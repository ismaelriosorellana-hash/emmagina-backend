"use strict";

const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
    {
        url: { type: String, trim: true, default: "" },
        downloadUrl: { type: String, trim: true, default: "" },
        publicId: { type: String, trim: true, default: "" },
        resourceType: { type: String, trim: true, default: "" },
        fileName: { type: String, trim: true, default: "" },
        mimeType: { type: String, trim: true, default: "" },
        bytes: { type: Number, default: 0, min: 0 },
        width: { type: Number, default: 0, min: 0 },
        height: { type: Number, default: 0, min: 0 },
        format: { type: String, trim: true, default: "" },
        createdAt: { type: Date, default: Date.now }
    },
    { _id: false }
);

const solicitudPersonalizadaSchema = new mongoose.Schema(
    {
        folio: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true,
            uppercase: true
        },
        tipoSolicitud: {
            type: String,
            enum: ["figura", "servicio", "idea"],
            default: "figura",
            index: true
        },
        estado: {
            type: String,
            enum: ["recibida", "en_revision", "cotizada", "aceptada", "rechazada", "cerrada"],
            default: "recibida",
            index: true
        },
        prioridad: {
            type: String,
            enum: ["normal", "alta"],
            default: "normal"
        },
        cliente: {
            nombre: { type: String, required: true, trim: true, maxlength: 120 },
            whatsapp: { type: String, required: true, trim: true, maxlength: 40 },
            correo: { type: String, trim: true, lowercase: true, maxlength: 160 },
            comuna: { type: String, trim: true, maxlength: 120 }
        },
        proyecto: {
            personas: { type: String, trim: true, maxlength: 80 },
            formato: { type: String, trim: true, maxlength: 100 },
            uso: { type: String, trim: true, maxlength: 100 },
            cantidad: { type: Number, default: 1, min: 1, max: 10000 },
            tamano: { type: String, trim: true, maxlength: 120 },
            color: { type: String, trim: true, maxlength: 120 },
            descripcion: { type: String, trim: true, maxlength: 2400 }
        },
        archivos: [assetSchema],
        resumen: {
            type: String,
            trim: true,
            maxlength: 900,
            default: ""
        },
        origen: {
            pagina: { type: String, trim: true, default: "pedido-personalizado" },
            url: { type: String, trim: true, default: "" },
            userAgent: { type: String, trim: true, default: "" },
            ip: { type: String, trim: true, default: "" }
        },
        cotizacion: {
            montoEstimado: { type: Number, default: 0, min: 0 },
            moneda: { type: String, trim: true, default: "CLP" },
            tiempoEstimado: { type: String, trim: true, default: "" },
            observaciones: { type: String, trim: true, default: "" },
            enviadaEn: { type: Date, default: null }
        },
        notasInternas: [
            {
                nota: { type: String, trim: true, maxlength: 1200 },
                creadaEn: { type: Date, default: Date.now },
                usuario: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", default: null }
            }
        ]
    },
    {
        timestamps: true,
        collection: "solicitudes_personalizadas"
    }
);

solicitudPersonalizadaSchema.index({ createdAt: -1 });
solicitudPersonalizadaSchema.index({ "cliente.whatsapp": 1, createdAt: -1 });
solicitudPersonalizadaSchema.index({ "cliente.correo": 1, createdAt: -1 });

module.exports = mongoose.model("SolicitudPersonalizada", solicitudPersonalizadaSchema);
