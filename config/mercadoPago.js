"use strict";

const MERCADO_PAGO_API_URL = "https://api.mercadopago.com";

function cleanUrl(value) {
    return String(value || "")
        .trim()
        .replace(/\/+$/, "");
}

function getMercadoPagoConfig() {
    const environment =
        String(process.env.MP_ENVIRONMENT || "test")
            .trim()
            .toLowerCase() === "production"
            ? "production"
            : "test";

    return {
        apiUrl: MERCADO_PAGO_API_URL,
        accessToken:
            String(process.env.MP_ACCESS_TOKEN || "").trim(),
        webhookSecret:
            String(process.env.MP_WEBHOOK_SECRET || "").trim(),
        frontendUrl:
            cleanUrl(
                process.env.PUBLIC_FRONTEND_URL ||
                "http://127.0.0.1:5500"
            ),
        backendUrl:
            cleanUrl(
                process.env.PUBLIC_BACKEND_URL ||
                "http://localhost:3000"
            ),
        environment
    };
}

function isMercadoPagoConfigured() {
    return Boolean(getMercadoPagoConfig().accessToken);
}

function hasPublicWebhookUrl() {
    const { backendUrl } = getMercadoPagoConfig();

    return (
        backendUrl.startsWith("https://") &&
        !/localhost|127\.0\.0\.1/i.test(backendUrl)
    );
}


function isMercadoPagoReady() {
    const config = getMercadoPagoConfig();

    return Boolean(
        config.accessToken &&
        config.webhookSecret &&
        hasPublicWebhookUrl()
    );
}

module.exports = {
    getMercadoPagoConfig,
    isMercadoPagoConfigured,
    hasPublicWebhookUrl,
    isMercadoPagoReady
};
