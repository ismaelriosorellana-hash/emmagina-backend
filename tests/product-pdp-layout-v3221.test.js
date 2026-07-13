"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeProductInput } = require("../utils/productNormalizer");
test("normaliza visibilidad de Lo que debes saber", () => {
  const hidden = normalizeProductInput({ nombre:"Producto", precio:1000, contenidoPDP:{ mostrarLoQueDebesSaber:false } });
  const shown = normalizeProductInput({ nombre:"Producto", precio:1000, contenidoPDP:{} });
  assert.equal(hidden.contenidoPDP.mostrarLoQueDebesSaber, false);
  assert.equal(shown.contenidoPDP.mostrarLoQueDebesSaber, true);
});
