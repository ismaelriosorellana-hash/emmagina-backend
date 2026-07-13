"use strict";

const {
    applicationError
} = require(
    "../utils/securityLogger"
);

function notFound(
    req,
    res
) {
    res.status(404).json({
        error:
            "La ruta solicitada no existe.",
        requestId:
            req.requestId
    });
}

function errorHandler(
    error,
    req,
    res,
    next
) {
    applicationError(
        req,
        error
    );

    if (
        error.name ===
        "ValidationError"
    ) {
        const firstIssue = Object.values(error.errors || {})[0];
        return res.status(400).json({
            error: firstIssue?.message || "Los datos enviados no son válidos.",
            requestId: req.requestId
        });
    }

    if (
        error.name ===
        "CastError"
    ) {
        return res.status(400).json({
            error:
                "El identificador enviado no es válido.",
            requestId:
                req.requestId
        });
    }

    if (
        error.name ===
        "SyntaxError" &&
        error.status === 400 &&
        "body" in error
    ) {
        return res.status(400).json({
            error:
                "El contenido JSON enviado no es válido.",
            requestId:
                req.requestId
        });
    }

    if (
        error.name ===
        "MulterError"
    ) {
        const messages = {
            LIMIT_FILE_SIZE:
                "La imagen supera el máximo permitido de 8 MB.",
            LIMIT_FILE_COUNT:
                "Solo se permiten dos imágenes por personalización.",
            LIMIT_UNEXPECTED_FILE:
                "El campo de imagen enviado no es válido."
        };

        return res.status(400).json({
            error:
                messages[
                    error.code
                ] ||
                "No fue posible procesar la imagen enviada.",
            requestId:
                req.requestId
        });
    }

    if (
        error.code === 11000
    ) {
        return res.status(409).json({
            error:
                "Ya existe un registro con esos datos.",
            requestId:
                req.requestId
        });
    }

    if (
        error.message ===
        "Origen no autorizado."
    ) {
        return res.status(403).json({
            error:
                "Origen no autorizado.",
            requestId:
                req.requestId
        });
    }

    const status =
        Number(
            error.statusCode
        ) || 500;

    const safeStatus =
        status >= 400 &&
        status < 600
            ? status
            : 500;

    res.status(
        safeStatus
    ).json({
        error:
            safeStatus === 500 ||
            error.expose === false
                ? "Ocurrió un error interno en el servidor."
                : error.message,
        requestId:
            req.requestId
    });
}

module.exports = {
    notFound,
    errorHandler
};
