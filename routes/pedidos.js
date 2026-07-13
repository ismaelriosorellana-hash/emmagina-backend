"use strict";

const express = require("express");
const { createOrder, validateCart, trackOrder } = require("../controllers/orderController");
const { orderLimiter } = require("../middleware/rateLimits");
const { optionalAuth } = require("../middleware/auth");

const router = express.Router();

router.post(
    "/seguimiento",
    orderLimiter,
    trackOrder
);

router.post(
    "/validar-carrito",
    optionalAuth,
    orderLimiter,
    validateCart
);

router.post(
    "/",
    optionalAuth,
    orderLimiter,
    createOrder
);

module.exports = router;
