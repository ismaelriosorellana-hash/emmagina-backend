"use strict";
const { getPricingGuide } = require("../services/pricingGuideService");
function showPricingGuide(req, res) {
  res.json({ guide: getPricingGuide(), requestId: req.requestId });
}
module.exports = { showPricingGuide };
