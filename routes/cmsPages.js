"use strict";

const express = require("express");
const controller = require("../controllers/cmsPublicController");

const router = express.Router();

router.get("/_status", controller.status);
router.get("/_navigation", controller.getNavigation);
router.get("/pages/:key", controller.getPublicPage);

module.exports = router;
