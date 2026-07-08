"use strict";

const express = require("express");
const { getStudio, updateStudio, resetStudio, uploadStudioImage } = require("../../controllers/adminSiteStudioController");
const { accountWriteLimiter, uploadLimiter } = require("../../middleware/rateLimits");
const { siteSettingsUpload } = require("../../middleware/siteSettingsUpload");
const { validateImageSignatures } = require("../../middleware/imageSignature");

const router = express.Router();
router.get("/", getStudio);
router.put("/", accountWriteLimiter, updateStudio);
router.post("/restablecer", accountWriteLimiter, resetStudio);
router.post("/imagen", uploadLimiter, siteSettingsUpload, validateImageSignatures, uploadStudioImage);
module.exports = router;
