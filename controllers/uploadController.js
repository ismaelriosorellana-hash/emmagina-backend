"use strict";

const crypto = require("crypto");

const {
    cleanSegment,
    uploadBuffer,
    toAsset,
    deleteAsset
} = require("../services/uploadService");

const {
    hasCloudinaryConfig
} = require("../config/cloudinary");

function firstFile(files, field) {
    return Array.isArray(files?.[field])
        ? files[field][0]
        : null;
}

async function uploadCustomization(req, res, next) {
    const uploadedPublicIds = [];

    try {
        const original = firstFile(req.files, "original");
        const preview = firstFile(req.files, "preview");

        if (!original && !preview) {
            return res.status(400).json({
                error: "Debes enviar al menos una imagen."
            });
        }

        const customizationId = cleanSegment(
            req.body.customizationId || crypto.randomUUID(),
            crypto.randomUUID()
        );

        const configuredFolder = String(
            process.env.CLOUDINARY_CUSTOMIZATION_FOLDER ||
            "mommy-crafts/personalizaciones"
        )
            .split("/")
            .map((part) => cleanSegment(part, "personalizaciones"))
            .join("/");

        const folder = `${configuredFolder}/${customizationId}`;
        const assets = {};

        if (original) {
            const result = await uploadBuffer(original.buffer, {
                folder,
                publicId: "archivo-original",
                context: {
                    customizationId,
                    assetType: "original"
                }
            });

            uploadedPublicIds.push(result.public_id);
            assets.original = toAsset(result, original);
        }

        if (preview) {
            const result = await uploadBuffer(preview.buffer, {
                folder,
                publicId: "vista-previa-final",
                context: {
                    customizationId,
                    assetType: "preview"
                }
            });

            uploadedPublicIds.push(result.public_id);
            assets.preview = toAsset(result, preview);
        }

        res.status(201).json({
            customizationId,
            assets
        });
    } catch (error) {
        await Promise.allSettled(
            uploadedPublicIds.map((publicId) => deleteAsset(publicId))
        );
        next(error);
    }
}

async function uploadSimpleCustomization(req, res, next) {
    const uploadedPublicIds = [];
    try {
        const files = Array.isArray(req.files?.imagenes) ? req.files.imagenes : [];
        if (!files.length) return res.status(400).json({ error: "Debes enviar al menos una imagen." });
        const customizationId = cleanSegment(req.body.customizationId || crypto.randomUUID(), crypto.randomUUID());
        const configuredFolder = String(process.env.CLOUDINARY_CUSTOMIZATION_FOLDER || "mommy-crafts/personalizaciones")
            .split("/").map(part => cleanSegment(part, "personalizaciones")).join("/");
        const folder = `${configuredFolder}/${customizationId}/simple`;
        const assets = [];
        for (let index = 0; index < files.length; index += 1) {
            const file = files[index];
            const result = await uploadBuffer(file.buffer, {
                folder, publicId: `referencia-${index + 1}`,
                context: { customizationId, assetType: "simple-reference" }
            });
            uploadedPublicIds.push(result.public_id);
            assets.push(toAsset(result, file));
        }
        res.status(201).json({ customizationId, assets });
    } catch (error) {
        await Promise.allSettled(uploadedPublicIds.map(publicId => deleteAsset(publicId)));
        next(error);
    }
}

function uploadStatus(req, res) {
    res.json({
        cloudinaryConfigured: hasCloudinaryConfig(),
        maxFiles: 2,
        maxFileSizeMb: 8,
        allowedTypes: [
            "image/jpeg",
            "image/png",
            "image/webp"
        ]
    });
}

module.exports = {
    uploadCustomization,
    uploadSimpleCustomization,
    uploadStatus
};
