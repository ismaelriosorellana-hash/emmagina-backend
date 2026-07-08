"use strict";

const express = require("express");

const {
    listMovements,
    adjustStock,
    lowStock
} = require("../../controllers/adminInventoryController");

const router = express.Router();

router.get(
    "/movimientos",
    listMovements
);

router.get(
    "/stock-bajo",
    lowStock
);

router.post(
    "/ajustes",
    adjustStock
);

module.exports = router;
