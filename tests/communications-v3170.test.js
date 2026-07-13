"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const service = fs.readFileSync(path.join(__dirname, "../services/notificationService.js"), "utf8");
const controller = fs.readFileSync(path.join(__dirname, "../controllers/adminOrderController.js"), "utf8");

test("incluye notificación de avance de producción", () => {
  assert.match(service, /production_update/);
  assert.match(service, /Avance de producción/);
  assert.match(service, /mensajeCliente/);
});

test("permite decidir si se notifica al cliente", () => {
  assert.match(controller, /notificarCliente/);
  assert.match(controller, /productionChanged/);
  assert.match(controller, /await order\.save\(\)/);
});
