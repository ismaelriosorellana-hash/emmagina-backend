"use strict";

const express = require("express");

const {
    dashboard
} = require("../../controllers/adminDashboardController");

const router = express.Router();

router.get("/", dashboard);

module.exports = router;
