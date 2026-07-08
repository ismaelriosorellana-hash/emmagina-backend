"use strict";

const {
    createSlug,
    stringValue
} = require("../utils/values");

const {
    escapeRegex
} = require("../utils/catalogQuery");

async function resolveUniqueProductSlug(
    ProductModel,
    {
        name,
        requestedSlug,
        excludeId = null
    } = {}
) {
    const base = createSlug(
        stringValue(requestedSlug) || stringValue(name)
    ).slice(0, 120);

    if (!base) {
        return "producto";
    }

    const filter = {
        slug: {
            $regex: new RegExp(
                `^${escapeRegex(base)}(?:-(\\d+))?$`,
                "i"
            )
        }
    };

    if (excludeId) {
        filter._id = {
            $ne: excludeId
        };
    }

    const existing = await ProductModel.find(filter)
        .select("slug")
        .lean();

    const used = new Set(
        existing
            .map((item) => stringValue(item.slug).toLowerCase())
            .filter(Boolean)
    );

    if (!used.has(base)) {
        return base;
    }

    for (let suffix = 2; suffix <= 9999; suffix += 1) {
        const candidate = `${base}-${suffix}`;

        if (!used.has(candidate)) {
            return candidate;
        }
    }

    return `${base}-${Date.now()}`;
}

module.exports = {
    resolveUniqueProductSlug
};
