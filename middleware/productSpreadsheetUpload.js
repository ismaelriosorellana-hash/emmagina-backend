"use strict";
const multer = require("multer");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter(req, file, cb) {
    const name = String(file.originalname || "").toLowerCase();
    const valid = name.endsWith(".xlsx") || name.endsWith(".xls") || ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","application/vnd.ms-excel"].includes(file.mimetype);
    cb(valid ? null : new Error("Solo se permiten archivos Excel .xlsx o .xls."), valid);
  }
});
module.exports = upload;
