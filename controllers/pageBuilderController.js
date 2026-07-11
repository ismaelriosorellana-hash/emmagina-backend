"use strict";

const Page = require("../models/CmsPage");
const { ensureDefaultHomePage, shouldBootstrapHome } = require("../services/pageBuilderDefaults");

function cleanKey(value) {
    return String(value || "").trim().toLowerCase();
}

async function getPublicPage(req, res, next) {
    try {
        const key = cleanKey(req.params.key || req.query.slug || "home");

        let page = await Page.findOne({
            $or: [
                { key },
                { slug: key }
            ],
            isPublished: true
        }).lean();

        if (!page && shouldBootstrapHome(key)) {
            page = await ensureDefaultHomePage().then((createdPage) => createdPage.toObject());
        }

        if (!page) {
            return res.status(404).json({ error: "Página no encontrada." });
        }

        page.blocks = (page.blocks || [])
            .filter((block) => block.isVisible !== false)
            .sort((a, b) => Number(a.position || 0) - Number(b.position || 0));

        page.publicPath = page.key === "home" || page.slug === "inicio"
            ? "/"
            : `/pagina.html?slug=${encodeURIComponent(page.slug || page.key)}`;

        res.set("Cache-Control", "no-store");
        res.json(page);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getPublicPage
};
