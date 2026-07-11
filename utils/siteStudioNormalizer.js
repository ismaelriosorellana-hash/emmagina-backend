"use strict";

const { cleanText, validationError } = require("./validation");
const { cloneDefaultSiteStudio, mergeSiteStudio } = require("../services/siteStudioDefaults");

const HEX = /^#[0-9A-F]{6}$/i;
const ID = /^[a-z0-9][a-z0-9-]{0,79}$/;
const SECTION_TYPES = new Set(["core", "hero", "richText", "imageText", "cta", "notice", "productGrid", "categoryLinks", "spacer", "divider"]);
const ZONES = new Set(["main", "left", "right", "before", "after"]);
const ALIGNMENTS = new Set(["left", "center", "right"]);
const IMAGE_POSITIONS = new Set(["left", "right", "top", "background"]);
const PRODUCT_MODES = new Set(["featured", "new", "best-sellers", "category", "manual"]);
const NAV_KINDS = new Set(["link", "categories", "customization"]);
const SHADOWS = new Set(["none", "soft", "medium", "strong"]);
const BUTTON_STYLES = new Set(["primary", "secondary", "link"]);

function cleanNumber(value, { field, min, max, fallback, integer = false }) {
    if (value === undefined || value === null || value === "") return fallback;
    const number = Number(value);
    if (!Number.isFinite(number) || number < min || number > max) {
        throw validationError(`${field} debe estar entre ${min} y ${max}.`);
    }
    return integer ? Math.round(number) : Math.round(number * 100) / 100;
}

function cleanBoolean(value, fallback = false) {
    return value === undefined ? Boolean(fallback) : Boolean(value);
}

function cleanId(value, field, fallback = "") {
    const id = cleanText(value ?? fallback, { field, maxLength: 80, required: true }).toLowerCase();
    if (!ID.test(id)) {
        throw validationError(`${field} solo puede contener letras minúsculas, números y guiones.`);
    }
    return id;
}

function cleanHex(value, field, fallback = "") {
    const raw = cleanText(value ?? fallback, { field, maxLength: 7 });
    if (!raw) return "";
    const color = raw.toUpperCase();
    if (!HEX.test(color)) {
        throw validationError(`${field} debe usar formato hexadecimal, por ejemplo #FFFFFF.`);
    }
    return color;
}

function cleanUrl(value, { field = "El enlace", fallback = "", required = false } = {}) {
    const url = cleanText(value ?? fallback, { field, maxLength: 1000, required });
    if (!url) return "";
    if (/^(https:\/\/|mailto:|tel:|#[a-z0-9_-]*|\/[a-z0-9_./?&=#%-]*|(?:\.\.?\/)*[a-z0-9_/-]+\.html(?:[?#].*)?|pagina\.html\?slug=[a-z0-9-]+)$/i.test(url)) {
        return url;
    }
    throw validationError(`${field} debe ser una ruta interna, un ancla o una dirección https:// válida.`);
}

function cleanImageUrl(value, fallback = "") {
    const url = cleanText(value ?? fallback, { field: "La imagen", maxLength: 1000 });
    if (!url) return "";
    if (!/^https:\/\//i.test(url)) {
        throw validationError("Las imágenes del editor deben usar una dirección https:// válida.");
    }
    return url;
}

function cleanEnum(value, allowed, field, fallback) {
    const result = cleanText(value ?? fallback, { field, maxLength: 40, required: true });
    if (!allowed.has(result)) throw validationError(`${field} no es válido.`);
    return result;
}

function normalizeButton(item = {}, index = 0) {
    return {
        label: cleanText(item.label, { field: `El texto del botón ${index + 1}`, maxLength: 120, required: true }),
        url: cleanUrl(item.url, { field: `El enlace del botón ${index + 1}`, required: true }),
        style: cleanEnum(item.style, BUTTON_STYLES, `El estilo del botón ${index + 1}`, "primary"),
        openNewTab: cleanBoolean(item.openNewTab, false)
    };
}

function normalizeCategoryItem(item = {}, index = 0) {
    return {
        label: cleanText(item.label, { field: `La categoría ${index + 1}`, maxLength: 120, required: true }),
        url: cleanUrl(item.url, { field: `El enlace de la categoría ${index + 1}`, required: true }),
        imageUrl: cleanImageUrl(item.imageUrl)
    };
}

function normalizeSection(section = {}, fallback = {}, index = 0) {
    const type = cleanEnum(section.type, SECTION_TYPES, `El tipo de la sección ${index + 1}`, fallback.type || "richText");
    const defaultId = fallback.id || `section-${index + 1}`;
    const buttons = Array.isArray(section.buttons) ? section.buttons.slice(0, 4).map(normalizeButton) : [];
    const categoryItems = Array.isArray(section.categoryItems)
        ? section.categoryItems.slice(0, 20).map(normalizeCategoryItem)
        : [];
    const productIds = Array.isArray(section.productIds)
        ? section.productIds.slice(0, 24).map((value, productIndex) => cleanText(value, {
            field: `El producto ${productIndex + 1}`,
            maxLength: 80,
            required: true
        }))
        : [];

    return {
        id: cleanId(section.id, `El identificador de la sección ${index + 1}`, defaultId),
        type,
        zone: cleanEnum(section.zone, ZONES, `La zona de la sección ${index + 1}`, fallback.zone || "main"),
        enabled: cleanBoolean(section.enabled, fallback.enabled !== false),
        order: cleanNumber(section.order, { field: `El orden de la sección ${index + 1}`, min: 0, max: 9999, fallback: fallback.order ?? (index + 1) * 10, integer: true }),
        eyebrow: cleanText(section.eyebrow ?? fallback.eyebrow, { field: `El antetítulo de la sección ${index + 1}`, maxLength: 160 }),
        title: cleanText(section.title ?? fallback.title, { field: `El título de la sección ${index + 1}`, maxLength: 260 }),
        body: cleanText(section.body ?? fallback.body, { field: `El texto de la sección ${index + 1}`, maxLength: 12000, allowNewlines: true }),
        imageUrl: cleanImageUrl(section.imageUrl, fallback.imageUrl),
        imageAlt: cleanText(section.imageAlt ?? fallback.imageAlt, { field: `El texto alternativo de la sección ${index + 1}`, maxLength: 260 }),
        buttonLabel: cleanText(section.buttonLabel ?? fallback.buttonLabel, { field: `El botón de la sección ${index + 1}`, maxLength: 120 }),
        buttonUrl: cleanUrl(section.buttonUrl, { field: `El enlace de la sección ${index + 1}`, fallback: fallback.buttonUrl || "" }),
        buttons,
        alignment: cleanEnum(section.alignment, ALIGNMENTS, `La alineación de la sección ${index + 1}`, fallback.alignment || "left"),
        imagePosition: cleanEnum(section.imagePosition, IMAGE_POSITIONS, `La posición de imagen de la sección ${index + 1}`, fallback.imagePosition || "right"),
        backgroundColor: cleanHex(section.backgroundColor, `El fondo de la sección ${index + 1}`, fallback.backgroundColor || ""),
        textColor: cleanHex(section.textColor, `El texto de la sección ${index + 1}`, fallback.textColor || ""),
        paddingY: cleanNumber(section.paddingY, { field: `El espaciado de la sección ${index + 1}`, min: 0, max: 180, fallback: fallback.paddingY || 0, integer: true }),
        borderRadius: cleanNumber(section.borderRadius, { field: `El borde de la sección ${index + 1}`, min: 0, max: 80, fallback: fallback.borderRadius || 0, integer: true }),
        anchor: section.anchor ? cleanId(section.anchor, `El ancla de la sección ${index + 1}`) : "",
        productMode: cleanEnum(section.productMode, PRODUCT_MODES, `El origen de productos de la sección ${index + 1}`, fallback.productMode || "featured"),
        productCategory: cleanText(section.productCategory ?? fallback.productCategory, { field: `La categoría de productos de la sección ${index + 1}`, maxLength: 160 }),
        productIds,
        itemLimit: cleanNumber(section.itemLimit, { field: `El límite de elementos de la sección ${index + 1}`, min: 1, max: 24, fallback: fallback.itemLimit || 4, integer: true }),
        categoryItems
    };
}

function normalizeLayout(layout = {}, fallback = {}) {
    return {
        maxWidth: cleanNumber(layout.maxWidth, { field: "El ancho máximo de página", min: 720, max: 1800, fallback: fallback.maxWidth || 1320, integer: true }),
        contentPadding: cleanNumber(layout.contentPadding, { field: "El margen lateral de página", min: 0, max: 80, fallback: fallback.contentPadding || 20, integer: true }),
        sectionGap: cleanNumber(layout.sectionGap, { field: "La separación entre secciones", min: 0, max: 140, fallback: fallback.sectionGap || 40, integer: true }),
        backgroundColor: cleanHex(layout.backgroundColor, "El fondo de página", fallback.backgroundColor || "#EAF4F8")
    };
}

function normalizePage(page = {}, fallback = {}, index = 0) {
    const type = page.type === "custom" ? "custom" : (fallback.type || "core");
    const id = cleanId(page.id, `El identificador de la página ${index + 1}`, fallback.id || `custom-page-${index + 1}`);
    const path = type === "custom"
        ? `pagina.html?slug=${id.replace(/^custom-/, "")}`
        : cleanUrl(page.path, { field: `La ruta de la página ${index + 1}`, fallback: fallback.path, required: true });
    const fallbackSections = Array.isArray(fallback.sections) ? fallback.sections : [];
    const inputSections = Array.isArray(page.sections) ? page.sections.slice(0, 60) : fallbackSections;
    const fallbackById = new Map(fallbackSections.map((section) => [section.id, section]));

    const sections = inputSections.map((section, sectionIndex) => normalizeSection(
        section,
        fallbackById.get(section?.id) || {},
        sectionIndex
    ));

    const used = new Set();
    for (const section of sections) {
        if (used.has(section.id)) throw validationError(`La página ${page.label || id} tiene secciones repetidas.`);
        used.add(section.id);
    }

    return {
        id,
        type,
        label: cleanText(page.label ?? fallback.label, { field: `El nombre de la página ${index + 1}`, maxLength: 160, required: true }),
        path,
        enabled: cleanBoolean(page.enabled, fallback.enabled !== false),
        seoTitle: cleanText(page.seoTitle ?? fallback.seoTitle, { field: `El título SEO de la página ${index + 1}`, maxLength: 180 }),
        seoDescription: cleanText(page.seoDescription ?? fallback.seoDescription, { field: `La descripción SEO de la página ${index + 1}`, maxLength: 320 }),
        layout: normalizeLayout(page.layout, fallback.layout || {}),
        sections: sections.sort((a, b) => a.order - b.order)
    };
}

function normalizeNavigation(input = {}, fallback = {}) {
    const items = Array.isArray(input.items) ? input.items.slice(0, 24) : fallback.items || [];
    return {
        items: items.map((item, index) => ({
            id: cleanId(item.id, `El identificador del enlace ${index + 1}`, `nav-${index + 1}`),
            label: cleanText(item.label, { field: `El texto del enlace ${index + 1}`, maxLength: 120, required: true }),
            url: cleanUrl(item.url, { field: `El destino del enlace ${index + 1}`, required: item.kind === "link" }),
            kind: cleanEnum(item.kind, NAV_KINDS, `El tipo del enlace ${index + 1}`, "link"),
            enabled: cleanBoolean(item.enabled, true),
            openNewTab: cleanBoolean(item.openNewTab, false),
            order: cleanNumber(item.order, { field: `El orden del enlace ${index + 1}`, min: 0, max: 9999, fallback: (index + 1) * 10, integer: true })
        })).sort((a, b) => a.order - b.order)
    };
}

function normalizeFooter(input = {}, fallback = {}) {
    const links = Array.isArray(input.links) ? input.links.slice(0, 30) : fallback.links || [];
    return {
        enabled: cleanBoolean(input.enabled, fallback.enabled !== false),
        heading: cleanText(input.heading ?? fallback.heading, { field: "El título del pie de página", maxLength: 160, required: true }),
        description: cleanText(input.description ?? fallback.description, { field: "La descripción del pie de página", maxLength: 1200, allowNewlines: true }),
        copyright: cleanText(input.copyright ?? fallback.copyright, { field: "El texto legal del pie de página", maxLength: 300 }),
        showNewsletter: cleanBoolean(input.showNewsletter, fallback.showNewsletter !== false),
        links: links.map((item, index) => ({
            label: cleanText(item.label, { field: `El enlace ${index + 1} del pie`, maxLength: 120, required: true }),
            url: cleanUrl(item.url, { field: `El destino ${index + 1} del pie`, required: true }),
            enabled: cleanBoolean(item.enabled, true),
            order: cleanNumber(item.order, { field: `El orden ${index + 1} del pie`, min: 0, max: 9999, fallback: (index + 1) * 10, integer: true })
        })).sort((a, b) => a.order - b.order)
    };
}

function normalizeComponents(input = {}, fallback = {}) {
    const shadow = cleanText(input.cardShadow ?? fallback.cardShadow ?? "soft", { field: "La sombra de tarjetas", maxLength: 20, required: true });
    if (!SHADOWS.has(shadow)) throw validationError("La sombra de tarjetas no es válida.");
    return {
        contentMaxWidth: cleanNumber(input.contentMaxWidth, { field: "El ancho general", min: 720, max: 1800, fallback: fallback.contentMaxWidth || 1320, integer: true }),
        buttonRadius: cleanNumber(input.buttonRadius, { field: "El borde de botones", min: 0, max: 40, fallback: fallback.buttonRadius || 14, integer: true }),
        buttonHeight: cleanNumber(input.buttonHeight, { field: "La altura de botones", min: 34, max: 72, fallback: fallback.buttonHeight || 48, integer: true }),
        buttonFontSize: cleanNumber(input.buttonFontSize, { field: "El texto de botones", min: 11, max: 24, fallback: fallback.buttonFontSize || 15, integer: true }),
        cardRadius: cleanNumber(input.cardRadius, { field: "El borde de tarjetas", min: 0, max: 60, fallback: fallback.cardRadius || 20, integer: true }),
        cardShadow: shadow,
        modalMaxWidth: cleanNumber(input.modalMaxWidth, { field: "El ancho de ventanas", min: 520, max: 1600, fallback: fallback.modalMaxWidth || 1120, integer: true }),
        modalRadius: cleanNumber(input.modalRadius, { field: "El borde de ventanas", min: 0, max: 60, fallback: fallback.modalRadius || 24, integer: true }),
        modalOverlayOpacity: cleanNumber(input.modalOverlayOpacity, { field: "La oscuridad de ventanas", min: 0.2, max: 0.95, fallback: fallback.modalOverlayOpacity || 0.62 }),
        headingScale: cleanNumber(input.headingScale, { field: "La escala de títulos", min: 0.75, max: 1.5, fallback: fallback.headingScale || 1 }),
        bodyScale: cleanNumber(input.bodyScale, { field: "La escala de texto", min: 0.8, max: 1.3, fallback: fallback.bodyScale || 1 }),
        headerSticky: cleanBoolean(input.headerSticky, fallback.headerSticky)
    };
}

function normalizeAdminPanel(input = {}, fallback = {}) {
    const items = Array.isArray(input.items) ? input.items.slice(0, 30) : fallback.items || [];
    return {
        accentColor: cleanHex(input.accentColor, "El color del panel", fallback.accentColor || "#219EBC"),
        sidebarBackground: cleanHex(input.sidebarBackground, "El fondo del menú administrador", fallback.sidebarBackground || "#2F2930"),
        sidebarText: cleanHex(input.sidebarText, "El texto del menú administrador", fallback.sidebarText || "#FFFFFF"),
        items: items.map((item, index) => ({
            id: cleanId(item.id, `El identificador del módulo ${index + 1}`, `admin-${index + 1}`),
            label: cleanText(item.label, { field: `El nombre del módulo ${index + 1}`, maxLength: 120, required: true }),
            href: cleanUrl(item.href, { field: `La ruta del módulo ${index + 1}`, required: true }),
            icon: cleanText(item.icon || "fa-link", { field: `El icono del módulo ${index + 1}`, maxLength: 80, required: true }),
            enabled: cleanBoolean(item.enabled, true),
            order: cleanNumber(item.order, { field: `El orden del módulo ${index + 1}`, min: 0, max: 9999, fallback: (index + 1) * 10, integer: true }),
            custom: cleanBoolean(item.custom, false)
        })).sort((a, b) => a.order - b.order)
    };
}

function normalizeSiteStudio(input = {}, fallbackValue = cloneDefaultSiteStudio()) {
    const fallback = mergeSiteStudio(fallbackValue || cloneDefaultSiteStudio());
    const inputPages = Array.isArray(input.pages) ? input.pages.slice(0, 50) : fallback.pages;
    const fallbackById = new Map(fallback.pages.map((page) => [page.id, page]));
    const pages = inputPages.map((page, index) => normalizePage(page, fallbackById.get(page?.id) || {}, index));

    for (const corePage of fallback.pages.filter((page) => page.type === "core")) {
        if (!pages.some((page) => page.id === corePage.id)) pages.push(normalizePage(corePage, corePage, pages.length));
    }

    const usedPages = new Set();
    for (const page of pages) {
        if (usedPages.has(page.id)) throw validationError("No puede haber páginas repetidas en el editor.");
        usedPages.add(page.id);
    }

    return {
        key: "main",
        navigation: normalizeNavigation(input.navigation || {}, fallback.navigation),
        footer: normalizeFooter(input.footer || {}, fallback.footer),
        components: normalizeComponents(input.components || {}, fallback.components),
        adminPanel: normalizeAdminPanel(input.adminPanel || {}, fallback.adminPanel),
        pages: pages.sort((a, b) => a.type.localeCompare(b.type) || a.label.localeCompare(b.label, "es"))
    };
}

module.exports = { normalizeSiteStudio };
