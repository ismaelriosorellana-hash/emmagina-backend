"use strict";

const crypto = require("crypto");
const mongoose = require("mongoose");

const BLOCK_TYPES = [
    "hero_banner",
    "category_sidebar",
    "category_grid",
    "info_cards",
    "product_carousel",
    "product_grid",
    "image_banner",
    "reviews_carousel",
    "text_block",
    "faq_block",
    "contact_block",
    "cart_summary",
    "checkout_form",
    "spacer",
    "custom_html"
];

const SECTION_TYPES = [
    "hero_section",
    "content_section",
    "products_section",
    "brand_section",
    "reviews_section",
    "checkout_section",
    "generic_section"
];

function makeId(prefix) {
    return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

function slugify(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "pagina";
}

const blockSchema = new mongoose.Schema(
    {
        id: { type: String, default: () => makeId("blk"), trim: true, maxlength: 80 },
        tipo: { type: String, required: true, enum: BLOCK_TYPES, index: true },
        nombre: { type: String, default: "Bloque", trim: true, maxlength: 160 },
        orden: { type: Number, default: 1, min: 1, max: 9999 },
        visible: { type: Boolean, default: true },
        contenido: { type: mongoose.Schema.Types.Mixed, default: {} },
        estilo: { type: mongoose.Schema.Types.Mixed, default: {} },
        configuracion: { type: mongoose.Schema.Types.Mixed, default: {} },
        fuentesDatos: { type: mongoose.Schema.Types.Mixed, default: {} },
        reglas: { type: mongoose.Schema.Types.Mixed, default: {} }
    },
    { _id: false, minimize: false }
);

const sectionSchema = new mongoose.Schema(
    {
        id: { type: String, default: () => makeId("sec"), trim: true, maxlength: 80 },
        tipo: { type: String, required: true, enum: SECTION_TYPES, index: true },
        nombre: { type: String, default: "Sección", trim: true, maxlength: 160 },
        orden: { type: Number, default: 1, min: 1, max: 9999 },
        visible: { type: Boolean, default: true },
        layout: {
            type: String,
            enum: ["stack", "grid", "hero_with_sidebar", "two_columns", "carousel", "full_width"],
            default: "stack"
        },
        contenido: { type: mongoose.Schema.Types.Mixed, default: {} },
        estilo: { type: mongoose.Schema.Types.Mixed, default: {} },
        configuracion: { type: mongoose.Schema.Types.Mixed, default: {} },
        bloques: { type: [blockSchema], default: [] }
    },
    { _id: false, minimize: false }
);

const regionSchema = new mongoose.Schema(
    {
        id: { type: String, default: () => makeId("reg"), trim: true, maxlength: 80 },
        tipo: { type: String, default: "main", trim: true, maxlength: 80 },
        nombre: { type: String, default: "Contenido principal", trim: true, maxlength: 160 },
        orden: { type: Number, default: 1, min: 1, max: 9999 },
        visible: { type: Boolean, default: true },
        configuracion: { type: mongoose.Schema.Types.Mixed, default: {} },
        estilo: { type: mongoose.Schema.Types.Mixed, default: {} },
        secciones: { type: [sectionSchema], default: [] }
    },
    { _id: false, minimize: false }
);

const layoutSchema = new mongoose.Schema(
    {
        versionEsquema: { type: String, default: "cms-layout-v1", trim: true, maxlength: 40 },
        templateKey: { type: String, default: "default_page", trim: true, lowercase: true, maxlength: 80 },
        configuracion: { type: mongoose.Schema.Types.Mixed, default: {} },
        regiones: { type: [regionSchema], default: [] }
    },
    { _id: false, minimize: false }
);

const seoSchema = new mongoose.Schema(
    {
        titulo: { type: String, default: "", trim: true, maxlength: 180 },
        descripcion: { type: String, default: "", trim: true, maxlength: 320 },
        imagen: { type: String, default: "", trim: true, maxlength: 1000 },
        noIndex: { type: Boolean, default: false }
    },
    { _id: false }
);

const navigationSchema = new mongoose.Schema(
    {
        mostrarEnMenu: { type: Boolean, default: false },
        mostrarEnFooter: { type: Boolean, default: false },
        etiqueta: { type: String, default: "", trim: true, maxlength: 120 },
        orden: { type: Number, default: 100, min: 1, max: 9999 },
        urlExterna: { type: String, default: "", trim: true, maxlength: 1000 }
    },
    { _id: false }
);

const versionSchema = new mongoose.Schema(
    {
        id: { type: String, default: () => makeId("ver"), trim: true, maxlength: 80 },
        numero: { type: Number, required: true, min: 1 },
        nota: { type: String, default: "", trim: true, maxlength: 300 },
        layout: { type: layoutSchema, required: true },
        seo: { type: seoSchema, default: () => ({}) },
        creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", default: null },
        creadoEn: { type: Date, default: Date.now }
    },
    { _id: false, minimize: false }
);

const cmsPageSchema = new mongoose.Schema(
    {
        clave: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true, maxlength: 100 },
        titulo: { type: String, required: true, trim: true, maxlength: 180 },
        slug: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true, maxlength: 180 },
        tipoPagina: {
            type: String,
            enum: ["home", "page", "category", "product", "cart", "checkout", "landing"],
            default: "page",
            index: true
        },
        templateKey: { type: String, default: "default_page", trim: true, lowercase: true, maxlength: 80, index: true },
        estado: { type: String, enum: ["borrador", "publicada", "archivada"], default: "borrador", index: true },
        sistema: { type: Boolean, default: false },
        editable: { type: Boolean, default: true },
        eliminable: { type: Boolean, default: true },
        navegacion: { type: navigationSchema, default: () => ({}) },
        seo: { type: seoSchema, default: () => ({}) },
        layoutBorrador: { type: layoutSchema, required: true, default: () => ({}) },
        layoutPublicado: { type: layoutSchema, default: null },
        tieneCambiosSinPublicar: { type: Boolean, default: true },
        versionActual: { type: Number, default: 0, min: 0 },
        versiones: { type: [versionSchema], default: [] },
        creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", default: null },
        actualizadoPor: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", default: null },
        publicadoPor: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", default: null },
        publicadoEn: { type: Date, default: null },
        eliminadoEn: { type: Date, default: null }
    },
    {
        timestamps: true,
        collection: "cms_pages",
        minimize: false
    }
);

cmsPageSchema.pre("validate", function normalizeCmsPage(next) {
    this.clave = slugify(this.clave || this.slug || this.titulo);
    this.slug = slugify(this.slug || this.clave || this.titulo);
    this.templateKey = slugify(this.templateKey || this.tipoPagina || "default_page").replace(/-/g, "_");
    if (!this.navegacion.etiqueta) this.navegacion.etiqueta = this.titulo;
    if (!this.seo.titulo) this.seo.titulo = this.titulo;
    if (!this.layoutBorrador) this.layoutBorrador = {};
    if (!this.layoutBorrador.versionEsquema) this.layoutBorrador.versionEsquema = "cms-layout-v1";
    if (!this.layoutBorrador.templateKey) this.layoutBorrador.templateKey = this.templateKey;
    next();
});

cmsPageSchema.index({ estado: 1, tipoPagina: 1, eliminadoEn: 1 });
cmsPageSchema.index({ "navegacion.mostrarEnMenu": 1, "navegacion.orden": 1 });

module.exports = mongoose.models.CmsPage || mongoose.model("CmsPage", cmsPageSchema);
module.exports.BLOCK_TYPES = BLOCK_TYPES;
module.exports.SECTION_TYPES = SECTION_TYPES;
