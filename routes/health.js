"use strict";

const express = require("express");

const {
    health,
    live,
    ready
} = require("../controllers/healthController");

const router = express.Router();

router.get("/", health);
router.get("/live", live);
router.get("/ready", ready);

module.exports = router;
