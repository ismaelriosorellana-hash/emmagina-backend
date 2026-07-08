"use strict";

let mongoose = null;

try {
    mongoose = require("mongoose");
} catch {
    mongoose = null;
}

const { APP_VERSION } = require("../config/version");

const DB_STATES = Object.freeze({
    0: "desconectado",
    1: "conectado",
    2: "conectando",
    3: "desconectando"
});

function uptimeSeconds() {
    return Math.round(process.uptime());
}

function databaseStatus() {
    if (!mongoose?.connection) {
        return {
            ok: false,
            estado: "no disponible",
            codigo: -1
        };
    }

    const state = Number(mongoose.connection.readyState);

    return {
        ok: state === 1,
        estado: DB_STATES[state] || "desconocido",
        codigo: state
    };
}

function basePayload(req) {
    return {
        ok: true,
        servicio: "emmagina-backend",
        version: APP_VERSION,
        entorno: process.env.NODE_ENV || "development",
        fecha: new Date().toISOString(),
        uptimeSegundos: uptimeSeconds(),
        requestId: req.requestId
    };
}

function health(req, res) {
    res.json({
        ...basePayload(req),
        database: databaseStatus()
    });
}

function live(req, res) {
    res.json(basePayload(req));
}

function ready(req, res) {
    const database = databaseStatus();
    const statusCode = database.ok ? 200 : 503;

    res.status(statusCode).json({
        ...basePayload(req),
        ok: database.ok,
        database
    });
}

function adminSystemStatus(req, res) {
    res.json({
        ...basePayload(req),
        database: databaseStatus(),
        seguridad: {
            corsProduccion: process.env.NODE_ENV === "production",
            trustProxy: Number(process.env.TRUST_PROXY_HOPS || 0),
            jwtIssuer: Boolean(process.env.JWT_ISSUER || "emmagina-api"),
            jwtAudience: Boolean(process.env.JWT_AUDIENCE || "emmagina-frontend")
        },
        seo: {
            publicSiteUrl: String(process.env.PUBLIC_SITE_URL || process.env.SEO_PUBLIC_URL || ""),
            publicFrontendUrl: String(process.env.PUBLIC_FRONTEND_URL || ""),
            publicBackendUrl: String(process.env.PUBLIC_BACKEND_URL || "")
        }
    });
}

module.exports = {
    databaseStatus,
    health,
    live,
    ready,
    adminSystemStatus
};
