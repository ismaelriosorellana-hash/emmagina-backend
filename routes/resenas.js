"use strict";
const express = require("express");
const { listProductReviews } = require("../controllers/reviewController");
const router = express.Router();
router.get("/producto/:productoId", listProductReviews);
module.exports = router;
