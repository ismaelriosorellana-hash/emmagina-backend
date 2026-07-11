"use strict";

const express = require("express");

const {
    listPages,
    getPage,
    createPage,
    updatePage,
    addBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks
} = require("../../controllers/adminPageBuilderController");

const router = express.Router();

router.get("/", listPages);
router.post("/", createPage);
router.get("/:pageId", getPage);
router.patch("/:pageId", updatePage);
router.put("/:pageId", updatePage);
router.post("/:pageId/blocks", addBlock);
router.patch("/:pageId/blocks/:blockId", updateBlock);
router.put("/:pageId/blocks/:blockId", updateBlock);
router.delete("/:pageId/blocks/:blockId", deleteBlock);
router.put("/:pageId/reorder", reorderBlocks);

module.exports = router;
