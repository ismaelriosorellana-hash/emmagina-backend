"use strict";

const {
    firstDefined,
    stringValue,
    numberValue,
    booleanValue,
    parseKeyValueArray,
    normalizeStringList,
    createSlug
} = require("./values");

const {
    normalizeDeliveryConfig
} = require("./delivery");

function clampNumber(value, minimum, maximum, fallback = 0) {
    const parsed = numberValue(value, fallback);

    if (!Number.isFinite(parsed)) {
        return fallback;
    }

    return Math.min(maximum, Math.max(minimum, parsed));
}

function integerCLP(value, fallback = 0) {
    return Math.max(0, Math.round(clampNumber(value, 0, Number.MAX_SAFE_INTEGER, fallback)));
}

function normalizeSku(value) {
    return stringValue(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .replace(/[^A-Z0-9._-]+/g, "-")
        .replace(/-{2,}/g, "-")
        .replace(/^[-._]+|[-._]+$/g, "")
        .slice(0, 80);
}

function normalizeImages(value) {
    if (!Array.isArray(value)) {
        if (typeof value === "string" && value.trim()) {
            return [value.trim()];
        }

        return [];
    }

    return value
        .map((item, index) => {
            if (typeof item === "string") {
                const url = item.trim();
                return url ? { url, principal: index === 0, orden: index + 1 } : null;
            }

            if (item && typeof item === "object") {
                const url = stringValue(
                    firstDefined(item.url, item.secure_url, item.imgUrl, item.imagen, item.src)
                );

                if (!url) return null;

                return {
                    ...item,
                    url,
                    publicId: stringValue(firstDefined(item.publicId, item.public_id)).slice(0, 300),
                    alt: stringValue(item.alt).slice(0, 180),
                    principal: booleanValue(firstDefined(item.principal, item.isMain), index === 0),
                    orden: Math.round(clampNumber(firstDefined(item.orden, item.order), -1000, 1000, index + 1))
                };
            }

            return null;
        })
        .filter(Boolean)
        .sort((a, b) => Number(b.principal) - Number(a.principal) || Number(a.orden || 0) - Number(b.orden || 0))
        .slice(0, 30);
}

function imageUrl(image) {
    if (!image) return "";
    if (typeof image === "string") return image;
    return stringValue(firstDefined(image.url, image.secure_url, image.imagen, image.src));
}

function normalizeSizes(value) {
    const values = normalizeStringList(value)
        .map((item) => String(item || "").trim().replace(/\s*-\s*/g, "-"))
        .filter(Boolean);

    const valid = values.filter((item) =>
        /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]+(?:\s*-\s*[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]+)*$/.test(item)
    );

    return [...new Set(valid)].slice(0, 80);
}

function normalizeDimensions(value = {}) {
    const source = value && typeof value === "object"
        ? value
        : {};

    return {
        largoCm: clampNumber(firstDefined(source.largoCm, source.largo, source.lengthCm), 0, 1000),
        anchoCm: clampNumber(firstDefined(source.anchoCm, source.ancho, source.widthCm), 0, 1000),
        altoCm: clampNumber(firstDefined(source.altoCm, source.alto, source.heightCm), 0, 1000)
    };
}

function normalizeKeywords(value) {
    const values = Array.isArray(value)
        ? value
        : String(value || "").split(/[,\n]/);

    const unique = [];
    const seen = new Set();

    for (const item of values) {
        const keyword = stringValue(item)
            .replace(/[\u0000-\u001F\u007F]/g, " ")
            .replace(/\s+/g, " ")
            .slice(0, 60);

        const key = keyword.toLowerCase();

        if (!keyword || seen.has(key)) continue;

        seen.add(key);
        unique.push(keyword);

        if (unique.length >= 20) break;
    }

    return unique;
}

function normalizeBadgeColor(value, fallback) {
    const color = stringValue(value || fallback).trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) return color;
    return fallback;
}

function normalizeBadges(value) {
    if (!Array.isArray(value)) return [];

    return value
        .map((badge, index) => {
            if (!badge || typeof badge !== "object") return null;

            const text = stringValue(firstDefined(badge.texto, badge.text, badge.label)).slice(0, 48);

            if (!text) return null;

            return {
                ...badge,
                tipo: stringValue(firstDefined(badge.tipo, badge.type), "insignia").slice(0, 40),
                activo: booleanValue(firstDefined(badge.activo, badge.visible), true),
                texto: text,
                color: normalizeBadgeColor(firstDefined(badge.color, badge.background), "#219EBC"),
                textoColor: normalizeBadgeColor(firstDefined(badge.textoColor, badge.textColor, badge.colorTexto), "#ffffff"),
                orden: Math.round(clampNumber(firstDefined(badge.orden, badge.order), -1000, 1000, index + 1))
            };
        })
        .filter(Boolean)
        .sort((a, b) => a.orden - b.orden)
        .slice(0, 8);
}

function normalizeDiscountBadge(value = {}) {
    const source = value && typeof value === "object" ? value : {};
    return {
        tipo: "descuento",
        activo: booleanValue(firstDefined(source.activo, source.visible), true),
        texto: stringValue(firstDefined(source.texto, source.text, source.label)).slice(0, 48),
        color: normalizeBadgeColor(firstDefined(source.color, source.background), "#FB8500"),
        textoColor: normalizeBadgeColor(firstDefined(source.textoColor, source.textColor, source.colorTexto), "#023047"),
        orden: Math.round(clampNumber(firstDefined(source.orden, source.order), -1000, 1000, 2))
    };
}

function normalizeSeo(value = {}) {
    const source = value && typeof value === "object"
        ? value
        : {};

    return {
        titulo: stringValue(firstDefined(source.titulo, source.title)).slice(0, 70),
        descripcion: stringValue(firstDefined(source.descripcion, source.description)).slice(0, 180),
        imagen: stringValue(firstDefined(source.imagen, source.image, source.ogImage)).slice(0, 1200),
        palabrasClave: normalizeKeywords(firstDefined(source.palabrasClave, source.keywords)),
        noIndex: booleanValue(firstDefined(source.noIndex, source.noindex), false)
    };
}

function normalizeVariantOptions(value = {}) {
    const source = value && typeof value === "object" ? value : {};
    const options = {};
    const allowed = ["color", "talla", "acabado", "material", "estilo", "tamano", "formato"];

    for (const key of allowed) {
        const normalizedKey = key === "tamano" ? "tamaño" : key;
        const valueText = stringValue(firstDefined(source[key], source[normalizedKey])).slice(0, 80);
        if (valueText) options[normalizedKey] = valueText;
    }

    return options;
}

function normalizeFaq(value) {
    if (!Array.isArray(value)) return [];
    return value
        .map((item) => {
            if (!item || typeof item !== "object") return null;
            const pregunta = stringValue(firstDefined(item.pregunta, item.question)).slice(0, 180);
            const respuesta = stringValue(firstDefined(item.respuesta, item.answer)).slice(0, 1200);
            if (!pregunta || !respuesta) return null;
            return { pregunta, respuesta };
        })
        .filter(Boolean)
        .slice(0, 20);
}

function normalizePdpContent(value = {}) {
    const source = value && typeof value === "object" ? value : {};
    const beneficiosSource = firstDefined(source.beneficios, source.benefits);
    const cuidadosSource = firstDefined(source.cuidados, source.care, source.instruccionesCuidado);

    return {
        tituloBeneficio: stringValue(firstDefined(source.tituloBeneficio, source.benefitTitle)).slice(0, 120),
        textoBeneficio: stringValue(firstDefined(source.textoBeneficio, source.benefitText)).slice(0, 800),
        beneficios: normalizeStringList(beneficiosSource).slice(0, 12),
        cuidados: normalizeStringList(cuidadosSource).slice(0, 12),
        preguntasFrecuentes: normalizeFaq(firstDefined(source.preguntasFrecuentes, source.faqs)),
        mensajeCompra: stringValue(firstDefined(source.mensajeCompra, source.buyMessage)).slice(0, 240),
        garantia: stringValue(source.garantia).slice(0, 500)
    };
}

function variantKeyFrom(variant, index) {
    return stringValue(firstDefined(variant.id, variant._id, variant.key, variant.sku, variant.nombre))
        .trim()
        .replace(/\s+/g, "-")
        .slice(0, 120) || `variante-${index + 1}`;
}

function normalizeVariants(value, baseProduct = {}) {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((variant, index) => {
            if (!variant || typeof variant !== "object") {
                return null;
            }

            const name = stringValue(
                firstDefined(
                    variant.nombre,
                    variant.color,
                    variant.name,
                    variant.label,
                    variant.nombreColor,
                    variant.presentacion
                )
            ).slice(0, 120);

            if (!name) return null;

            const priceValue = firstDefined(variant.precio, variant.price);
            const originalValue = firstDefined(variant.precioOriginal, variant.originalPrice);
            const stock = integerCLP(firstDefined(variant.stock, variant.existencias));
            const reserved = integerCLP(firstDefined(variant.stockReservado, variant.reservado));
            const available = Math.max(0, stock - reserved);
            const images = normalizeImages(firstDefined(variant.imagenes, variant.images, variant.imagen));
            const price = priceValue === undefined || priceValue === null || priceValue === ""
                ? null
                : integerCLP(priceValue);

            const normalized = {
                ...variant,
                key: variantKeyFrom(variant, index),
                nombre: name,
                tipo: stringValue(firstDefined(variant.tipo, variant.type, "opcion")).slice(0, 60),
                opciones: normalizeVariantOptions(firstDefined(variant.opciones, variant.options, variant)),
                codigoHex: stringValue(firstDefined(variant.codigoHex, variant.colorHex, variant.hex, variant.codigoColor)).slice(0, 20),
                stock,
                stockReservado: reserved,
                stockDisponible: available,
                stockMinimo: integerCLP(firstDefined(variant.stockMinimo, variant.lowStockThreshold), 5),
                sku: normalizeSku(variant.sku),
                activo: booleanValue(variant.activo, true),
                imagenes: images,
                imagenPrincipal: imageUrl(firstDefined(variant.imagenPrincipal, images[0])) || imageUrl(images[0]),
                pesoGramos: Math.round(clampNumber(firstDefined(variant.pesoGramos, variant.peso, variant.weightGrams), 0, 100000)),
                dimensiones: normalizeDimensions(firstDefined(variant.dimensiones, variant.dimensions)),
                diasPreparacion: Math.min(90, Math.max(1, Math.round(numberValue(firstDefined(variant.diasPreparacion, baseProduct.diasPreparacion), 3)))),
                estadoComercial: stringValue(firstDefined(variant.estadoComercial, variant.status)).slice(0, 80)
            };

            if (price === null) {
                delete normalized.precio;
            } else {
                normalized.precio = price;
            }

            if (originalValue !== undefined && originalValue !== null && originalValue !== "") {
                normalized.precioOriginal = integerCLP(originalValue);
            }

            return normalized;
        })
        .filter(Boolean)
        .slice(0, 150);
}

function productPriceSummary(product) {
    const basePrice = integerCLP(product.precio);
    const baseOriginal = integerCLP(product.precioOriginal);
    const activeVariants = (product.variantes || []).filter((variant) => variant.activo !== false);
    const prices = activeVariants
        .map((variant) => Number.isFinite(Number(variant.precio)) ? integerCLP(variant.precio) : basePrice)
        .filter((price) => price >= 0);

    if (!prices.length) prices.push(basePrice);

    return {
        precioDesde: Math.min(...prices),
        precioHasta: Math.max(...prices),
        precioOriginalDesde: baseOriginal,
        tieneRangoPrecio: Math.min(...prices) !== Math.max(...prices)
    };
}

function productStockSummary(product) {
    const activeVariants = (product.variantes || []).filter((variant) => variant.activo !== false);
    if (!activeVariants.length) {
        const stock = integerCLP(firstDefined(product.stock, product.existencias));
        return {
            stockTotal: stock,
            stockDisponible: stock,
            enStock: stock > 0,
            stockBajo: stock > 0 && stock <= 5
        };
    }

    const total = activeVariants.reduce((sum, variant) => sum + integerCLP(variant.stock), 0);
    const available = activeVariants.reduce((sum, variant) => sum + integerCLP(firstDefined(variant.stockDisponible, variant.stock)), 0);

    return {
        stockTotal: total,
        stockDisponible: available,
        enStock: available > 0,
        stockBajo: available > 0 && available <= 5
    };
}

function normalizeProductOutput(rawProduct) {
    const raw = rawProduct?.toObject ? rawProduct.toObject() : { ...rawProduct };

    const categorias = normalizeStringList(firstDefined(raw.categorias, raw["categorías"], raw.categoria));
    const imagenes = normalizeImages(firstDefined(raw.imagenes, raw["imágenes"], raw.images));
    const personalizacionLigera = parseKeyValueArray(
        firstDefined(
            raw.personalizacionLigera,
            raw["personalizaciónLigera"],
            raw.personalizacionSimple,
            raw.personalizacionCatalogo
        )
    );

    const caracteristicas = firstDefined(
        raw.caracteristicas,
        raw["características"],
        raw.especificaciones,
        raw.detallesProducto,
        raw.detalles
    );

    const product = {
        ...raw,
        id: String(raw._id || raw.id || ""),
        nombre: stringValue(raw.nombre),
        slug: createSlug(stringValue(raw.slug) || stringValue(raw.nombre)),
        sku: normalizeSku(raw.sku),
        marca: stringValue(raw.marca, "Rhema Diseños").slice(0, 120),
        codigoBarras: stringValue(firstDefined(raw.codigoBarras, raw.barcode, raw.ean)).slice(0, 80),
        precio: integerCLP(raw.precio),
        precioOriginal: integerCLP(raw.precioOriginal),
        descripcion: stringValue(firstDefined(raw.descripcion, raw["descripción"])),
        descripcionCorta: stringValue(firstDefined(raw.descripcionCorta, raw.shortDescription)).slice(0, 360),
        imagenes,
        imagenPrincipal: imageUrl(firstDefined(raw.imagenPrincipal, imagenes[0])) || imageUrl(imagenes[0]),
        categorias,
        tallas: normalizeSizes(firstDefined(raw.tallas, raw.sizes, raw.talla)),
        categoriaPrincipal: stringValue(firstDefined(raw.categoriaPrincipal, raw.categoriaPincipal, raw.categoria)),
        insignia: stringValue(firstDefined(raw.insignia, raw.badge)),
        badges: normalizeBadges(raw.badges),
        badgeDescuento: normalizeDiscountBadge(firstDefined(raw.badgeDescuento, raw.discountBadge)),
        textoDisponibilidad: stringValue(firstDefined(raw.textoDisponibilidad, raw.availabilityText, raw.estadoComercialTexto)).slice(0, 80),
        destacado: booleanValue(raw.destacado, false),
        activo: booleanValue(raw.activo, true),
        personalizable: booleanValue(raw.personalizable, false),
        fabricadoPedido: booleanValue(firstDefined(raw.fabricadoPedido, raw.fabricadoAPedido, raw.madeToOrder), false),
        bajoPedido: booleanValue(raw.bajoPedido, false),
        publicarCatalogo: booleanValue(raw.publicarCatalogo, true),
        stock: integerCLP(firstDefined(raw.stock, raw.existencias)),
        existencias: integerCLP(firstDefined(raw.stock, raw.existencias)),
        ventas: integerCLP(raw.ventas),
        movimiento: numberValue(raw.movimiento),
        orden: numberValue(raw.orden),
        diasPreparacion: Math.min(90, Math.max(1, Math.round(numberValue(firstDefined(raw.diasPreparacion, raw.plazoPreparacionDias, raw.diasFabricacion), 3)))),
        pesoGramos: Math.round(clampNumber(firstDefined(raw.pesoGramos, raw.peso, raw.weightGrams), 0, 100000)),
        dimensiones: normalizeDimensions(firstDefined(raw.dimensiones, raw.dimensions)),
        seo: normalizeSeo(raw.seo),
        personalizacionLigera: personalizacionLigera || null,
        caracteristicas: caracteristicas || [],
        contenidoPDP: normalizePdpContent(firstDefined(raw.contenidoPDP, raw.pdp, raw.detalleComercial)),
        entrega: normalizeDeliveryConfig(firstDefined(raw.entrega, raw.metodosEntrega, raw.despacho)),
        variantes: [],
        ajusteImagenTarjeta: stringValue(raw.ajusteImagenTarjeta, "cover"),
        ajusteImagenDetalle: stringValue(raw.ajusteImagenDetalle, "contain"),
        posicionImagen: stringValue(raw.posicionImagen, "center")
    };

    product.variantes = normalizeVariants(firstDefined(raw.variantes, raw.colores), product);
    const priceSummary = productPriceSummary(product);
    const stockSummary = productStockSummary(product);
    const defaultVariant = product.variantes.find((variant) => variant.activo !== false && integerCLP(firstDefined(variant.stockDisponible, variant.stock)) > 0) ||
        product.variantes.find((variant) => variant.activo !== false) ||
        null;

    return {
        ...product,
        ...priceSummary,
        ...stockSummary,
        tieneVariantes: product.variantes.length > 0,
        variantesActivas: product.variantes.filter((variant) => variant.activo !== false).length,
        variantePredeterminada: defaultVariant,
        imagenPrincipal: product.imagenPrincipal || imageUrl(defaultVariant?.imagenPrincipal) || imageUrl(defaultVariant?.imagenes?.[0])
    };
}

function normalizeProductInput(input = {}) {
    const normalized = normalizeProductOutput(input);

    delete normalized.id;
    delete normalized._id;
    delete normalized.__v;
    delete normalized.createdAt;
    delete normalized.updatedAt;
    delete normalized.existencias;
    delete normalized.precioDesde;
    delete normalized.precioHasta;
    delete normalized.precioOriginalDesde;
    delete normalized.tieneRangoPrecio;
    delete normalized.stockTotal;
    delete normalized.stockDisponible;
    delete normalized.enStock;
    delete normalized.stockBajo;
    delete normalized.tieneVariantes;
    delete normalized.variantesActivas;
    delete normalized.variantePredeterminada;

    normalized.nombre = stringValue(input.nombre).slice(0, 180);
    normalized.precio = integerCLP(input.precio);
    normalized.precioOriginal = integerCLP(input.precioOriginal);
    normalized.stock = integerCLP(input.stock);
    normalized.slug = createSlug(stringValue(input.slug) || stringValue(input.nombre)).slice(0, 140);
    normalized.sku = normalizeSku(input.sku);
    normalized.marca = stringValue(input.marca, "Rhema Diseños").slice(0, 120);
    normalized.codigoBarras = stringValue(input.codigoBarras).slice(0, 80);
    normalized.descripcionCorta = stringValue(input.descripcionCorta).slice(0, 360);
    normalized.pesoGramos = Math.round(clampNumber(input.pesoGramos, 0, 100000));
    normalized.dimensiones = normalizeDimensions(input.dimensiones);
    normalized.seo = normalizeSeo(input.seo);
    normalized.contenidoPDP = normalizePdpContent(input.contenidoPDP);
    normalized.variantes = normalizeVariants(input.variantes, normalized);

    return normalized;
}

module.exports = {
    normalizeSku,
    normalizeImages,
    normalizeSizes,
    normalizeDimensions,
    normalizeKeywords,
    normalizeSeo,
    normalizeBadges,
    normalizeDiscountBadge,
    normalizeVariants,
    normalizePdpContent,
    normalizeProductOutput,
    normalizeProductInput
};
