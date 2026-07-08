"use strict";

const express = require("express");
const {
    listPublicContent,
    getPublicContent
} = require("../controllers/contentController");

const router = express.Router();

router.get("/", listPublicContent);
router.get("/:slug", getPublicContent);

module.exports = router;
