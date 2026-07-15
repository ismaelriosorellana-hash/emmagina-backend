"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { FALLBACK_CATEGORIES, fallbackCategoryDocuments } = require("../utils/categoryNormalizer");

test("categorías base oficiales de Rhema Diseños", () => {
  assert.equal(FALLBACK_CATEGORIES.length, 20);
  assert.deepEqual(FALLBACK_CATEGORIES, [
    "Librería y Escritorio", "Juguetería", "Coleccionables", "Decoración", "Hogar", "Memories", "Vasos", "Para regalar", "Educativos", "Infantiles", "Babies", "Cristianos", "Niños", "Niñas", "Mascotas", "Herramientas", "Utilidades", "Accesorios para automóvil", "Accesorios para celular", "Todos"
  ]);
  const docs = fallbackCategoryDocuments();
  assert.equal(docs.length, 20);
  assert.ok(docs.every((item) => item.activa && item.mostrarMenu && item.mostrarInicio));
});
