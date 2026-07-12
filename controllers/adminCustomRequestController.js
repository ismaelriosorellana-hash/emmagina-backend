"use strict";

const SolicitudPersonalizada = require("../models/SolicitudPersonalizada");
const Pedido = require("../models/Pedido");
const { notifyCustomQuote } = require("../services/customRequestNotificationService");

function clean(value) {
    return String(value ?? "").trim();
}

function money(value) {
    const amount = Math.max(0, Math.round(Number(value) || 0));
    return Number.isFinite(amount) ? amount : 0;
}

function bool(value) {
    return value === true || value === "true" || value === 1 || value === "1";
}

function buildQuery(query = {}) {
    const filter = {};
    const estado = clean(query.estado);
    const tipo = clean(query.tipoSolicitud);
    const search = clean(query.buscar);

    if (estado) filter.estado = estado;
    if (tipo) filter.tipoSolicitud = tipo;
    if (search) {
        filter.$or = [
            { folio: new RegExp(search, "i") },
            { "cliente.nombre": new RegExp(search, "i") },
            { "cliente.whatsapp": new RegExp(search, "i") },
            { "cliente.correo": new RegExp(search, "i") },
            { "proyecto.descripcion": new RegExp(search, "i") }
        ];
    }

    return filter;
}

function serialize(item) {
    return {
        id: item._id,
        folio: item.folio,
        tipoSolicitud: item.tipoSolicitud,
        estado: item.estado,
        prioridad: item.prioridad,
        cliente: item.cliente,
        proyecto: item.proyecto,
        archivos: item.archivos || [],
        resumen: item.resumen,
        cotizacion: item.cotizacion || {},
        notasInternas: item.notasInternas || [],
        pedido: item.pedido || {},
        historial: item.historial || [],
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
    };
}

function buildQuotePayload(body = {}, userId = null) {
    const montoEstimado = money(body.montoEstimado ?? body.cotizacion?.montoEstimado);
    const montoAbono = money(body.montoAbono ?? body.cotizacion?.montoAbono);
    const validezDias = Math.min(Math.max(Number(body.validezDias ?? body.cotizacion?.validezDias) || 7, 1), 60);

    if (!montoEstimado) {
        const error = new Error("Ingresa un monto estimado válido para enviar la cotización.");
        error.statusCode = 400;
        throw error;
    }

    return {
        montoEstimado,
        moneda: "CLP",
        tiempoEstimado: clean(body.tiempoEstimado ?? body.cotizacion?.tiempoEstimado).slice(0, 160),
        observaciones: clean(body.observaciones ?? body.cotizacion?.observaciones).slice(0, 1800),
        condiciones: clean(body.condiciones ?? body.cotizacion?.condiciones).slice(0, 1800),
        validezDias,
        requiereAbono: bool(body.requiereAbono ?? body.cotizacion?.requiereAbono),
        montoAbono,
        enviadaEn: new Date(),
        enviadaPor: userId
    };
}

function requestItemName(request) {
    const label = {
        figura: "Figura / retrato 3D personalizado",
        servicio: "Servicio de impresión 3D a pedido",
        idea: "Diseño e impresión de idea personalizada"
    }[request.tipoSolicitud] || "Solicitud personalizada";
    return `${label} · ${request.folio}`;
}

async function listCustomRequests(req, res, next) {
    try {
        const limit = Math.min(Math.max(Number(req.query.limit) || 80, 1), 200);
        const page = Math.max(Number(req.query.page) || 1, 1);
        const filter = buildQuery(req.query);
        const [items, total] = await Promise.all([
            SolicitudPersonalizada.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            SolicitudPersonalizada.countDocuments(filter)
        ]);

        res.json({
            solicitudes: items.map(serialize),
            total,
            page,
            limit
        });
    } catch (error) {
        next(error);
    }
}

async function getCustomRequest(req, res, next) {
    try {
        const item = await SolicitudPersonalizada.findById(req.params.id).lean();
        if (!item) return res.status(404).json({ error: "Solicitud no encontrada." });
        return res.json({ solicitud: serialize(item) });
    } catch (error) {
        next(error);
    }
}

async function updateCustomRequest(req, res, next) {
    try {
        const allowed = {};
        if (clean(req.body.estado)) allowed.estado = clean(req.body.estado);
        if (clean(req.body.prioridad)) allowed.prioridad = clean(req.body.prioridad);
        if (req.body.cotizacion && typeof req.body.cotizacion === "object") {
            allowed.cotizacion = {
                montoEstimado: money(req.body.cotizacion.montoEstimado),
                moneda: "CLP",
                tiempoEstimado: clean(req.body.cotizacion.tiempoEstimado),
                observaciones: clean(req.body.cotizacion.observaciones),
                condiciones: clean(req.body.cotizacion.condiciones),
                validezDias: Math.min(Math.max(Number(req.body.cotizacion.validezDias) || 7, 1), 60),
                requiereAbono: bool(req.body.cotizacion.requiereAbono),
                montoAbono: money(req.body.cotizacion.montoAbono),
                enviadaEn: req.body.cotizacion.enviadaEn ? new Date(req.body.cotizacion.enviadaEn) : null,
                enviadaPor: req.body.cotizacion.enviadaPor || null,
                aceptadaEn: req.body.cotizacion.aceptadaEn ? new Date(req.body.cotizacion.aceptadaEn) : null
            };
        }

        const item = await SolicitudPersonalizada.findByIdAndUpdate(
            req.params.id,
            { $set: allowed },
            { new: true, runValidators: true }
        ).lean();

        if (!item) return res.status(404).json({ error: "Solicitud no encontrada." });
        return res.json({ solicitud: serialize(item) });
    } catch (error) {
        next(error);
    }
}

async function sendCustomRequestQuote(req, res, next) {
    try {
        const request = await SolicitudPersonalizada.findById(req.params.id);
        if (!request) return res.status(404).json({ error: "Solicitud no encontrada." });

        request.cotizacion = buildQuotePayload(req.body || {}, req.user?._id || null);
        request.estado = "cotizada";
        request.historial.push({
            evento: "cotizacion_enviada",
            detalle: `Cotización enviada por ${request.cotizacion.montoEstimado} CLP.`,
            usuario: req.user?._id || null
        });

        await request.save();
        const notifications = await notifyCustomQuote(request).catch((error) => [{
            sent: false,
            skipped: false,
            reason: error.message || "Error enviando cotización."
        }]);

        return res.json({
            solicitud: serialize(request.toObject()),
            notifications
        });
    } catch (error) {
        next(error);
    }
}

async function convertCustomRequestToOrder(req, res, next) {
    try {
        const request = await SolicitudPersonalizada.findById(req.params.id);
        if (!request) return res.status(404).json({ error: "Solicitud no encontrada." });
        if (request.pedido?.pedidoId) {
            return res.status(409).json({ error: "Esta solicitud ya fue convertida a pedido." });
        }
        if (!clean(request.cliente?.correo)) {
            return res.status(400).json({ error: "Para convertir la solicitud en pedido, primero agrega un correo al cliente." });
        }

        const total = money(req.body.total || request.cotizacion?.montoEstimado);
        if (!total) {
            return res.status(400).json({ error: "La solicitud necesita una cotización con monto para convertirse en pedido." });
        }

        const cantidad = Math.max(1, Math.round(Number(request.proyecto?.cantidad) || 1));
        const item = {
            productoId: `solicitud:${request.folio}`,
            nombre: clean(req.body.nombreItem) || requestItemName(request),
            imagen: request.archivos?.find((file) => String(file.mimeType || "").startsWith("image/"))?.url || "",
            varianteId: "",
            color: clean(request.proyecto?.color),
            talla: clean(request.proyecto?.tamano),
            sku: request.folio,
            cantidad,
            precioUnitario: Math.round(total / cantidad),
            subtotal: total,
            personalizacion: {
                solicitudId: String(request._id),
                folio: request.folio,
                tipoSolicitud: request.tipoSolicitud,
                descripcion: request.proyecto?.descripcion || "",
                archivos: request.archivos || []
            },
            personalizacionResumen: {
                folio: request.folio,
                tipo: request.tipoSolicitud,
                resumen: request.resumen
            }
        };

        const order = await Pedido.create({
            cliente: {
                nombre: request.cliente.nombre,
                email: request.cliente.correo,
                telefono: request.cliente.whatsapp,
                direccion: clean(req.body.direccion) || "Coordinar con cliente",
                comuna: request.cliente.comuna || ""
            },
            items: [item],
            subtotal: total,
            costoEnvio: money(req.body.costoEnvio),
            descuento: money(req.body.descuento),
            total: Math.max(0, total + money(req.body.costoEnvio) - money(req.body.descuento)),
            metodoPago: clean(req.body.metodoPago) || "transferencia",
            estadoPago: "pendiente_comprobante",
            estadoPedido: "confirmado",
            entrega: {
                metodo: clean(req.body.metodoEntrega) === "envio" ? "envio" : "retiro",
                instrucciones: clean(req.body.instruccionesEntrega) || "Pedido creado desde solicitud personalizada.",
                direccion: clean(req.body.direccion) || "Coordinar con cliente",
                comuna: request.cliente.comuna || "",
                diasPreparacion: Math.min(Math.max(Number(req.body.diasPreparacion) || 5, 1), 90)
            },
            observaciones: `Pedido creado desde solicitud ${request.folio}. ${clean(req.body.observaciones)}`.trim(),
            notasInternas: `Solicitud original: ${request.folio}. ${request.proyecto?.descripcion || ""}`.trim(),
            origen: "administrador",
            historial: [
                { estado: "confirmado", detalle: `Pedido creado desde solicitud personalizada ${request.folio}.`, usuarioId: req.user?._id || null }
            ]
        });

        request.estado = "convertida_pedido";
        request.pedido = {
            pedidoId: order._id,
            numeroPedido: order.numeroPedido,
            convertidoEn: new Date(),
            convertidoPor: req.user?._id || null
        };
        request.historial.push({
            evento: "convertida_pedido",
            detalle: `Convertida en pedido ${order.numeroPedido}.`,
            usuario: req.user?._id || null
        });
        await request.save();

        return res.status(201).json({
            solicitud: serialize(request.toObject()),
            pedido: {
                id: order._id,
                numeroPedido: order.numeroPedido,
                total: order.total,
                estadoPedido: order.estadoPedido,
                estadoPago: order.estadoPago
            }
        });
    } catch (error) {
        next(error);
    }
}

async function addCustomRequestNote(req, res, next) {
    try {
        const nota = clean(req.body.nota);
        if (!nota) return res.status(400).json({ error: "La nota no puede estar vacía." });
        const item = await SolicitudPersonalizada.findByIdAndUpdate(
            req.params.id,
            {
                $push: {
                    notasInternas: { nota, usuario: req.user?._id || null },
                    historial: { evento: "nota_interna", detalle: nota, usuario: req.user?._id || null }
                }
            },
            { new: true, runValidators: true }
        ).lean();
        if (!item) return res.status(404).json({ error: "Solicitud no encontrada." });
        return res.json({ solicitud: serialize(item) });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    listCustomRequests,
    getCustomRequest,
    updateCustomRequest,
    sendCustomRequestQuote,
    convertCustomRequestToOrder,
    addCustomRequestNote
};
