"use strict";

const express = require("express");
const controller = require("../../controllers/adminSiteEditorPageController");

const router = express.Router();

router.get("/_status", controller.status);
router.get("/_diagnostic", controller.diagnostic);
router.post("/_repair", controller.repair);
router.get("/pages", controller.listPages);
router.post("/pages", controller.createPage);
router.get("/pages/:pageId", controller.getPage);
router.patch("/pages/:pageId", controller.updatePage);
router.put("/pages/:pageId", controller.updatePage);
router.delete("/pages/:pageId", controller.deletePage);
router.post("/pages/:pageId/sections", controller.addSection);
router.put("/pages/:pageId/sections/reorder", controller.reorderSections);
router.patch("/pages/:pageId/sections/:sectionId", controller.updateSection);
router.put("/pages/:pageId/sections/:sectionId", controller.updateSection);
router.delete("/pages/:pageId/sections/:sectionId", controller.deleteSection);
router.post("/pages/:pageId/blocks", controller.addBlock);
router.patch("/pages/:pageId/blocks/:blockId", controller.updateBlock);
router.put("/pages/:pageId/blocks/:blockId", controller.updateBlock);
router.delete("/pages/:pageId/blocks/:blockId", controller.deleteBlock);
router.put("/pages/:pageId/reorder", controller.reorderBlocks);

module.exports = router;
