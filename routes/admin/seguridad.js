"use strict";

const express = require("express");

const {
    adminSecurityStatus
} = require("../../controllers/adminSecurityController");

const router = express.Router();

router.get("/estado", adminSecurityStatus);

module.exports = router;
