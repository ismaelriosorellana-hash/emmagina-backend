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
            alt: "Logo Rhema Diseños",
            width: 52,
            offsetX: 0,
            offsetY: 0
        },
        title: {
            mode: "text",
            url: "",
            publicId: "",
            text: "Rhema Diseños",
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
        backgroundColor: "#023047",
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
        primary: "#8ECAE6",
        primaryDark: "#219EBC",
        primaryDeep: "#023047",
        primarySoft: "#EAF4F8",
        secondary: "#125373",
        accent: "#FB8500",
        background: "#EAF4F8",
        surface: "#FFFFFF",
        surfaceSoft: "#EAF4F8",
        text: "#023047",
        textSoft: "#125373",
        border: "#BFDCE8",
        headerBackground: "#EAF4F8",
        footerBackground: "#023047",
        footerText: "#FFFFFF",
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
            { label: "Crea tu Figura", href: "pedido-personalizado.html", isVisible: true, sortOrder: 20, source: "system", opensNewTab: false },
            { label: "Sobre Nosotros", href: "quienes-somos.html", isVisible: true, sortOrder: 40, source: "system", opensNewTab: false },
            { label: "Preguntas Frecuentes", href: "preguntas-frecuentes.html", isVisible: true, sortOrder: 50, source: "system", opensNewTab: false },
            { label: "Contáctanos", href: "contacto.html", isVisible: true, sortOrder: 60, source: "system", opensNewTab: false }
        ]
    },
    footer: {
        enabled: true,
        brandTitle: "Rhema Diseños",
        brandText: "Productos impresos en 3D, regalos personalizados, decoración y soluciones prácticas hechas con cercanía.",
        columns: [
            { title: "Tienda", isVisible: true, sortOrder: 10, links: [
                { label: "Catálogo", href: "catalogo.html", isVisible: true },
                { label: "Crea tu Figura", href: "pedido-personalizado.html", isVisible: true },
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
        email: envText("STORE_SUPPORT_EMAIL", "contacto@rhemadisenos.cl"),
        supportButtonText: "Contactar soporte",
        copyright: "© 2026 Rhema Diseños. Todos los derechos reservados.",
        legalLinks: [
            { label: "Privacidad", href: "privacidad.html", isVisible: true },
            { label: "Términos", href: "terminos.html", isVisible: true }
        ]
    },
    revision: 1
});


const LEGACY_COLORS = new Set(["#FCC0E6", "#8E456A", "#71364F", "#FFF2FA", "#65445A", "#F59BCF", "#FFF9FD", "#F0D6E6", "#2F292C", "#F9F3F5", "#372A32", "#715F69"]);

function normalizePaletteColors(colors = {}, defaults = cloneDefaultSiteSettings().colors) {
    const result = { ...defaults, ...(colors || {}) };
    Object.keys(defaults).forEach((key) => {
        const value = String(result[key] || "").trim().toUpperCase();
        if (!value || LEGACY_COLORS.has(value)) result[key] = defaults[key];
    });
    return result;
}

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
        colors: normalizePaletteColors(value.colors || {}, defaults.colors),
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
