"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
    validateProductionConfig
} = require("../config/runtime");

const {
    normalizeOrigin
} = require("../config/cors");

const {
    applySecurityHeaders
} = require("../middleware/securityHeaders");

function withEnvironment(values, callback) {
    const original = {};

    Object.keys(values).forEach((key) => {
        original[key] = process.env[key];
        process.env[key] = values[key];
    });

    try {
        return callback();
    } finally {
        Object.entries(original).forEach(([key, value]) => {
            if (value === undefined) delete process.env[key];
            else process.env[key] = value;
        });
    }
}

const validProductionEnvironment = {
    NODE_ENV: "production",
    MONGODB_URI: "mongodb+srv://user:password@cluster.mongodb.net/mommycrafts",
    FRONTEND_URLS: "https://mommycrafts.cl",
    PUBLIC_FRONTEND_URL: "https://mommycrafts.cl",
    PUBLIC_BACKEND_URL: "https://api.mommycrafts.cl",
    TRUST_PROXY_HOPS: "1",
    CLOUDINARY_CLOUD_NAME: "mommycrafts",
    CLOUDINARY_API_KEY: "123456789",
    CLOUDINARY_API_SECRET: "secret-cloudinary-value",
    MP_ENVIRONMENT: "test",
    MP_ACCESS_TOKEN: "APP_USR-valid-token",
    MP_WEBHOOK_SECRET: "valid-webhook-secret"
};

test("acepta una configuración de producción completa", () => {
    withEnvironment(validProductionEnvironment, () => {
        const report = validateProductionConfig();
        assert.equal(report.environment, "production");
        assert.deepEqual(report.origins, ["https://mommycrafts.cl"]);
    });
});

test("rechaza orígenes inseguros o con rutas", () => {
    withEnvironment({
        ...validProductionEnvironment,
        FRONTEND_URLS: "http://mommycrafts.cl/tienda",
        PUBLIC_FRONTEND_URL: "http://mommycrafts.cl/tienda"
    }, () => {
        assert.throws(
            validateProductionConfig,
            /HTTPS|solo el origen/
        );
    });
});

test("rechaza configuración productiva con localhost", () => {
    withEnvironment({
        ...validProductionEnvironment,
        PUBLIC_BACKEND_URL: "https://localhost:3000"
    }, () => {
        assert.throws(
            validateProductionConfig,
            /localhost/
        );
    });
});

test("normaliza solo orígenes absolutos sin ruta", () => {
    assert.equal(
        normalizeOrigin("https://mommycrafts.cl/"),
        "https://mommycrafts.cl"
    );

    assert.equal(
        normalizeOrigin("https://mommycrafts.cl/catalogo"),
        ""
    );
});

test("agrega no-store y encabezados a rutas sensibles", () => {
    const headers = new Map();
    const req = { path: "/api/cuenta/pedidos" };
    const res = {
        setHeader(name, value) {
            headers.set(name, value);
        }
    };
    let continued = false;

    applySecurityHeaders(req, res, () => {
        continued = true;
    });

    assert.equal(continued, true);
    assert.match(headers.get("Cache-Control"), /no-store/);
    assert.match(headers.get("Permissions-Policy"), /camera=\(\)/);
});
