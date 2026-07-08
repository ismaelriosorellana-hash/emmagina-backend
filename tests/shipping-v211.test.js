"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
    FREE_SHIPPING_THRESHOLD,
    SANTIAGO_SHIPPING_COST,
    calculateShippingCost
} = require("../services/deliveryService");

test("cobra envío en Santiago bajo la meta", () => {
    assert.equal(FREE_SHIPPING_THRESHOLD, 25000);
    assert.equal(calculateShippingCost({ method: "envio", zone: "santiago", subtotal: 24990 }), SANTIAGO_SHIPPING_COST);
});

test("libera el costo desde $25.000 y no cobra retiro ni Chilexpress por pagar", () => {
    assert.equal(calculateShippingCost({ method: "envio", zone: "santiago", subtotal: 25000 }), 0);
    assert.equal(calculateShippingCost({ method: "retiro", zone: "santiago", subtotal: 1000 }), 0);
    assert.equal(calculateShippingCost({ method: "envio", zone: "otras_zonas", subtotal: 1000 }), 0);
});
