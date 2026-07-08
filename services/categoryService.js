"use strict";

const Categoria = require("../models/Categoria");
const Producto = require("../models/Producto");

const {
    fallbackCategoryDocuments,
    mergeCategoryDocuments,
    normalizeCategoryOutput
} = require("../utils/categoryNormalizer");

const { escapeRegex } = require("../utils/catalogQuery");

function productCategoryFilter(categoryName) {
    const escaped = escapeRegex(categoryName);
    const exact = new RegExp(`^${escaped}$`, "i");
    const commaSeparated = new RegExp(
        `(^|,\\s*)${escaped}(\\s*,|$)`,
        "i"
    );

    return {
        activo: { $ne: false },
        publicarCatalogo: { $ne: false },
        $or: [
            { categorias: categoryName },
            { categorias: exact },
            { categorias: commaSeparated },
            { categoriaPrincipal: exact },
            { categoria: exact }
        ]
    };
}

async function countProductsByCategory(categories) {
    const pairs = await Promise.all(
        categories.map(async (category) => {
            const total = await Producto.countDocuments(
                productCategoryFilter(category.nombre)
            );

            return [category.slug, total];
        })
    );

    return new Map(pairs);
}

async function getActiveCategories(options = {}) {
    const savedCategories = await Categoria.find({})
        .sort({ orden: 1, nombre: 1 })
        .lean();

    const mergedCategories = mergeCategoryDocuments(
        savedCategories,
        fallbackCategoryDocuments()
    );

    const normalized = mergedCategories
        .filter((category) => category.activa !== false)
        .filter((category) => !options.menuOnly || category.mostrarMenu !== false)
        .filter((category) => !options.homeOnly || category.mostrarInicio !== false);

    if (!options.includeCounts) {
        return normalized;
    }

    const counts = await countProductsByCategory(normalized);

    return normalized.map((category) => ({
        ...category,
        totalProductos: counts.get(category.slug) || 0
    }));
}

async function resolveUniqueCategorySlug(requestedSlug, excludeId = null) {
    const base = String(requestedSlug || "categoria").trim() || "categoria";
    let slug = base;
    let suffix = 2;

    while (true) {
        const filter = { slug };

        if (excludeId) {
            filter._id = { $ne: excludeId };
        }

        const exists = await Categoria.exists(filter);

        if (!exists) return slug;

        slug = `${base}-${suffix}`;
        suffix += 1;
    }
}

module.exports = {
    getActiveCategories,
    resolveUniqueCategorySlug
};
