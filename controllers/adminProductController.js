"use strict";

const Producto =
    require("../models/Producto");

const {
    normalizeProductInput,
    normalizeProductOutput
} = require("../utils/productNormalizer");

const {
    resolveUniqueProductSlug
} = require("../services/productSlugService");

const {
    assignProductSkus
} = require("../services/productSkuService");

const {
    escapeRegex
} = require("../utils/catalogQuery");


const { previewImport, applyImport, buildTemplateBuffer } = require("../services/productSpreadsheetService");

async function downloadProductTemplate(req, res, next) {
    try {
        const includeCurrent = String(req.query.incluirActuales || "true") !== "false";
        const buffer = await buildTemplateBuffer(includeCurrent);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="plantilla-productos-rhema-${new Date().toISOString().slice(0,10)}.xlsx"`);
        res.send(buffer);
    } catch (error) { next(error); }
}

async function importProductsExcel(req, res, next) {
    try {
        if (!req.file?.buffer) return res.status(400).json({ error: "Debes adjuntar una plantilla Excel." });
        const apply = String(req.body?.aplicar || "false") === "true";
        const result = apply ? await applyImport(req.file.buffer) : await previewImport(req.file.buffer);
        res.status(result.errors?.length ? 422 : 200).json({
            modo: apply ? "aplicado" : "vista_previa",
            resumen: result.resumen, errores: result.errors, vistaPrevia: result.preview, aplicados: result.applied || []
        });
    } catch (error) { next(error); }
}

async function listAdminProducts(
    req,
    res,
    next
) {
    try {
        const filter = {};

        if (req.query.buscar) {
            const search = String(req.query.buscar)
                .replace(/[\u0000-\u001F\u007F]/g, " ")
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 80);

            if (search) {
                const pattern = new RegExp(escapeRegex(search), "i");

                filter.$or = [
                    { nombre: pattern },
                    { descripcion: pattern },
                    { sku: pattern },
                    { "variantes.sku": pattern },
                    { marca: pattern },
                    { categoriaPrincipal: pattern }
                ];
            }
        }

        if (
            req.query.activo !==
            undefined
        ) {
            filter.activo =
                String(
                    req.query.activo
                ) !== "false";
        }

        const products =
            await Producto.find(filter)
                .sort({
                    orden: 1,
                    createdAt: -1
                })
                .lean();

        res.json(
            products.map(
                normalizeProductOutput
            )
        );
    } catch (error) {
        next(error);
    }
}

async function getAdminProduct(
    req,
    res,
    next
) {
    try {
        const product =
            await Producto.findById(
                req.params.id
            ).lean();

        if (!product) {
            return res.status(404).json({
                error:
                    "Producto no encontrado."
            });
        }

        res.json(
            normalizeProductOutput(
                product
            )
        );
    } catch (error) {
        next(error);
    }
}

async function createProduct(
    req,
    res,
    next
) {
    try {
        const data =
            normalizeProductInput(
                req.body
            );

        if (!data.nombre) {
            return res.status(400).json({
                error:
                    "El nombre es obligatorio."
            });
        }

        data.slug = await resolveUniqueProductSlug(
            Producto,
            {
                name: data.nombre,
                requestedSlug: data.slug
            }
        );

        await assignProductSkus(
            Producto,
            data
        );

        const product =
            await Producto.create(data);

        res.status(201).json(
            normalizeProductOutput(
                product
            )
        );
    } catch (error) {
        next(error);
    }
}

async function updateProduct(
    req,
    res,
    next
) {
    try {
        const data =
            normalizeProductInput(
                req.body
            );

        const existing = await Producto.findById(
            req.params.id
        )
            .select("nombre slug sku")
            .lean();

        if (!existing) {
            return res.status(404).json({
                error:
                    "Producto no encontrado."
            });
        }

        data.nombre = data.nombre || existing.nombre;
        data.slug = await resolveUniqueProductSlug(
            Producto,
            {
                name: data.nombre,
                requestedSlug: data.slug || existing.slug,
                excludeId: req.params.id
            }
        );

        await assignProductSkus(
            Producto,
            data,
            {
                excludeId: req.params.id,
                existingSku: existing.sku
            }
        );

        const product =
            await Producto.findByIdAndUpdate(
                req.params.id,
                {
                    $set: data
                },
                {
                    new: true,
                    runValidators: true
                }
            );

        if (!product) {
            return res.status(404).json({
                error:
                    "Producto no encontrado."
            });
        }

        res.json(
            normalizeProductOutput(
                product
            )
        );
    } catch (error) {
        next(error);
    }
}

async function deleteProduct(
    req,
    res,
    next
) {
    try {
        const product =
            await Producto.findByIdAndUpdate(
                req.params.id,
                {
                    activo: false,
                    publicarCatalogo: false
                },
                {
                    new: true
                }
            );

        if (!product) {
            return res.status(404).json({
                error:
                    "Producto no encontrado."
            });
        }

        res.json({
            mensaje:
                "Producto desactivado correctamente."
        });
    } catch (error) {
        next(error);
    }
}

async function updateVariantInventory(
    req,
    res,
    next
) {
    try {
        const product = await Producto.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                error: "Producto no encontrado."
            });
        }

        const updates = Array.isArray(req.body?.variantes)
            ? req.body.variantes
            : [];

        if (!updates.length) {
            return res.status(400).json({
                error: "No se recibieron variantes para actualizar."
            });
        }

        const nextVariants = (product.variantes || []).map((variant) => {
            const key = String(variant.key || variant.sku || variant.nombre || "");
            const update = updates.find((item) => {
                const candidate = String(item.key || item.sku || item.nombre || "");
                return candidate && candidate === key;
            });

            if (!update) return variant;

            const stock = Math.max(0, Math.round(Number(update.stock ?? variant.stock ?? 0) || 0));
            const reserved = Math.max(0, Math.round(Number(update.stockReservado ?? variant.stockReservado ?? 0) || 0));

            return {
                ...variant,
                stock,
                stockReservado: reserved,
                stockDisponible: Math.max(0, stock - reserved),
                stockMinimo: Math.max(0, Math.round(Number(update.stockMinimo ?? variant.stockMinimo ?? 5) || 0)),
                estadoComercial: String(update.estadoComercial ?? variant.estadoComercial ?? "").slice(0, 80)
            };
        });

        product.variantes = nextVariants;
        product.stock = nextVariants.reduce((sum, variant) => {
            if (variant.activo === false) return sum;
            return sum + Math.max(0, Math.round(Number(variant.stockDisponible ?? variant.stock ?? 0) || 0));
        }, 0);

        await product.save();

        res.json(normalizeProductOutput(product));
    } catch (error) {
        next(error);
    }
}

module.exports = {
    listAdminProducts,
    getAdminProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    updateVariantInventory,
    downloadProductTemplate,
    importProductsExcel
};
