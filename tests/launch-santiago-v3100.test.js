"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("fase de lanzamiento mantiene Santiago y condiciones de entrega", () => {
  const settings = fs.readFileSync(path.join(__dirname, "../services/siteSettingsDefaults.js"), "utf8");
  const delivery = fs.readFileSync(path.join(__dirname, "../services/deliveryService.js"), "utf8");
  assert.match(settings, /Lanzamiento local de Rhema Diseños en Santiago/);
  assert.match(settings, /lanzamiento-santiago\.html/);
  assert.match(delivery, /SANTIAGO_SHIPPING_COST = 4000/);
  assert.match(delivery, /FREE_SHIPPING_THRESHOLD = 25000/);
});
