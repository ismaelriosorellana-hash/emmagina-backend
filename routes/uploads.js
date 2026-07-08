"use strict";

const express =
    require("express");

const {
    uploadCustomization,
    uploadSimpleCustomization,
    uploadStatus
} = require(
    "../controllers/uploadController"
);

const {
    customizationUpload
} = require(
    "../middleware/customizationUpload"
);

const {
    validateImageSignatures
} = require(
    "../middleware/imageSignature"
);

const {
    simpleCustomizationUpload,
    validateMagic
} = require("../middleware/orderUpload");

const {
    uploadLimiter
} = require(
    "../middleware/rateLimits"
);

const {
    requireAuth,
    requireRole
} = require(
    "../middleware/auth"
);

const router =
    express.Router();

router.get(
    "/estado",
    uploadStatus
);

router.post(
    "/personalizacion",
    uploadLimiter,
    customizationUpload,
    validateImageSignatures,
    uploadCustomization
);

router.post(
    "/personalizacion-simple",
    uploadLimiter,
    requireAuth,
    requireRole("cliente"),
    simpleCustomizationUpload,
    validateMagic,
    uploadSimpleCustomization
);

module.exports = router;
