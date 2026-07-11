"use strict";

const store = require("../services/siteEditorStore");

async function getPublicPage(req, res, next) {
    try {
        const key = req.params.key || req.query.slug || "home";
        const page = await store.findPublicPage(key);
        if (!page) {
            return res.status(404).json({ error: "Página no encontrada." });
        }
        res.set("Cache-Control", "no-store");
        res.json(page);
    } catch (error) {
        next(error);
    }
}

async function status(req, res, next) {
    try {
        res.set("Cache-Control", "no-store");
        res.json(await store.diagnostic());
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getPublicPage,
    status
};
