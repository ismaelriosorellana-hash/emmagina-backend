"use strict";

const express = require("express");
const { status, getPublicPage } = require("../controllers/siteEditorPageController");

const router = express.Router();

router.get("/_status", status);
router.get("/:key", getPublicPage);

module.exports = router;
