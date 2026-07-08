"use strict";

const {
    validationError
} = require("../utils/validation");

const FORBIDDEN_KEYS =
    new Set([
        "__proto__",
        "prototype",
        "constructor"
    ]);

function inspectPayload(
    value,
    depth = 0
) {
    if (
        depth > 14
    ) {
        throw validationError(
            "La estructura enviada es demasiado profunda."
        );
    }

    if (
        value === null ||
        value === undefined
    ) {
        return;
    }

    if (Array.isArray(value)) {
        if (value.length > 500) {
            throw validationError(
                "La solicitud contiene demasiados elementos."
            );
        }

        value.forEach(
            (item) =>
                inspectPayload(
                    item,
                    depth + 1
                )
        );

        return;
    }

    if (
        typeof value !== "object"
    ) {
        return;
    }

    for (
        const [key, child]
        of Object.entries(value)
    ) {
        if (
            FORBIDDEN_KEYS.has(key) ||
            key.startsWith("$") ||
            key.includes(".")
        ) {
            throw validationError(
                "La solicitud contiene una clave no permitida."
            );
        }

        inspectPayload(
            child,
            depth + 1
        );
    }
}

function enforceExpectedContentType(
    req,
    res,
    next
) {
    const method =
        String(req.method || "")
            .toUpperCase();

    if (
        !["POST", "PUT", "PATCH"]
            .includes(method)
    ) {
        next();
        return;
    }

    const hasBody =
        Number(req.get("content-length") || 0) > 0 ||
        Boolean(
            req.get("transfer-encoding")
        );

    if (!hasBody) {
        next();
        return;
    }

    const type =
        String(
            req.get("content-type") ||
            ""
        ).toLowerCase();

    if (
        type.startsWith("application/json") ||
        type.startsWith("multipart/form-data")
    ) {
        next();
        return;
    }

    res.status(415).json({
        error:
            "El tipo de contenido enviado no es compatible.",
        requestId:
            req.requestId
    });
}

function inspectRequestBody(
    req,
    res,
    next
) {
    try {
        inspectPayload(req.body);
        next();
    } catch (error) {
        next(error);
    }
}

function inspectRequestQuery(
    req,
    res,
    next
) {
    try {
        inspectPayload(req.query);
        next();
    } catch (error) {
        next(error);
    }
}

module.exports = {
    inspectPayload,
    enforceExpectedContentType,
    inspectRequestBody,
    inspectRequestQuery
};
