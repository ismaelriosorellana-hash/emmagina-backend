"use strict";

const express = require("express");
const { createCustomRequest, getCustomRequestPublic } = require("../controllers/customRequestController");
const { customRequestUpload } = require("../middleware/customRequestUpload");
const { uploadLimiter } = require("../middleware/rateLimits");

const router = express.Router();

router.post("/", uploadLimiter, customRequestUpload, createCustomRequest);
router.get("/:folio", getCustomRequestPublic);

module.exports = router;
