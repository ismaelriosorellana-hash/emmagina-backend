"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
    fallbackCategoryDocuments,
    mergeCategoryDocuments,
    normalizeCategoryInput,
    normalizeCategoryOutput
} = require("../utils/categoryNormalizer");

test("normaliza categorías administrables con slug y banderas visibles", () => {
    const category = normalizeCategoryInput({
        nombre: "Material Educativo",
        slug: "Material   Educativo!!",
        descripcion: "Recursos para aprender",
        icono: "fa-solid fa-book-open <script>",
        imagen: "https://example.com/categoria.jpg",
        color: "#ff8899",
        mostrarMenu: "si",
        mostrarInicio: "no",
        destacada: "true",
        orden: "25"
    });

    assert.equal(category.nombre, "Material Educativo");
    assert.equal(category.slug, "material-educativo");
    assert.equal(category.color, "#FF8899");
    assert.equal(category.mostrarMenu, true);
    assert.equal(category.mostrarInicio, false);
    assert.equal(category.destacada, true);
    assert.equal(category.orden, 25);
    assert.match(category.icono, /^fa-solid fa-book-open/);
});

test("entrega categorías base cuando aún no existen categorías guardadas", () => {
    const categories = fallbackCategoryDocuments().map(normalizeCategoryOutput);

    assert.ok(categories.length >= 8);
    assert.ok(categories.some((category) => category.nombre === "Librería y Escritorio"));
    assert.ok(categories.every((category) => category.slug));
    assert.ok(categories.every((category) => category.activa));
});


test("combina categorías guardadas con categorías base sin borrar el menú", () => {
    const categories = mergeCategoryDocuments([
        {
            _id: "custom-1",
            nombre: "Material Didáctico",
            slug: "material-didactico",
            mostrarMenu: true,
            mostrarInicio: true,
            orden: 5
        }
    ]);

    assert.ok(categories.some((category) => category.nombre === "Material Didáctico"));
    assert.ok(categories.some((category) => category.nombre === "Librería y Escritorio"));
    assert.ok(categories.some((category) => category.nombre === "Educativos"));
});

test("una categoría guardada reemplaza a la base con el mismo slug", () => {
    const categories = mergeCategoryDocuments([
        {
            _id: "libreria-escritorio-custom",
            nombre: "Librería y Escritorio",
            slug: "libreria-y-escritorio",
            activa: false,
            mostrarMenu: false,
            mostrarInicio: false,
            orden: 1
        }
    ]);

    const libreria = categories.filter((category) => category.slug === "libreria-y-escritorio");

    assert.equal(libreria.length, 1);
    assert.equal(libreria[0].activa, false);
});
