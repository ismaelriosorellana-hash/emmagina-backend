"use strict";

const {
    createSlug,
    stringValue
} = require("../utils/values");

const {
    normalizeSku
} = require("../utils/productNormalizer");

const {
    escapeRegex
} = require("../utils/catalogQuery");

function createSkuBase(value, prefix = "MC") {
    const slug = createSlug(value)
        .replace(/-/g, "-")
        .toUpperCase()
        .slice(0, 46);

    const normalizedPrefix = prefix === ""
        ? ""
        : (normalizeSku(prefix).slice(0, 12) || "MC");

    if (!normalizedPrefix) {
        return normalizeSku(slug || "VARIANTE");
    }

    return normalizeSku(slug ? `${normalizedPrefix}-${slug}` : `${normalizedPrefix}-PRODUCTO`);
}

function exposedError(message, statusCode = 409) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.expose = true;
    return error;
}

async function skuExists(ProductModel, sku, excludeId = null) {
    if (!sku) return false;

    const exact = new RegExp(`^${escapeRegex(sku)}$`, "i");
    const filter = {
        $or: [
            { sku: exact },
            { "variantes.sku": exact }
        ]
    };

    if (excludeId) {
        filter._id = { $ne: excludeId };
    }

    return Boolean(
        await ProductModel.exists(filter)
    );
}

async function uniqueGeneratedSku(ProductModel, base, usedLocal, excludeId = null) {
    const normalizedBase = normalizeSku(base) || "MC-PRODUCTO";

    for (let suffix = 1; suffix <= 9999; suffix += 1) {
        const tail = suffix === 1 ? "" : `-${suffix}`;
        const candidate = normalizeSku(
            `${normalizedBase.slice(0, Math.max(1, 80 - tail.length))}${tail}`
        );

        if (usedLocal.has(candidate)) continue;

        if (!(await skuExists(ProductModel, candidate, excludeId))) {
            usedLocal.add(candidate);
            return candidate;
        }
    }

    const fallback = normalizeSku(
        `${normalizedBase.slice(0, 60)}-${Date.now()}`
    );
    usedLocal.add(fallback);
    return fallback;
}

async function assignProductSkus(
    ProductModel,
    data,
    {
        excludeId = null,
        existingSku = ""
    } = {}
) {
    const usedLocal = new Set();
    const requestedProductSku = normalizeSku(data.sku || existingSku);

    if (requestedProductSku) {
        if (await skuExists(ProductModel, requestedProductSku, excludeId)) {
            throw exposedError(
                `El SKU ${requestedProductSku} ya está utilizado por otro producto o variante.`
            );
        }

        data.sku = requestedProductSku;
        usedLocal.add(requestedProductSku);
    } else {
        data.sku = await uniqueGeneratedSku(
            ProductModel,
            createSkuBase(data.nombre),
            usedLocal,
            excludeId
        );
    }

    const variants = Array.isArray(data.variantes)
        ? data.variantes
        : [];

    for (const variant of variants) {
        const requestedVariantSku = normalizeSku(variant.sku);

        if (requestedVariantSku) {
            if (usedLocal.has(requestedVariantSku)) {
                throw exposedError(
                    `El SKU ${requestedVariantSku} está repetido dentro del producto.`
                );
            }

            if (await skuExists(ProductModel, requestedVariantSku, excludeId)) {
                throw exposedError(
                    `El SKU ${requestedVariantSku} ya está utilizado por otro producto o variante.`
                );
            }

            variant.sku = requestedVariantSku;
            variant.key = variant.key || requestedVariantSku;
            usedLocal.add(requestedVariantSku);
            continue;
        }

        const variantName = stringValue(variant.nombre) || "VARIANTE";
        variant.sku = await uniqueGeneratedSku(
            ProductModel,
            `${data.sku}-${createSkuBase(variantName, "").replace(/^-+/, "")}`,
            usedLocal,
            excludeId
        );
        variant.key = variant.key || variant.sku;
    }

    return data;
}

module.exports = {
    createSkuBase,
    skuExists,
    assignProductSkus
};
