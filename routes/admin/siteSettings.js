"use strict";

const express = require("express");
const { getSettings, updateSettings, resetSettings, uploadBrandAsset } = require("../../controllers/adminSiteSettingsController");
const { accountWriteLimiter, uploadLimiter } = require("../../middleware/rateLimits");
const { siteSettingsUpload } = require("../../middleware/siteSettingsUpload");
const { validateImageSignatures } = require("../../middleware/imageSignature");

const router = express.Router();
router.get("/", getSettings);
router.put("/", accountWriteLimiter, updateSettings);
router.post("/restablecer", accountWriteLimiter, resetSettings);
router.post("/imagen", uploadLimiter, siteSettingsUpload, validateImageSignatures, uploadBrandAsset);
module.exports = router;
