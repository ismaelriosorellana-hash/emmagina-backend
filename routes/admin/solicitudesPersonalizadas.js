"use strict";

const express = require("express");
const {
    listCustomRequests,
    getCustomRequest,
    updateCustomRequest,
    addCustomRequestNote
} = require("../../controllers/adminCustomRequestController");

const router = express.Router();

router.get("/", listCustomRequests);
router.get("/:id", getCustomRequest);
router.patch("/:id", updateCustomRequest);
router.post("/:id/notas", addCustomRequestNote);

module.exports = router;
