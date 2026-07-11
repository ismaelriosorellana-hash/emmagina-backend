"use strict";

const mongoose = require("mongoose");

const regionSchema = new mongoose.Schema(
    {
        id: { type: String, required: true, trim: true, maxlength: 80 },
        nombre: { type: String, required: true, trim: true, maxlength: 140 },
        tipo: { type: String, default: "main", trim: true, maxlength: 80 },
        orden: { type: Number, default: 1, min: 1, max: 9999 },
        obligatoria: { type: Boolean, default: true },
        maxSecciones: { type: Number, default: 0, min: 0, max: 200 },
        tiposSeccionPermitidos: { type: [String], default: [] },
        tiposBloquePermitidos: { type: [String], default: [] },
        layoutInicial: { type: mongoose.Schema.Types.Mixed, default: {} }
    },
    { _id: false, minimize: false }
);

const cmsTemplateSchema = new mongoose.Schema(
    {
        templateKey: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true,
            lowercase: true,
            maxlength: 80
        },
        nombre: { type: String, required: true, trim: true, maxlength: 160 },
        descripcion: { type: String, default: "", trim: true, maxlength: 800 },
        tipoPagina: {
            type: String,
            enum: ["home", "page", "category", "product", "cart", "checkout", "landing"],
            default: "page",
            index: true
        },
        activo: { type: Boolean, default: true, index: true },
        sistema: { type: Boolean, default: true },
        version: { type: Number, default: 1, min: 1 },
        regiones: { type: [regionSchema], default: [] },
        layoutInicial: { type: mongoose.Schema.Types.Mixed, default: {} },
        configuracion: { type: mongoose.Schema.Types.Mixed, default: {} }
    },
    {
        timestamps: true,
        collection: "cms_templates",
        minimize: false
    }
);

module.exports = mongoose.models.CmsTemplate || mongoose.model("CmsTemplate", cmsTemplateSchema);
