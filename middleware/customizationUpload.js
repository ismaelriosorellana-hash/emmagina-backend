"use strict";

const multer = require("multer");

const allowedTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp"
]);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 8 * 1024 * 1024,
        files: 2,
        fields: 10
    },
    fileFilter(req, file, callback) {
        if (!allowedTypes.has(file.mimetype)) {
            const error = new Error(
                "Solo se permiten imágenes JPG, PNG o WEBP."
            );
            error.statusCode = 400;
            callback(error);
            return;
        }

        callback(null, true);
    }
});

const customizationUpload = upload.fields([
    { name: "original", maxCount: 1 },
    { name: "preview", maxCount: 1 }
]);

module.exports = {
    customizationUpload
};
