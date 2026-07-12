"use strict";

const path = require("path");
const crypto = require("crypto");

const SolicitudPersonalizada = require("../models/SolicitudPersonalizada");
const { cleanSegment, uploadBuffer, toAsset, deleteAsset } = require("../services/uploadService");
const { notifyCustomRequest } = require("../services/customRequestNotificationService");

function clean(value) {
    return String(value ?? "").trim();
}

function number(value, fallback = 1) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function requestType(value) {
    const type = clean(value).toLowerCase();
    return ["figura", "servicio", "idea"].includes(type) ? type : "figura";
}

function resourceTypeFor(file) {
    if (String(file?.mimetype || "").startsWith("image/")) return "image";
    return "raw";
}

async function createFolio() {
    const now = new Date();
    const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;

    for (let attempt = 0; attempt < 8; attempt += 1) {
        const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();
        const folio = `RD-${date}-${suffix}`;
        const exists = await SolicitudPersonalizada.exists({ folio });
        if (!exists) return folio;
    }

    return `RD-${date}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

function validateBody(body) {
    const errors = [];
    if (!clean(body.nombre)) errors.push("El nombre es obligatorio.");
    if (!clean(body.whatsapp)) errors.push("El WhatsApp es obligatorio.");
    if (!clean(body.descripcion)) errors.push("La descripción del proyecto es obligatoria.");
    return errors;
}

async function uploadRequestFiles(files, folio) {
    const uploadedPublicIds = [];
    const assets = [];
    const configuredFolder = String(
        process.env.CLOUDINARY_CUSTOM_REQUEST_FOLDER ||
        process.env.CLOUDINARY_CUSTOMIZATION_FOLDER ||
        "rhema/solicitudes"
    )
        .split("/")
        .map((part) => cleanSegment(part, "solicitudes"))
        .join("/");

    const folder = `${configuredFolder}/${cleanSegment(folio, "solicitud")}`;

    try {
        for (let index = 0; index < files.length; index += 1) {
            const file = files[index];
            const extension = path.extname(file.originalname || "").replace(/^\./, "").toLowerCase();
            const result = await uploadBuffer(file.buffer, {
                resourceType: resourceTypeFor(file),
                folder,
                publicId: `archivo-${index + 1}-${cleanSegment(crypto.randomUUID(), "ref")}`,
                context: {
                    folio,
                    assetType: "custom-request",
                    originalName: file.originalname || "archivo"
                },
                tags: ["rhema", "solicitud", "personalizada"]
            });
            uploadedPublicIds.push({ publicId: result.public_id, resourceType: result.resource_type || resourceTypeFor(file) });
            assets.push({
                ...toAsset(result, file),
                resourceType: result.resource_type || resourceTypeFor(file),
                format: result.format || extension
            });
        }

        return assets;
    } catch (error) {
        await Promise.allSettled(uploadedPublicIds.map((item) => deleteAsset(item.publicId, item.resourceType)));
        throw error;
    }
}

function buildSummary(payload, fileCount) {
    const parts = [
        payload.tipoSolicitud === "figura" ? "Figura/retrato 3D" : payload.tipoSolicitud === "servicio" ? "Impresión a pedido" : "Idea personalizada",
        payload.proyecto?.formato,
        payload.proyecto?.uso,
        payload.proyecto?.tamano,
        payload.proyecto?.color,
        fileCount ? `${fileCount} archivo(s)` : "sin archivos"
    ].filter(Boolean);
    return parts.join(" · ");
}

async function createCustomRequest(req, res, next) {
    try {
        const body = req.body || {};
        const errors = validateBody(body);
        if (errors.length) {
            return res.status(400).json({
                error: errors.join(" "),
                errors
            });
        }

        const folio = await createFolio();
        const files = Array.isArray(req.files?.archivos) ? req.files.archivos : [];
        const assets = files.length ? await uploadRequestFiles(files, folio) : [];
        const tipoSolicitud = requestType(body.tipoSolicitud);

        const payload = {
            folio,
            tipoSolicitud,
            cliente: {
                nombre: clean(body.nombre).slice(0, 120),
                whatsapp: clean(body.whatsapp).slice(0, 40),
                correo: clean(body.correo).toLowerCase().slice(0, 160),
                comuna: clean(body.comuna).slice(0, 120)
            },
            proyecto: {
                personas: clean(body.personas).slice(0, 80),
                formato: clean(body.formato).slice(0, 100),
                uso: clean(body.uso).slice(0, 100),
                cantidad: number(body.cantidad, 1),
                tamano: clean(body.tamano).slice(0, 120),
                color: clean(body.color).slice(0, 120),
                descripcion: clean(body.descripcion).slice(0, 2400)
            },
            archivos: assets,
            origen: {
                pagina: "pedido-personalizado",
                url: clean(body.origenUrl || req.headers.referer || "").slice(0, 400),
                userAgent: clean(req.headers["user-agent"] || "").slice(0, 400),
                ip: clean(req.ip || "")
            }
        };

        payload.resumen = buildSummary(payload, assets.length);

        const request = await SolicitudPersonalizada.create(payload);
        const notifications = await notifyCustomRequest(request).catch((error) => [{
            sent: false,
            skipped: false,
            reason: error.message || "Error enviando notificaciones."
        }]);

        return res.status(201).json({
            ok: true,
            folio: request.folio,
            estado: request.estado,
            solicitud: {
                id: request._id,
                folio: request.folio,
                tipoSolicitud: request.tipoSolicitud,
                estado: request.estado,
                resumen: request.resumen,
                archivos: request.archivos.length,
                createdAt: request.createdAt
            },
            notifications
        });
    } catch (error) {
        next(error);
    }
}

async function getCustomRequestPublic(req, res, next) {
    try {
        const folio = clean(req.params.folio).toUpperCase();
        const email = clean(req.query.correo).toLowerCase();
        const whatsapp = clean(req.query.whatsapp);
        const query = { folio };
        if (email) query["cliente.correo"] = email;
        if (whatsapp) query["cliente.whatsapp"] = whatsapp;

        const request = await SolicitudPersonalizada.findOne(query).lean();
        if (!request) {
            return res.status(404).json({ error: "Solicitud no encontrada." });
        }

        const quoteVisible = ["cotizada", "aceptada", "convertida_pedido"].includes(request.estado);

        return res.json({
            solicitud: {
                folio: request.folio,
                tipoSolicitud: request.tipoSolicitud,
                estado: request.estado,
                resumen: request.resumen,
                cotizacion: quoteVisible ? {
                    montoEstimado: request.cotizacion?.montoEstimado || 0,
                    moneda: request.cotizacion?.moneda || "CLP",
                    tiempoEstimado: request.cotizacion?.tiempoEstimado || "",
                    observaciones: request.cotizacion?.observaciones || "",
                    condiciones: request.cotizacion?.condiciones || "",
                    validezDias: request.cotizacion?.validezDias || 7,
                    requiereAbono: Boolean(request.cotizacion?.requiereAbono),
                    montoAbono: request.cotizacion?.montoAbono || 0,
                    enviadaEn: request.cotizacion?.enviadaEn || null
                } : null,
                pedido: request.pedido?.numeroPedido ? {
                    numeroPedido: request.pedido.numeroPedido
                } : null,
                createdAt: request.createdAt,
                updatedAt: request.updatedAt
            }
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createCustomRequest,
    getCustomRequestPublic
};
