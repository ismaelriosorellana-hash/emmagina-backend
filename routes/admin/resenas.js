"use strict";
const express = require("express");
const { listReviews, updateReview, deleteReview } = require("../../controllers/adminReviewController");
const { validateObjectId } = require("../../middleware/validateObjectId");
const router = express.Router();
router.get("/", listReviews);
router.patch("/:id", validateObjectId("id"), updateReview);
router.delete("/:id", validateObjectId("id"), deleteReview);
module.exports = router;
