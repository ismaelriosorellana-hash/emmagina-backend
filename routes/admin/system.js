"use strict";

const express = require("express");

const {
    adminSystemStatus
} = require("../../controllers/healthController");

const router = express.Router();

router.get("/estado", adminSystemStatus);

module.exports = router;
