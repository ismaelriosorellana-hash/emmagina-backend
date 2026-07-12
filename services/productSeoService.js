"use strict";

const {
    createSlug,
    stringValue,
    numberValue,
    firstDefined
} = require("../utils/values");

const {
    normalizeProductOutput
} = require("../utils/productNormalizer");

const DEFAULT_SITE_URL = "https://rhemadisenos.cl";
const DEFAULT_BRAND = "Rhema Diseños";
const DEFAULT_IMAGE = process.env.DEFAULT_SEO_IMAGE || "";
const DEFAULT_LOCALE = "es_CL";
const DEFAULT_CURRENCY = "CLP";

function cleanUrl(value, fallback = "") {
    const text = stringValue(value, fallback).replace(/\/+$/g, "");

    if (!text) {
        return fallback;
    }

    try {
        const url = new URL(text);
        if (!["http:", "https:"].includes(url.protocol)) {
            return fallback;
        }
        return url.toString().replace(/\/+$/g, "");
    } catch (error) {
        return fallback;
    }
}

function siteUrl() {
    return cleanUrl(
        firstDefined(
            process.env.PUBLIC_SITE_URL,
            process.env.FRONTEND_URL,
            process.env.SITE_URL
        ),
        DEFAULT_SITE_URL
    );
}

function seoPublicUrl() {
    return cleanUrl(
        firstDefined(
            process.env.SEO_PUBLIC_URL,
            process.env.PUBLIC_SEO_URL,
            process.env.PUBLIC_SITE_URL,
            process.env.FRONTEND_URL,
            process.env.SITE_URL
        ),
        siteUrl()
    );
}

function frontendProductUrl(slugOrId) {
    const slug = encodeURIComponent(String(slugOrId || ""));
    return `${siteUrl()}/producto.html?slug=${slug}`;
}

function frontendProductShellUrl() {
    return `${siteUrl()}/producto.html`;
}

function prettyProductPath(slug) {
    return `/producto/${encodeURIComponent(slug)}`;
}

function prettyProductUrl(slug) {
    return `${seoPublicUrl()}${prettyProductPath(slug)}`;
}

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function escapeJsonForHtml(value) {
    return JSON.stringify(value)
        .replace(/</g, "\\u003c")
        .replace(/>/g, "\\u003e")
        .replace(/&/g, "\\u0026")
        .replace(/\u2028/g, "\\u2028")
        .replace(/\u2029/g, "\\u2029");
}

function cleanText(value, fallback = "") {
    return stringValue(value, fallback)
        .replace(/[\u0000-\u001F\u007F]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function truncate(value, max, fallback = "") {
    const text = cleanText(value, fallback);
    if (text.length <= max) return text;
    return `${text.slice(0, Math.max(0, max - 1)).trim()}…`;
}

function imageUrlFromValue(value) {
    if (!value) return "";

    if (typeof value === "string") {
        return value.trim();
    }

    if (typeof value === "object") {
        return stringValue(
            firstDefined(
                value.secure_url,
                value.url,
                value.imgUrl,
                value.imagen,
                value.src
            )
        );
    }

    return "";
}

function absoluteUrl(pathOrUrl, fallback = DEFAULT_IMAGE) {
    const value = stringValue(pathOrUrl, fallback);
    if (!value) return fallback;

    try {
        return new URL(value, siteUrl()).toString();
    } catch (error) {
        return fallback;
    }
}

function productImages(product) {
    const values = [];

    if (product?.seo?.imagen) values.push(product.seo.imagen);
    if (product?.imagenPrincipal) values.push(product.imagenPrincipal);

    if (Array.isArray(product?.imagenes)) {
        values.push(...product.imagenes);
    }

    if (Array.isArray(product?.variantes)) {
        product.variantes.forEach((variant) => {
            if (Array.isArray(variant?.imagenes)) {
                values.push(...variant.imagenes);
            }
        });
    }

    const result = [];
    const seen = new Set();

    values.forEach((item) => {
        const url = absoluteUrl(imageUrlFromValue(item), "");
        if (!url || seen.has(url)) return;
        seen.add(url);
        result.push(url);
    });

    if (!result.length) result.push(DEFAULT_IMAGE);
    return result.slice(0, 8);
}

function productCategory(product) {
    return cleanText(
        firstDefined(
            product.categoriaPrincipal,
            product.categoria,
            Array.isArray(product.categorias) ? product.categorias[0] : ""
        ),
        "Productos personalizados"
    );
}

function productAvailability(product) {
    const stock = numberValue(
        firstDefined(product.stock, product.existencias),
        0
    );

    if (stock <= 0) {
        return "https://schema.org/OutOfStock";
    }

    return "https://schema.org/InStock";
}

function productMeta(rawProduct) {
    const product = normalizeProductOutput(rawProduct);
    const slug = createSlug(product.slug || product.nombre || product.id).slice(0, 140);
    const productName = cleanText(product.nombre, "Producto Rhema Diseños");
    const title = truncate(
        product.seo?.titulo || `${productName} | Rhema Diseños`,
        70,
        `${productName} | Rhema Diseños`
    );
    const description = truncate(
        product.seo?.descripcion ||
        product.descripcion ||
        `Compra ${productName} en Rhema Diseños. Revisa precio, opciones de personalización, tiempos de preparación y entrega coordinada.`,
        170,
        `Compra ${productName} en Rhema Diseños.`
    );
    const images = productImages(product);
    const price = Math.max(0, numberValue(product.precio));
    const canonicalUrl = prettyProductUrl(slug);
    const frontendUrl = frontendProductUrl(slug || product.id);
    const category = productCategory(product);
    const noIndex = Boolean(product.seo?.noIndex || product.publicarCatalogo === false || product.activo === false);

    const schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: productName,
        description,
        image: images,
        sku: cleanText(product.sku || product.id),
        brand: {
            "@type": "Brand",
            name: cleanText(product.marca, DEFAULT_BRAND)
        },
        category,
        url: canonicalUrl,
        offers: {
            "@type": "Offer",
            url: canonicalUrl,
            priceCurrency: DEFAULT_CURRENCY,
            price: price || undefined,
            availability: productAvailability(product),
            itemCondition: "https://schema.org/NewCondition"
        }
    };

    if (product.codigoBarras) {
        schema.gtin = cleanText(product.codigoBarras);
    }

    const breadcrumb = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            {
                "@type": "ListItem",
                position: 1,
                name: "Inicio",
                item: `${siteUrl()}/`
            },
            {
                "@type": "ListItem",
                position: 2,
                name: "Catálogo",
                item: `${siteUrl()}/catalogo.html`
            },
            {
                "@type": "ListItem",
                position: 3,
                name: productName,
                item: canonicalUrl
            }
        ]
    };

    return {
        product,
        slug,
        title,
        description,
        images,
        image: images[0],
        price,
        currency: DEFAULT_CURRENCY,
        canonicalUrl,
        frontendUrl,
        category,
        noIndex,
        schema,
        breadcrumb
    };
}

const PRODUCT_SHELL_CACHE_TTL_MS = 5 * 60 * 1000;
let productShellCache = {
    html: "",
    expiresAt: 0
};

function frontendProductShellFetchUrl() {
    return `${siteUrl()}/producto.html`;
}

function seoMetaBlock(meta) {
    const robots = meta.noIndex
        ? "noindex, nofollow, noarchive"
        : "index, follow";
    const price = meta.price ? String(meta.price) : "";

    return [
        `<title>${escapeHtml(meta.title)}</title>`,
        `<meta name="description" content="${escapeHtml(meta.description)}">`,
        `<meta name="robots" content="${escapeHtml(robots)}">`,
        `<link rel="canonical" href="${escapeHtml(meta.canonicalUrl)}">`,
        `<meta property="og:site_name" content="Rhema Diseños">`,
        `<meta property="og:locale" content="${DEFAULT_LOCALE}">`,
        `<meta property="og:type" content="product">`,
        `<meta property="og:title" content="${escapeHtml(meta.title)}">`,
        `<meta property="og:description" content="${escapeHtml(meta.description)}">`,
        `<meta property="og:url" content="${escapeHtml(meta.canonicalUrl)}">`,
        `<meta property="og:image" content="${escapeHtml(meta.image)}">`,
        `<meta property="og:image:secure_url" content="${escapeHtml(meta.image)}">`,
        `<meta property="og:image:alt" content="${escapeHtml(meta.product.nombre)}">`,
        `<meta property="product:price:amount" content="${escapeHtml(price)}">`,
        `<meta property="product:price:currency" content="${DEFAULT_CURRENCY}">`,
        `<meta name="twitter:card" content="summary_large_image">`,
        `<meta name="twitter:title" content="${escapeHtml(meta.title)}">`,
        `<meta name="twitter:description" content="${escapeHtml(meta.description)}">`,
        `<meta name="twitter:image" content="${escapeHtml(meta.image)}">`,
        `<script type="application/ld+json" id="product-schema">${escapeJsonForHtml(meta.schema)}</script>`,
        `<script type="application/ld+json" id="breadcrumb-schema">${escapeJsonForHtml(meta.breadcrumb)}</script>`
    ].join("\n");
}

function minimalProductHtml(meta) {
    const robots = meta.noIndex
        ? "noindex, nofollow, noarchive"
        : "index, follow";
    return `<!doctype html>
<html lang="es-CL">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(meta.title)}</title>
<meta name="description" content="${escapeHtml(meta.description)}">
<meta name="robots" content="${escapeHtml(robots)}">
<link rel="canonical" href="${escapeHtml(meta.canonicalUrl)}">
<meta property="og:title" content="${escapeHtml(meta.title)}">
<meta property="og:description" content="${escapeHtml(meta.description)}">
<meta property="og:image" content="${escapeHtml(meta.image)}">
<meta property="og:url" content="${escapeHtml(meta.canonicalUrl)}">
<script type="application/ld+json" id="product-schema">${escapeJsonForHtml(meta.schema)}</script>
</head>
<body>
<main>
<h1>${escapeHtml(meta.product.nombre)}</h1>
<p>${escapeHtml(meta.description)}</p>
<p><a href="${escapeHtml(meta.frontendUrl)}">Ver producto en Rhema Diseños</a></p>
</main>
</body>
</html>`;
}

async function fetchFrontendProductShell(options = {}) {
    if (options.shellHtml) {
        return String(options.shellHtml);
    }

    const now = Date.now();
    if (productShellCache.html && productShellCache.expiresAt > now) {
        return productShellCache.html;
    }

    if (typeof fetch !== "function") {
        throw new Error("fetch no está disponible para cargar producto.html");
    }

    const response = await fetch(frontendProductShellFetchUrl(), {
        method: "GET",
        headers: {
            "Accept": "text/html"
        },
        redirect: "follow"
    });

    if (!response.ok) {
        throw new Error(`No se pudo cargar producto.html: HTTP ${response.status}`);
    }

    const html = await response.text();
    productShellCache = {
        html,
        expiresAt: now + PRODUCT_SHELL_CACHE_TTL_MS
    };
    return html;
}

function removeExistingSeoTags(html) {
    return String(html || "")
        .replace(/<title>[\s\S]*?<\/title>/i, "")
        .replace(/<meta\s+[^>]*name=["']description["'][^>]*>/gi, "")
        .replace(/<meta\s+[^>]*name=["']robots["'][^>]*>/gi, "")
        .replace(/<link\s+[^>]*rel=["']canonical["'][^>]*>/gi, "")
        .replace(/<meta\s+[^>]*property=["']og:[^"']+["'][^>]*>/gi, "")
        .replace(/<meta\s+[^>]*property=["']product:[^"']+["'][^>]*>/gi, "")
        .replace(/<meta\s+[^>]*name=["']twitter:[^"']+["'][^>]*>/gi, "")
        .replace(/<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, "");
}

function injectProductSeoIntoShell(shellHtml, meta) {
    let html = removeExistingSeoTags(shellHtml);
    const baseTag = `<base href="${escapeHtml(`${siteUrl()}/`)}">`;
    const metaBlock = `${baseTag}\n${seoMetaBlock(meta)}\n<meta name="mc-product-slug" content="${escapeHtml(meta.slug)}">`;

    if (/<head([^>]*)>/i.test(html)) {
        html = html.replace(/<head([^>]*)>/i, `<head$1>\n${metaBlock}`);
    } else {
        html = html.replace(/<html([^>]*)>/i, `<html$1>\n<head>\n${metaBlock}\n</head>`);
    }

    html = html.replace(
        /<body([^>]*)>/i,
        `<body$1 data-seo-prerender="true" data-product-slug="${escapeHtml(meta.slug)}">`
    );

    return html;
}

async function renderProductHtml(meta, options = {}) {
    try {
        const shellHtml = await fetchFrontendProductShell(options);
        return injectProductSeoIntoShell(shellHtml, meta);
    } catch (error) {
        return minimalProductHtml(meta);
    }
}

function escapeXml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function renderSitemap(products = []) {
    const today = new Date().toISOString().slice(0, 10);
    const staticUrls = [
        ["/", "weekly", "1.0"],
        ["/catalogo.html", "weekly", "0.9"],
        ["/quienes-somos.html", "monthly", "0.6"],
        ["/contacto.html", "monthly", "0.6"],
        ["/preguntas-frecuentes.html", "monthly", "0.6"],
        ["/despachos-retiros.html", "monthly", "0.6"],
        ["/cambios-pedidos.html", "monthly", "0.6"],
        ["/seguridad.html", "monthly", "0.5"],
        ["/privacidad.html", "yearly", "0.4"],
        ["/terminos.html", "yearly", "0.4"]
    ];

    function urlNode({ loc, lastmod = today, changefreq = "monthly", priority = "0.5" }) {
        return [
            "  <url>",
            `    <loc>${escapeXml(loc)}</loc>`,
            `    <lastmod>${escapeXml(lastmod)}</lastmod>`,
            `    <changefreq>${escapeXml(changefreq)}</changefreq>`,
            `    <priority>${escapeXml(priority)}</priority>`,
            "  </url>"
        ].join("\n");
    }

    const entries = staticUrls.map(([path, changefreq, priority]) => ({
        loc: `${siteUrl()}${path}`,
        changefreq,
        priority
    }));

    products.forEach((rawProduct) => {
        const meta = productMeta(rawProduct);
        if (!meta.slug || meta.noIndex) return;
        const date = new Date(rawProduct.updatedAt || rawProduct.createdAt || Date.now());
        entries.push({
            loc: meta.canonicalUrl,
            lastmod: Number.isNaN(date.getTime()) ? today : date.toISOString().slice(0, 10),
            changefreq: "weekly",
            priority: "0.7"
        });
    });

    return [
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
        "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">",
        ...entries.map(urlNode),
        "</urlset>",
        ""
    ].join("\n");
}

function renderRobots() {
    return [
        "User-agent: *",
        "Allow: /",
        "Disallow: /api/admin/",
        "Disallow: /api/cuenta/",
        "Disallow: /api/pedidos/",
        "Disallow: /api/pagos/",
        "Disallow: /api/uploads/",
        `Sitemap: ${seoPublicUrl()}/sitemap.xml`,
        ""
    ].join("\n");
}

module.exports = {
    DEFAULT_SITE_URL,
    DEFAULT_IMAGE,
    siteUrl,
    seoPublicUrl,
    frontendProductUrl,
    frontendProductShellUrl,
    prettyProductPath,
    prettyProductUrl,
    escapeHtml,
    escapeXml,
    cleanText,
    truncate,
    productMeta,
    renderProductHtml,
    renderSitemap,
    renderRobots
};
