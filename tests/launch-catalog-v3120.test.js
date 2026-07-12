"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");

test("el catálogo inicial incluye líneas y reglas comerciales", () => {
  const source = fs.readFileSync(path.join(root, "scripts", "seedRhemaLaunchProducts.js"), "utf8");
  for (const value of ["Librería y Escritorio", "Juguetería y Coleccionables", "Decoración y Hogar", "Memories", "Alma", "Servicio 3D"]) assert.match(source, new RegExp(value));
  assert.match(source, /Listo para comprar/);
  assert.match(source, /Fabricado a pedido/);
  assert.match(source, /Cotización antes de fabricar/);
  assert.doesNotMatch(source, /linearGradient/);
});

test("package expone el comando seguro de carga del catálogo", () => {
  const pkg = require(path.join(root, "package.json"));
  assert.equal(pkg.version, "3.12.0");
  assert.equal(pkg.scripts["seed-rhema-launch"], "node scripts/seedRhemaLaunchProducts.js");
});
