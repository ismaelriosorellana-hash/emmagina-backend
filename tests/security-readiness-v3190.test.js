"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { renderRobots, siteUrl } = require("../services/productSeoService");

test("robots usa la URL pública actual y no fuerza el dominio futuro", () => {
  const robots = renderRobots();
  assert.match(robots, /Sitemap: https:\/\//);
  assert.equal(robots.includes("Sitemap: https://rhemadisenos.cl/sitemap.xml"), false);
  assert.equal(robots.includes(`${siteUrl()}/sitemap.xml`), true);
});

test("robots protege las rutas sensibles de la API", () => {
  const robots = renderRobots();
  ["/api/admin/", "/api/cuenta/", "/api/pedidos/", "/api/pagos/", "/api/uploads/"].forEach((route) => {
    assert.equal(robots.includes(`Disallow: ${route}`), true);
  });
});
