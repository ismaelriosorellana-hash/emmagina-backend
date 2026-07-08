"use strict";

const crypto = require("crypto");

function safeText(value, maxLength = 180) {
    return String(value ?? "")
        .replace(/[\r\n\t]+/g, " ")
        .replace(/[\u0000-\u001F\u007F]/g, " ")
        .trim()
        .slice(0, maxLength);
}

function hashValue(value) {
    const salt = String(
        process.env.SECURITY_LOG_SALT ||
        process.env.JWT_SECRET ||
        "emmagina"
    );

    return crypto
        .createHash("sha256")
        .update(`${salt}:${String(value || "")}`)
        .digest("hex")
        .slice(0, 16);
}

function securityEvent(
    req,
    event,
    details = {}
) {
    const payload = {
        type: "security_event",
        event: safeText(event, 80),
        timestamp:
            new Date().toISOString(),
        requestId:
            safeText(req?.requestId, 80),
        method:
            safeText(req?.method, 12),
        path:
            safeText(
                req?.originalUrl
                    ?.split("?")[0],
                180
            ),
        ipHash:
            hashValue(
                req?.ip ||
                req?.socket?.remoteAddress
            ),
        userId:
            req?.user?._id
                ? String(req.user._id)
                : undefined,
        role:
            safeText(
                req?.user?.rol,
                30
            ) || undefined,
        userAgent:
            safeText(
                req?.get?.("user-agent"),
                180
            ) || undefined,
        ...Object.fromEntries(
            Object.entries(details)
                .map(([key, value]) => [
                    safeText(key, 60),
                    typeof value === "number" ||
                    typeof value === "boolean"
                        ? value
                        : safeText(value, 180)
                ])
        )
    };

    console.info(
        JSON.stringify(payload)
    );
}

function applicationError(req, error) {
    const payload = {
        type: "application_error",
        timestamp:
            new Date().toISOString(),
        requestId:
            safeText(req?.requestId, 80),
        method:
            safeText(req?.method, 12),
        path:
            safeText(
                req?.originalUrl
                    ?.split("?")[0],
                180
            ),
        name:
            safeText(error?.name, 80),
        message:
            process.env.NODE_ENV === "production"
                ? "Internal error"
                : safeText(
                    error?.message,
                    300
                )
    };

    if (
        process.env.NODE_ENV !==
        "production"
    ) {
        payload.stack =
            safeText(
                error?.stack,
                1200
            );
    }

    console.error(
        JSON.stringify(payload)
    );
}

module.exports = {
    safeText,
    hashValue,
    securityEvent,
    applicationError
};
