"use strict";

const Pedido = require("../models/Pedido");
const { cleanSegment, uploadBuffer, toAsset, deleteAsset } = require("../services/uploadService");
const { cleanText } = require("../utils/validation");

function firstFile(req) { return Array.isArray(req.files?.archivo) ? req.files.archivo[0] : null; }
function findItem(order, lineId) { return order.items.find(item => String(item.lineaId) === String(lineId)); }

async function uploadFinalDesign(req, res, next) {
    try {
        const order = await Pedido.findById(req.params.id);
        if (!order) return res.status(404).json({ error: "Pedido no encontrado." });
        if (order.estadoPago !== "pagado") return res.status(409).json({ error: "Confirma el pago antes de enviar el diseño final." });
        const item = findItem(order, req.params.lineaId);
        if (!item) return res.status(404).json({ error: "Producto del pedido no encontrado." });
        if (item.personalizacionResumen?.tipo === "ninguna") return res.status(409).json({ error: "Este producto no registra personalización." });
        const file = firstFile(req);
        if (!file) return res.status(400).json({ error: "Selecciona la imagen del diseño final." });
        const folder = `${process.env.CLOUDINARY_DESIGN_FOLDER || "mommy-crafts/disenos"}/${cleanSegment(order.numeroPedido)}/${cleanSegment(item.lineaId)}`;
        const result = await uploadBuffer(file.buffer, { folder, publicId: `diseno-${Date.now()}`, tags: ["mommy-crafts", "diseno-final"] });
        const previous = item.disenoFinal?.asset;
        item.disenoFinal = {
            estado: item.disenoFinal?.estado === "cambios_solicitados" ? "corregido" : "enviado",
            asset: toAsset(result, file),
            mensaje: cleanText(req.body.mensaje, { field: "El mensaje", maxLength: 1500, allowNewlines: true }) || "Te enviamos el diseño final para tu revisión.",
            canal: ["cuenta", "correo", "whatsapp", "mixto"].includes(req.body.canal) ? req.body.canal : "cuenta",
            observacionesCliente: "",
            enviadoAt: new Date(),
            respondidoAt: null,
            enviadoPor: req.user._id
        };
        order.markModified("items");
        order.estadoPedido = "validacion_diseno";
        order.historial.push({ estado: "diseno_enviado", detalle: `Diseño enviado para ${item.nombre}.`, usuarioId: req.user._id });
        await order.save();
        if (previous?.publicId) deleteAsset(previous.publicId).catch(() => {});
        res.status(201).json(order);
    } catch (error) { next(error); }
}

async function respondDesign(req, res, next) {
    try {
        const order = await Pedido.findOne({ _id: req.params.id, usuarioClienteId: req.user._id });
        if (!order) return res.status(404).json({ error: "Pedido no encontrado." });
        if (order.estadoPago !== "pagado") return res.status(409).json({ error: "El pago debe estar confirmado antes de responder un diseño." });
        const item = findItem(order, req.params.lineaId);
        if (!item?.disenoFinal?.asset?.url) return res.status(409).json({ error: "Todavía no existe un diseño para revisar." });
        const action = String(req.body.accion || "");
        const observations = cleanText(req.body.observaciones, { field: "Las observaciones", maxLength: 1500, allowNewlines: true, required: action === "solicitar_cambios" });
        if (action === "aprobar") {
            item.disenoFinal.estado = "aprobado";
            item.disenoFinal.observacionesCliente = observations;
            item.disenoFinal.respondidoAt = new Date();
            order.historial.push({ estado: "diseno_aprobado", detalle: `El cliente aprobó el diseño de ${item.nombre}.` });
        } else if (action === "solicitar_cambios") {
            item.disenoFinal.estado = "cambios_solicitados";
            item.disenoFinal.observacionesCliente = observations;
            item.disenoFinal.respondidoAt = new Date();
            order.historial.push({ estado: "cambios_solicitados", detalle: `El cliente solicitó cambios para ${item.nombre}.` });
        } else return res.status(400).json({ error: "Respuesta de diseño no válida." });

        const personalized = order.items.filter(entry => entry.personalizacionResumen?.tipo !== "ninguna");
        if (order.estadoPago === "pagado" && personalized.length && personalized.every(entry => entry.disenoFinal?.estado === "aprobado")) {
            order.estadoPedido = "en_produccion";
            order.historial.push({ estado: "en_produccion", detalle: "Todos los diseños fueron aprobados; el pedido puede entrar a producción." });
        }
        order.markModified("items");
        await order.save();
        res.json({ mensaje: action === "aprobar" ? "Diseño aprobado." : "Observaciones enviadas.", pedido: order });
    } catch (error) { next(error); }
}

module.exports = { uploadFinalDesign, respondDesign };
