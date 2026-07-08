"use strict";

const express = require("express");

const {
    renderProductSeoPage,
    renderProductSeoFromQuery,
    getProductSeoJson,
    renderDynamicSitemap,
    renderRobotsTxt
} = require("../controllers/seoController");

const router = express.Router();

router.get("/producto.html", renderProductSeoFromQuery);
router.get("/producto/:slug", renderProductSeoPage);
router.get("/p/:slug", renderProductSeoPage);
router.get("/api/seo/productos/:slug", getProductSeoJson);
router.get("/sitemap.xml", renderDynamicSitemap);
router.get("/robots.txt", renderRobotsTxt);

module.exports = router;
