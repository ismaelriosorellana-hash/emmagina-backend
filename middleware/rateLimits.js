"use strict";

const rateLimit =
    require("express-rate-limit");

const {
    securityEvent
} = require(
    "../utils/securityLogger"
);

function limiter({
    windowMs,
    limit,
    event,
    message,
    skip
}) {
    return rateLimit({
        windowMs,
        limit,
        standardHeaders:
            "draft-7",
        legacyHeaders: false,
        skip,
        handler(req, res) {
            securityEvent(
                req,
                "rate_limit_reached",
                {
                    bucket: event
                }
            );

            res.status(429).json({
                error: message,
                requestId:
                    req.requestId
            });
        }
    });
}

const generalApiLimiter =
    limiter({
        windowMs:
            15 * 60 * 1000,
        limit: 300,
        event: "api_general",
        message:
            "Se alcanzó temporalmente el límite de solicitudes. Intenta nuevamente en unos minutos.",
        skip(req) {
            return req.path ===
                "/health";
        }
    });

const loginLimiter =
    limiter({
        windowMs:
            15 * 60 * 1000,
        limit: 10,
        event: "login",
        message:
            "Demasiados intentos. Espera unos minutos antes de volver a intentar."
    });

const registerLimiter =
    limiter({
        windowMs:
            60 * 60 * 1000,
        limit: 5,
        event: "register",
        message:
            "Se alcanzó temporalmente el límite de creación de cuentas."
    });

const orderLimiter =
    limiter({
        windowMs:
            60 * 60 * 1000,
        limit: 20,
        event: "orders",
        message:
            "Se alcanzó temporalmente el límite de pedidos. Intenta nuevamente más tarde."
    });

const uploadLimiter =
    limiter({
        windowMs:
            15 * 60 * 1000,
        limit: 20,
        event: "uploads",
        message:
            "Se alcanzó temporalmente el límite de cargas. Intenta nuevamente en unos minutos."
    });

const paymentLimiter =
    limiter({
        windowMs:
            60 * 1000,
        limit: 30,
        event: "payments",
        message:
            "Demasiadas solicitudes de pago. Espera un momento."
    });

const passwordLimiter =
    limiter({
        windowMs:
            60 * 60 * 1000,
        limit: 5,
        event: "password_change",
        message:
            "Se alcanzó temporalmente el límite de cambios de contraseña."
    });


const adminLimiter =
    limiter({
        windowMs:
            15 * 60 * 1000,
        limit: 180,
        event: "admin",
        message:
            "Se alcanzó temporalmente el límite de acciones administrativas."
    });

const accountWriteLimiter =
    limiter({
        windowMs:
            60 * 60 * 1000,
        limit: 30,
        event: "account_write",
        message:
            "Se alcanzó temporalmente el límite de cambios de cuenta."
    });

module.exports = {
    generalApiLimiter,
    adminLimiter,
    loginLimiter,
    registerLimiter,
    orderLimiter,
    uploadLimiter,
    paymentLimiter,
    passwordLimiter,
    accountWriteLimiter
};
