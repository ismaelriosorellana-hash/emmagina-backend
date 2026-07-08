"use strict";

const express = require("express");

const {
    salesSummary
} = require("../../controllers/adminReportController");

const router = express.Router();

router.get(
    "/ventas",
    salesSummary
);

module.exports = router;
