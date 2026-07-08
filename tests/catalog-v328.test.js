"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { normalizeSizes, normalizeProductOutput } = require("../utils/productNormalizer");

test("normaliza tallas alfanuméricas y rangos sin duplicados", () => {
    assert.deepEqual(
        normalizeSizes([" S ", "M", "2 - 4", "2-4", "XL", "M", "@"]),
        ["S", "M", "2-4", "XL"]
    );

    const product = normalizeProductOutput({
        _id: "producto-prueba",
        nombre: "Body bebé",
        precio: 9990,
        tallas: "0-3, 3-6, M"
    });

    assert.deepEqual(product.tallas, ["0-3", "3-6", "M"]);
});
