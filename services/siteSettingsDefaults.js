"use strict";

function envFlag(name, fallback = false) {
    const value = String(process.env[name] || "").trim().toLowerCase();
    if (["1", "true", "yes", "si", "sí", "on"].includes(value)) return true;
    if (["0", "false", "no", "off"].includes(value)) return false;
    return fallback;
}

function envText(name, fallback) {
    return String(process.env[name] || fallback || "").trim();
}

const DEFAULT_SITE_SETTINGS = Object.freeze({
    key: "main",
    branding: {
        logo: {
            url: "",
            publicId: "",
            alt: "Logo Emmagina",
            width: 52,
            offsetX: 0,
            offsetY: 0
        },
        title: {
            mode: "image",
            url: "https://res.cloudinary.com/jo3bgrnh/image/upload/v1782320550/Mommy_Crafts_2_1_hbj8xi.png",
            publicId: "",
            text: "Emmagina",
            width: 220,
            fontSize: 32,
            offsetX: 0,
            offsetY: 0,
            gap: 10
        }
    },
    headerLayout: {
        social: { offsetX: 0, offsetY: 0 },
        brand: { offsetX: 0, offsetY: 0 },
        support: { offsetX: 0, offsetY: 0 },
        actions: { offsetX: 0, offsetY: 0 }
    },
    announcementBar: {
        enabled: true,
        speedSeconds: 22,
        backgroundColor: "#71364F",
        textColor: "#FFFFFF",
        linkColor: "#FFFFFF",
        items: [
            {
                text: "Envío gratis dentro de Santiago por compras desde $25.000",
                url: "despachos-retiros.html"
            },
            {
                text: "Productos personalizados para cada ocasión",
                url: "catalogo.html"
            }
        ]
    },
    storeStatus: {
        paused: envFlag("STORE_PAUSED", false),
        message: envText("STORE_PAUSE_MESSAGE", "Nuestra tienda online estará disponible próximamente. Si necesitas consultar por un producto, escríbenos por WhatsApp."),
        whatsappNumber: envText("STORE_PAUSE_WHATSAPP", "56954633848").replace(/[^0-9]/g, "") || "56954633848",
        updatedAt: null
    },
    analytics: {
        enabled: envFlag("ANALYTICS_ENABLED", false),
        ga4MeasurementId: envText("GA4_MEASUREMENT_ID", ""),
        clarityProjectId: envText("CLARITY_PROJECT_ID", ""),
        anonymizeIp: true,
        trackEcommerce: true,
        updatedAt: null
    },
    colors: {
        primary: "#FCC0E6",
        primaryDark: "#8E456A",
        primaryDeep: "#71364F",
        primarySoft: "#FFF2FA",
        secondary: "#65445A",
        accent: "#F59BCF",
        background: "#FFF9FD",
        surface: "#FFFFFF",
        surfaceSoft: "#FFF2FA",
        text: "#372A32",
        textSoft: "#715F69",
        border: "#F0D6E6",
        headerBackground: "#FFF9FD",
        footerBackground: "#2F292C",
        footerText: "#F9F3F5",
        buttonText: "#FFFFFF"
    },
    revision: 1
});

function cloneDefaultSiteSettings() {
    return JSON.parse(JSON.stringify(DEFAULT_SITE_SETTINGS));
}

function mergeSiteSettings(value = {}) {
    const defaults = cloneDefaultSiteSettings();
    return {
        ...defaults,
        ...value,
        branding: {
            ...defaults.branding,
            ...(value.branding || {}),
            logo: { ...defaults.branding.logo, ...(value.branding?.logo || {}) },
            title: { ...defaults.branding.title, ...(value.branding?.title || {}) }
        },
        headerLayout: {
            ...defaults.headerLayout,
            ...(value.headerLayout || {}),
            social: { ...defaults.headerLayout.social, ...(value.headerLayout?.social || {}) },
            brand: { ...defaults.headerLayout.brand, ...(value.headerLayout?.brand || {}) },
            support: { ...defaults.headerLayout.support, ...(value.headerLayout?.support || {}) },
            actions: { ...defaults.headerLayout.actions, ...(value.headerLayout?.actions || {}) }
        },
        colors: { ...defaults.colors, ...(value.colors || {}) },
        announcementBar: {
            ...defaults.announcementBar,
            ...(value.announcementBar || {}),
            items: Array.isArray(value.announcementBar?.items) && value.announcementBar.items.length
                ? value.announcementBar.items
                : defaults.announcementBar.items
        },
        storeStatus: {
            ...defaults.storeStatus,
            ...(value.storeStatus || {})
        },
        analytics: {
            ...defaults.analytics,
            ...(value.analytics || {})
        }
    };
}

module.exports = {
    DEFAULT_SITE_SETTINGS,
    cloneDefaultSiteSettings,
    mergeSiteSettings
};
