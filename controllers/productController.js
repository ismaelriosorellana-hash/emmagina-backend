"use strict";

const mongoose = require("mongoose");
const Producto = require("../models/Producto");

const {
    normalizeProductOutput
} = require("../utils/productNormalizer");

const {
    createSlug
} = require("../utils/values");

const {
    escapeRegex,
    parseCatalogQuery,
    buildCatalogFilter,
    buildCatalogSort,
    buildPagination
} = require("../utils/catalogQuery");

const {
    normalizeCategories,
    relationScore,
    explicitRelatedIds
} = require("../utils/productRelations");

function applyFreshCatalogHeaders(res) {
    /*
     * Los precios, stock, publicación y variantes cambian desde el panel admin.
     * Para evitar que un cliente vea valores antiguos durante una compra real,
     * las respuestas JSON públicas de productos no se deben guardar en caché.
     */
    res.set(
        "Cache-Control",
        "no-store, max-age=0, must-revalidate"
    );
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
}

async function listProducts(req, res, next) {
    try {
        const options = parseCatalogQuery(req.query);
        const filter = buildCatalogFilter(options);
        const total = await Producto.countDocuments(filter);
        const pagination = buildPagination(
            total,
            options.page,
            options.limit
        );

        const products = await Producto.find(filter)
            .sort(buildCatalogSort(options.sort))
            .skip((pagination.pagina - 1) * pagination.limite)
            .limit(pagination.limite)
            .lean();

        const normalized = products.map(normalizeProductOutput);

        applyFreshCatalogHeaders(res);

        if (options.legacyArray) {
            return res.json(normalized);
        }

        return res.json({
            productos: normalized,
            paginacion: pagination,
            filtros: {
                busqueda: options.search,
                categoria: options.category,
                destacado: options.featured,
                personalizable: options.customizable,
                publicarCatalogo: options.publishCatalog,
                enStock: options.inStock,
                precioMin: options.minPrice,
                precioMax: options.maxPrice,
                ordenar: options.sort
            }
        });
    } catch (error) {
        next(error);
    }
}

async function getProduct(req, res, next) {
    try {
        const product = await Producto.findOne({
            _id: req.params.id,
            activo: {
                $ne: false
            }
        }).lean();

        if (!product) {
            return res.status(404).json({
                error: "Producto no encontrado."
            });
        }

        applyFreshCatalogHeaders(res);
        return res.json(normalizeProductOutput(product));
    } catch (error) {
        next(error);
    }
}

async function getProductBySlug(req, res, next) {
    try {
        const slug = createSlug(req.params.slug).slice(0, 140);

        if (!slug) {
            return res.status(400).json({
                error: "El slug del producto no es válido."
            });
        }

        let product = await Producto.findOne({
            slug,
            activo: {
                $ne: false
            }
        }).lean();

        /*
         * Compatibilidad temporal para productos antiguos que todavía no
         * tienen slug guardado en MongoDB. El script de migración incluido
         * permite completar este dato de forma permanente.
         */
        if (!product) {
            const candidates = await Producto.find({
                activo: {
                    $ne: false
                },
                $or: [
                    { slug: { $exists: false } },
                    { slug: "" },
                    { slug: null }
                ]
            })
                .select("nombre slug")
                .limit(500)
                .lean();

            const match = candidates.find(
                (candidate) => createSlug(candidate.nombre) === slug
            );

            if (match) {
                product = await Producto.findById(match._id).lean();
            }
        }

        if (!product) {
            return res.status(404).json({
                error: "Producto no encontrado."
            });
        }

        applyFreshCatalogHeaders(res);
        return res.json(normalizeProductOutput(product));
    } catch (error) {
        next(error);
    }
}

async function getRelatedProducts(req, res, next) {
    try {
        const current = await Producto.findOne({
            _id: req.params.id,
            activo: {
                $ne: false
            }
        }).lean();

        if (!current) {
            return res.status(404).json({
                error: "Producto no encontrado."
            });
        }

        const requestedLimit = Math.floor(Number(req.query.limit) || 5);
        const limit = Math.min(12, Math.max(1, requestedLimit));
        const explicitIds = explicitRelatedIds(current)
            .filter((id) => mongoose.isValidObjectId(id));

        const conditions = [];

        if (explicitIds.length) {
            conditions.push({
                _id: {
                    $in: explicitIds
                }
            });
        }

        normalizeCategories(current).forEach((category) => {
            const exact = new RegExp(
                `^${escapeRegex(category)}$`,
                "i"
            );

            conditions.push(
                { categorias: exact },
                { categoriaPrincipal: exact },
                { categoria: exact }
            );
        });

        const filter = {
            _id: {
                $ne: current._id
            },
            activo: {
                $ne: false
            },
            publicarCatalogo: {
                $ne: false
            }
        };

        if (conditions.length) {
            filter.$or = conditions;
        }

        const candidates = await Producto.find(filter)
            .sort({
                destacado: -1,
                ventas: -1,
                orden: 1,
                createdAt: -1
            })
            .limit(40)
            .lean();

        const explicitOrder = new Map(
            explicitIds.map((id, index) => [String(id), index])
        );

        const related = candidates
            .map((candidate) => ({
                candidate,
                explicitIndex:
                    explicitOrder.get(String(candidate._id)) ??
                    Number.MAX_SAFE_INTEGER,
                score: relationScore(current, candidate)
            }))
            .sort((a, b) =>
                a.explicitIndex - b.explicitIndex ||
                b.score - a.score ||
                Number(b.candidate.ventas || 0) - Number(a.candidate.ventas || 0)
            )
            .slice(0, limit)
            .map(({ candidate }) => normalizeProductOutput(candidate));

        applyFreshCatalogHeaders(res);
        return res.json({
            productos: related,
            total: related.length
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    listProducts,
    getProduct,
    getProductBySlug,
    getRelatedProducts
};
