"use strict";

const mongoose = require("mongoose");

const {
    APP_VERSION
} = require("../config/version");

const {
    getAllowedOrigins
} = require("../config/cors");

const {
    jwtExpiresIn,
    jwtIssuer,
    jwtAudience
} = require("../config/security");

const {
    splitList,
    isPlaceholder
} = require("../config/runtime");

function text(value) {
    return String(value || "").trim();
}

function maskEmail(value) {
    const email = text(value);
    const [local, domain] = email.split("@");

    if (!local || !domain) return "";

    const visible = local.length <= 2
        ? local[0]
        : `${local.slice(0, 2)}…`;

    return `${visible}@${domain}`;
}

function maskList(values) {
    return values
        .map(maskEmail)
        .filter(Boolean);
}

function parseOrigin(value) {
    try {
        const url = new URL(value);
        return url.origin;
    } catch {
        return "";
    }
}

function hasHttpsOrigin(value) {
    try {
        return new URL(value).protocol === "https:";
    } catch {
        return false;
    }
}

function createCheck(id, label, ok, message, severity = "critical") {
    return {
        id,
        label,
        ok: Boolean(ok),
        severity,
        message
    };
}

function countByStatus(checks) {
    return checks.reduce(
        (acc, check) => {
            if (check.ok) {
                acc.ok += 1;
                return acc;
            }

            if (check.severity === "warning") {
                acc.warnings += 1;
            } else {
                acc.critical += 1;
            }

            return acc;
        },
        {
            ok: 0,
            warnings: 0,
            critical: 0
        }
    );
}

function readinessFromCounts(counts) {
    if (counts.critical > 0) {
        return "bloqueado";
    }

    if (counts.warnings > 0) {
        return "con_observaciones";
    }

    return "listo";
}

function buildSecurityStatus() {
    const frontendUrls = splitList(
        process.env.FRONTEND_URLS ||
        process.env.PUBLIC_FRONTEND_URL
    );
    const allowedOrigins = getAllowedOrigins();
    const publicFrontend = text(process.env.PUBLIC_FRONTEND_URL);
    const publicBackend = text(process.env.PUBLIC_BACKEND_URL);
    const publicSite = text(process.env.PUBLIC_SITE_URL || process.env.SEO_PUBLIC_URL);
    const jwtSecret = text(process.env.JWT_SECRET);
    const logSalt = text(process.env.SECURITY_LOG_SALT);
    const cloudinaryValues = [
        process.env.CLOUDINARY_CLOUD_NAME,
        process.env.CLOUDINARY_API_KEY,
        process.env.CLOUDINARY_API_SECRET
    ].map(text);
    const mercadoPagoEnvironment = text(process.env.MP_ENVIRONMENT || "test").toLowerCase();
    const mercadoPagoToken = text(process.env.MP_ACCESS_TOKEN);
    const mercadoPagoWebhookSecret = text(process.env.MP_WEBHOOK_SECRET);
    const notificationsEnabled = text(process.env.NOTIFICATIONS_ENABLED).toLowerCase() === "true";
    const resendKey = text(process.env.RESEND_API_KEY);
    const emailFrom = text(process.env.EMAIL_FROM);
    const adminEmails = splitList(process.env.NOTIFICATION_ADMIN_EMAIL);
    const whatsapp = text(process.env.WHATSAPP_SUPPORT_NUMBER || process.env.WHATSAPP_NUMBER);
    const trustProxy = Number(process.env.TRUST_PROXY_HOPS);

    const checks = [
        createCheck(
            "node-env-production",
            "Entorno de producción",
            process.env.NODE_ENV === "production",
            process.env.NODE_ENV === "production"
                ? "NODE_ENV está en producción."
                : "Configura NODE_ENV=production antes de abrir a clientes reales."
        ),
        createCheck(
            "frontend-https",
            "Frontend público HTTPS",
            Boolean(publicFrontend && hasHttpsOrigin(publicFrontend)),
            publicFrontend
                ? `Frontend configurado como ${publicFrontend}.`
                : "Falta PUBLIC_FRONTEND_URL con HTTPS."
        ),
        createCheck(
            "backend-https",
            "Backend público HTTPS",
            Boolean(publicBackend && hasHttpsOrigin(publicBackend)),
            publicBackend
                ? `Backend configurado como ${publicBackend}.`
                : "Falta PUBLIC_BACKEND_URL con HTTPS."
        ),
        createCheck(
            "site-seo-origin",
            "URL pública SEO",
            Boolean(publicSite && hasHttpsOrigin(publicSite)),
            publicSite
                ? `SEO público usa ${publicSite}.`
                : "Falta PUBLIC_SITE_URL o SEO_PUBLIC_URL con HTTPS."
        ),
        createCheck(
            "final-store-domain",
            "Dominio final de tienda",
            publicFrontend === "https://mommycrafts.cl" && publicSite === "https://mommycrafts.cl",
            publicFrontend === "https://mommycrafts.cl" && publicSite === "https://mommycrafts.cl"
                ? "Frontend y SEO usan mommycrafts.cl como dominio oficial."
                : "Actualiza PUBLIC_FRONTEND_URL, PUBLIC_SITE_URL y SEO_PUBLIC_URL a https://mommycrafts.cl.",
            "warning"
        ),
        createCheck(
            "cors-origins",
            "CORS restringido",
            allowedOrigins.length > 0 && allowedOrigins.every(hasHttpsOrigin),
            allowedOrigins.length
                ? `Orígenes permitidos: ${allowedOrigins.join(", ")}.`
                : "Falta FRONTEND_URLS o PUBLIC_FRONTEND_URL.",
        ),
        createCheck(
            "frontend-in-cors",
            "Frontend incluido en CORS",
            Boolean(publicFrontend && allowedOrigins.includes(parseOrigin(publicFrontend))),
            publicFrontend
                ? "PUBLIC_FRONTEND_URL está autorizado en CORS."
                : "PUBLIC_FRONTEND_URL no está definido."
        ),
        createCheck(
            "jwt-secret",
            "JWT secret robusto",
            jwtSecret.length >= 48 && !isPlaceholder(jwtSecret),
            jwtSecret.length >= 48
                ? "JWT_SECRET tiene longitud adecuada."
                : "Usa un JWT_SECRET aleatorio de 48+ caracteres.",
        ),
        createCheck(
            "security-log-salt",
            "Salt de logs de seguridad",
            logSalt.length >= 32 && !isPlaceholder(logSalt),
            logSalt.length >= 32
                ? "SECURITY_LOG_SALT está configurado."
                : "Configura SECURITY_LOG_SALT con 32+ caracteres."
        ),
        createCheck(
            "jwt-claims",
            "Claims JWT",
            Boolean(jwtIssuer() && jwtAudience() && jwtExpiresIn()),
            `Issuer: ${jwtIssuer() || "sin dato"}. Audience: ${jwtAudience() || "sin dato"}. Expira: ${jwtExpiresIn() || "sin dato"}.`,
            "warning"
        ),
        createCheck(
            "trust-proxy",
            "Trust proxy Render",
            Number.isInteger(trustProxy) && trustProxy >= 1 && trustProxy <= 10,
            Number.isInteger(trustProxy)
                ? `TRUST_PROXY_HOPS=${trustProxy}.`
                : "Configura TRUST_PROXY_HOPS=1 en Render.",
            "warning"
        ),
        createCheck(
            "mongodb-connected",
            "MongoDB conectado",
            mongoose.connection.readyState === 1,
            mongoose.connection.readyState === 1
                ? "MongoDB está conectado."
                : `MongoDB no está listo. Estado interno: ${mongoose.connection.readyState}.`
        ),
        createCheck(
            "cloudinary-complete",
            "Cloudinary completo",
            cloudinaryValues.every(Boolean) && cloudinaryValues.every((value) => !isPlaceholder(value)),
            cloudinaryValues.every(Boolean)
                ? "Cloudinary está configurado para imágenes."
                : "Faltan variables de Cloudinary; las cargas de imágenes pueden fallar."
        ),
        createCheck(
            "mercadopago-mode",
            "Mercado Pago coherente",
            mercadoPagoEnvironment !== "production" || (mercadoPagoToken && mercadoPagoWebhookSecret && !/^TEST-/i.test(mercadoPagoToken)),
            mercadoPagoEnvironment === "production"
                ? "Mercado Pago está en modo producción con credenciales productivas."
                : "Mercado Pago está en modo test o no productivo; correcto para pruebas, no para apertura oficial.",
            mercadoPagoEnvironment === "production" ? "critical" : "warning"
        ),
        createCheck(
            "email-notifications",
            "Correo transaccional",
            !notificationsEnabled || Boolean(resendKey && emailFrom),
            notificationsEnabled
                ? resendKey && emailFrom
                    ? "Correo automático configurado."
                    : "NOTIFICATIONS_ENABLED está activo, pero falta RESEND_API_KEY o EMAIL_FROM."
                : "Correo automático desactivado; puedes operar manualmente por WhatsApp.",
            notificationsEnabled ? "critical" : "warning"
        ),
        createCheck(
            "admin-notification-email",
            "Aviso interno de pedidos",
            adminEmails.length > 0,
            adminEmails.length
                ? `Avisos internos a ${maskList(adminEmails).join(", ")}.`
                : "No hay NOTIFICATION_ADMIN_EMAIL; no se enviará aviso interno automático.",
            "warning"
        ),
        createCheck(
            "whatsapp-support",
            "WhatsApp de soporte",
            /^\d{8,15}$/.test(whatsapp),
            whatsapp
                ? "WhatsApp de soporte configurado."
                : "Falta WHATSAPP_SUPPORT_NUMBER para contacto directo.",
            "warning"
        )
    ];

    const counts = countByStatus(checks);
    const readiness = readinessFromCounts(counts);

    return {
        version: APP_VERSION,
        fecha: new Date().toISOString(),
        entorno: process.env.NODE_ENV || "development",
        estado: readiness,
        resumen: counts,
        listoParaClientes: readiness !== "bloqueado",
        dominios: {
            frontend: publicFrontend || "",
            backend: publicBackend || "",
            seo: publicSite || "",
            corsPermitidos: allowedOrigins
        },
        checks
    };
}

function adminSecurityStatus(req, res) {
    res.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    res.json(buildSecurityStatus());
}

module.exports = {
    adminSecurityStatus,
    buildSecurityStatus
};
