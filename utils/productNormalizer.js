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

    return value.filter((item) => {
        if (typeof item === "string") {
            return Boolean(item.trim());
        }

        if (item && typeof item === "object") {
            return Boolean(
                item.url ||
                item.secure_url ||
                item.imgUrl ||
                item.imagen
            );
        }

        return false;
    });
}

function normalizeSizes(value) {
    const values = normalizeStringList(value)
        .map((item) => String(item || "").trim().replace(/\s*-\s*/g, "-"))
        .filter(Boolean);

    const valid = values.filter((item) =>
        /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]+(?:\s*-\s*[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]+)*$/.test(item)
    );

    return [...new Set(valid)].slice(0, 40);
}

function normalizeDimensions(value = {}) {
    const source = value && typeof value === "object"
        ? value
        : {};

    return {
        largoCm: clampNumber(
            firstDefined(source.largoCm, source.largo, source.lengthCm),
            0,
            1000
        ),
        anchoCm: clampNumber(
            firstDefined(source.anchoCm, source.ancho, source.widthCm),
            0,
            1000
        ),
        altoCm: clampNumber(
            firstDefined(source.altoCm, source.alto, source.heightCm),
            0,
            1000
        )
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

function normalizeSeo(value = {}) {
    const source = value && typeof value === "object"
        ? value
        : {};

    return {
        titulo: stringValue(
            firstDefined(source.titulo, source.title)
        ).slice(0, 70),
        descripcion: stringValue(
            firstDefined(source.descripcion, source.description)
        ).slice(0, 180),
        imagen: stringValue(
            firstDefined(source.imagen, source.image)
        ).slice(0, 1200),
        palabrasClave: normalizeKeywords(
            firstDefined(source.palabrasClave, source.keywords)
        ),
        noIndex: booleanValue(
            firstDefined(source.noIndex, source.noindex),
            false
        )
    };
}

function normalizeVariants(value) {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((variant) => {
            if (!variant || typeof variant !== "object") {
                return null;
            }

            const name = stringValue(
                firstDefined(
                    variant.nombre,
                    variant.color,
                    variant.name,
                    variant.label,
                    variant.nombreColor
                )
            ).slice(0, 120);

            if (!name) return null;

            const priceValue = firstDefined(
                variant.precio,
                variant.price
            );

            const normalized = {
                ...variant,
                nombre: name,
                codigoHex: stringValue(
                    firstDefined(
                        variant.codigoHex,
                        variant.colorHex,
                        variant.hex,
                        variant.codigoColor
                    )
                ).slice(0, 20),
                stock: Math.floor(
                    clampNumber(
                        firstDefined(variant.stock, variant.existencias),
                        0,
                        Number.MAX_SAFE_INTEGER
                    )
                ),
                sku: normalizeSku(variant.sku),
                activo: booleanValue(variant.activo, true),
                imagenes: normalizeImages(
                    firstDefined(
                        variant.imagenes,
                        variant.images,
                        variant.imagen
                    )
                ),
                pesoGramos: Math.round(
                    clampNumber(
                        firstDefined(
                            variant.pesoGramos,
                            variant.peso,
                            variant.weightGrams
                        ),
                        0,
                        100000
                    )
                ),
                dimensiones: normalizeDimensions(
                    firstDefined(
                        variant.dimensiones,
                        variant.dimensions
                    )
                )
            };

            if (
                priceValue === undefined ||
                priceValue === null ||
                priceValue === ""
            ) {
                delete normalized.precio;
            } else {
                normalized.precio = clampNumber(
                    priceValue,
                    0,
                    Number.MAX_SAFE_INTEGER
                );
            }

            return normalized;
        })
        .filter(Boolean)
        .slice(0, 100);
}

function normalizeProductOutput(rawProduct) {
    const raw =
        rawProduct?.toObject
            ? rawProduct.toObject()
            : { ...rawProduct };

    const categorias =
        normalizeStringList(
            firstDefined(
                raw.categorias,
                raw["categorías"],
                raw.categoria
            )
        );

    const imagenes =
        normalizeImages(
            firstDefined(
                raw.imagenes,
                raw["imágenes"],
                raw.images
            )
        );

    const personalizacionLigera =
        parseKeyValueArray(
            firstDefined(
                raw.personalizacionLigera,
                raw["personalizaciónLigera"],
                raw.personalizacionSimple,
                raw.personalizacionCatalogo
            )
        );

    const caracteristicas =
        firstDefined(
            raw.caracteristicas,
            raw["características"],
            raw.especificaciones,
            raw.detallesProducto,
            raw.detalles
        );

    const stock =
        Math.max(
            0,
            numberValue(
                firstDefined(
                    raw.stock,
                    raw.existencias
                )
            )
        );

    return {
        ...raw,
        id: String(raw._id || raw.id || ""),
        nombre: stringValue(raw.nombre),
        slug: createSlug(
            stringValue(raw.slug) ||
            stringValue(raw.nombre)
        ),
        sku: normalizeSku(raw.sku),
        marca: stringValue(raw.marca, "Mommy Crafts").slice(0, 120),
        codigoBarras: stringValue(
            firstDefined(raw.codigoBarras, raw.barcode, raw.ean)
        ).slice(0, 80),
        precio: Math.max(
            0,
            numberValue(raw.precio)
        ),
        precioOriginal: Math.max(
            0,
            numberValue(raw.precioOriginal)
        ),
        descripcion: stringValue(
            firstDefined(
                raw.descripcion,
                raw["descripción"]
            )
        ),
        imagenes,
        categorias,
        tallas: normalizeSizes(
            firstDefined(
                raw.tallas,
                raw.sizes,
                raw.talla
            )
        ),
        categoriaPrincipal: stringValue(
            firstDefined(
                raw.categoriaPrincipal,
                raw.categoriaPincipal,
                raw.categoria
            )
        ),
        insignia: stringValue(
            firstDefined(
                raw.insignia,
                raw.badge
            )
        ),
        destacado: booleanValue(
            raw.destacado,
            false
        ),
        activo: booleanValue(
            raw.activo,
            true
        ),
        personalizable: booleanValue(
            raw.personalizable,
            false
        ),
        publicarCatalogo: booleanValue(
            raw.publicarCatalogo,
            true
        ),
        stock,
        existencias: stock,
        ventas: Math.max(
            0,
            numberValue(raw.ventas)
        ),
        movimiento: numberValue(
            raw.movimiento
        ),
        orden: numberValue(raw.orden),
        diasPreparacion: Math.min(
            90,
            Math.max(
                1,
                Math.round(
                    numberValue(
                        firstDefined(
                            raw.diasPreparacion,
                            raw.plazoPreparacionDias,
                            raw.diasFabricacion
                        ),
                        3
                    )
                )
            )
        ),
        pesoGramos: Math.round(
            clampNumber(
                firstDefined(
                    raw.pesoGramos,
                    raw.peso,
                    raw.weightGrams
                ),
                0,
                100000
            )
        ),
        dimensiones: normalizeDimensions(
            firstDefined(
                raw.dimensiones,
                raw.dimensions
            )
        ),
        seo: normalizeSeo(raw.seo),
        personalizacionLigera:
            personalizacionLigera || null,
        caracteristicas:
            caracteristicas || [],
        entrega: normalizeDeliveryConfig(
            firstDefined(
                raw.entrega,
                raw.metodosEntrega,
                raw.despacho
            )
        ),
        variantes: normalizeVariants(
            firstDefined(raw.variantes, raw.colores)
        ),
        ajusteImagenTarjeta:
            stringValue(
                raw.ajusteImagenTarjeta,
                "cover"
            ),
        ajusteImagenDetalle:
            stringValue(
                raw.ajusteImagenDetalle,
                "contain"
            ),
        posicionImagen:
            stringValue(
                raw.posicionImagen,
                "center"
            )
    };
}

function normalizeProductInput(input = {}) {
    const normalized =
        normalizeProductOutput(input);

    delete normalized.id;
    delete normalized._id;
    delete normalized.__v;
    delete normalized.createdAt;
    delete normalized.updatedAt;
    delete normalized.existencias;

    normalized.nombre =
        stringValue(input.nombre).slice(0, 180);

    normalized.precio =
        Math.max(
            0,
            numberValue(input.precio)
        );

    normalized.slug =
        createSlug(
            stringValue(input.slug) ||
            stringValue(input.nombre)
        ).slice(0, 140);

    normalized.sku = normalizeSku(input.sku);
    normalized.marca = stringValue(input.marca, "Mommy Crafts").slice(0, 120);
    normalized.codigoBarras = stringValue(input.codigoBarras).slice(0, 80);
    normalized.pesoGramos = Math.round(
        clampNumber(input.pesoGramos, 0, 100000)
    );
    normalized.dimensiones = normalizeDimensions(input.dimensiones);
    normalized.seo = normalizeSeo(input.seo);
    normalized.variantes = normalizeVariants(input.variantes);

    return normalized;
}

module.exports = {
    normalizeSku,
    normalizeImages,
    normalizeSizes,
    normalizeDimensions,
    normalizeKeywords,
    normalizeSeo,
    normalizeVariants,
    normalizeProductOutput,
    normalizeProductInput
};
