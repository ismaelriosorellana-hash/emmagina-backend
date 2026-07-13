"use strict";

const express = require("express");

const {
    listAdminProducts,
    getAdminProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    updateVariantInventory,
    downloadProductTemplate,
    importProductsExcel
} = require("../../controllers/adminProductController");

const {
    validateObjectId
} = require("../../middleware/validateObjectId");

const productSpreadsheetUpload = require("../../middleware/productSpreadsheetUpload");

const router = express.Router();

router.get("/plantilla-excel", downloadProductTemplate);
router.post("/importar-excel", productSpreadsheetUpload.single("archivo"), importProductsExcel);
router.get("/", listAdminProducts);
router.post("/", createProduct);

router.patch(
    "/:id/variantes/inventario",
    validateObjectId("id"),
    updateVariantInventory
);

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
