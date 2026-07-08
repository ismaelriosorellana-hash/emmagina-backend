"use strict";

const multer = require("multer");

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024, files: 1, fields: 4 },
    fileFilter(req, file, callback) {
        if (!allowedTypes.has(file.mimetype)) {
            const error = new Error("Solo se permiten imágenes JPG, PNG o WEBP.");
            error.statusCode = 400;
            callback(error);
            return;
        }
        callback(null, true);
    }
});

module.exports = { siteSettingsUpload: upload.fields([{ name: "image", maxCount: 1 }]) };
