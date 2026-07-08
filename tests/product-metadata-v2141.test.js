"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const Producto = require("../models/Producto");

const {
    normalizeSku,
    normalizeDimensions,
    normalizeSeo,
    normalizeProductInput,
    normalizeProductOutput
} = require("../utils/productNormalizer");

const {
    createSkuBase,
    assignProductSkus
} = require("../services/productSkuService");

test("el modelo incluye campos comerciales, logísticos y SEO", () => {
    assert.ok(Producto.schema.path("sku"));
    assert.ok(Producto.schema.path("marca"));
    assert.ok(Producto.schema.path("codigoBarras"));
    assert.ok(Producto.schema.path("pesoGramos"));
    assert.ok(Producto.schema.path("dimensiones.largoCm"));
    assert.ok(Producto.schema.path("seo.titulo"));
    assert.ok(Producto.schema.path("variantes.sku"));
    assert.ok(Producto.schema.path("variantes.dimensiones.altoCm"));
});

test("normaliza SKU, dimensiones y SEO sin aceptar valores fuera de rango", () => {
    assert.equal(normalizeSku(" taza rosé / 01 "), "TAZA-ROSE-01");

    assert.deepEqual(
        normalizeDimensions({
            largo: -5,
            anchoCm: 24.5,
            heightCm: 4000
        }),
        {
            largoCm: 0,
            anchoCm: 24.5,
            altoCm: 1000
        }
    );

    assert.deepEqual(
        normalizeSeo({
            title: "Título de prueba",
            description: "Descripción de prueba",
            keywords: "Regalo, regalo, educativo",
            noindex: "true"
        }),
        {
            titulo: "Título de prueba",
            descripcion: "Descripción de prueba",
            imagen: "",
            palabrasClave: ["Regalo", "educativo"],
            noIndex: true
        }
    );
});

test("normaliza metadatos generales y de variantes manteniendo compatibilidad", () => {
    const product = normalizeProductInput({
        nombre: "Cuaderno Escolar",
        precio: 12990,
        sku: " cuaderno escolar ",
        marca: "Mommy Crafts",
        pesoGramos: 780.4,
        dimensiones: {
            largoCm: 31,
            anchoCm: 23,
            altoCm: 5
        },
        seo: {
            titulo: "Cuaderno escolar personalizado",
            descripcion: "Cuaderno educativo con opciones de personalización.",
            palabrasClave: ["cuaderno", "educativo"]
        },
        variantes: [
            {
                nombre: "Azul",
                sku: "cuaderno azul",
                peso: 800,
                dimensions: {
                    largo: 32,
                    ancho: 24,
                    alto: 6
                }
            }
        ]
    });

    assert.equal(product.sku, "CUADERNO-ESCOLAR");
    assert.equal(product.pesoGramos, 780);
    assert.equal(product.dimensiones.anchoCm, 23);
    assert.equal(product.seo.palabrasClave.length, 2);
    assert.equal(product.variantes[0].sku, "CUADERNO-AZUL");
    assert.equal(product.variantes[0].pesoGramos, 800);
    assert.equal(product.variantes[0].dimensiones.altoCm, 6);
});

test("productos antiguos reciben estructura logística y SEO vacía al responder", () => {
    const product = normalizeProductOutput({
        _id: "abc123",
        nombre: "Producto antiguo",
        precio: 5000,
        variantes: [{ nombre: "Rojo", stock: 2 }]
    });

    assert.equal(product.marca, "Mommy Crafts");
    assert.equal(product.pesoGramos, 0);
    assert.deepEqual(product.dimensiones, {
        largoCm: 0,
        anchoCm: 0,
        altoCm: 0
    });
    assert.equal(product.seo.noIndex, false);
    assert.equal(product.variantes[0].pesoGramos, 0);
});

test("genera SKU principal y de variante cuando están vacíos", async () => {
    const fakeModel = {
        async exists() {
            return null;
        }
    };

    const data = {
        nombre: "Cuaderno Devocional",
        sku: "",
        variantes: [
            { nombre: "Azul", sku: "" },
            { nombre: "Rosado", sku: "" }
        ]
    };

    await assignProductSkus(fakeModel, data);

    assert.equal(data.sku, "MC-CUADERNO-DEVOCIONAL");
    assert.equal(data.variantes[0].sku, "MC-CUADERNO-DEVOCIONAL-AZUL");
    assert.equal(data.variantes[1].sku, "MC-CUADERNO-DEVOCIONAL-ROSADO");
    assert.equal(createSkuBase("Taza mamá"), "MC-TAZA-MAMA");
});

test("rechaza SKU repetido dentro del mismo producto", async () => {
    const fakeModel = {
        async exists() {
            return null;
        }
    };

    await assert.rejects(
        assignProductSkus(fakeModel, {
            nombre: "Botella",
            sku: "BOT-001",
            variantes: [
                { nombre: "Negra", sku: "BOT-001" }
            ]
        }),
        /repetido dentro del producto/
    );
});

test("rechaza SKU usado en otro producto", async () => {
    const fakeModel = {
        async exists() {
            return { _id: "existing" };
        }
    };

    await assert.rejects(
        assignProductSkus(fakeModel, {
            nombre: "Taza",
            sku: "TAZA-001",
            variantes: []
        }),
        /ya está utilizado/
    );
});
