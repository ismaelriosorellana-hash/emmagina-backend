"use strict";

const multer = require("multer");

const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const receiptTypes = new Set([...imageTypes, "application/pdf"]);

function buildUpload(types, maxFiles = 1, field = "archivo") {
    return multer({
        storage: multer.memoryStorage(),
        limits: { fileSize: 8 * 1024 * 1024, files: maxFiles, fields: 12 },
        fileFilter(req, file, callback) {
            if (!types.has(file.mimetype)) {
                const error = new Error(types.has("application/pdf") ? "Solo se permiten JPG, PNG, WEBP o PDF." : "Solo se permiten imágenes JPG, PNG o WEBP.");
                error.statusCode = 400; return callback(error);
            }
            callback(null, true);
        }
    }).fields([{ name: field, maxCount: maxFiles }]);
}

function validateMagic(req, res, next) {
    const files = Object.values(req.files || {}).flat();
    for (const file of files) {
        const b = file.buffer;
        const valid =
            (file.mimetype === "image/jpeg" && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) ||
            (file.mimetype === "image/png" && b.slice(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))) ||
            (file.mimetype === "image/webp" && b.slice(0,4).toString() === "RIFF" && b.slice(8,12).toString() === "WEBP") ||
            (file.mimetype === "application/pdf" && b.slice(0,5).toString() === "%PDF-");
        if (!valid) { const error = new Error("El contenido del archivo no coincide con su formato."); error.statusCode = 400; return next(error); }
    }
    next();
}

module.exports = {
    simpleCustomizationUpload: buildUpload(imageTypes, 5, "imagenes"),
    receiptUpload: buildUpload(receiptTypes, 1, "archivo"),
    designUpload: buildUpload(imageTypes, 1, "archivo"),
    validateMagic
};
