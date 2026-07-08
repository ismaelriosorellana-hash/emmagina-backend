"use strict";

const express = require("express");
const { createOrder } = require("../controllers/orderController");
const { requireAuth, requireRole } = require("../middleware/auth");
const { orderLimiter } = require("../middleware/rateLimits");

const router = express.Router();

router.post(
    "/",
    orderLimiter,
    requireAuth,
    requireRole("cliente"),
    createOrder
);

module.exports = router;
