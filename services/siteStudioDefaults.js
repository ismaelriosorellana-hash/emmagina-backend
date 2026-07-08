"use strict";

const CORE_PAGES = [
    {
        id: "home",
        type: "core",
        label: "Inicio",
        path: "index.html",
        enabled: true,
        seoTitle: "Mommy Crafts | Productos personalizados",
        seoDescription: "Productos personalizados, sublimados y estampados de Mommy Crafts.",
        layout: { maxWidth: 1320, contentPadding: 20, sectionGap: 54, backgroundColor: "#FFF9FD" },
        sections: [
            { id: "hero", type: "core", zone: "main", enabled: true, order: 10, eyebrow: "Regalos creados con intención", title: "Productos auténticos y únicos para quienes más quieres", body: "", buttonLabel: "Ver productos", buttonUrl: "#lo-mas-vendido", alignment: "left", backgroundColor: "", textColor: "", paddingY: 0, borderRadius: 0 },
            { id: "categories", type: "core", zone: "main", enabled: true, order: 20, eyebrow: "Explora", title: "Categorías", body: "", buttonLabel: "", buttonUrl: "", alignment: "left", backgroundColor: "", textColor: "", paddingY: 0, borderRadius: 0 },
            { id: "trending", type: "core", zone: "main", enabled: true, order: 30, eyebrow: "Los favoritos", title: "Tendencias", body: "", buttonLabel: "Ver todo", buttonUrl: "catalogo.html?filtro=destacados", alignment: "left", backgroundColor: "", textColor: "", paddingY: 0, borderRadius: 0 },
            { id: "best-sellers", type: "core", zone: "main", enabled: true, order: 40, eyebrow: "Los preferidos", title: "Lo más vendido", body: "", buttonLabel: "Ver todo", buttonUrl: "catalogo.html?orden=mas-vendidos", alignment: "left", backgroundColor: "", textColor: "", paddingY: 0, borderRadius: 0 },
            { id: "new", type: "core", zone: "main", enabled: true, order: 50, eyebrow: "Recién llegados", title: "Lo más nuevo", body: "", buttonLabel: "Ver todo", buttonUrl: "catalogo.html?filtro=nuevos", alignment: "left", backgroundColor: "", textColor: "", paddingY: 0, borderRadius: 0 },
            { id: "benefits", type: "core", zone: "main", enabled: true, order: 60, eyebrow: "", title: "Compra con confianza", body: "", buttonLabel: "", buttonUrl: "", alignment: "left", backgroundColor: "", textColor: "", paddingY: 0, borderRadius: 0 }
        ]
    },
    {
        id: "catalog",
        type: "core",
        label: "Catálogo",
        path: "catalogo.html",
        enabled: true,
        seoTitle: "Catálogo | Mommy Crafts",
        seoDescription: "Explora todos los productos disponibles en Mommy Crafts.",
        layout: { maxWidth: 1320, contentPadding: 20, sectionGap: 34, backgroundColor: "#FFF9FD" },
        sections: [
            { id: "heading", type: "core", zone: "main", enabled: true, order: 10, eyebrow: "Catálogo", title: "Todos los productos", body: "", buttonLabel: "", buttonUrl: "", alignment: "left", backgroundColor: "", textColor: "", paddingY: 0, borderRadius: 0 },
            { id: "toolbar", type: "core", zone: "main", enabled: true, order: 20, eyebrow: "", title: "", body: "", buttonLabel: "", buttonUrl: "", alignment: "left", backgroundColor: "", textColor: "", paddingY: 0, borderRadius: 0 },
            { id: "products", type: "core", zone: "main", enabled: true, order: 30, eyebrow: "", title: "Productos", body: "", buttonLabel: "", buttonUrl: "", alignment: "left", backgroundColor: "", textColor: "", paddingY: 0, borderRadius: 0 }
        ]
    },
    {
        id: "product",
        type: "core",
        label: "Detalle de producto",
        path: "producto.html",
        enabled: true,
        seoTitle: "Producto | Mommy Crafts",
        seoDescription: "Detalle, opciones y personalización del producto.",
        layout: { maxWidth: 1320, contentPadding: 20, sectionGap: 42, backgroundColor: "#FFF9FD" },
        sections: [
            { id: "detail", type: "core", zone: "main", enabled: true, order: 10, eyebrow: "", title: "", body: "", buttonLabel: "", buttonUrl: "", alignment: "left", backgroundColor: "", textColor: "", paddingY: 0, borderRadius: 0 },
            { id: "related", type: "core", zone: "main", enabled: true, order: 20, eyebrow: "", title: "También te puede gustar", body: "", buttonLabel: "", buttonUrl: "", alignment: "left", backgroundColor: "", textColor: "", paddingY: 0, borderRadius: 0 }
        ]
    },
    {
        id: "cart",
        type: "core",
        label: "Carrito",
        path: "carrito.html",
        enabled: true,
        seoTitle: "Carrito de compras | Mommy Crafts",
        seoDescription: "Revisa productos, cantidades, sugerencias y meta de envío gratis.",
        layout: { maxWidth: 1220, contentPadding: 20, sectionGap: 32, backgroundColor: "#FFF9FD" },
        sections: [
            { id: "heading", type: "core", zone: "main", enabled: true, order: 10, eyebrow: "Tu compra", title: "Carrito de compras", body: "", buttonLabel: "Seguir comprando", buttonUrl: "catalogo.html", alignment: "left", backgroundColor: "", textColor: "", paddingY: 0, borderRadius: 0 },
            { id: "shipping-progress", type: "core", zone: "main", enabled: true, order: 20, eyebrow: "", title: "Meta de envío gratis", body: "", buttonLabel: "", buttonUrl: "", alignment: "left", backgroundColor: "", textColor: "", paddingY: 0, borderRadius: 0 },
            { id: "products", type: "core", zone: "main", enabled: true, order: 30, eyebrow: "", title: "Tus productos", body: "", buttonLabel: "", buttonUrl: "", alignment: "left", backgroundColor: "", textColor: "", paddingY: 0, borderRadius: 0 },
            { id: "summary", type: "core", zone: "main", enabled: true, order: 40, eyebrow: "", title: "Resumen", body: "", buttonLabel: "Finalizar compra", buttonUrl: "finalizar-compra.html", alignment: "left", backgroundColor: "", textColor: "", paddingY: 0, borderRadius: 0 },
            { id: "suggestions", type: "core", zone: "main", enabled: true, order: 50, eyebrow: "También te puede gustar", title: "Productos sugeridos", body: "", buttonLabel: "Ver catálogo", buttonUrl: "catalogo.html", alignment: "left", backgroundColor: "", textColor: "", paddingY: 0, borderRadius: 0 }
        ]
    },
    {
        id: "checkout",
        type: "core",
        label: "Finalizar compra",
        path: "finalizar-compra.html",
        enabled: true,
        seoTitle: "Finalizar compra | Mommy Crafts",
        seoDescription: "Completa tus datos, entrega y medio de pago.",
        layout: { maxWidth: 1260, contentPadding: 20, sectionGap: 24, backgroundColor: "#FFF9FD" },
        sections: [
            { id: "heading", type: "core", zone: "main", enabled: true, order: 10, eyebrow: "Último paso", title: "Finalizar compra", body: "Completa tus datos, selecciona la entrega y revisa el total antes de confirmar.", buttonLabel: "", buttonUrl: "", alignment: "left", backgroundColor: "", textColor: "", paddingY: 0, borderRadius: 0 },
            { id: "customer", type: "core", zone: "left", enabled: true, order: 20, eyebrow: "", title: "Datos de la persona", body: "Usaremos esta información para identificar y comunicar el estado del pedido.", buttonLabel: "", buttonUrl: "", alignment: "left", backgroundColor: "", textColor: "", paddingY: 0, borderRadius: 0 },
            { id: "delivery", type: "core", zone: "left", enabled: true, order: 30, eyebrow: "", title: "Envío o retiro", body: "Selecciona la opción que corresponda a este pedido.", buttonLabel: "", buttonUrl: "", alignment: "left", backgroundColor: "", textColor: "", paddingY: 0, borderRadius: 0 },
            { id: "payment", type: "core", zone: "left", enabled: true, order: 40, eyebrow: "", title: "Medio de pago", body: "Todas las transacciones se procesan mediante canales seguros.", buttonLabel: "", buttonUrl: "", alignment: "left", backgroundColor: "", textColor: "", paddingY: 0, borderRadius: 0 },
            { id: "notes", type: "core", zone: "left", enabled: true, order: 50, eyebrow: "", title: "Notas adicionales", body: "Incluye cualquier información que debamos considerar.", buttonLabel: "", buttonUrl: "", alignment: "left", backgroundColor: "", textColor: "", paddingY: 0, borderRadius: 0 },
            { id: "summary", type: "core", zone: "right", enabled: true, order: 10, eyebrow: "", title: "Resumen del pedido", body: "", buttonLabel: "", buttonUrl: "", alignment: "left", backgroundColor: "", textColor: "", paddingY: 0, borderRadius: 0 }
        ]
    },
    {
        id: "access",
        type: "core",
        label: "Acceso clientes",
        path: "acceso.html",
        enabled: true,
        seoTitle: "Acceso | Mommy Crafts",
        seoDescription: "Inicia sesión o crea tu cuenta de cliente.",
        layout: { maxWidth: 980, contentPadding: 20, sectionGap: 28, backgroundColor: "#FFF9FD" },
        sections: [
            { id: "auth", type: "core", zone: "main", enabled: true, order: 10, eyebrow: "Bienvenido", title: "Accede a tu cuenta", body: "", buttonLabel: "", buttonUrl: "", alignment: "left", backgroundColor: "", textColor: "", paddingY: 0, borderRadius: 0 },
            { id: "security", type: "core", zone: "main", enabled: true, order: 20, eyebrow: "", title: "Compra segura", body: "", buttonLabel: "", buttonUrl: "", alignment: "left", backgroundColor: "", textColor: "", paddingY: 0, borderRadius: 0 }
        ]
    },
    {
        id: "account",
        type: "core",
        label: "Mi cuenta",
        path: "cuenta.html",
        enabled: true,
        seoTitle: "Mi cuenta | Mommy Crafts",
        seoDescription: "Gestiona tu perfil y revisa tus pedidos.",
        layout: { maxWidth: 1180, contentPadding: 20, sectionGap: 28, backgroundColor: "#FFF9FD" },
        sections: [
            { id: "hero", type: "core", zone: "main", enabled: true, order: 10, eyebrow: "Tu espacio personal", title: "Mi cuenta", body: "", buttonLabel: "", buttonUrl: "", alignment: "left", backgroundColor: "", textColor: "", paddingY: 0, borderRadius: 0 },
            { id: "profile", type: "core", zone: "main", enabled: true, order: 20, eyebrow: "", title: "Datos personales", body: "", buttonLabel: "", buttonUrl: "", alignment: "left", backgroundColor: "", textColor: "", paddingY: 0, borderRadius: 0 },
            { id: "security", type: "core", zone: "main", enabled: true, order: 30, eyebrow: "Protección de la cuenta", title: "Seguridad", body: "", buttonLabel: "", buttonUrl: "", alignment: "left", backgroundColor: "", textColor: "", paddingY: 0, borderRadius: 0 },
            { id: "orders", type: "core", zone: "main", enabled: true, order: 40, eyebrow: "Historial", title: "Pedidos", body: "", buttonLabel: "", buttonUrl: "", alignment: "left", backgroundColor: "", textColor: "", paddingY: 0, borderRadius: 0 }
        ]
    },
    {
        id: "order",
        type: "core",
        label: "Detalle de pedido",
        path: "pedido.html",
        enabled: true,
        seoTitle: "Pedido | Mommy Crafts",
        seoDescription: "Consulta el detalle y seguimiento de tu pedido.",
        layout: { maxWidth: 1080, contentPadding: 20, sectionGap: 28, backgroundColor: "#FFF9FD" },
        sections: [
            { id: "hero", type: "core", zone: "main", enabled: true, order: 10, eyebrow: "Seguimiento", title: "Pedido", body: "", buttonLabel: "", buttonUrl: "", alignment: "left", backgroundColor: "", textColor: "", paddingY: 0, borderRadius: 0 },
            { id: "detail", type: "core", zone: "main", enabled: true, order: 20, eyebrow: "", title: "Detalle", body: "", buttonLabel: "", buttonUrl: "", alignment: "left", backgroundColor: "", textColor: "", paddingY: 0, borderRadius: 0 }
        ]
    },
    {
        id: "payment-result",
        type: "core",
        label: "Resultado de pago",
        path: "pago.html",
        enabled: true,
        seoTitle: "Resultado de pago | Mommy Crafts",
        seoDescription: "Revisa el resultado y estado de tu pago.",
        layout: { maxWidth: 900, contentPadding: 20, sectionGap: 28, backgroundColor: "#FFF9FD" },
        sections: [
            { id: "result", type: "core", zone: "main", enabled: true, order: 10, eyebrow: "Pago", title: "Resultado del pago", body: "", buttonLabel: "", buttonUrl: "", alignment: "center", backgroundColor: "", textColor: "", paddingY: 0, borderRadius: 0 }
        ]
    }
];

const CONTENT_PAGE_DEFINITIONS = [
    ["about", "Quiénes somos", "quienes-somos.html"],
    ["contact", "Contacto", "contacto.html"],
    ["shipping", "Despachos y retiros", "despachos-retiros.html"],
    ["faq", "Preguntas frecuentes", "preguntas-frecuentes.html"],
    ["changes", "Cambios y pedidos", "cambios-pedidos.html"],
    ["privacy", "Privacidad", "privacidad.html"],
    ["terms", "Términos", "terminos.html"],
    ["security-page", "Seguridad", "seguridad.html"]
];

for (const [id, label, path] of CONTENT_PAGE_DEFINITIONS) {
    CORE_PAGES.push({
        id,
        type: "core",
        label,
        path,
        enabled: true,
        seoTitle: `${label} | Mommy Crafts`,
        seoDescription: `${label} de Mommy Crafts.`,
        layout: { maxWidth: 1040, contentPadding: 20, sectionGap: 28, backgroundColor: "#FFF9FD" },
        sections: [
            { id: "content", type: "core", zone: "main", enabled: true, order: 10, eyebrow: "", title: label, body: "", buttonLabel: "", buttonUrl: "", alignment: "left", backgroundColor: "", textColor: "", paddingY: 0, borderRadius: 0 }
        ]
    });
}

const DEFAULT_SITE_STUDIO = Object.freeze({
    key: "main",
    navigation: {
        items: [
            { id: "inicio", label: "Inicio", url: "index.html", kind: "link", enabled: true, openNewTab: false, order: 10 },
            { id: "catalogo", label: "Todos", url: "catalogo.html", kind: "link", enabled: true, openNewTab: false, order: 20 },
            { id: "categorias", label: "Categorías", url: "catalogo.html", kind: "categories", enabled: true, openNewTab: false, order: 30 },
            { id: "personalizar", label: "Personaliza tu producto", url: "#", kind: "customization", enabled: true, openNewTab: false, order: 40 }
        ]
    },
    footer: {
        enabled: true,
        heading: "Mommy Crafts",
        description: "Productos personalizados creados con dedicación para cada ocasión.",
        copyright: "Mommy Crafts. Todos los derechos reservados.",
        showNewsletter: true,
        links: [
            { label: "Quiénes somos", url: "quienes-somos.html", enabled: true, order: 10 },
            { label: "Contacto", url: "contacto.html", enabled: true, order: 20 },
            { label: "Despachos y retiros", url: "despachos-retiros.html", enabled: true, order: 30 },
            { label: "Preguntas frecuentes", url: "preguntas-frecuentes.html", enabled: true, order: 40 }
        ]
    },
    components: {
        contentMaxWidth: 1320,
        buttonRadius: 14,
        buttonHeight: 48,
        buttonFontSize: 15,
        cardRadius: 20,
        cardShadow: "soft",
        modalMaxWidth: 1120,
        modalRadius: 24,
        modalOverlayOpacity: 0.62,
        headingScale: 1,
        bodyScale: 1,
        headerSticky: false
    },
    adminPanel: {
        accentColor: "#8E456A",
        sidebarBackground: "#2F2930",
        sidebarText: "#FFFFFF",
        items: [
            { id: "dashboard", label: "Resumen", href: "index.html", icon: "fa-chart-pie", enabled: true, order: 10, custom: false },
            { id: "productos", label: "Productos", href: "productos.html", icon: "fa-box-open", enabled: true, order: 20, custom: false },
            { id: "pedidos", label: "Pedidos", href: "pedidos.html", icon: "fa-bag-shopping", enabled: true, order: 30, custom: false },
            { id: "categorias", label: "Categorías", href: "categorias.html", icon: "fa-tags", enabled: true, order: 35, custom: false },
            { id: "inventario", label: "Inventario", href: "inventario.html", icon: "fa-boxes-stacked", enabled: true, order: 40, custom: false },
            { id: "reportes", label: "Reportes", href: "reportes.html", icon: "fa-chart-line", enabled: true, order: 50, custom: false },
            { id: "banners", label: "Banners", href: "banners.html", icon: "fa-images", enabled: true, order: 60, custom: false },
            { id: "contenido", label: "Contenido", href: "contenido.html", icon: "fa-file-pen", enabled: true, order: 70, custom: false },
            { id: "apariencia", label: "Apariencia", href: "apariencia.html", icon: "fa-palette", enabled: true, order: 80, custom: false },
            { id: "studio", label: "Editor del sitio", href: "editor-sitio.html", icon: "fa-layer-group", enabled: true, order: 90, custom: false }
        ]
    },
    pages: CORE_PAGES,
    revision: 1
});

function cloneDefaultSiteStudio() {
    return JSON.parse(JSON.stringify(DEFAULT_SITE_STUDIO));
}


function mergeAdminItems(defaultItems, savedItems) {
    const map = new Map();

    defaultItems.forEach((item) => {
        map.set(item.id, { ...item });
    });

    if (Array.isArray(savedItems)) {
        savedItems.forEach((item) => {
            if (!item?.id) return;
            map.set(item.id, {
                ...(map.get(item.id) || {}),
                ...item
            });
        });
    }

    return Array.from(map.values())
        .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
}

function mergeSiteStudio(value = {}) {
    const defaults = cloneDefaultSiteStudio();
    const savedPages = Array.isArray(value.pages) ? value.pages : [];
    const byId = new Map(savedPages.map((page) => [page.id, page]));
    const mergedCore = defaults.pages.map((page) => {
        const saved = byId.get(page.id);
        if (!saved) return page;
        const savedSections = Array.isArray(saved.sections) ? saved.sections : [];
        const sectionById = new Map(savedSections.map((section) => [section.id, section]));
        const coreSections = page.sections.map((section) => ({ ...section, ...(sectionById.get(section.id) || {}) }));
        const extraSections = savedSections.filter((section) => !page.sections.some((core) => core.id === section.id));
        return {
            ...page,
            ...saved,
            layout: { ...page.layout, ...(saved.layout || {}) },
            sections: [...coreSections, ...extraSections].sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
        };
    });
    const customPages = savedPages.filter((page) => !defaults.pages.some((core) => core.id === page.id));

    return {
        ...defaults,
        ...value,
        navigation: {
            ...defaults.navigation,
            ...(value.navigation || {}),
            items: Array.isArray(value.navigation?.items) && value.navigation.items.length
                ? value.navigation.items
                : defaults.navigation.items
        },
        footer: {
            ...defaults.footer,
            ...(value.footer || {}),
            links: Array.isArray(value.footer?.links) ? value.footer.links : defaults.footer.links
        },
        components: { ...defaults.components, ...(value.components || {}) },
        adminPanel: {
            ...defaults.adminPanel,
            ...(value.adminPanel || {}),
            items: mergeAdminItems(defaults.adminPanel.items, value.adminPanel?.items)
        },
        pages: [...mergedCore, ...customPages]
    };
}

module.exports = {
    DEFAULT_SITE_STUDIO,
    cloneDefaultSiteStudio,
    mergeSiteStudio
};
