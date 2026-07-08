"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
    productMeta,
    renderProductHtml,
    renderSitemap,
    renderRobots,
    prettyProductPath
} = require("../services/productSeoService");

test("construye metadatos Open Graph y Schema.org para un producto", () => {
    process.env.PUBLIC_SITE_URL = "https://mommycrafts.onrender.com";
    process.env.SEO_PUBLIC_URL = "https://mommycrafts.onrender.com";

    const meta = productMeta({
        _id: "abc123",
        nombre: "Taza Mamá Especial",
        slug: "taza-mama-especial",
        descripcion: "Taza personalizada para regalar.",
        precio: 7990,
        stock: 4,
        marca: "Mommy Crafts",
        categoriaPrincipal: "Tazas",
        imagenes: ["https://res.cloudinary.com/demo/image/upload/taza.jpg"],
        seo: {
            titulo: "Taza Mamá Especial | Mommy Crafts",
            descripcion: "Taza personalizada para regalar a mamá.",
            imagen: "https://res.cloudinary.com/demo/image/upload/taza-seo.jpg"
        }
    });

    assert.equal(meta.title, "Taza Mamá Especial | Mommy Crafts");
    assert.equal(meta.price, 7990);
    assert.equal(meta.currency, "CLP");
    assert.equal(meta.category, "Tazas");
    assert.equal(meta.canonicalUrl, "https://mommycrafts.onrender.com/producto/taza-mama-especial");
    assert.equal(meta.frontendUrl, "https://mommycrafts.onrender.com/producto.html?slug=taza-mama-especial");
    assert.equal(meta.schema["@type"], "Product");
    assert.equal(meta.schema.offers.priceCurrency, "CLP");
    assert.equal(meta.schema.offers.availability, "https://schema.org/InStock");
});

test("renderiza HTML prerenderizado usando el shell del frontend sin scripts inline de navegación", async () => {
    const meta = productMeta({
        _id: "abc123",
        nombre: "Cuaderno Devocional",
        slug: "cuaderno-devocional",
        descripcion: "Cuaderno con espacio para notas.",
        precio: 12990,
        stock: 0,
        imagenes: ["https://res.cloudinary.com/demo/image/upload/cuaderno.jpg"]
    });

    const shellHtml = `<!doctype html><html lang="es-CL"><head><meta charset="utf-8"><title>Producto personalizado | Mommy Crafts</title><meta name="description" content="genérica"><link rel="canonical" href="https://mommycrafts.onrender.com/producto.html"><script defer src="js/config.js"></script><script defer src="js/products.js"></script></head><body data-page="product"><main id="product-detail"></main></body></html>`;
    const html = await renderProductHtml(meta, { shellHtml });

    assert.match(html, /<base href="https:\/\/mommycrafts.onrender.com\/">/);
    assert.match(html, /<meta property="og:title" content="Cuaderno Devocional \| Mommy Crafts">/);
    assert.match(html, /<meta property="product:price:currency" content="CLP">/);
    assert.match(html, /application\/ld\+json/);
    assert.match(html, /https:\/\/schema.org\/OutOfStock/);
    assert.match(html, /data-seo-prerender="true"/);
    assert.match(html, /data-product-slug="cuaderno-devocional"/);
    assert.match(html, /js\/products\.js/);

    assert.doesNotMatch(html, /window\.location\.replace/);
    assert.doesNotMatch(html, /http-equiv="refresh"/);
    assert.doesNotMatch(html, /fetch\(data\.shellUrl/);
});

test("genera sitemap dinámico con URLs de productos publicables", () => {
    const xml = renderSitemap([
        {
            _id: "1",
            nombre: "Producto publicado",
            slug: "producto-publicado",
            precio: 1000,
            stock: 2,
            publicarCatalogo: true,
            activo: true
        },
        {
            _id: "2",
            nombre: "Producto privado",
            slug: "producto-privado",
            precio: 1000,
            publicarCatalogo: false,
            activo: true
        }
    ]);

    assert.match(xml, /<loc>https:\/\/mommycrafts.onrender.com\/producto\/producto-publicado<\/loc>/);
    assert.doesNotMatch(xml, /producto-privado/);
});

test("entrega robots y ruta bonita esperada", () => {
    assert.equal(prettyProductPath("taza-mama"), "/producto/taza-mama");
    const robots = renderRobots();
    assert.match(robots, /User-agent: \*/);
    assert.match(robots, /Sitemap:/);
    assert.match(robots, /Disallow: \/api\/admin\//);
});
