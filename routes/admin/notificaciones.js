"use strict";

const express = require("express");
const {
    notificationStatus
} = require("../../controllers/adminNotificationSettingsController");

const router = express.Router();

router.get("/estado", notificationStatus);

module.exports = router;
