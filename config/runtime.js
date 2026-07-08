"use strict";

const PLACEHOLDER_PATTERN =
    /reemplaza|cambia_esta|example|ejemplo|tu[_-]|your[_-]|usuario:contrasena|localhost|127\.0\.0\.1/i;

function text(value) {
    return String(value || "").trim();
}

function splitList(value) {
    return text(value)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

function isPlaceholder(value) {
    return PLACEHOLDER_PATTERN.test(text(value));
}

function parseUrl(value, label, errors) {
    const raw = text(value);

    if (!raw) {
        errors.push(`Falta ${label}.`);
        return null;
    }

    let url;

    try {
        url = new URL(raw);
    } catch {
        errors.push(`${label} no contiene una URL válida.`);
        return null;
    }

    if (url.username || url.password) {
        errors.push(`${label} no debe incluir credenciales en la URL.`);
    }

    return url;
}

function validatePublicOrigin(value, label, errors) {
    const url = parseUrl(value, label, errors);

    if (!url) return null;

    if (url.protocol !== "https:") {
        errors.push(`${label} debe usar HTTPS en producción.`);
    }

    if (
        url.pathname !== "/" ||
        url.search ||
        url.hash
    ) {
        errors.push(`${label} debe contener solo el origen, sin ruta, consulta ni fragmento.`);
    }

    if (isPlaceholder(url.hostname)) {
        errors.push(`${label} no puede apuntar a localhost ni contener valores de ejemplo.`);
    }

    return url.origin;
}

function validateMongoUri(errors) {
    const uri = text(process.env.MONGODB_URI);

    if (!uri) {
        errors.push("Falta MONGODB_URI.");
        return;
    }

    if (!/^mongodb(?:\+srv)?:\/\//i.test(uri)) {
        errors.push("MONGODB_URI debe comenzar con mongodb:// o mongodb+srv://.");
    }

    if (isPlaceholder(uri)) {
        errors.push("MONGODB_URI contiene un valor local o de ejemplo.");
    }
}

function validateCloudinary(errors, warnings) {
    const values = [
        process.env.CLOUDINARY_CLOUD_NAME,
        process.env.CLOUDINARY_API_KEY,
        process.env.CLOUDINARY_API_SECRET
    ].map(text);

    const configured = values.filter(Boolean).length;

    if (configured > 0 && configured < values.length) {
        errors.push("La configuración de Cloudinary está incompleta.");
        return;
    }

    if (configured === 0) {
        warnings.push("Cloudinary no está configurado; las cargas de imágenes no estarán disponibles.");
        return;
    }

    if (values.some(isPlaceholder)) {
        errors.push("Cloudinary contiene valores de ejemplo.");
    }
}

function validateMercadoPago(errors, warnings) {
    const environment = text(process.env.MP_ENVIRONMENT || "test").toLowerCase();
    const accessToken = text(process.env.MP_ACCESS_TOKEN);
    const webhookSecret = text(process.env.MP_WEBHOOK_SECRET);

    if (!["test", "production"].includes(environment)) {
        errors.push("MP_ENVIRONMENT debe ser test o production.");
    }

    if (!accessToken && !webhookSecret) {
        warnings.push("Mercado Pago no está configurado.");
        return;
    }

    if (!accessToken || !webhookSecret) {
        errors.push("Mercado Pago requiere MP_ACCESS_TOKEN y MP_WEBHOOK_SECRET.");
        return;
    }

    if (isPlaceholder(accessToken) || isPlaceholder(webhookSecret)) {
        errors.push("Mercado Pago contiene valores de ejemplo.");
    }

    if (environment === "production" && /^TEST-/i.test(accessToken)) {
        errors.push("MP_ENVIRONMENT=production no puede usar un Access Token de prueba.");
    }
}

function validateProductionConfig() {
    if (process.env.NODE_ENV !== "production") {
        return {
            environment: process.env.NODE_ENV || "development",
            origins: [],
            warnings: []
        };
    }

    const errors = [];
    const warnings = [];

    validateMongoUri(errors);

    const frontendOrigins = splitList(
        process.env.FRONTEND_URLS ||
        process.env.PUBLIC_FRONTEND_URL
    );

    if (!frontendOrigins.length) {
        errors.push("Falta FRONTEND_URLS en producción.");
    }

    const normalizedOrigins = frontendOrigins
        .map((origin, index) =>
            validatePublicOrigin(
                origin,
                `FRONTEND_URLS[${index}]`,
                errors
            )
        )
        .filter(Boolean);

    if (normalizedOrigins.length !== new Set(normalizedOrigins).size) {
        warnings.push("FRONTEND_URLS contiene orígenes repetidos.");
    }

    const publicFrontend = validatePublicOrigin(
        process.env.PUBLIC_FRONTEND_URL,
        "PUBLIC_FRONTEND_URL",
        errors
    );

    validatePublicOrigin(
        process.env.PUBLIC_BACKEND_URL,
        "PUBLIC_BACKEND_URL",
        errors
    );

    if (
        publicFrontend &&
        normalizedOrigins.length &&
        !normalizedOrigins.includes(publicFrontend)
    ) {
        errors.push("PUBLIC_FRONTEND_URL también debe estar incluido en FRONTEND_URLS.");
    }

    const trustProxy = Number(process.env.TRUST_PROXY_HOPS);

    if (!Number.isInteger(trustProxy) || trustProxy < 1 || trustProxy > 10) {
        errors.push("TRUST_PROXY_HOPS debe ser un entero entre 1 y 10 en producción.");
    }

    validateCloudinary(errors, warnings);
    validateMercadoPago(errors, warnings);

    if (errors.length) {
        const error = new Error(
            `Configuración de producción inválida: ${errors.join(" ")}`
        );

        error.code = "PRODUCTION_CONFIG_INVALID";
        error.details = errors;
        throw error;
    }

    return {
        environment: "production",
        origins: [...new Set(normalizedOrigins)],
        warnings
    };
}

module.exports = {
    isPlaceholder,
    splitList,
    validatePublicOrigin,
    validateProductionConfig
};
