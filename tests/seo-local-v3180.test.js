"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("SEO local incluye páginas comerciales y estado público", () => {
  const service = fs.readFileSync(path.join(__dirname, "../services/productSeoService.js"), "utf8");
  const controller = fs.readFileSync(path.join(__dirname, "../controllers/seoController.js"), "utf8");
  const routes = fs.readFileSync(path.join(__dirname, "../routes/seo.js"), "utf8");

  ["/memories.html", "/alma.html", "/servicio-3d.html", "/ayuda.html"].forEach((page) => {
    assert.equal(service.includes(page), true);
  });

  assert.match(controller, /domainReady/);
  assert.match(routes, /\/api\/seo\/estado/);
});
