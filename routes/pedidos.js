"use strict";

const express = require("express");
const { createOrder, validateCart, trackOrder } = require("../controllers/orderController");
const { orderLimiter } = require("../middleware/rateLimits");

const router = express.Router();

router.post(
    "/seguimiento",
    orderLimiter,
    trackOrder
);

router.post(
    "/validar-carrito",
    orderLimiter,
    validateCart
);

router.post(
    "/",
    orderLimiter,
    createOrder
);

module.exports = router;
