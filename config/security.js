"use strict";

const DEFAULT_ISSUER = "emmagina-api";
const DEFAULT_AUDIENCE = "emmagina-frontend";

function jwtIssuer() {
    return String(
        process.env.JWT_ISSUER ||
        DEFAULT_ISSUER
    ).trim();
}

function jwtAudience() {
    return String(
        process.env.JWT_AUDIENCE ||
        DEFAULT_AUDIENCE
    ).trim();
}

function jwtExpiresIn() {
    return String(
        process.env.JWT_EXPIRES_IN ||
        "2h"
    ).trim();
}

function trustProxyHops() {
    const value = Number(
        process.env.TRUST_PROXY_HOPS
    );

    return Number.isInteger(value) &&
        value >= 0 &&
        value <= 10
        ? value
        : process.env.NODE_ENV === "production"
            ? 1
            : 0;
}

function validateSecurityConfig() {
    const errors = [];
    const warnings = [];
    const secret = String(
        process.env.JWT_SECRET ||
        ""
    );

    if (!secret) {
        errors.push(
            "Falta JWT_SECRET."
        );
    } else if (secret.length < 32) {
        errors.push(
            "JWT_SECRET debe tener al menos 32 caracteres."
        );
    }

    if (
        /reemplaza|cambia_esta|example|ejemplo|tu_secreto|your_secret/i
            .test(secret)
    ) {
        errors.push(
            "JWT_SECRET parece contener un valor de ejemplo."
        );
    }

    const logSalt = String(
        process.env.SECURITY_LOG_SALT ||
        ""
    );

    if (
        process.env.NODE_ENV === "production" &&
        logSalt.length < 32
    ) {
        errors.push(
            "SECURITY_LOG_SALT debe tener al menos 32 caracteres en producción."
        );
    }

    if (
        /reemplaza|cambia_esta|example|ejemplo|tu_valor|your_value/i
            .test(logSalt)
    ) {
        errors.push(
            "SECURITY_LOG_SALT parece contener un valor de ejemplo."
        );
    }

    if (!jwtIssuer()) {
        errors.push(
            "JWT_ISSUER no puede estar vacío."
        );
    }

    if (!jwtAudience()) {
        errors.push(
            "JWT_AUDIENCE no puede estar vacío."
        );
    }

    if (
        process.env.NODE_ENV === "production"
    ) {
        const origins = String(
            process.env.FRONTEND_URLS ||
            process.env.PUBLIC_FRONTEND_URL ||
            ""
        )
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean);

        if (!origins.length) {
            errors.push(
                "En producción debes configurar FRONTEND_URLS."
            );
        }

        const insecureOrigins = origins.filter(
            (origin) => !origin.startsWith("https://")
        );

        if (insecureOrigins.length) {
            warnings.push(
                "FRONTEND_URLS contiene orígenes sin HTTPS."
            );
        }
    }

    if (errors.length) {
        const error = new Error(
            `Configuración de seguridad inválida: ${errors.join(" ")}`
        );

        error.code =
            "SECURITY_CONFIG_INVALID";

        throw error;
    }

    warnings.forEach((message) => {
        console.warn(
            `⚠️ Seguridad: ${message}`
        );
    });
}

module.exports = {
    jwtIssuer,
    jwtAudience,
    jwtExpiresIn,
    trustProxyHops,
    validateSecurityConfig
};
