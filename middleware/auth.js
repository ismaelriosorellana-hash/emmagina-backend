"use strict";

const jwt = require("jsonwebtoken");
const Usuario = require("../models/Usuario");

const {
    jwtIssuer,
    jwtAudience
} = require("../config/security");

const {
    securityEvent
} = require("../utils/securityLogger");

function getToken(req) {
    const header =
        String(
            req.headers.authorization ||
            ""
        );

    const [scheme, token] =
        header.split(" ");

    if (
        scheme !== "Bearer" ||
        !token ||
        token.length > 4096
    ) {
        return "";
    }

    return token;
}

async function resolveUser(token) {
    const secret =
        process.env.JWT_SECRET;

    if (!secret) {
        throw new Error(
            "Falta JWT_SECRET en el servidor."
        );
    }

    const payload =
        jwt.verify(
            token,
            secret,
            {
                algorithms: [
                    "HS256"
                ],
                issuer:
                    jwtIssuer(),
                audience:
                    jwtAudience()
            }
        );

    if (
        payload.typ !==
        "access"
    ) {
        const error =
            new Error(
                "Tipo de sesión inválido."
            );

        error.statusCode = 401;
        throw error;
    }

    const user =
        await Usuario.findById(
            payload.sub
        );

    if (
        !user ||
        !user.activo ||
        Number(
            payload.sv ?? -1
        ) !== Number(
            user.sessionVersion || 0
        )
    ) {
        const error =
            new Error(
                "La sesión ya no es válida."
            );

        error.statusCode = 401;
        throw error;
    }

    return user;
}

function authError(
    req,
    res
) {
    return res.status(401).json({
        error:
            "La sesión expiró o no es válida.",
        requestId:
            req.requestId
    });
}

async function requireAuth(
    req,
    res,
    next
) {
    try {
        const token =
            getToken(req);

        if (!token) {
            return res.status(401).json({
                error:
                    "Debes iniciar sesión.",
                requestId:
                    req.requestId
            });
        }

        req.user =
            await resolveUser(token);

        next();
    } catch (error) {
        if (
            error.name ===
                "JsonWebTokenError" ||
            error.name ===
                "TokenExpiredError" ||
            error.statusCode === 401
        ) {
            securityEvent(
                req,
                "auth_token_rejected",
                {
                    reason:
                        error.name ||
                        "invalid_session"
                }
            );

            return authError(
                req,
                res
            );
        }

        next(error);
    }
}

async function optionalAuth(
    req,
    res,
    next
) {
    try {
        const token =
            getToken(req);

        if (!token) {
            req.user = null;
            next();
            return;
        }

        req.user =
            await resolveUser(token);

        next();
    } catch (error) {
        if (
            error.name ===
                "JsonWebTokenError" ||
            error.name ===
                "TokenExpiredError" ||
            error.statusCode === 401
        ) {
            securityEvent(
                req,
                "optional_auth_token_rejected",
                {
                    reason:
                        error.name ||
                        "invalid_session"
                }
            );

            return authError(
                req,
                res
            );
        }

        next(error);
    }
}

function requireRole(
    ...allowedRoles
) {
    return (
        req,
        res,
        next
    ) => {
        if (
            !req.user ||
            !allowedRoles.includes(
                req.user.rol
            )
        ) {
            securityEvent(
                req,
                "authorization_rejected",
                {
                    requiredRoles:
                        allowedRoles.join(",")
                }
            );

            return res.status(403).json({
                error:
                    "No tienes permiso para realizar esta acción.",
                requestId:
                    req.requestId
            });
        }

        next();
    };
}

module.exports = {
    getToken,
    resolveUser,
    requireAuth,
    optionalAuth,
    requireRole
};
