"use strict";

const express = require("express");
const {
    listContent,
    getContent,
    updateContent,
    resetContent
} = require("../../controllers/adminContentController");
const { accountWriteLimiter } = require("../../middleware/rateLimits");

const router = express.Router();

router.get("/", listContent);
router.get("/:slug", getContent);
router.put("/:slug", accountWriteLimiter, updateContent);
router.post("/:slug/restablecer", accountWriteLimiter, resetContent);

module.exports = router;
