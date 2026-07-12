"use strict";

const SolicitudPersonalizada = require("../models/SolicitudPersonalizada");

function clean(value) {
    return String(value ?? "").trim();
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
        cotizacion: item.cotizacion,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
    };
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
                montoEstimado: Number(req.body.cotizacion.montoEstimado) || 0,
                moneda: clean(req.body.cotizacion.moneda || "CLP") || "CLP",
                tiempoEstimado: clean(req.body.cotizacion.tiempoEstimado),
                observaciones: clean(req.body.cotizacion.observaciones),
                enviadaEn: req.body.cotizacion.enviadaEn ? new Date(req.body.cotizacion.enviadaEn) : null
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

async function addCustomRequestNote(req, res, next) {
    try {
        const nota = clean(req.body.nota);
        if (!nota) return res.status(400).json({ error: "La nota no puede estar vacía." });
        const item = await SolicitudPersonalizada.findByIdAndUpdate(
            req.params.id,
            { $push: { notasInternas: { nota, usuario: req.user?._id || null } } },
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
    addCustomRequestNote
};
