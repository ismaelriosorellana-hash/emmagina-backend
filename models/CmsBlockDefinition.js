"use strict";

const mongoose = require("mongoose");

const fieldSchema = new mongoose.Schema(
    {
        key: { type: String, required: true, trim: true, maxlength: 120 },
        label: { type: String, required: true, trim: true, maxlength: 160 },
        kind: {
            type: String,
            enum: [
                "text",
                "textarea",
                "richtext",
                "number",
                "boolean",
                "select",
                "multi_select",
                "image",
                "url",
                "color",
                "product_selector",
                "category_selector",
                "repeater",
                "json"
            ],
            default: "text"
        },
        required: { type: Boolean, default: false },
        options: { type: [String], default: [] },
        min: { type: Number, default: null },
        max: { type: Number, default: null },
        defaultValue: { type: mongoose.Schema.Types.Mixed, default: null },
        group: { type: String, default: "Contenido", trim: true, maxlength: 80 },
        help: { type: String, default: "", trim: true, maxlength: 500 }
    },
    { _id: false }
);

const cmsBlockDefinitionSchema = new mongoose.Schema(
    {
        tipo: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true,
            lowercase: true,
            maxlength: 80
        },
        nombre: { type: String, required: true, trim: true, maxlength: 160 },
        categoria: {
            type: String,
            enum: ["portada", "catalogo", "contenido", "venta", "navegacion", "checkout", "sistema"],
            default: "contenido",
            index: true
        },
        descripcion: { type: String, default: "", trim: true, maxlength: 800 },
        icono: { type: String, default: "fa-square", trim: true, maxlength: 80 },
        activo: { type: Boolean, default: true, index: true },
        sistema: { type: Boolean, default: true },
        version: { type: Number, default: 1, min: 1 },
        paginasPermitidas: { type: [String], default: ["home", "page", "category", "product", "cart", "checkout"] },
        regionesPermitidas: { type: [String], default: ["main"] },
        contenidoInicial: { type: mongoose.Schema.Types.Mixed, default: {} },
        estiloInicial: { type: mongoose.Schema.Types.Mixed, default: {} },
        configuracionInicial: { type: mongoose.Schema.Types.Mixed, default: {} },
        campos: { type: [fieldSchema], default: [] }
    },
    {
        timestamps: true,
        collection: "cms_block_definitions",
        minimize: false
    }
);

module.exports = mongoose.models.CmsBlockDefinition || mongoose.model("CmsBlockDefinition", cmsBlockDefinitionSchema);
