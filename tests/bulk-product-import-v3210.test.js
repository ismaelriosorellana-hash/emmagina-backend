"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
function read(file) { return fs.readFileSync(path.join(root, file), "utf8"); }

test("la API administrativa incluye plantilla, vista previa e importación masiva", () => {
  const routes = read("routes/admin/productos.js");
  const service = read("services/productSpreadsheetService.js");
  assert.match(routes, /plantilla-excel/);
  assert.match(routes, /importar-excel/);
  assert.match(routes, /productSpreadsheetUpload\.single\("archivo"\)/);
  assert.match(service, /SKU es obligatorio para actualización masiva/);
  assert.match(service, /vista previa|Vista previa/i);
  assert.match(service, /upsert/);
});

test("el módulo administrativo de lanzamiento fue retirado", () => {
  const app = read("app.js");
  assert.doesNotMatch(app, /admin\/lanzamiento/);
  assert.equal(fs.existsSync(path.join(root, "routes/admin/lanzamiento.js")), false);
  assert.equal(fs.existsSync(path.join(root, "controllers/adminLaunchController.js")), false);
});
