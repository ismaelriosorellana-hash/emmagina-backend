"use strict";

const { getActiveCategories } = require("../services/categoryService");

async function listPublicCategories(req, res, next) {
    try {
        const categories = await getActiveCategories({
            includeCounts: String(req.query.conteo || req.query.count || "") !== "false",
            menuOnly: String(req.query.menu || "") === "1",
            homeOnly: String(req.query.inicio || req.query.home || "") === "1"
        });

        res.json({ categorias: categories });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    listPublicCategories
};
