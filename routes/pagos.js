"use strict";

const express =
    require("express");

const {
    optionalAuth
} = require(
    "../middleware/auth"
);

const {
    validateObjectId
} = require(
    "../middleware/validateObjectId"
);

const {
    paymentLimiter
} = require(
    "../middleware/rateLimits"
);

const {
    getIntegrationStatus,
    createOrderPreference,
    processReturn,
    getPaymentStatus,
    webhook
} = require(
    "../controllers/paymentController"
);

const router =
    express.Router();

router.get(
    "/mercadopago/estado",
    getIntegrationStatus
);

router.post(
    "/mercadopago/pedidos/:id/preferencia",
    paymentLimiter,
    optionalAuth,
    validateObjectId("id"),
    createOrderPreference
);

router.post(
    "/mercadopago/pedidos/:id/retorno",
    paymentLimiter,
    optionalAuth,
    validateObjectId("id"),
    processReturn
);

router.get(
    "/mercadopago/pedidos/:id/estado",
    paymentLimiter,
    optionalAuth,
    validateObjectId("id"),
    getPaymentStatus
);

router.post(
    "/mercadopago/webhook",
    webhook
);

module.exports = router;
