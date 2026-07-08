"use strict";

const mongoose = require("mongoose");
const Producto = require("../models/Producto");
const {
    numberValue,
    stringValue
} = require("../utils/values");

const CATEGORY_BASE = Object.freeze({
    "Librería": 7990,
    "Tazas": 4990,
    "Vasos": 6990,
    "Botellas": 7990,
    "Vestuario": 12990,
    "Accesorios": 5990,
    "Otros": 7990
});

const PRODUCT_BASE_OVERRIDES = Object.freeze({
    "agenda personal 2026": 7990,
    "poleron": 12990,
    "polerón": 12990,
    "taza": 4990
});

const DEFAULT_EXTRAS = Object.freeze({
    image: 3000,
    mainText: 2000,
    secondaryText: 2000
});

function httpError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

function normalizedText(value) {
    return stringValue(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function imagesOf(value) {
    if (!Array.isArray(value)) return [];

    return value
        .map((item) => {
            if (typeof item === "string") return item;
            return item?.secure_url || item?.url || item?.imagen || item?.imgUrl || "";
        })
        .map(stringValue)
        .filter(Boolean);
}

function variantIdentifier(variant) {
    return stringValue(
        variant?._id ||
        variant?.id ||
        variant?.codigo ||
        variant?.sku
    );
}

function findVariant(product, requestedItem) {
    if (!Array.isArray(product.variantes)) return null;

    const requestedId = stringValue(requestedItem.varianteId);
    const requestedSku = stringValue(requestedItem.sku);
    const requestedName = normalizedText(requestedItem.color);

    return product.variantes.find((variant) => {
        if (!variant || typeof variant !== "object") return false;
        if (variant.activo === false || variant.habilitado === false) return false;

        const id = variantIdentifier(variant);
        const sku = stringValue(variant.sku || variant.codigo);
        const name = normalizedText(variant.nombre || variant.color);

        return Boolean(
            (requestedId && id === requestedId) ||
            (requestedSku && sku === requestedSku) ||
            (requestedName && name === requestedName)
        );
    }) || null;
}

function firstProductImage(product, variant) {
    const variantImages = imagesOf(variant?.imagenes || variant?.images || []);
    const variantSingle = stringValue(
        variant?.secure_url || variant?.url || variant?.imagen || variant?.imgUrl
    );

    if (variantSingle) variantImages.unshift(variantSingle);

    const productImages = imagesOf(product.imagenes || product.images || []);
    return variantImages[0] || productImages[0] || "";
}

function variantStock(product, variant) {
    const raw = variant
        ? variant.stock ?? variant.existencias
        : product.stock ?? product.existencias;

    if (raw === undefined || raw === null || raw === "") return null;
    return Math.max(0, numberValue(raw));
}

function directPrice(product, variant) {
    const variantPrice = variant?.precio ?? variant?.price;
    return Math.max(
        0,
        variantPrice === undefined || variantPrice === null || variantPrice === ""
            ? numberValue(product.precio)
            : numberValue(variantPrice)
    );
}

function personalizationValue(customization, path, legacyKey = "") {
    const parts = path.split(".");
    let current = customization;

    for (const part of parts) {
        current = current?.[part];
    }

    return current ?? (legacyKey ? customization?.[legacyKey] : undefined);
}

function customizationBase(product, customization, variant = null) {
    const currentPrice = directPrice(product, variant);
    if (currentPrice > 0) return currentPrice;

    const explicit = numberValue(
        product.precioBasePersonalizacion ??
        product.precioBasePersonalizado ??
        product.personalizacion?.precioBase
    );

    if (explicit > 0) return explicit;

    const productName = normalizedText(product.nombre);

    for (const [name, value] of Object.entries(PRODUCT_BASE_OVERRIDES)) {
        if (productName.includes(normalizedText(name))) return value;
    }

    const category = stringValue(
        customization?.category ||
        product.categoriaPrincipal ||
        product.categoria
    );

    return CATEGORY_BASE[category] || CATEGORY_BASE.Otros;
}

function customizationPrice(product, customization, variant = null) {
    const costs = product.costosPersonalizacion || product.personalizacion?.costos || {};
    const base = customizationBase(product, customization, variant);
    const imageCost = numberValue(
        costs.imagen ?? product.precioAgregarImagen,
        DEFAULT_EXTRAS.image
    );
    const mainTextCost = numberValue(
        costs.textoPrincipal ?? product.precioTextoPrincipal,
        DEFAULT_EXTRAS.mainText
    );
    const secondaryTextCost = numberValue(
        costs.textoSecundario ?? product.precioTextoSecundario,
        DEFAULT_EXTRAS.secondaryText
    );

    const hasImage = Boolean(
        personalizationValue(customization, "assets.original.url") ||
        personalizationValue(customization, "image.asset.url") ||
        customization?.imageName
    );
    const mainText = stringValue(
        personalizationValue(customization, "texts.main.value", "mainText")
    );
    const secondaryText = stringValue(
        personalizationValue(customization, "texts.secondary.value", "secondaryText")
    );

    return Math.max(
        0,
        base +
        (hasImage ? imageCost : 0) +
        (mainText ? mainTextCost : 0) +
        (secondaryText ? secondaryTextCost : 0)
    );
}

function isFullCustomization(product, customization) {
    return Boolean(
        customization &&
        typeof customization === "object" &&
        (
            Number(customization.version) >= 2 ||
            customization.customizationId ||
            product.personalizable === true
        )
    );
}

async function priceOrderItems(requestedItems) {
    if (!Array.isArray(requestedItems) || requestedItems.length === 0) {
        throw httpError("El carrito está vacío.");
    }

    const ids = [
        ...new Set(
            requestedItems
                .map((item) => stringValue(item.productoId))
                .filter((id) => mongoose.isValidObjectId(id))
        )
    ];

    const products = await Producto.find({
        _id: { $in: ids },
        activo: { $ne: false }
    }).lean();

    const productMap = new Map(
        products.map((product) => [String(product._id), product])
    );

    return requestedItems.map((requested) => {
        const product = productMap.get(stringValue(requested.productoId));

        if (!product) {
            throw httpError(
                `El producto "${stringValue(requested.nombre, "seleccionado")}" ya no está disponible.`,
                409
            );
        }

        const quantity = Math.min(
            99,
            Math.max(1, Math.trunc(numberValue(requested.cantidad, 1)))
        );
        const variant = findVariant(product, requested);
        const configuredSizes = Array.isArray(product.tallas)
            ? product.tallas.map(stringValue).filter(Boolean)
            : [];
        const requestedSize = stringValue(
            requested.talla || requested.personalizacion?.talla || requested.personalizacion?.size
        );
        let selectedSize = requestedSize;

        if (configuredSizes.length) {
            const matchedSize = configuredSizes.find(
                (size) => normalizedText(size) === normalizedText(requestedSize)
            );

            if (!matchedSize) {
                throw httpError(
                    `Debes seleccionar una talla válida para "${product.nombre}".`,
                    409
                );
            }

            selectedSize = matchedSize;
        }

        const stock = variantStock(product, variant);

        if (stock !== null && stock < quantity) {
            throw httpError(
                `No hay stock suficiente para "${product.nombre}".`,
                409
            );
        }

        const customization = requested.personalizacion || null;
        const unitPrice = isFullCustomization(product, customization)
            ? customizationPrice(product, customization, variant)
            : directPrice(product, variant);

        if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
            throw httpError(
                `"${product.nombre}" no tiene un precio válido.`,
                409
            );
        }

        return {
            lineaId: stringValue(requested.lineaId) || undefined,
            productoId: String(product._id),
            nombre: stringValue(product.nombre),
            imagen: firstProductImage(product, variant) || stringValue(requested.imagen),
            varianteId: variantIdentifier(variant) || stringValue(requested.varianteId),
            color: stringValue(variant?.nombre || variant?.color || requested.color),
            talla: selectedSize,
            sku: stringValue(variant?.sku || variant?.codigo || requested.sku),
            cantidad: quantity,
            precioUnitario: Math.round(unitPrice),
            subtotal: Math.round(unitPrice) * quantity,
            personalizacion: customization,
            entrega: requested.entrega || product.entrega || null
        };
    });
}

function calculateOrderTotals(items) {
    const subtotal = items.reduce(
        (sum, item) => sum + Number(item.subtotal || 0),
        0
    );

    return {
        subtotal,
        costoEnvio: 0,
        descuento: 0,
        total: subtotal
    };
}

module.exports = {
    priceOrderItems,
    calculateOrderTotals
};
