"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
    DEFAULT_SITE_URL,
    siteUrl,
    seoPublicUrl,
    prettyProductUrl,
    productMeta,
    renderRobots,
    renderSitemap
} = require("../services/productSeoService");

function withEnv(values, fn) {
    const previous = {};
    for (const key of Object.keys(values)) {
        previous[key] = process.env[key];
        if (values[key] === undefined) delete process.env[key];
        else process.env[key] = values[key];
    }

    try {
        return fn();
    } finally {
        for (const key of Object.keys(values)) {
            if (previous[key] === undefined) delete process.env[key];
            else process.env[key] = previous[key];
        }
    }
}

test("dominio por defecto usa rhemadisenos.cl", () => {
    assert.equal(DEFAULT_SITE_URL, "https://rhemadisenos.cl");
    withEnv({
        PUBLIC_SITE_URL: undefined,
        SEO_PUBLIC_URL: undefined,
        FRONTEND_URL: undefined,
        SITE_URL: undefined
    }, () => {
        assert.equal(siteUrl(), "https://rhemadisenos.cl");
        assert.equal(seoPublicUrl(), "https://rhemadisenos.cl");
        assert.equal(prettyProductUrl("vaso-alto"), "https://rhemadisenos.cl/producto/vaso-alto");
    });
});

test("metadatos, robots y sitemap usan dominio final", () => {
    withEnv({
        PUBLIC_SITE_URL: "https://rhemadisenos.cl",
        SEO_PUBLIC_URL: "https://rhemadisenos.cl",
        FRONTEND_URL: "https://rhemadisenos.cl"
    }, () => {
        const meta = productMeta({
            _id: "abc123",
            nombre: "Vaso alto con nombre",
            slug: "vaso-alto-con-nombre",
            precio: 7990,
            descripcion: "Vaso personalizado preparado por Rhema Diseños.",
            imagenes: ["https://res.cloudinary.com/demo/image/upload/vaso.jpg"],
            activo: true,
            publicarCatalogo: true
        });

        assert.equal(meta.canonicalUrl, "https://rhemadisenos.cl/producto/vaso-alto-con-nombre");
        assert.equal(meta.frontendUrl, "https://rhemadisenos.cl/producto.html?slug=vaso-alto-con-nombre");
        assert.match(renderRobots(), /Sitemap: https:\/\/emmagina\.cl\/sitemap\.xml/);
        assert.match(renderSitemap([meta.product]), /<loc>https:\/\/emmagina\.cl\/producto\/vaso-alto-con-nombre<\/loc>/);
    });
});
