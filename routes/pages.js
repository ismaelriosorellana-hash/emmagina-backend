"use strict";

const express = require("express");
const { status, getPublicPage, getNavigation } = require("../controllers/siteEditorPageController");

const router = express.Router();

router.get("/_status", status);
router.get("/_navigation", getNavigation);
router.get("/:key", getPublicPage);

module.exports = router;
