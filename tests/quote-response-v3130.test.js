"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("flujo público de cotizaciones exige contacto y permite responder", () => {
  const controller = fs.readFileSync(path.join(__dirname, "../controllers/customRequestController.js"), "utf8");
  const routes = fs.readFileSync(path.join(__dirname, "../routes/solicitudesPersonalizadas.js"), "utf8");
  assert.match(controller, /contactQuery/);
  assert.match(controller, /cotizacion_aceptada_cliente/);
  assert.match(controller, /cotizacion_rechazada_cliente/);
  assert.match(controller, /Esta cotización venció/);
  assert.match(routes, /\/:folio\/responder/);
});
