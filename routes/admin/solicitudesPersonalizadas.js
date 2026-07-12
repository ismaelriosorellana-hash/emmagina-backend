"use strict";

const express = require("express");
const {
    listCustomRequests,
    getCustomRequest,
    updateCustomRequest,
    sendCustomRequestQuote,
    convertCustomRequestToOrder,
    addCustomRequestNote
} = require("../../controllers/adminCustomRequestController");

const router = express.Router();

router.get("/", listCustomRequests);
router.get("/:id", getCustomRequest);
router.patch("/:id", updateCustomRequest);
router.post("/:id/cotizacion/enviar", sendCustomRequestQuote);
router.post("/:id/convertir-pedido", convertCustomRequestToOrder);
router.post("/:id/notas", addCustomRequestNote);

module.exports = router;
