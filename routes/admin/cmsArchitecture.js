"use strict";

const express = require("express");
const controller = require("../../controllers/adminCmsArchitectureController");

const router = express.Router();

router.get("/status", controller.status);
router.post("/bootstrap", controller.bootstrap);
router.get("/schema", controller.schema);
router.get("/templates", controller.listTemplates);
router.get("/blocks", controller.listBlockDefinitions);
router.get("/pages", controller.listCmsPages);

module.exports = router;
