"use strict";

const Pedido = require("../models/Pedido");
const { cleanSegment, uploadBuffer, toAsset, deleteAsset } = require("../services/uploadService");
const { transferDeadline, transferHours, expireOrder } = require("../services/transferOrderService");
const { applyOrderStock } = require("../services/inventoryService");
const { cleanText } = require("../utils/validation");

function firstFile(req) { return Array.isArray(req.files?.archivo) ? req.files.archivo[0] : null; }

async function uploadReceipt(req, res, next) {
    try {
        const order = await Pedido.findOne({ _id: req.params.id, usuarioClienteId: req.user._id });
        if (!order) return res.status(404).json({ error: "Pedido no encontrado." });
        await expireOrder(order);
        if (order.estadoPedido === "cancelado" || order.estadoPago === "vencido") return res.status(409).json({ error: "El plazo de este pedido finalizó." });
        if (order.metodoPago !== "transferencia") return res.status(409).json({ error: "Este pedido no utiliza transferencia." });
        if (!["pendiente_comprobante", "rechazado"].includes(order.estadoPago)) return res.status(409).json({ error: "Este pedido no permite cargar otro comprobante." });
        const file = firstFile(req);
        if (!file) return res.status(400).json({ error: "Selecciona un comprobante." });
        const resourceType = file.mimetype === "application/pdf" ? "raw" : "image";
        const folder = `${process.env.CLOUDINARY_PAYMENT_FOLDER || "mommy-crafts/pagos"}/${cleanSegment(order.numeroPedido)}`;
        const result = await uploadBuffer(file.buffer, { folder, publicId: `comprobante-${Date.now()}`, resourceType, tags: ["mommy-crafts", "comprobante"] });
        const previous = order.transferencia?.comprobante;
        order.transferencia.comprobante = toAsset(result, file);
        order.transferencia.recibidoAt = new Date();
        order.transferencia.canal = "cuenta";
        order.transferencia.permiteReenvio = false;
        order.estadoPago = "comprobante_recibido";
        order.historial.push({ estado: "comprobante_recibido", detalle: "El cliente cargó un comprobante de transferencia." });
        await order.save();
        if (previous?.publicId) deleteAsset(previous.publicId, previous.mimeType === "application/pdf" ? "raw" : "image").catch(() => {});
        res.status(201).json({ mensaje: "Comprobante recibido. Lo revisaremos antes de confirmar el pago.", pedido: order });
    } catch (error) { next(error); }
}

async function validateTransfer(req, res, next) {
    let receiptToDelete = null;

    try {
        const order = await Pedido.findById(req.params.id);
        if (!order) return res.status(404).json({ error: "Pedido no encontrado." });
        if (order.metodoPago !== "transferencia") return res.status(409).json({ error: "Este pedido no utiliza transferencia." });
        if (order.estadoPedido === "cancelado" || ["pagado", "reembolsado", "vencido"].includes(order.estadoPago)) {
            return res.status(409).json({ error: "Este pedido ya no admite cambios en su transferencia." });
        }

        const action = String(req.body.accion || "");
        const notes = cleanText(req.body.observaciones, { field: "Las observaciones", maxLength: 1500, allowNewlines: true });
        const channel = ["cuenta", "correo", "whatsapp", "manual"].includes(req.body.canal) ? req.body.canal : "manual";
        if (action === "aprobar") {
            if (!order.transferencia?.comprobante?.url && !["whatsapp", "manual"].includes(channel)) {
                return res.status(409).json({ error: "Carga un comprobante o indica que la validación se realizó por WhatsApp/manual." });
            }
            order.estadoPago = "pagado";
            order.transferencia.validadoAt = new Date();
            order.transferencia.validadoPor = req.user._id;
            order.transferencia.canal = channel;
            order.transferencia.observaciones = notes;
            order.estadoPedido = order.items.some(item => item.personalizacionResumen?.tipo !== "ninguna") ? "validacion_diseno" : "confirmado";
            order.historial.push({ estado: "pagado", detalle: "Transferencia validada por administración.", usuarioId: req.user._id });
        } else if (action === "rechazar") {
            const retry = Boolean(req.body.permitirReenvio);
            order.transferencia.observaciones = notes;
            order.transferencia.validadoPor = req.user._id;
            if (retry) {
                receiptToDelete = order.transferencia?.comprobante || null;
                order.estadoPago = "pendiente_comprobante";
                order.transferencia.venceAt = transferDeadline();
                order.transferencia.permiteReenvio = true;
                order.transferencia.comprobante = null;
                order.transferencia.recibidoAt = null;
                order.historial.push({
                    estado: "comprobante_rechazado",
                    detalle: `Comprobante rechazado; se habilitó un nuevo plazo de ${transferHours()} horas.`,
                    usuarioId: req.user._id
                });
            } else {
                if (order.stockAplicado) { await applyOrderStock(order, "restore", req.user._id); order.stockAplicado = false; }
                order.estadoPago = "rechazado";
                order.estadoPedido = "cancelado";
                order.historial.push({ estado: "comprobante_rechazado", detalle: "Comprobante rechazado y pedido cancelado.", usuarioId: req.user._id });
            }
        } else if (action === "extender") {
            order.estadoPago = "pendiente_comprobante";
            order.transferencia.venceAt = transferDeadline();
            order.transferencia.permiteReenvio = true;
            order.historial.push({
                estado: "plazo_extendido",
                detalle: `Administración extendió el plazo de comprobante por ${transferHours()} horas.`,
                usuarioId: req.user._id
            });
        } else {
            return res.status(400).json({ error: "Acción de transferencia no válida." });
        }
        await order.save();

        if (receiptToDelete?.publicId) {
            deleteAsset(
                receiptToDelete.publicId,
                receiptToDelete.mimeType === "application/pdf" ? "raw" : "image"
            ).catch(() => {});
        }

        res.json(order);
    } catch (error) { next(error); }
}

module.exports = { uploadReceipt, validateTransfer };
