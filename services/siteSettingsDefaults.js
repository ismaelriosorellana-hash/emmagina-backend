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
            mode: "text",
            url: "",
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
    visualStyle: {
        pageMaxWidth: 1360,
        sectionSpacing: 28,
        cardRadius: 28,
        buttonRadius: 999,
        inputRadius: 18,
        shadowLevel: "soft",
        density: "comfortable"
    },
    navigation: {
        mode: "mixed",
        items: [
            { label: "Inicio", href: "index.html", isVisible: true, sortOrder: 1, source: "system", opensNewTab: false },
            { label: "Tienda", href: "catalogo.html", isVisible: true, sortOrder: 10, source: "system", opensNewTab: false },
            { label: "Crea tu Escena", href: "pedido-personalizado.html", isVisible: true, sortOrder: 20, source: "system", opensNewTab: false },
            { label: "Sobre Nosotros", href: "quienes-somos.html", isVisible: true, sortOrder: 90, source: "system", opensNewTab: false },
            { label: "Contáctanos", href: "contacto.html", isVisible: true, sortOrder: 100, source: "system", opensNewTab: false },
            { label: "Preguntas Frecuentes", href: "preguntas-frecuentes.html", isVisible: true, sortOrder: 110, source: "system", opensNewTab: false }
        ]
    },
    footer: {
        enabled: true,
        brandTitle: "Emmagina",
        brandText: "Productos impresos en 3D, figuras personalizadas y decoraciones pensadas para regalar, crear y recordar.",
        columns: [
            { title: "Tienda", isVisible: true, sortOrder: 10, links: [
                { label: "Catálogo", href: "catalogo.html", isVisible: true },
                { label: "Crea tu escena", href: "pedido-personalizado.html", isVisible: true },
                { label: "Carrito", href: "carrito.html", isVisible: true },
                { label: "Comparación", href: "comparacion.html", isVisible: true }
            ] },
            { title: "Ayuda", isVisible: true, sortOrder: 20, links: [
                { label: "Preguntas frecuentes", href: "preguntas-frecuentes.html", isVisible: true },
                { label: "Despachos y retiros", href: "despachos-retiros.html", isVisible: true },
                { label: "Cambios y pedidos", href: "cambios-pedidos.html", isVisible: true },
                { label: "Seguimiento", href: "seguimiento-pedido.html", isVisible: true }
            ] }
        ],
        contactTitle: "Soporte",
        whatsapp: envText("STORE_SUPPORT_WHATSAPP", "56900000000").replace(/[^0-9]/g, "") || "56900000000",
        email: envText("STORE_SUPPORT_EMAIL", "contacto@emmagina.cl"),
        supportButtonText: "Contactar soporte",
        copyright: "© 2026 Emmagina. Todos los derechos reservados.",
        legalLinks: [
            { label: "Privacidad", href: "privacidad.html", isVisible: true },
            { label: "Términos", href: "terminos.html", isVisible: true }
        ]
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
        visualStyle: { ...defaults.visualStyle, ...(value.visualStyle || {}) },
        navigation: {
            ...defaults.navigation,
            ...(value.navigation || {}),
            items: Array.isArray(value.navigation?.items) ? value.navigation.items : defaults.navigation.items
        },
        footer: {
            ...defaults.footer,
            ...(value.footer || {}),
            columns: Array.isArray(value.footer?.columns) ? value.footer.columns : defaults.footer.columns,
            legalLinks: Array.isArray(value.footer?.legalLinks) ? value.footer.legalLinks : defaults.footer.legalLinks
        },
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
