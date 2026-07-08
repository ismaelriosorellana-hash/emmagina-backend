"use strict";

function normalizeOrigin(
    value
) {
    const raw = String(
        value || ""
    )
        .trim()
        .replace(/\/+$/, "");

    if (!raw) return "";

    try {
        const url = new URL(raw);

        if (
            url.pathname !== "/" ||
            url.search ||
            url.hash ||
            url.username ||
            url.password
        ) {
            return "";
        }

        return url.origin;
    } catch {
        return "";
    }
}

function getAllowedOrigins() {
    const configured = [
        process.env.FRONTEND_URLS,
        process.env.PUBLIC_FRONTEND_URL
    ]
        .filter(Boolean)
        .flatMap(
            (value) =>
                String(value)
                    .split(",")
        )
        .map(normalizeOrigin)
        .filter(Boolean);

    const unique =
        [...new Set(configured)];

    if (
        process.env.NODE_ENV !==
        "production"
    ) {
        [
            "http://127.0.0.1:5500",
            "http://localhost:5500",
            "http://127.0.0.1:3000",
            "http://localhost:3000"
        ].forEach(
            (origin) => {
                if (
                    !unique.includes(
                        origin
                    )
                ) {
                    unique.push(
                        origin
                    );
                }
            }
        );
    }

    return unique;
}

function createCorsOptions() {
    const allowedOrigins =
        getAllowedOrigins();

    return {
        origin(
            origin,
            callback
        ) {
            if (!origin) {
                callback(
                    null,
                    true
                );

                return;
            }

            const normalized =
                normalizeOrigin(
                    origin
                );

            if (
                allowedOrigins.includes(
                    normalized
                )
            ) {
                callback(
                    null,
                    true
                );

                return;
            }

            const error =
                new Error(
                    "Origen no autorizado."
                );

            error.statusCode =
                403;

            callback(error);
        },
        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS"
        ],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "X-Request-ID"
        ],
        exposedHeaders: [
            "X-Request-ID",
            "RateLimit",
            "RateLimit-Policy"
        ],
        credentials: false,
        preflightContinue: false,
        maxAge: 600,
        optionsSuccessStatus:
            204
    };
}

module.exports = {
    createCorsOptions,
    getAllowedOrigins,
    normalizeOrigin
};
