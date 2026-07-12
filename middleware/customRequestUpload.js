"use strict";

const path = require("path");
const multer = require("multer");

const allowedExtensions = new Set([
    ".jpg", ".jpeg", ".png", ".webp", ".pdf",
    ".stl", ".obj", ".3mf", ".step", ".stp", ".zip", ".rar"
]);

const allowedMimeTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "model/stl",
    "model/obj",
    "application/sla",
    "application/vnd.ms-3mfdocument",
    "application/octet-stream",
    "application/zip",
    "application/x-zip-compressed",
    "application/vnd.rar",
    "application/x-rar-compressed"
]);

const customRequestUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 20 * 1024 * 1024,
        files: 8,
        fields: 30
    },
    fileFilter(req, file, callback) {
        const extension = path.extname(file.originalname || "").toLowerCase();
        const mimeAllowed = allowedMimeTypes.has(file.mimetype) && file.mimetype !== "application/octet-stream";
        const extensionAllowed = allowedExtensions.has(extension);

        if (!extensionAllowed && !mimeAllowed) {
            const error = new Error("Archivo no permitido. Puedes subir imágenes, PDF, STL, OBJ, 3MF, STEP, ZIP o RAR.");
            error.statusCode = 400;
            callback(error);
            return;
        }

        callback(null, true);
    }
}).fields([
    { name: "archivos", maxCount: 8 }
]);

module.exports = {
    customRequestUpload
};
