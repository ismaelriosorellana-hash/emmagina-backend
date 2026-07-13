"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");
test("seguimiento de producción está integrado", () => {
  assert.match(read("models/Pedido.js"), /productionSchema/);
  assert.match(read("routes/pedidos.js"), /\/seguimiento/);
  assert.match(read("controllers/orderController.js"), /async function trackOrder/);
  assert.match(read("controllers/adminOrderController.js"), /req\.body\.produccion/);
});
