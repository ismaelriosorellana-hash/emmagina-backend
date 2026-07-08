"use strict";

const express = require("express");
const { getPublicSiteStudio } = require("../controllers/siteStudioController");

const router = express.Router();
router.get("/", getPublicSiteStudio);
module.exports = router;
