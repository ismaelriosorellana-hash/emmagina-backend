"use strict";

const express = require("express");
const {
    listPublicBanners
} = require("../controllers/bannerController");

const router = express.Router();

router.get("/", listPublicBanners);

module.exports = router;
