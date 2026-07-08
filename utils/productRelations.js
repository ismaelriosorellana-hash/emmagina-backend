"use strict";

const {
    normalizeStringList,
    numberValue,
    stringValue
} = require("./values");

function normalizeCategories(product) {
    const values = [
        ...normalizeStringList(product?.categorias),
        ...normalizeStringList(product?.categoriaPrincipal),
        ...normalizeStringList(product?.categoria)
    ];

    return [...new Set(
        values
            .map((item) => item.toLowerCase())
            .filter(Boolean)
    )];
}

function relationScore(currentProduct, candidate) {
    const currentCategories = new Set(
        normalizeCategories(currentProduct)
    );

    const candidateCategories = normalizeCategories(candidate);
    let score = 0;

    candidateCategories.forEach((category) => {
        if (currentCategories.has(category)) {
            score += 30;
        }
    });

    if (
        Boolean(currentProduct?.personalizable) ===
        Boolean(candidate?.personalizable)
    ) {
        score += 8;
    }

    if (candidate?.destacado) {
        score += 6;
    }

    const currentPrice = numberValue(currentProduct?.precio);
    const candidatePrice = numberValue(candidate?.precio);

    if (currentPrice > 0 && candidatePrice > 0) {
        const difference = Math.abs(currentPrice - candidatePrice);
        const ratio = difference / currentPrice;
        score += Math.max(0, 15 - Math.round(ratio * 15));
    }

    score += Math.min(10, Math.log10(numberValue(candidate?.ventas, 0) + 1) * 4);

    return score;
}

function explicitRelatedIds(product) {
    const raw = product?.productosRelacionados ?? product?.relacionados;

    if (!Array.isArray(raw)) {
        return [];
    }

    return raw
        .map((item) => stringValue(item?._id ?? item?.id ?? item))
        .filter(Boolean);
}

module.exports = {
    normalizeCategories,
    relationScore,
    explicitRelatedIds
};
