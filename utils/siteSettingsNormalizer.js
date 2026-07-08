"use strict";

const { cleanText, cleanPhone, validationError } = require("./validation");
const { cloneDefaultSiteSettings } = require("../services/siteSettingsDefaults");

const HEX = /^#[0-9A-F]{6}$/i;

function cleanNumber(value, { field, min, max, fallback }) {
    if (value === undefined || value === null || value === "") return fallback;
    const number = Number(value);
    if (!Number.isFinite(number) || number < min || number > max) {
        throw validationError(`${field} debe estar entre ${min} y ${max}.`);
    }
    return Math.round(number * 100) / 100;
}


function normalizePositionGroup(value = {}, fallback = {}, label = "El elemento") {
    const source = value && typeof value === "object" ? value : {};
    const safeFallback = fallback && typeof fallback === "object" ? fallback : {};

    return {
        offsetX: cleanNumber(source.offsetX, {
            field: `${label}: posición horizontal`,
            min: -300,
            max: 300,
            fallback: Number(safeFallback.offsetX) || 0
        }),
        offsetY: cleanNumber(source.offsetY, {
            field: `${label}: posición vertical`,
            min: -160,
            max: 160,
            fallback: Number(safeFallback.offsetY) || 0
        })
    };
}

function cleanHttpsUrl(value, fallback = "") {
    const url = cleanText(value ?? fallback, {
        field: "La URL de imagen",
        maxLength: 1000
    });
    if (!url) return "";
    if (!/^https:\/\//i.test(url)) {
        throw validationError("Las imágenes deben usar una dirección https:// válida.");
    }
    return url;
}

function cleanAnnouncementUrl(value) {
    const url = cleanText(value ?? "", { field: "El enlace de la cinta", maxLength: 1000 });
    if (!url) return "";
    if (/^(https:\/\/|\/|\.\/|\.\.\/|[a-z0-9_-]+\.html(?:[?#].*)?$)/i.test(url)) return url;
    throw validationError("Los enlaces de la cinta deben ser https:// o rutas internas válidas.");
}

function cleanGa4MeasurementId(value, fallback = "") {
    const id = cleanText(value ?? fallback, { field: "El ID de Google Analytics 4", maxLength: 32 }).toUpperCase();
    if (!id) return "";
    if (!/^G-[A-Z0-9]{4,24}$/.test(id)) {
        throw validationError("El ID de Google Analytics 4 debe tener formato G-XXXXXXXX.");
    }
    return id;
}

function cleanClarityProjectId(value, fallback = "") {
    const id = cleanText(value ?? fallback, { field: "El ID de Microsoft Clarity", maxLength: 64 });
    if (!id) return "";
    if (!/^[a-zA-Z0-9_-]{4,64}$/.test(id)) {
        throw validationError("El ID de Microsoft Clarity debe contener solo letras, números, guiones o guiones bajos.");
    }
    return id;
}

function cleanHex(value, field, fallback) {
    const color = cleanText(value ?? fallback, { field, maxLength: 7 }).toUpperCase();
    if (!HEX.test(color)) {
        throw validationError(`${field} debe usar formato hexadecimal, por ejemplo #FFFFFF.`);
    }
    return color;
}

function normalizeSiteSettings(input = {}, fallbackValue = cloneDefaultSiteSettings()) {
    const fallback = fallbackValue || cloneDefaultSiteSettings();
    const branding = input.branding && typeof input.branding === "object" ? input.branding : {};
    const logo = branding.logo && typeof branding.logo === "object" ? branding.logo : {};
    const title = branding.title && typeof branding.title === "object" ? branding.title : {};
    const headerLayout = input.headerLayout && typeof input.headerLayout === "object"
        ? input.headerLayout
        : {};
    const fallbackHeaderLayout = fallback.headerLayout && typeof fallback.headerLayout === "object"
        ? fallback.headerLayout
        : cloneDefaultSiteSettings().headerLayout;
    const colors = input.colors && typeof input.colors === "object" ? input.colors : {};
    const announcement = input.announcementBar && typeof input.announcementBar === "object" ? input.announcementBar : {};
    const storeStatus = input.storeStatus && typeof input.storeStatus === "object" ? input.storeStatus : {};
    const analytics = input.analytics && typeof input.analytics === "object" ? input.analytics : {};

    const mode = cleanText(title.mode ?? fallback.branding.title.mode, {
        field: "El tipo de título",
        maxLength: 10,
        required: true
    }).toLowerCase();
    if (!["image", "text"].includes(mode)) {
        throw validationError("El título debe mostrarse como imagen o texto.");
    }

    const normalizedColors = {};
    const labels = {
        primary: "El color principal",
        primaryDark: "El color principal oscuro",
        primaryDeep: "El color principal profundo",
        primarySoft: "El color principal suave",
        secondary: "El color secundario",
        accent: "El color de acento",
        background: "El fondo general",
        surface: "El fondo de tarjetas",
        surfaceSoft: "El fondo suave",
        text: "El color de texto",
        textSoft: "El color de texto secundario",
        border: "El color de bordes",
        headerBackground: "El fondo del encabezado",
        footerBackground: "El fondo del pie de página",
        footerText: "El texto del pie de página",
        buttonText: "El texto de botones"
    };

    for (const key of Object.keys(labels)) {
        normalizedColors[key] = cleanHex(colors[key], labels[key], fallback.colors[key]);
    }

    const sourceItems = Array.isArray(announcement.items)
        ? announcement.items
        : fallback.announcementBar.items;
    const announcementItems = sourceItems
        .slice(0, 12)
        .map((item, index) => ({
            text: cleanText(item?.text, {
                field: `El texto ${index + 1} de la cinta`,
                maxLength: 240,
                required: true
            }),
            url: cleanAnnouncementUrl(item?.url)
        }))
        .filter((item) => item.text);

    if (!announcementItems.length) {
        throw validationError("La cinta superior debe tener al menos un mensaje.");
    }

    return {
        key: "main",
        branding: {
            logo: {
                url: cleanHttpsUrl(logo.url, fallback.branding.logo.url),
                publicId: cleanText(logo.publicId ?? fallback.branding.logo.publicId, {
                    field: "El identificador del logo",
                    maxLength: 300
                }),
                alt: cleanText(logo.alt ?? fallback.branding.logo.alt, {
                    field: "El texto alternativo del logo",
                    maxLength: 160,
                    required: true
                }),
                width: cleanNumber(logo.width, { field: "El ancho del logo", min: 24, max: 240, fallback: fallback.branding.logo.width }),
                offsetX: cleanNumber(logo.offsetX, { field: "La posición horizontal del logo", min: -300, max: 300, fallback: fallback.branding.logo.offsetX }),
                offsetY: cleanNumber(logo.offsetY, { field: "La posición vertical del logo", min: -160, max: 160, fallback: fallback.branding.logo.offsetY })
            },
            title: {
                mode,
                url: cleanHttpsUrl(title.url, fallback.branding.title.url),
                publicId: cleanText(title.publicId ?? fallback.branding.title.publicId, {
                    field: "El identificador del título",
                    maxLength: 300
                }),
                text: cleanText(title.text ?? fallback.branding.title.text, {
                    field: "El título de la marca",
                    maxLength: 120,
                    required: true
                }),
                width: cleanNumber(title.width, { field: "El ancho del título", min: 60, max: 520, fallback: fallback.branding.title.width }),
                fontSize: cleanNumber(title.fontSize, { field: "El tamaño del título", min: 14, max: 92, fallback: fallback.branding.title.fontSize }),
                offsetX: cleanNumber(title.offsetX, { field: "La posición horizontal del título", min: -300, max: 300, fallback: fallback.branding.title.offsetX }),
                offsetY: cleanNumber(title.offsetY, { field: "La posición vertical del título", min: -160, max: 160, fallback: fallback.branding.title.offsetY }),
                gap: cleanNumber(title.gap, { field: "La separación entre logo y título", min: 0, max: 120, fallback: fallback.branding.title.gap })
            }
        },
        headerLayout: {
            social: normalizePositionGroup(headerLayout.social, fallbackHeaderLayout.social, "Los iconos de redes sociales"),
            brand: normalizePositionGroup(headerLayout.brand, fallbackHeaderLayout.brand, "Los logos"),
            support: normalizePositionGroup(headerLayout.support, fallbackHeaderLayout.support, "El soporte al cliente"),
            actions: normalizePositionGroup(headerLayout.actions, fallbackHeaderLayout.actions, "Los iconos de acciones")
        },
        colors: normalizedColors,
        announcementBar: {
            enabled: announcement.enabled === undefined
                ? fallback.announcementBar.enabled
                : Boolean(announcement.enabled),
            speedSeconds: cleanNumber(announcement.speedSeconds, {
                field: "La velocidad de la cinta",
                min: 6,
                max: 120,
                fallback: fallback.announcementBar.speedSeconds
            }),
            backgroundColor: cleanHex(
                announcement.backgroundColor,
                "El fondo de la cinta",
                fallback.announcementBar.backgroundColor
            ),
            textColor: cleanHex(
                announcement.textColor,
                "El texto de la cinta",
                fallback.announcementBar.textColor
            ),
            linkColor: cleanHex(
                announcement.linkColor,
                "Los enlaces de la cinta",
                fallback.announcementBar.linkColor
            ),
            items: announcementItems
        },
        storeStatus: {
            paused: storeStatus.paused === undefined
                ? Boolean(fallback.storeStatus?.paused)
                : Boolean(storeStatus.paused),
            message: cleanText(storeStatus.message ?? fallback.storeStatus?.message, {
                field: "El mensaje del modo pausa",
                maxLength: 500,
                required: true,
                allowNewlines: true
            }),
            whatsappNumber: cleanPhone(storeStatus.whatsappNumber ?? fallback.storeStatus?.whatsappNumber ?? "56954633848", {
                field: "El WhatsApp del modo pausa",
                required: true
            }).replace(/[^0-9]/g, ""),
            updatedAt: storeStatus.updatedAt || fallback.storeStatus?.updatedAt || null
        },
        analytics: {
            enabled: analytics.enabled === undefined
                ? Boolean(fallback.analytics?.enabled)
                : Boolean(analytics.enabled),
            ga4MeasurementId: cleanGa4MeasurementId(analytics.ga4MeasurementId, fallback.analytics?.ga4MeasurementId || ""),
            clarityProjectId: cleanClarityProjectId(analytics.clarityProjectId, fallback.analytics?.clarityProjectId || ""),
            anonymizeIp: analytics.anonymizeIp === undefined
                ? fallback.analytics?.anonymizeIp !== false
                : Boolean(analytics.anonymizeIp),
            trackEcommerce: analytics.trackEcommerce === undefined
                ? fallback.analytics?.trackEcommerce !== false
                : Boolean(analytics.trackEcommerce),
            updatedAt: analytics.updatedAt || fallback.analytics?.updatedAt || null
        }
    };
}

module.exports = { normalizeSiteSettings };
