"use strict";

function isJpeg(buffer) {
    return buffer?.length >= 3 &&
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff;
}

function isPng(buffer) {
    const signature = [
        0x89, 0x50, 0x4e, 0x47,
        0x0d, 0x0a, 0x1a, 0x0a
    ];

    return buffer?.length >= 8 &&
        signature.every(
            (byte, index) =>
                buffer[index] === byte
        );
}

function isWebp(buffer) {
    return buffer?.length >= 12 &&
        buffer
            .subarray(0, 4)
            .toString("ascii") === "RIFF" &&
        buffer
            .subarray(8, 12)
            .toString("ascii") === "WEBP";
}

function validSignature(file) {
    if (!file?.buffer) return false;

    if (
        file.mimetype ===
        "image/jpeg"
    ) {
        return isJpeg(
            file.buffer
        );
    }

    if (
        file.mimetype ===
        "image/png"
    ) {
        return isPng(
            file.buffer
        );
    }

    if (
        file.mimetype ===
        "image/webp"
    ) {
        return isWebp(
            file.buffer
        );
    }

    return false;
}

function validateImageSignatures(
    req,
    res,
    next
) {
    const files =
        Object.values(
            req.files || {}
        ).flat();

    if (
        files.some(
            (file) =>
                !validSignature(file)
        )
    ) {
        return res.status(400).json({
            error:
                "Uno de los archivos no corresponde a una imagen válida.",
            requestId:
                req.requestId
        });
    }

    next();
}

module.exports = {
    validSignature,
    validateImageSignatures
};
