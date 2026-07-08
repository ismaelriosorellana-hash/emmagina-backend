"use strict";

const {
    booleanValue,
    numberValue,
    stringValue
} = require("./values");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 100;
const MAX_SEARCH_LENGTH = 80;
const MAX_CATEGORY_LENGTH = 80;

function escapeRegex(value) {
    return String(value || "")
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function boundedText(value, maxLength) {
    return stringValue(value)
        .replace(/[\u0000-\u001F\u007F]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, maxLength);
}

function positiveInteger(value, fallback, maximum = Number.MAX_SAFE_INTEGER) {
    const parsed = Math.floor(numberValue(value, fallback));

    if (!Number.isFinite(parsed) || parsed < 1) {
        return fallback;
    }

    return Math.min(parsed, maximum);
}

function optionalMoney(value) {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    const parsed = numberValue(value, NaN);

    if (!Number.isFinite(parsed) || parsed < 0) {
        return null;
    }

    return parsed;
}

function parseCatalogQuery(query = {}) {
    const page = positiveInteger(
        query.page ?? query.pagina,
        DEFAULT_PAGE
    );

    const limit = positiveInteger(
        query.limit ?? query.limite,
        DEFAULT_LIMIT,
        MAX_LIMIT
    );

    const minPrice = optionalMoney(
        query.precioMin ?? query.minPrice
    );

    const maxPrice = optionalMoney(
        query.precioMax ?? query.maxPrice
    );

    return {
        page,
        limit,
        search: boundedText(
            query.q ?? query.buscar,
            MAX_SEARCH_LENGTH
        ),
        category: boundedText(
            query.categoria ?? query.category,
            MAX_CATEGORY_LENGTH
        ),
        featured:
            query.destacado === undefined
                ? null
                : booleanValue(query.destacado),
        customizable:
            query.personalizable === undefined
                ? null
                : booleanValue(query.personalizable),
        publishCatalog:
            query.publicarCatalogo === undefined
                ? null
                : booleanValue(query.publicarCatalogo),
        inStock:
            query.enStock === undefined && query.stock === undefined
                ? null
                : booleanValue(query.enStock ?? query.stock),
        minPrice,
        maxPrice,
        sort: boundedText(
            query.ordenar ?? query.sort,
            30
        ).toLowerCase() || "relevancia",
        legacyArray:
            String(query.formato || "").toLowerCase() === "lista"
    };
}

function buildCatalogFilter(options) {
    const filter = {
        activo: {
            $ne: false
        }
    };

    if (options.featured !== null) {
        filter.destacado = options.featured;
    }

    if (options.customizable !== null) {
        filter.personalizable = options.customizable;
    }

    if (options.publishCatalog !== null) {
        filter.publicarCatalogo = options.publishCatalog;
    }

    if (options.category) {
        const escaped = escapeRegex(options.category);
        const exact = new RegExp(`^${escaped}$`, "i");
        const commaSeparated = new RegExp(
            `(^|,\\s*)${escaped}(\\s*,|$)`,
            "i"
        );

        filter.$or = [
            { categorias: options.category },
            { categorias: exact },
            { categorias: commaSeparated },
            { categoriaPrincipal: exact },
            { categoria: exact }
        ];
    }

    if (options.search) {
        const searchRegex = new RegExp(
            escapeRegex(options.search),
            "i"
        );

        const searchConditions = [
            { nombre: searchRegex },
            { descripcion: searchRegex },
            { categoriaPrincipal: searchRegex },
            { categorias: searchRegex },
            { tags: searchRegex },
            { sku: searchRegex }
        ];

        if (filter.$or) {
            filter.$and = [
                { $or: filter.$or },
                { $or: searchConditions }
            ];
            delete filter.$or;
        } else {
            filter.$or = searchConditions;
        }
    }

    if (options.minPrice !== null || options.maxPrice !== null) {
        filter.precio = {};

        if (options.minPrice !== null) {
            filter.precio.$gte = options.minPrice;
        }

        if (options.maxPrice !== null) {
            filter.precio.$lte = options.maxPrice;
        }
    }

    if (options.inStock !== null) {
        const stockConditions = options.inStock
            ? [
                { stock: { $gt: 0 } },
                { "variantes.stock": { $gt: 0 } }
            ]
            : [
                {
                    $and: [
                        {
                            $or: [
                                { stock: { $lte: 0 } },
                                { stock: { $exists: false } }
                            ]
                        },
                        {
                            "variantes.stock": {
                                $not: { $gt: 0 }
                            }
                        }
                    ]
                }
            ];

        if (filter.$and) {
            filter.$and.push({ $or: stockConditions });
        } else if (filter.$or) {
            filter.$and = [
                { $or: filter.$or },
                { $or: stockConditions }
            ];
            delete filter.$or;
        } else {
            filter.$or = stockConditions;
        }
    }

    return filter;
}

function buildCatalogSort(sort) {
    switch (sort) {
        case "precio_asc":
        case "price_asc":
            return { precio: 1, orden: 1, createdAt: -1 };

        case "precio_desc":
        case "price_desc":
            return { precio: -1, orden: 1, createdAt: -1 };

        case "nuevos":
        case "newest":
            return { createdAt: -1, orden: 1 };

        case "ventas":
        case "popularidad":
            return { ventas: -1, destacado: -1, orden: 1 };

        case "nombre":
        case "nombre_asc":
            return { nombre: 1, orden: 1 };

        default:
            return {
                orden: 1,
                destacado: -1,
                ventas: -1,
                createdAt: -1
            };
    }
}

function buildPagination(total, page, limit) {
    const pages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, pages);

    return {
        pagina: safePage,
        limite: limit,
        total,
        paginas: pages,
        hayAnterior: safePage > 1,
        haySiguiente: safePage < pages
    };
}

module.exports = {
    DEFAULT_PAGE,
    DEFAULT_LIMIT,
    MAX_LIMIT,
    escapeRegex,
    parseCatalogQuery,
    buildCatalogFilter,
    buildCatalogSort,
    buildPagination
};
