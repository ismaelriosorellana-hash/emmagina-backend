"use strict";
const express = require("express");
const { showPricingGuide } = require("../controllers/pricingGuideController");
const router = express.Router();
router.get("/", showPricingGuide);
module.exports = router;
