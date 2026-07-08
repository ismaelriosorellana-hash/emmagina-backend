"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
    escapeRegex,
    parseCatalogQuery,
    buildCatalogFilter,
    buildCatalogSort,
    buildPagination
} = require("../utils/catalogQuery");

const {
    relationScore
} = require("../utils/productRelations");

const {
    resolveUniqueProductSlug
} = require("../services/productSlugService");

const {
    normalizeProductOutput
} = require("../utils/productNormalizer");

test("escapa búsquedas y limita paginación pública", () => {
    assert.equal(
        escapeRegex("taza (roja)+"),
        "taza \\(roja\\)\\+"
    );

    const options = parseCatalogQuery({
        page: "0",
        limit: "900",
        q: " cuaderno   escolar ",
        precioMin: "5000",
        precioMax: "20000",
        enStock: "true"
    });

    assert.equal(options.page, 1);
    assert.equal(options.limit, 100);
    assert.equal(options.search, "cuaderno escolar");
    assert.equal(options.minPrice, 5000);
    assert.equal(options.maxPrice, 20000);
    assert.equal(options.inStock, true);
});

test("construye filtros de categoría sin interpolar regex peligrosa", () => {
    const options = parseCatalogQuery({
        categoria: "Niños (3+)",
        publicarCatalogo: "true"
    });

    const filter = buildCatalogFilter(options);
    const serialized = JSON.stringify(filter);

    assert.equal(filter.activo.$ne, false);
    assert.equal(filter.publicarCatalogo, true);
    assert.match(serialized, /Niños/);
    assert.doesNotMatch(serialized, /\.\*/);
});

test("normaliza orden y metadatos de paginación", () => {
    assert.deepEqual(
        buildCatalogSort("precio_desc"),
        { precio: -1, orden: 1, createdAt: -1 }
    );

    assert.deepEqual(
        buildPagination(51, 3, 24),
        {
            pagina: 3,
            limite: 24,
            total: 51,
            paginas: 3,
            hayAnterior: true,
            haySiguiente: false
        }
    );
});

test("prioriza productos relacionados por categoría y precio", () => {
    const current = {
        categorias: ["Librería"],
        precio: 10000,
        personalizable: true
    };

    const close = relationScore(current, {
        categorias: ["Librería"],
        precio: 11000,
        personalizable: true,
        destacado: true,
        ventas: 20
    });

    const distant = relationScore(current, {
        categorias: ["Vestuario"],
        precio: 40000,
        personalizable: false,
        ventas: 0
    });

    assert.ok(close > distant);
});

test("entrega slug compatible aunque el producto antiguo no lo tenga guardado", () => {
    const product = normalizeProductOutput({
        _id: "abc123",
        nombre: "Cuaderno Devocional 2026",
        slug: "",
        precio: 10000
    });

    assert.equal(product.slug, "cuaderno-devocional-2026");
});

test("genera slugs únicos sin modificar el nombre base", async () => {
    const fakeModel = {
        find() {
            return {
                select() {
                    return {
                        async lean() {
                            return [
                                { slug: "cuaderno-devocional" },
                                { slug: "cuaderno-devocional-2" }
                            ];
                        }
                    };
                }
            };
        }
    };

    const slug = await resolveUniqueProductSlug(
        fakeModel,
        {
            name: "Cuaderno Devocional"
        }
    );

    assert.equal(slug, "cuaderno-devocional-3");
});
