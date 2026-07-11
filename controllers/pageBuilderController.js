"use strict";

const Page = require("../models/Page");

async function getPublicPage(req, res, next) {
    try {
        const key = String(req.params.key || "").trim().toLowerCase();

        const page = await Page.findOne({
            $or: [
                { key },
                { slug: key }
            ],
            isPublished: true
        }).lean();

        if (!page) {
            return res.status(404).json({ error: "Página no encontrada." });
        }

        page.blocks = (page.blocks || [])
            .filter((block) => block.isVisible !== false)
            .sort((a, b) => Number(a.position || 0) - Number(b.position || 0));

        res.json(page);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getPublicPage
};
