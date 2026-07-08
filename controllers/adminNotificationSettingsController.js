"use strict";

const {
    EVENT_LABELS,
    notificationConfigStatus
} = require("../services/notificationService");

const { APP_VERSION } = require("../config/version");

function notificationStatus(req, res) {
    res.json({
        version: APP_VERSION,
        estado: notificationConfigStatus(),
        eventos: Object.entries(EVENT_LABELS).map(([evento, etiqueta]) => ({
            evento,
            etiqueta
        }))
    });
}

module.exports = {
    notificationStatus
};
