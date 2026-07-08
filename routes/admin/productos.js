"use strict";

const express = require("express");

const {
    listAdminProducts,
    getAdminProduct,
    createProduct,
    updateProduct,
    deleteProduct
} = require("../../controllers/adminProductController");

const {
    validateObjectId
} = require("../../middleware/validateObjectId");

const router = express.Router();

router.get("/", listAdminProducts);
router.post("/", createProduct);

router.get(
    "/:id",
    validateObjectId("id"),
    getAdminProduct
);

router.patch(
    "/:id",
    validateObjectId("id"),
    updateProduct
);

router.put(
    "/:id",
    validateObjectId("id"),
    updateProduct
);

router.delete(
    "/:id",
    validateObjectId("id"),
    deleteProduct
);

module.exports = router;
