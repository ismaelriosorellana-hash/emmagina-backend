"use strict";

const express = require("express");
const { getPublicSiteSettings } = require("../controllers/siteSettingsController");
const router = express.Router();
router.get("/", getPublicSiteSettings);
module.exports = router;
