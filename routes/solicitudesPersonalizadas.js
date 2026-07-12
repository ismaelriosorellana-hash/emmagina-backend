"use strict";

const express = require("express");
const { createCustomRequest, getCustomRequestPublic, respondCustomRequestQuote, createOrderFromAcceptedQuote } = require("../controllers/customRequestController");
const { customRequestUpload } = require("../middleware/customRequestUpload");
const { uploadLimiter } = require("../middleware/rateLimits");

const router = express.Router();

router.post("/", uploadLimiter, customRequestUpload, createCustomRequest);
router.get("/:folio", getCustomRequestPublic);
router.post("/:folio/responder", respondCustomRequestQuote);
router.post("/:folio/crear-pedido", createOrderFromAcceptedQuote);

module.exports = router;
