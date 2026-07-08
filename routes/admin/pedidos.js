"use strict";

const express = require("express");

const {
    listOrders,
    getOrder,
    updateOrder,
    adminSyncPayment
} = require("../../controllers/adminOrderController");

const {
    validateObjectId
} = require("../../middleware/validateObjectId");

const { validateTransfer } = require("../../controllers/transferController");
const {
    listOrderNotifications,
    previewOrderNotification,
    sendOrderNotification
} = require("../../controllers/adminNotificationController");
const { uploadFinalDesign } = require("../../controllers/designApprovalController");
const { designUpload, validateMagic } = require("../../middleware/orderUpload");
const { uploadLimiter } = require("../../middleware/rateLimits");

const router = express.Router();

router.get("/", listOrders);

router.post(
    "/:id/sincronizar-pago",
    validateObjectId("id"),
    adminSyncPayment
);

router.post(
    "/:id/transferencia",
    validateObjectId("id"),
    validateTransfer
);

router.post(
    "/:id/items/:lineaId/diseno",
    validateObjectId("id"),
    uploadLimiter,
    designUpload,
    validateMagic,
    uploadFinalDesign
);


router.get(
    "/:id/notificaciones",
    validateObjectId("id"),
    listOrderNotifications
);

router.get(
    "/:id/notificaciones/:evento",
    validateObjectId("id"),
    previewOrderNotification
);

router.post(
    "/:id/notificaciones/:evento",
    validateObjectId("id"),
    sendOrderNotification
);

router.get(
    "/:id",
    validateObjectId("id"),
    getOrder
);

router.patch(
    "/:id",
    validateObjectId("id"),
    updateOrder
);

router.put(
    "/:id",
    validateObjectId("id"),
    updateOrder
);

module.exports = router;
