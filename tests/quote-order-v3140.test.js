"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("quote to order flow is wired", () => {
  const controller = fs.readFileSync(path.join(__dirname, "../controllers/customRequestController.js"), "utf8");
  const routes = fs.readFileSync(path.join(__dirname, "../routes/solicitudesPersonalizadas.js"), "utf8");
  assert.match(controller, /createOrderFromAcceptedQuote/);
  assert.match(controller, /convertida_pedido/);
  assert.match(controller, /createPreference/);
  assert.match(routes, /crear-pedido/);
});
