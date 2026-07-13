"use strict";

const Producto = require("../models/Producto");

const {
    createSlug
} = require("../utils/values");

const {
    productMeta,
    renderProductHtml,
    renderSitemap,
    renderRobots,
    frontendProductUrl,
    siteUrl,
    seoPublicUrl
} = require("../services/productSeoService");

function publicProductFilter(extra = {}) {
    return {
        ...extra,
        activo: { $ne: false },
        publicarCatalogo: { $ne: false }
    };
}

async function findProductBySlug(slugValue) {
    const slug = createSlug(slugValue).slice(0, 140);

    if (!slug) {
        return null;
    }

    let product = await Producto.findOne(
        publicProductFilter({ slug })
    ).lean();

    if (product) {
        return product;
    }

    const candidates = await Producto.find(
        publicProductFilter({
            $or: [
                { slug: { $exists: false } },
                { slug: "" },
                { slug: null }
            ]
        })
    )
        .select("nombre slug precio descripcion imagenes seo marca stock publicarCatalogo activo updatedAt createdAt")
        .limit(500)
        .lean();

    const match = candidates.find(
        (candidate) => createSlug(candidate.nombre) === slug
    );

    if (!match) {
        return null;
    }

    return Producto.findById(match._id).lean();
}

function setPublicHtmlCache(res, seconds = 300) {
    res.set("Content-Type", "text/html; charset=utf-8");
    res.set("Cache-Control", `public, max-age=${seconds}, stale-while-revalidate=1800`);
}

function setPublicXmlCache(res, seconds = 3600) {
    res.set("Content-Type", "application/xml; charset=utf-8");
    res.set("Cache-Control", `public, max-age=${seconds}, stale-while-revalidate=3600`);
}

async function renderProductSeoPage(req, res, next) {
    try {
        const product = await findProductBySlug(req.params.slug);

        if (!product) {
            return res.status(404).type("html").send(
                "<!doctype html><html lang=\"es-CL\"><head><meta charset=\"utf-8\"><meta name=\"robots\" content=\"noindex\"><title>Producto no encontrado | Rhema Diseños</title></head><body><h1>Producto no encontrado</h1></body></html>"
            );
        }

        const meta = productMeta(product);
        setPublicHtmlCache(res);
        return res.send(await renderProductHtml(meta));
    } catch (error) {
        next(error);
    }
}

async function renderProductSeoFromQuery(req, res, next) {
    try {
        const slug = req.query.slug;

        if (!slug) {
            return res.redirect(302, frontendProductUrl(""));
        }

        const product = await findProductBySlug(slug);

        if (!product) {
            return res.status(404).type("html").send(
                "<!doctype html><html lang=\"es-CL\"><head><meta charset=\"utf-8\"><meta name=\"robots\" content=\"noindex\"><title>Producto no encontrado | Rhema Diseños</title></head><body><h1>Producto no encontrado</h1></body></html>"
            );
        }

        const meta = productMeta(product);
        setPublicHtmlCache(res);
        return res.send(await renderProductHtml(meta));
    } catch (error) {
        next(error);
    }
}

async function getProductSeoJson(req, res, next) {
    try {
        const product = await findProductBySlug(req.params.slug);

        if (!product) {
            return res.status(404).json({
                error: "Producto no encontrado."
            });
        }

        const meta = productMeta(product);
        res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=1800");
        return res.json({
            titulo: meta.title,
            descripcion: meta.description,
            imagen: meta.image,
            imagenes: meta.images,
            url: meta.canonicalUrl,
            frontendUrl: meta.frontendUrl,
            canonical: meta.canonicalUrl,
            precio: meta.price,
            moneda: meta.currency,
            categoria: meta.category,
            noIndex: meta.noIndex,
            schema: meta.schema,
            breadcrumb: meta.breadcrumb
        });
    } catch (error) {
        next(error);
    }
}

async function renderDynamicSitemap(req, res, next) {
    try {
        const products = await Producto.find(
            publicProductFilter()
        )
            .select("nombre slug precio descripcion imagenes seo marca stock publicarCatalogo activo updatedAt createdAt")
            .sort({ updatedAt: -1, createdAt: -1 })
            .limit(1000)
            .lean();

        setPublicXmlCache(res);
        return res.send(renderSitemap(products));
    } catch (error) {
        next(error);
    }
}

function renderRobotsTxt(req, res) {
    res.type("text/plain");
    res.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=3600");
    res.send(renderRobots());
}

function getSeoStatus(req, res) {
    const publicSite = siteUrl();
    const publicSeo = seoPublicUrl();
    let hostname = "";

    try {
        hostname = new URL(publicSite).hostname;
    } catch (error) {
        hostname = "";
    }

    return res.json({
        brand: "Rhema Diseños",
        siteUrl: publicSite,
        seoPublicUrl: publicSeo,
        sitemapUrl: `${publicSeo}/sitemap.xml`,
        robotsUrl: `${publicSeo}/robots.txt`,
        locale: "es-CL",
        currency: "CLP",
        areaServed: "Santiago de Chile",
        domainReady: Boolean(hostname && !hostname.endsWith("onrender.com")),
        nextStep: hostname.endsWith("onrender.com")
            ? "Cuando tengas dominio, actualiza PUBLIC_SITE_URL, PUBLIC_FRONTEND_URL y SEO_PUBLIC_URL."
            : "Dominio personalizado detectado."
    });
}

module.exports = {
    findProductBySlug,
    renderProductSeoPage,
    renderProductSeoFromQuery,
    getProductSeoJson,
    renderDynamicSitemap,
    renderRobotsTxt,
    getSeoStatus
};
