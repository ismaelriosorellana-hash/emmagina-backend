"use strict";

const { v2: cloudinary } = require("cloudinary");

let configured = false;

function hasCloudinaryConfig() {
    return Boolean(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    );
}

function getCloudinary() {
    if (!hasCloudinaryConfig()) {
        const error = new Error(
            "Cloudinary no está configurado. Completa CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET en .env."
        );
        error.statusCode = 503;
        throw error;
    }

    if (!configured) {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            secure: true
        });
        configured = true;
    }

    return cloudinary;
}

module.exports = {
    getCloudinary,
    hasCloudinaryConfig
};
