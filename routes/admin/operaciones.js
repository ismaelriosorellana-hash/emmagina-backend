"use strict";

const express = require("express");

const {
    operationsSummary
} = require("../../controllers/adminOperationsController");

const router = express.Router();

router.get("/", operationsSummary);

module.exports = router;
