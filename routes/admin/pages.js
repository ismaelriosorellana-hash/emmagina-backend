"use strict";

const express = require("express");
const controller = require("../../controllers/adminSiteEditorPageController");

const router = express.Router();

router.get("/_status", controller.status);
router.get("/_diagnostic", controller.diagnostic);
router.post("/_repair", controller.repair);
router.get("/", controller.listPages);
router.post("/", controller.createPage);
router.get("/:pageId", controller.getPage);
router.patch("/:pageId", controller.updatePage);
router.put("/:pageId", controller.updatePage);
router.delete("/:pageId", controller.deletePage);
router.post("/:pageId/blocks", controller.addBlock);
router.patch("/:pageId/blocks/:blockId", controller.updateBlock);
router.put("/:pageId/blocks/:blockId", controller.updateBlock);
router.delete("/:pageId/blocks/:blockId", controller.deleteBlock);
router.put("/:pageId/reorder", controller.reorderBlocks);

module.exports = router;
