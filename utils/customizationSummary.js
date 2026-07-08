"use strict";

function safeArray(value) {
    return Array.isArray(value) ? value.filter(Boolean) : [];
}

function assetUrl(asset) {
    if (!asset || typeof asset !== "object") return "";
    return String(asset.secureUrl || asset.secure_url || asset.url || "");
}

function summarizeCustomization(value) {
    if (!value || typeof value !== "object") {
        return {
            tipo: "ninguna",
            descripcion: "Sin personalización",
            elementos: [],
            imagenes: [],
            vistaPrevia: ""
        };
    }

    const simple = value.type === "light" || value.tipo === "simple";
    const elements = [];
    const images = [];
    const size = String(value.size || value.talla || "").trim();

    if (size) elements.push(`Talla ${size}`);

    const texts = [
        value.requestedName,
        value.mainText,
        value.secondaryText,
        value.texts?.main?.value,
        value.texts?.secondary?.value
    ].filter((entry) => String(entry || "").trim());

    if (texts.length) elements.push(texts.length > 1 ? `${texts.length} textos` : "Texto");

    const simpleAssets = safeArray(value.assets?.images);
    for (const asset of simpleAssets) {
        const url = assetUrl(asset);
        if (url) images.push(asset);
    }

    for (const asset of [value.assets?.original, value.image?.asset]) {
        const url = assetUrl(asset);
        if (url && !images.some((entry) => assetUrl(entry) === url)) images.push(asset);
    }

    const imageCount = images.length || safeArray(value.imageNames).length || (value.imageName ? 1 : 0);
    if (imageCount) elements.push(imageCount === 1 ? "Imagen" : `${imageCount} imágenes`);
    if (value.observation || value.instructions) elements.push("Indicaciones");

    const preview =
        assetUrl(value.assets?.preview) ||
        assetUrl(value.finalPreview?.asset) ||
        String(value.finalPreviewUrl || "");

    return {
        tipo: simple ? "simple" : "avanzada",
        descripcion: elements.length ? elements.join(" + ") : "Opciones seleccionadas",
        elementos: elements,
        imagenes: images,
        vistaPrevia: preview
    };
}

module.exports = {
    summarizeCustomization,
    assetUrl
};
