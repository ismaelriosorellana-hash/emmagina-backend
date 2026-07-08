"use strict";

const { getResolvedSiteSettings } = require("../controllers/siteSettingsController");

function publicStoreStatus(settings = {}) {
    const status = settings.storeStatus || {};
    return {
        paused: Boolean(status.paused),
        message: String(status.message || "Nuestra tienda online estará disponible próximamente. Si necesitas consultar por un producto, escríbenos por WhatsApp."),
        whatsappNumber: String(status.whatsappNumber || "56954633848").replace(/[^0-9]/g, ""),
        updatedAt: status.updatedAt || null
    };
}

async function getStoreStatus() {
    const settings = await getResolvedSiteSettings();
    return publicStoreStatus(settings);
}

async function assertStoreOpen() {
    const status = await getStoreStatus();
    if (status.paused) {
        const error = new Error(status.message || "La tienda está temporalmente en pausa.");
        error.statusCode = 423;
        error.expose = true;
        error.details = {
            storePaused: true,
            whatsappNumber: status.whatsappNumber
        };
        throw error;
    }
    return status;
}

module.exports = { publicStoreStatus, getStoreStatus, assertStoreOpen };
