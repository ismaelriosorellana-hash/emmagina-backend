"use strict";

const express = require("express");

const {
    getPublicPage
} = require("../controllers/pageBuilderController");

const router = express.Router();

router.get("/:key", getPublicPage);

module.exports = router;
