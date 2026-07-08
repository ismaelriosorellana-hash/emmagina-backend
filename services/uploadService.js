"use strict";

const { getCloudinary } = require("../config/cloudinary");

function cleanSegment(value, fallback = "archivo") {
    const cleaned = String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);

    return cleaned || fallback;
}

function uploadBuffer(buffer, options = {}) {
    const cloudinary = getCloudinary();

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                resource_type: options.resourceType || "image",
                folder: options.folder,
                public_id: options.publicId,
                overwrite: false,
                unique_filename: false,
                use_filename: false,
                context: options.context || undefined,
                tags: options.tags || ["emmagina", "personalizacion"]
            },
            (error, result) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(result);
            }
        );

        stream.end(buffer);
    });
}

function buildDownloadUrl(result) {
    const cloudinary = getCloudinary();

    return cloudinary.url(result.public_id, {
        secure: true,
        resource_type: result.resource_type || "image",
        type: result.type || "upload",
        flags: "attachment",
        format: result.format
    });
}

function toAsset(result, file) {
    return {
        url: result.secure_url,
        downloadUrl: buildDownloadUrl(result),
        publicId: result.public_id,
        fileName: file?.originalname || result.original_filename || "imagen",
        mimeType: file?.mimetype || "",
        bytes: Number(result.bytes || file?.size || 0),
        width: Number(result.width || 0),
        height: Number(result.height || 0),
        format: result.format || "",
        createdAt: result.created_at || new Date().toISOString()
    };
}

async function deleteAsset(publicId, resourceType = "image") {
    if (!publicId) return;
    const cloudinary = getCloudinary();
    await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        invalidate: true
    });
}

module.exports = {
    cleanSegment,
    uploadBuffer,
    toAsset,
    deleteAsset
};
