"use strict";

const express = require("express");

const {
    listAdminCategories,
    createCategory,
    updateCategory,
    deleteCategory
} = require("../../controllers/adminCategoryController");

const { validateObjectId } = require("../../middleware/validateObjectId");

const router = express.Router();

router.get("/", listAdminCategories);
router.post("/", createCategory);
router.put("/:id", validateObjectId("id"), updateCategory);
router.patch("/:id", validateObjectId("id"), updateCategory);
router.delete("/:id", validateObjectId("id"), deleteCategory);

module.exports = router;
