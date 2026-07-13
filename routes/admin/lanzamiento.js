"use strict";

const express = require("express");
const { adminLaunchStatus } = require("../../controllers/adminLaunchController");

const router = express.Router();
router.get("/estado", adminLaunchStatus);
module.exports = router;
