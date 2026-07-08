"use strict";

const express =
    require("express");

const {
    getProfile,
    updateProfile,
    listOrders,
    getOrder,
    cancelOrder
} = require(
    "../controllers/accountController"
);

const {
    requireAuth,
    requireRole
} = require(
    "../middleware/auth"
);

const {
    validateObjectId
} = require(
    "../middleware/validateObjectId"
);

const {
    accountWriteLimiter,
    uploadLimiter
} = require(
    "../middleware/rateLimits"
);

const { uploadReceipt } = require("../controllers/transferController");
const { respondDesign } = require("../controllers/designApprovalController");
const { receiptUpload, validateMagic } = require("../middleware/orderUpload");

const router =
    express.Router();

router.use(
    requireAuth,
    requireRole(
        "cliente"
    )
);

router.get(
    "/perfil",
    getProfile
);

router.patch(
    "/perfil",
    accountWriteLimiter,
    updateProfile
);

router.get(
    "/pedidos",
    listOrders
);

router.get(
    "/pedidos/:id",
    validateObjectId(
        "id"
    ),
    getOrder
);

router.post(
    "/pedidos/:id/cancelar",
    validateObjectId(
        "id"
    ),
    accountWriteLimiter,
    cancelOrder
);

router.post(
    "/pedidos/:id/comprobante",
    validateObjectId("id"),
    uploadLimiter,
    receiptUpload,
    validateMagic,
    uploadReceipt
);

router.post(
    "/pedidos/:id/items/:lineaId/diseno-respuesta",
    validateObjectId("id"),
    accountWriteLimiter,
    respondDesign
);

module.exports = router;
