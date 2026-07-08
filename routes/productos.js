"use strict";

const express = require("express");
const {
    listProducts,
    getProduct,
    getProductBySlug,
    getRelatedProducts
} = require("../controllers/productController");

const {
    validateObjectId
} = require("../middleware/validateObjectId");

const router = express.Router();

router.get("/", listProducts);
router.get("/slug/:slug", getProductBySlug);
router.get(
    "/:id/relacionados",
    validateObjectId("id"),
    getRelatedProducts
);
router.get(
    "/:id",
    validateObjectId("id"),
    getProduct
);

module.exports = router;
