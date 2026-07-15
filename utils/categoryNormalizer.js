"use strict";

const {
    booleanValue,
    createSlug,
    numberValue,
    stringValue
} = require("./values");

const FALLBACK_CATEGORIES = [
    "Librería y Escritorio",
    "Juguetería",
    "Coleccionables",
    "Decoración",
    "Hogar",
    "Memories",
    "Vasos",
    "Para regalar",
    "Educativos",
    "Infantiles",
    "Babies",
    "Cristianos",
    "Niños",
    "Niñas",
    "Mascotas",
    "Herramientas",
    "Utilidades",
    "Accesorios para automóvil",
    "Accesorios para celular",
    "Todos"
];

function safeColor(value) {
    const color = stringValue(value, "#219EBC");

    return /^#[0-9a-f]{6}$/i.test(color)
        ? color.toUpperCase()
        : "#219EBC";
}

function safeIcon(value) {
    const icon = stringValue(value, "fa-solid fa-tag")
        .replace(/[^a-z0-9\-\s]/gi, " ")
        .replace(/\s+/g, " ")
        .trim();

    return icon || "fa-solid fa-tag";
}

function normalizeCategoryInput(input = {}) {
    const nombre = stringValue(input.nombre ?? input.name).slice(0, 80);

    return {
        nombre,
        slug: createSlug(input.slug || nombre).slice(0, 100),
        descripcion: stringValue(input.descripcion ?? input.description).slice(0, 280),
        icono: safeIcon(input.icono ?? input.icon),
        imagen: stringValue(input.imagen ?? input.image).slice(0, 1200),
        color: safeColor(input.color),
        activa: booleanValue(input.activa ?? input.active, true),
        mostrarMenu: booleanValue(input.mostrarMenu ?? input.showInMenu, true),
        mostrarInicio: booleanValue(input.mostrarInicio ?? input.showOnHome, true),
        destacada: booleanValue(input.destacada ?? input.featured, false),
        orden: Math.max(0, Math.min(9999, Math.floor(numberValue(input.orden ?? input.order, 0))))
    };
}

function normalizeCategoryOutput(category = {}) {
    const id = String(category._id || category.id || "");
    const nombre = stringValue(category.nombre ?? category.name);
    const slug = createSlug(category.slug || nombre);

    return {
        id,
        _id: id,
        nombre,
        slug,
        descripcion: stringValue(category.descripcion ?? category.description),
        icono: safeIcon(category.icono ?? category.icon),
        imagen: stringValue(category.imagen ?? category.image),
        color: safeColor(category.color),
        activa: booleanValue(category.activa ?? category.active, true),
        mostrarMenu: booleanValue(category.mostrarMenu ?? category.showInMenu, true),
        mostrarInicio: booleanValue(category.mostrarInicio ?? category.showOnHome, true),
        destacada: booleanValue(category.destacada ?? category.featured, false),
        orden: Math.max(0, Math.floor(numberValue(category.orden ?? category.order, 0))),
        createdAt: category.createdAt || null,
        updatedAt: category.updatedAt || null
    };
}

function fallbackCategoryDocuments() {
    return FALLBACK_CATEGORIES.map((nombre, index) => ({
        nombre,
        slug: createSlug(nombre),
        descripcion: "",
        icono: nombre === "Todos" ? "fa-solid fa-border-all" : "fa-solid fa-tag",
        imagen: "",
        color: "#219EBC",
        activa: true,
        mostrarMenu: true,
        mostrarInicio: true,
        destacada: index < 8,
        orden: (index + 1) * 10
    }));
}

function mergeCategoryDocuments(savedCategories = [], defaultCategories = fallbackCategoryDocuments()) {
    const seenSlugs = new Set();
    const merged = [];

    [...savedCategories, ...defaultCategories].forEach((category, index) => {
        const normalized = normalizeCategoryOutput({
            ...category,
            orden: category?.orden ?? (index + 1) * 10
        });

        if (!normalized.nombre || !normalized.slug) return;
        if (seenSlugs.has(normalized.slug)) return;

        seenSlugs.add(normalized.slug);
        merged.push(normalized);
    });

    return merged;
}

module.exports = {
    FALLBACK_CATEGORIES,
    fallbackCategoryDocuments,
    mergeCategoryDocuments,
    normalizeCategoryInput,
    normalizeCategoryOutput,
    safeColor,
    safeIcon
};
