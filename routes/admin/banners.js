"use strict";

const express = require("express");

const {
    listBanners,
    createBanner,
    updateBanner,
    deleteBanner
} = require("../../controllers/adminBannerController");

const {
    validateObjectId
} = require("../../middleware/validateObjectId");

const router = express.Router();

router.get("/", listBanners);
router.post("/", createBanner);

router.patch(
    "/:id",
    validateObjectId("id"),
    updateBanner
);

router.put(
    "/:id",
    validateObjectId("id"),
    updateBanner
);

router.delete(
    "/:id",
    validateObjectId("id"),
    deleteBanner
);

module.exports = router;
