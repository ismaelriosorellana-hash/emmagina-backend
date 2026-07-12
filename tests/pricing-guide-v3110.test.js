"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { getPricingGuide } = require("../services/pricingGuideService");
test("guía de precios define reglas iniciales de Santiago", () => {
  const guide = getPricingGuide();
  assert.equal(guide.city, "Santiago");
  assert.equal(guide.minimumCustomOrder, 5990);
  assert.equal(guide.localShipping, 4000);
  assert.equal(guide.freeShippingFrom, 25000);
  assert.ok(guide.factors.length >= 4);
});
