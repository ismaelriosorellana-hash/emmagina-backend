"use strict";

const SENSITIVE_API_PREFIXES = [
    "/api/auth",
    "/api/cuenta",
    "/api/admin",
    "/api/pedidos",
    "/api/pagos",
    "/api/uploads"
];

const DEFAULT_CSP = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "form-action 'self'",
    "script-src 'self' https://www.googletagmanager.com https://www.clarity.ms https://*.clarity.ms",
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
    "font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com",
    "img-src 'self' data: blob: https: https://www.google-analytics.com https://www.googletagmanager.com https://*.clarity.ms",
    "connect-src 'self' https://emmagina-backend.onrender.com https://res.cloudinary.com https://*.cloudinary.com https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://www.clarity.ms https://*.clarity.ms",
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "upgrade-insecure-requests"
].join("; ");

function startsWithAny(pathname, prefixes) {
    return prefixes.some(
        (prefix) =>
            pathname === prefix ||
            pathname.startsWith(`${prefix}/`)
    );
}

function isHtmlRequest(req) {
    const accept = String(req.get("accept") || "").toLowerCase();
    return accept.includes("text/html") ||
        req.path === "/" ||
        req.path.endsWith(".html") ||
        req.path.startsWith("/producto/") ||
        req.path.startsWith("/p/");
}

function applySecurityHeaders(req, res, next) {
    res.setHeader(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=(), payment=()"
    );

    res.setHeader(
        "X-Permitted-Cross-Domain-Policies",
        "none"
    );

    res.setHeader(
        "Cross-Origin-Opener-Policy",
        "same-origin-allow-popups"
    );

    res.setHeader(
        "X-Content-Type-Options",
        "nosniff"
    );

    res.setHeader(
        "Referrer-Policy",
        "strict-origin-when-cross-origin"
    );

    if (isHtmlRequest(req)) {
        res.setHeader(
            "Content-Security-Policy",
            DEFAULT_CSP
        );
    }

    if (startsWithAny(req.path, SENSITIVE_API_PREFIXES)) {
        res.setHeader(
            "Cache-Control",
            "no-store, max-age=0, must-revalidate"
        );
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
    }

    next();
}

module.exports = {
    SENSITIVE_API_PREFIXES,
    DEFAULT_CSP,
    applySecurityHeaders,
    startsWithAny,
    isHtmlRequest
};
