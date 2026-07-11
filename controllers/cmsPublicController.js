"use strict";

const CmsPage = require("../models/CmsPage");
const cmsArchitectureService = require("../services/cmsArchitectureService");

function pickPublishedLayout(page) {
    if (page.layoutPublicado && Array.isArray(page.layoutPublicado.regiones)) {
        return page.layoutPublicado;
    }
    return page.layoutBorrador || null;
}

function publicPageShape(page) {
    const layout = pickPublishedLayout(page);
    return {
        id: String(page._id || ""),
        clave: page.clave,
        titulo: page.titulo,
        slug: page.slug,
        tipoPagina: page.tipoPagina,
        templateKey: page.templateKey,
        estado: page.estado,
        navegacion: page.navegacion || {},
        seo: page.seo || {},
        layout,
        publicadoEn: page.publicadoEn || null,
        versionActual: page.versionActual || 0
    };
}

async function findPublishedPage(key) {
    const cleanKey = String(key || "home").trim().toLowerCase();
    const aliases = cleanKey === "inicio" ? ["home", "inicio"] : cleanKey === "home" ? ["home", "inicio"] : [cleanKey];
    return CmsPage.findOne({
        eliminadoEn: null,
        estado: "publicada",
        $or: [
            { clave: { $in: aliases } },
            { slug: { $in: aliases } },
            { tipoPagina: { $in: aliases } }
        ]
    }).lean();
}

async function getPublicPage(req, res, next) {
    try {
        await cmsArchitectureService.ensureArchitecture();
        const page = await findPublishedPage(req.params.key || "home");
        if (!page) {
            res.status(404).json({ error: "Página no encontrada." });
            return;
        }
        res.set("Cache-Control", "no-store");
        res.json({ page: publicPageShape(page) });
    } catch (error) {
        next(error);
    }
}

async function getNavigation(req, res, next) {
    try {
        await cmsArchitectureService.ensureArchitecture();
        const pages = await CmsPage.find({
            eliminadoEn: null,
            estado: "publicada",
            "navegacion.mostrarEnMenu": true
        })
            .select("clave titulo slug tipoPagina navegacion")
            .sort({ "navegacion.orden": 1, titulo: 1 })
            .lean();
        const navigation = pages.map((page) => ({
            id: String(page._id || ""),
            label: page.navegacion?.etiqueta || page.titulo,
            href: page.navegacion?.urlExterna || (page.clave === "home" ? "index.html" : `pagina.html?slug=${encodeURIComponent(page.slug)}`),
            slug: page.slug,
            clave: page.clave,
            orden: page.navegacion?.orden || 100,
            source: "cms"
        }));
        res.set("Cache-Control", "no-store");
        res.json({ navigation });
    } catch (error) {
        next(error);
    }
}

async function status(req, res, next) {
    try {
        await cmsArchitectureService.ensureArchitecture();
        res.set("Cache-Control", "no-store");
        res.json({ ok: true, engine: "cms-public-render-v1", versionEsquema: "cms-layout-v1" });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getPublicPage,
    getNavigation,
    status
};
