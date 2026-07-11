"use strict";

const mongoose = require("mongoose");

const COLLECTION_NAME = "site_editor_pages";
const HOME_KEYS = new Set(["", "home", "inicio"]);

function now() { return new Date(); }

function collection() {
    const db = mongoose.connection && mongoose.connection.db;
    if (!db) {
        const error = new Error("MongoDB no está conectado para Editor del Sitio.");
        error.statusCode = 503;
        error.expose = true;
        throw error;
    }
    return db.collection(COLLECTION_NAME);
}

function slugify(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "pagina";
}

function cleanText(value, fallback = "") {
    return String(value ?? fallback).trim();
}

function toBool(value, fallback = false) {
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;
    return fallback;
}

function toNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}

function newId() { return new mongoose.Types.ObjectId(); }
function isObjectId(value) { return mongoose.Types.ObjectId.isValid(String(value || "")); }
function asObjectId(value) { return new mongoose.Types.ObjectId(String(value)); }
function shouldBootstrapHome(value) { return HOME_KEYS.has(slugify(value || "home")); }

const SECTION_TYPE_ALIASES = {
    hero: "hero_section",
    "hero-section": "hero_section",
    hero_section: "hero_section",
    info: "content_section",
    content: "content_section",
    "content-section": "content_section",
    content_section: "content_section",
    productos: "products_section",
    products: "products_section",
    "products-section": "products_section",
    products_section: "products_section",
    marcas: "brand_section",
    brand: "brand_section",
    "brand-section": "brand_section",
    brand_section: "brand_section",
    resenas: "reviews_section",
    reviews: "reviews_section",
    "reviews-section": "reviews_section",
    reviews_section: "reviews_section",
    generica: "generic_section",
    generic: "generic_section",
    "generic-section": "generic_section",
    generic_section: "generic_section"
};

const BLOCK_TYPE_ALIASES = {
    "category-sidebar": "category_sidebar",
    category_sidebar: "category_sidebar",
    categorias: "category_sidebar",
    "lista-categorias": "category_sidebar",
    "lista-lateral-categorias": "category_sidebar",
    "category-grid": "category_grid",
    category_grid: "category_grid",
    "grilla-categorias": "category_grid",
    "hero-banner": "hero_banner",
    hero_banner: "hero_banner",
    hero: "hero_banner",
    "banner-principal": "hero_banner",
    "info-cards": "info_cards",
    info_cards: "info_cards",
    "bloques-informativos": "info_cards",
    "tarjetas-informativas": "info_cards",
    "product-marquee": "product_marquee",
    product_marquee: "product_marquee",
    "carrusel-productos": "product_marquee",
    "product-grid": "product_grid",
    product_grid: "product_grid",
    "grilla-productos": "product_grid",
    "image-banner": "image_banner",
    image_banner: "image_banner",
    "banner-imagen": "image_banner",
    "reviews-marquee": "reviews_marquee",
    reviews_marquee: "reviews_marquee",
    "carrusel-resenas": "reviews_marquee",
    resenas: "reviews_marquee",
    "text-block": "text_block",
    text_block: "text_block",
    texto: "text_block",
    "faq-block": "faq_block",
    faq_block: "faq_block",
    "contact-block": "contact_block",
    contact_block: "contact_block",
    "cart-summary": "cart_summary",
    cart_summary: "cart_summary",
    "checkout-form": "checkout_form",
    checkout_form: "checkout_form",
    spacer: "spacer",
    separador: "spacer",
    "html-block": "html_block",
    html_block: "html_block",
    "custom-html": "custom_html",
    custom_html: "custom_html",
    "contenido-html": "custom_html"
};

function normalizeSectionType(value) {
    const raw = String(value || "generic_section").trim();
    if (!raw) return "generic_section";
    if (SECTION_TYPE_ALIASES[raw]) return SECTION_TYPE_ALIASES[raw];
    const safe = slugify(raw);
    return SECTION_TYPE_ALIASES[safe] || safe.replace(/-/g, "_") || "generic_section";
}

function normalizeBlockType(value) {
    const raw = String(value || "custom_html").trim();
    if (!raw) return "custom_html";
    if (BLOCK_TYPE_ALIASES[raw]) return BLOCK_TYPE_ALIASES[raw];
    const safe = slugify(raw);
    return BLOCK_TYPE_ALIASES[safe] || safe.replace(/-/g, "_") || "custom_html";
}

function plainObject(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeBlock(block = {}, index = 0, sectionId = null) {
    const id = isObjectId(block._id || block.id) ? asObjectId(block._id || block.id) : newId();
    const type = normalizeBlockType(block.type || "custom_html");
    return {
        _id: id,
        id: String(id),
        sectionId: sectionId ? String(sectionId) : (block.sectionId ? String(block.sectionId) : ""),
        type,
        position: Math.max(1, toNumber(block.position, index + 1)),
        name: cleanText(block.name, type || "Bloque") || "Bloque",
        isVisible: toBool(block.isVisible, true),
        content: plainObject(block.content),
        style: plainObject(block.style),
        settings: plainObject(block.settings),
        createdAt: block.createdAt ? new Date(block.createdAt) : now(),
        updatedAt: block.updatedAt ? new Date(block.updatedAt) : now()
    };
}

function sortBlocks(blocks = [], sectionId = null) {
    return (Array.isArray(blocks) ? blocks : [])
        .map((block, index) => normalizeBlock(block, index, sectionId))
        .sort((a, b) => Number(a.position || 0) - Number(b.position || 0))
        .map((block, index) => ({ ...block, position: index + 1, sectionId: sectionId ? String(sectionId) : String(block.sectionId || "") }));
}

function normalizeSection(section = {}, index = 0) {
    const id = isObjectId(section._id || section.id) ? asObjectId(section._id || section.id) : newId();
    const type = normalizeSectionType(section.type || section.sectionType || "generic_section");
    return {
        _id: id,
        id: String(id),
        type,
        position: Math.max(1, toNumber(section.position, index + 1)),
        name: cleanText(section.name, section.title || "Sección") || "Sección",
        isVisible: toBool(section.isVisible, true),
        layout: cleanText(section.layout, type === "hero_section" ? "hero_with_sidebar" : "stack") || "stack",
        content: plainObject(section.content),
        style: plainObject(section.style),
        settings: plainObject(section.settings),
        blocks: sortBlocks(section.blocks || [], String(id)),
        createdAt: section.createdAt ? new Date(section.createdAt) : now(),
        updatedAt: section.updatedAt ? new Date(section.updatedAt) : now()
    };
}

function sortSections(sections = []) {
    return (Array.isArray(sections) ? sections : [])
        .map(normalizeSection)
        .sort((a, b) => Number(a.position || 0) - Number(b.position || 0))
        .map((section, index) => {
            const sectionId = String(section._id);
            return { ...section, id: sectionId, position: index + 1, blocks: sortBlocks(section.blocks, sectionId) };
        });
}

function inferSectionForBlock(block, index = 0) {
    const type = normalizeBlockType(block.type);
    if (type === "hero_banner" || type === "category_sidebar") return { key: "hero", type: "hero_section", name: "Sección Hero", layout: "hero_with_sidebar", position: 1 };
    if (type === "info_cards" || type === "text_block" || type === "custom_html" || type === "html_block") return { key: `content-${index}`, type: "content_section", name: "Sección de contenido", layout: "stack", position: 2 + index };
    if (type === "product_marquee" || type === "product_grid") return { key: "products", type: "products_section", name: "Sección de productos", layout: "stack", position: 10 };
    if (type === "image_banner") return { key: "brand", type: "brand_section", name: "Líneas de marca", layout: "stack", position: 20 };
    if (type === "reviews_marquee") return { key: "reviews", type: "reviews_section", name: "Reseñas", layout: "stack", position: 30 };
    return { key: `generic-${index}`, type: "generic_section", name: "Sección", layout: "stack", position: 40 + index };
}

function migrateLegacyBlocksToSections(blocks = []) {
    const normalizedBlocks = sortBlocks(blocks);
    const grouped = new Map();
    normalizedBlocks.forEach((block, index) => {
        const meta = inferSectionForBlock(block, index);
        if (!grouped.has(meta.key)) {
            grouped.set(meta.key, { ...meta, _id: newId(), blocks: [] });
        }
        grouped.get(meta.key).blocks.push(block);
    });
    return sortSections([...grouped.values()].map((section) => ({
        ...section,
        blocks: section.blocks.map((block, index) => ({ ...block, position: index + 1 }))
    })));
}

function defaultHomeSections() {
    return sortSections([
        {
            type: "hero_section",
            name: "Sección Hero",
            position: 1,
            isVisible: true,
            layout: "hero_with_sidebar",
            style: { marginTop: 0, marginBottom: 24 },
            blocks: [
                {
                    type: "category_sidebar",
                    name: "Lista lateral de categorías",
                    position: 1,
                    isVisible: true,
                    content: {
                        heading: "Categorías",
                        source: "manual",
                        categories: [
                            { label: "Accesorios", href: "catalogo.html?categoria=Accesorios" },
                            { label: "Coleccionables", href: "catalogo.html?categoria=Coleccionables" },
                            { label: "Decoración", href: "catalogo.html?categoria=Decoraci%C3%B3n" },
                            { label: "Herramientas", href: "catalogo.html?categoria=Herramientas" },
                            { label: "Línea Memories", href: "catalogo.html?categoria=Linea%20Memories" },
                            { label: "Librería", href: "catalogo.html?categoria=Librer%C3%ADa" },
                            { label: "Línea Alma", href: "catalogo.html?categoria=Linea%20Alma" },
                            { label: "Ofertas", href: "catalogo.html?grupo=ofertas" },
                            { label: "Vasos Temáticos", href: "catalogo.html?categoria=Vasos%20Tem%C3%A1ticos" },
                            { label: "Todos", href: "catalogo.html" }
                        ],
                        showIcons: false,
                        showViewAll: true,
                        viewAllText: "Ver todas",
                        viewAllUrl: "catalogo.html"
                    },
                    style: { desktopVisible: true, mobileVisible: false }
                },
                {
                    type: "hero_banner",
                    name: "Hero principal",
                    position: 2,
                    isVisible: true,
                    content: {
                        title: "Emmagina",
                        subtitle: "Productos impresos en 3D para regalar, decorar y crear recuerdos.",
                        imageDesktop: "",
                        imageMobile: "",
                        buttonText: "Comprar ahora",
                        buttonUrl: "catalogo.html"
                    },
                    style: { heightDesktop: 323, heightMobile: 220, marginTop: 0, marginBottom: 0 }
                }
            ]
        },
        {
            type: "content_section",
            name: "Bloques informativos",
            position: 2,
            isVisible: true,
            layout: "stack",
            style: { marginTop: 0, marginBottom: 24 },
            blocks: [{
                type: "info_cards",
                name: "Bloques informativos",
                position: 1,
                isVisible: true,
                content: {
                    title: "Explora Emmagina",
                    cards: [
                        { title: "Destacados", text: "Selección especial de productos", image: "", href: "catalogo.html?grupo=destacados" },
                        { title: "Más vendidos", text: "Lo favorito de nuestros clientes", image: "", href: "catalogo.html?grupo=vendidos" },
                        { title: "Más vistos", text: "Lo más explorado de la tienda", image: "", href: "catalogo.html?grupo=vistos" }
                    ]
                },
                style: { marginTop: 0, marginBottom: 0 }
            }]
        },
        {
            type: "products_section",
            name: "Productos destacados",
            position: 3,
            isVisible: true,
            layout: "stack",
            style: { marginTop: 0, marginBottom: 24 },
            blocks: [
                { type: "product_marquee", name: "Desde $14.990", position: 1, isVisible: true, content: { title: "Desde $14.990", filter: "desde14990", limit: 12 }, style: { marginTop: 0, marginBottom: 24 } },
                { type: "product_marquee", name: "Lanzamiento", position: 2, isVisible: true, content: { title: "Lanzamiento", filter: "lanzamiento", limit: 12 }, style: { marginTop: 0, marginBottom: 0 } }
            ]
        },
        {
            type: "brand_section",
            name: "Líneas de marca",
            position: 4,
            isVisible: true,
            layout: "stack",
            style: { marginTop: 0, marginBottom: 18 },
            blocks: [
                { type: "image_banner", name: "Línea Memories", position: 1, isVisible: true, content: { title: "Línea Memories", imageDesktop: "", imageMobile: "", buttonText: "Pedir el mío", buttonUrl: "pedido-personalizado.html" }, style: { heightDesktop: 112, heightMobile: 88, marginTop: 0, marginBottom: 18 } },
                { type: "image_banner", name: "Línea Alma", position: 2, isVisible: true, content: { title: "Línea Alma", imageDesktop: "", imageMobile: "", buttonText: "Pedir el mío", buttonUrl: "pedido-personalizado.html" }, style: { heightDesktop: 112, heightMobile: 88, marginTop: 0, marginBottom: 0 } }
            ]
        },
        {
            type: "reviews_section",
            name: "Reseñas",
            position: 5,
            isVisible: true,
            layout: "stack",
            style: { marginTop: 0, marginBottom: 24 },
            blocks: [{ type: "reviews_marquee", name: "Reseñas destacadas", position: 1, isVisible: true, content: { title: "Lo que dicen nuestros clientes", minRating: 4, hideWhenEmpty: true }, style: { marginTop: 0, marginBottom: 0 } }]
        }
    ]);
}

function flattenSections(sections = []) {
    return sortSections(sections).flatMap((section) => sortBlocks(section.blocks || [], String(section._id)).map((block) => ({
        ...block,
        sectionId: String(section._id),
        sectionType: section.type,
        sectionName: section.name
    })));
}


function ensureHomeHeroCategorySidebar(sections = []) {
    const normalizedSections = sortSections(sections);
    const heroSection = normalizedSections.find((section) => section.type === "hero_section" || section.layout === "hero_with_sidebar");
    if (!heroSection) return normalizedSections;
    const blocks = sortBlocks(heroSection.blocks || [], String(heroSection._id));
    const hasSidebar = blocks.some((block) => block.type === "category_sidebar");
    if (hasSidebar) {
        heroSection.blocks = sortBlocks(blocks, String(heroSection._id));
        return normalizedSections;
    }
    const hero = blocks.find((block) => block.type === "hero_banner");
    const categories = hero?.content?.categories || hero?.content?.categorias || defaultHomeSections()[0].blocks[0].content.categories;
    const sidebar = normalizeBlock({
        _id: newId(),
        type: "category_sidebar",
        name: "Lista lateral de categorías",
        position: 1,
        isVisible: true,
        content: {
            heading: "Categorías",
            source: "manual",
            categories,
            showViewAll: true,
            viewAllText: "Ver todas",
            viewAllUrl: "catalogo.html"
        },
        style: { desktopVisible: true, mobileVisible: false }
    }, 0, String(heroSection._id));
    heroSection.blocks = sortBlocks([sidebar, ...blocks.map((block, index) => ({ ...block, position: index + 2 }))], String(heroSection._id));
    heroSection.layout = "hero_with_sidebar";
    return normalizedSections;
}

function defaultHomePage() {
    const createdAt = now();
    const sections = defaultHomeSections();
    return {
        _id: newId(),
        key: "home",
        title: "Inicio",
        slug: "inicio",
        description: "Página principal editable de Emmagina.",
        isPublished: true,
        isSystem: true,
        canDelete: false,
        template: "home",
        pageType: "home",
        showInSiteEditor: true,
        showInNavigation: false,
        navigationLabel: "Inicio",
        sortOrder: 1,
        seo: {
            title: "Emmagina | Productos impresos en 3D",
            description: "Figuras, decoraciones y productos impresos en 3D para regalar, crear y conservar recuerdos.",
            image: "",
            noIndex: false
        },
        sections,
        blocks: flattenSections(sections),
        createdBy: null,
        updatedBy: null,
        createdAt,
        updatedAt: createdAt,
        deletedAt: null
    };
}

function publicPath(page = {}) {
    if (page.key === "home" || page.slug === "inicio") return "/";
    return `/pagina.html?slug=${encodeURIComponent(page.slug || page.key || "")}`;
}

function normalizeSeo(seo = {}, title = "") {
    const source = seo && typeof seo === "object" ? seo : {};
    return {
        title: cleanText(source.title, title),
        description: cleanText(source.description, ""),
        image: cleanText(source.image, ""),
        noIndex: toBool(source.noIndex, false)
    };
}

function normalizeSectionsForPage(page = {}) {
    const incomingSections = Array.isArray(page.sections) && page.sections.length ? page.sections : [];
    if (incomingSections.length) return sortSections(incomingSections);
    if (Array.isArray(page.blocks) && page.blocks.length) return migrateLegacyBlocksToSections(page.blocks);
    return [];
}

function normalizePage(page = {}) {
    const title = cleanText(page.title, "Nueva página") || "Nueva página";
    const key = slugify(page.key || page.slug || title);
    const slug = slugify(page.slug || key || title);
    const isHome = key === "home" || slug === "inicio" || page.pageType === "home";
    let sections = normalizeSectionsForPage(page);
    if (isHome && !sections.length) sections = defaultHomeSections();
    const flattened = flattenSections(sections);
    return {
        _id: isObjectId(page._id) ? asObjectId(page._id) : newId(),
        key: isHome ? "home" : key,
        title,
        slug: isHome ? "inicio" : slug,
        description: cleanText(page.description, ""),
        isPublished: isHome ? true : toBool(page.isPublished, true),
        isSystem: isHome ? true : toBool(page.isSystem, false),
        canDelete: isHome ? false : toBool(page.canDelete, true),
        template: slugify(page.template || (isHome ? "home" : "page")),
        pageType: slugify(page.pageType || (isHome ? "home" : "custom")),
        showInSiteEditor: toBool(page.showInSiteEditor, true),
        showInNavigation: isHome ? false : toBool(page.showInNavigation, false),
        navigationLabel: cleanText(page.navigationLabel, title) || title,
        sortOrder: isHome ? 1 : toNumber(page.sortOrder, 100),
        seo: normalizeSeo(page.seo, title),
        sections,
        blocks: flattened,
        createdBy: page.createdBy || null,
        updatedBy: page.updatedBy || null,
        createdAt: page.createdAt ? new Date(page.createdAt) : now(),
        updatedAt: page.updatedAt ? new Date(page.updatedAt) : now(),
        deletedAt: page.deletedAt || null
    };
}

function serializeBlock(block = {}) {
    return { ...block, _id: String(block._id), id: String(block._id), sectionId: String(block.sectionId || ""), createdAt: block.createdAt, updatedAt: block.updatedAt };
}

function serializeSection(section = {}) {
    const normalized = normalizeSection(section);
    return {
        ...normalized,
        _id: String(normalized._id),
        id: String(normalized._id),
        blocks: normalized.blocks.map(serializeBlock),
        createdAt: normalized.createdAt,
        updatedAt: normalized.updatedAt
    };
}

function serializePage(page = {}) {
    const normalized = normalizePage(page);
    const id = String(normalized._id);
    const sections = normalized.sections.map(serializeSection);
    const blocks = flattenSections(sections).map(serializeBlock);
    return {
        ...normalized,
        _id: id,
        id,
        sections,
        blocks,
        publicPath: publicPath(normalized),
        canDelete: normalized.canDelete !== false && normalized.isSystem !== true && normalized.key !== "home"
    };
}

function pageSummary(page = {}) {
    const normalized = serializePage(page);
    return {
        _id: normalized._id,
        id: normalized._id,
        key: normalized.key,
        title: normalized.title,
        slug: normalized.slug,
        description: normalized.description,
        isPublished: normalized.isPublished !== false,
        isSystem: normalized.isSystem === true,
        canDelete: normalized.canDelete === true,
        template: normalized.template,
        pageType: normalized.pageType,
        showInNavigation: normalized.showInNavigation === true,
        navigationLabel: normalized.navigationLabel,
        sortOrder: normalized.sortOrder,
        sectionsCount: normalized.sections.length,
        blocksCount: normalized.blocks.length,
        publicPath: normalized.publicPath,
        updatedAt: normalized.updatedAt,
        createdAt: normalized.createdAt
    };
}

function queryFor(value) {
    const raw = cleanText(value, "");
    const safe = slugify(raw || "home");
    const or = [{ key: safe }, { slug: safe }];
    if (isObjectId(raw)) or.unshift({ _id: asObjectId(raw) });
    return { deletedAt: null, $or: or };
}

async function ensureIndexes() {
    const col = collection();
    await Promise.allSettled([
        col.createIndex({ key: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } }),
        col.createIndex({ slug: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } }),
        col.createIndex({ showInSiteEditor: 1, sortOrder: 1 }),
        col.createIndex({ isPublished: 1, key: 1 }),
        col.createIndex({ isPublished: 1, slug: 1 })
    ]);
}

async function ensureHomePage() {
    const col = collection();
    const existing = await col.findOne({ deletedAt: null, $or: [{ key: "home" }, { slug: "inicio" }] });
    if (!existing) {
        const page = defaultHomePage();
        try { await col.insertOne(page); } catch (error) { if (error && error.code !== 11000) throw error; }
        return serializePage(await col.findOne({ key: "home", deletedAt: null }) || page);
    }

    const normalized = normalizePage(existing);
    if (!normalized.sections.length) normalized.sections = defaultHomeSections();
    normalized.sections = ensureHomeHeroCategorySidebar(sortSections(normalized.sections));
    normalized.blocks = flattenSections(normalized.sections);
    normalized.key = "home";
    normalized.slug = "inicio";
    normalized.isPublished = true;
    normalized.isSystem = true;
    normalized.canDelete = false;
    normalized.template = "home";
    normalized.pageType = "home";
    normalized.showInSiteEditor = true;
    normalized.showInNavigation = false;
    normalized.sortOrder = 1;
    normalized.updatedAt = now();

    await col.updateOne({ _id: normalized._id }, { $set: normalized }, { upsert: false });
    return serializePage(await col.findOne({ _id: normalized._id }));
}

async function uniqueSlug(field, base, ignoreId = null) {
    const col = collection();
    const safeBase = slugify(base || "pagina");
    let candidate = safeBase;
    let suffix = 2;
    while (true) {
        const query = { deletedAt: null, [field]: candidate };
        if (ignoreId && isObjectId(ignoreId)) query._id = { $ne: asObjectId(ignoreId) };
        const exists = await col.findOne(query, { projection: { _id: 1 } });
        if (!exists) return candidate;
        candidate = `${safeBase}-${suffix}`;
        suffix += 1;
    }
}

async function saveNormalizedPage(page, userId = null) {
    const normalized = normalizePage({ ...page, updatedBy: userId ?? page.updatedBy, updatedAt: now() });
    await collection().updateOne({ _id: normalized._id }, { $set: normalized }, { upsert: false });
    return findPage(normalized._id);
}

async function listPages() {
    await ensureIndexes();
    await ensureHomePage();
    const docs = await collection().find({ deletedAt: null, showInSiteEditor: { $ne: false } }).sort({ sortOrder: 1, updatedAt: -1 }).toArray();
    return docs.map(pageSummary);
}

async function findPage(value = "home") {
    await ensureIndexes();
    if (shouldBootstrapHome(value)) await ensureHomePage();
    const doc = await collection().findOne(queryFor(value));
    if (!doc && shouldBootstrapHome(value)) return ensureHomePage();
    return doc ? serializePage(doc) : null;
}

async function findPublicPage(value = "home") {
    const page = await findPage(value);
    if (!page || page.isPublished === false) return null;
    const sections = (page.sections || []).filter((section) => section.isVisible !== false).map((section) => ({
        ...section,
        blocks: (section.blocks || []).filter((block) => block.isVisible !== false)
    }));
    return { ...page, sections, blocks: flattenSections(sections).map(serializeBlock) };
}

async function createPage(body = {}, userId = null) {
    await ensureIndexes();
    const title = cleanText(body.title, "Nueva página") || "Nueva página";
    const slug = await uniqueSlug("slug", body.slug || title);
    const key = await uniqueSlug("key", body.key || slug);
    const section = normalizeSection({
        type: "generic_section",
        name: "Contenido principal",
        position: 1,
        isVisible: true,
        layout: "stack",
        blocks: [{ type: "custom_html", name: "Contenido principal", position: 1, isVisible: true, content: { title, html: `<p>Edita el contenido de ${title} desde el Editor del Sitio.</p>` }, style: { marginTop: 0, marginBottom: 24 }, settings: {} }]
    });
    const page = normalizePage({
        ...body,
        _id: newId(),
        key,
        slug,
        title,
        isSystem: false,
        canDelete: true,
        pageType: body.pageType || "custom",
        template: body.template || "page",
        isPublished: toBool(body.isPublished, false),
        showInSiteEditor: true,
        navigationLabel: cleanText(body.navigationLabel, title) || title,
        sections: Array.isArray(body.sections) && body.sections.length ? body.sections : [section],
        createdBy: userId,
        updatedBy: userId,
        createdAt: now(),
        updatedAt: now(),
        deletedAt: null
    });
    await collection().insertOne(page);
    return serializePage(page);
}

async function updatePage(value, body = {}, userId = null) {
    await ensureIndexes();
    const current = await findPage(value);
    if (!current) return null;
    const isHome = current.key === "home";
    const update = {
        title: cleanText(body.title, current.title) || current.title,
        description: cleanText(body.description, current.description || ""),
        isPublished: isHome ? true : toBool(body.isPublished, current.isPublished !== false),
        showInNavigation: isHome ? false : toBool(body.showInNavigation, current.showInNavigation === true),
        navigationLabel: cleanText(body.navigationLabel, current.navigationLabel || current.title) || current.title,
        seo: normalizeSeo(body.seo || current.seo || {}, body.title || current.title),
        updatedBy: userId,
        updatedAt: now()
    };
    if (!isHome) {
        update.slug = await uniqueSlug("slug", body.slug || current.slug || current.title, current._id);
        update.key = await uniqueSlug("key", body.key || current.key || update.slug, current._id);
        update.isSystem = false;
        update.canDelete = true;
        update.pageType = slugify(body.pageType || current.pageType || "custom");
        update.template = slugify(body.template || current.template || "page");
        update.sortOrder = toNumber(body.sortOrder, current.sortOrder || 100);
    } else {
        update.key = "home";
        update.slug = "inicio";
        update.isSystem = true;
        update.canDelete = false;
        update.pageType = "home";
        update.template = "home";
        update.sortOrder = 1;
        update.showInSiteEditor = true;
    }
    await collection().updateOne({ _id: asObjectId(current._id) }, { $set: update });
    return findPage(current._id);
}

async function deletePage(value) {
    const current = await findPage(value);
    if (!current) return null;
    if (current.key === "home" || current.isSystem || current.canDelete === false) {
        const error = new Error("La página Inicio es del sistema y no se puede eliminar.");
        error.statusCode = 400;
        error.expose = true;
        throw error;
    }
    await collection().updateOne({ _id: asObjectId(current._id) }, { $set: { deletedAt: now(), isPublished: false, showInSiteEditor: false, updatedAt: now() } });
    return { deletedId: current._id };
}

function findSection(page, sectionValue = "") {
    const sections = sortSections(page.sections || []);
    const raw = String(sectionValue || "");
    if (raw) {
        const match = sections.find((section) => String(section._id) === raw || String(section.id) === raw || slugify(section.name) === slugify(raw));
        if (match) return match;
    }
    return sections[0] || null;
}

function findBlockLocation(page, blockValue) {
    const sections = sortSections(page.sections || []);
    for (const section of sections) {
        const blocks = sortBlocks(section.blocks || [], String(section._id));
        const index = blocks.findIndex((block) => String(block._id) === String(blockValue) || String(block.id) === String(blockValue));
        if (index >= 0) return { sections, section, blocks, index, block: blocks[index] };
    }
    return null;
}

async function addSection(pageValue, body = {}, userId = null) {
    const page = await findPage(pageValue);
    if (!page) return null;
    const sections = sortSections(page.sections || []);
    const section = normalizeSection({
        ...body,
        _id: newId(),
        position: toNumber(body.position, sections.length + 1),
        name: cleanText(body.name, body.title || "Nueva sección") || "Nueva sección",
        type: body.type || "generic_section",
        layout: body.layout || "stack",
        blocks: Array.isArray(body.blocks) ? body.blocks : [],
        createdAt: now(),
        updatedAt: now()
    });
    sections.push(section);
    const saved = await saveNormalizedPage({ ...page, sections }, userId);
    return { page: saved, section: (saved.sections || []).find((item) => String(item._id) === String(section._id)) || null };
}

async function updateSection(pageValue, sectionValue, body = {}, userId = null) {
    const page = await findPage(pageValue);
    if (!page) return null;
    const sections = sortSections(page.sections || []);
    const index = sections.findIndex((section) => String(section._id) === String(sectionValue) || String(section.id) === String(sectionValue));
    if (index < 0) {
        const error = new Error("Sección no encontrada.");
        error.statusCode = 404;
        error.expose = true;
        throw error;
    }
    sections[index] = normalizeSection({
        ...sections[index],
        type: Object.prototype.hasOwnProperty.call(body, "type") ? body.type : sections[index].type,
        name: Object.prototype.hasOwnProperty.call(body, "name") ? body.name : sections[index].name,
        isVisible: Object.prototype.hasOwnProperty.call(body, "isVisible") ? body.isVisible : sections[index].isVisible,
        layout: Object.prototype.hasOwnProperty.call(body, "layout") ? body.layout : sections[index].layout,
        content: Object.prototype.hasOwnProperty.call(body, "content") ? body.content : sections[index].content,
        style: Object.prototype.hasOwnProperty.call(body, "style") ? body.style : sections[index].style,
        settings: Object.prototype.hasOwnProperty.call(body, "settings") ? body.settings : sections[index].settings,
        updatedAt: now()
    }, index);
    const saved = await saveNormalizedPage({ ...page, sections }, userId);
    return { page: saved, section: (saved.sections || []).find((item) => String(item._id) === String(sectionValue)) || null };
}

async function deleteSection(pageValue, sectionValue, userId = null) {
    const page = await findPage(pageValue);
    if (!page) return null;
    const sections = sortSections(page.sections || []);
    if (sections.length <= 1) {
        const error = new Error("La página debe mantener al menos una sección.");
        error.statusCode = 400;
        error.expose = true;
        throw error;
    }
    const nextSections = sections.filter((section) => String(section._id) !== String(sectionValue));
    if (nextSections.length === sections.length) {
        const error = new Error("Sección no encontrada.");
        error.statusCode = 404;
        error.expose = true;
        throw error;
    }
    return saveNormalizedPage({ ...page, sections: nextSections }, userId);
}

async function reorderSections(pageValue, order = [], userId = null) {
    const page = await findPage(pageValue);
    if (!page) return null;
    const positionMap = new Map((Array.isArray(order) ? order : []).map((item) => [String(item.sectionId || item._id || item.id), toNumber(item.position, 0)]));
    const sections = sortSections((page.sections || []).map((section) => ({ ...section, position: positionMap.get(String(section._id)) || section.position })));
    return saveNormalizedPage({ ...page, sections }, userId);
}

async function addBlock(pageValue, body = {}, userId = null) {
    const page = await findPage(pageValue);
    if (!page) return null;
    const sections = sortSections(page.sections || []);
    let section = findSection({ sections }, body.sectionId || body.section || "");
    if (!section) {
        section = normalizeSection({ type: "generic_section", name: "Contenido", position: 1, blocks: [] });
        sections.push(section);
    }
    const sectionIndex = sections.findIndex((item) => String(item._id) === String(section._id));
    const newBlock = normalizeBlock({ ...body, _id: newId(), position: toNumber(body.position, (section.blocks || []).length + 1), createdAt: now(), updatedAt: now() }, 0, String(section._id));
    sections[sectionIndex].blocks = sortBlocks([...(sections[sectionIndex].blocks || []), newBlock], String(section._id));
    const saved = await saveNormalizedPage({ ...page, sections }, userId);
    return { page: saved, block: (saved.blocks || []).find((item) => String(item._id) === String(newBlock._id)) || null };
}

async function updateBlock(pageValue, blockValue, body = {}, userId = null) {
    const page = await findPage(pageValue);
    if (!page) return null;
    const location = findBlockLocation(page, blockValue);
    if (!location) {
        const error = new Error("Bloque no encontrado.");
        error.statusCode = 404;
        error.expose = true;
        throw error;
    }
    const { sections, section, blocks, index, block: current } = location;
    const targetSectionId = body.sectionId || body.section;
    const updated = normalizeBlock({
        ...current,
        type: Object.prototype.hasOwnProperty.call(body, "type") ? body.type : current.type,
        position: Object.prototype.hasOwnProperty.call(body, "position") ? body.position : current.position,
        name: Object.prototype.hasOwnProperty.call(body, "name") ? body.name : current.name,
        isVisible: Object.prototype.hasOwnProperty.call(body, "isVisible") ? body.isVisible : current.isVisible,
        content: Object.prototype.hasOwnProperty.call(body, "content") ? body.content : current.content,
        style: Object.prototype.hasOwnProperty.call(body, "style") ? body.style : current.style,
        settings: Object.prototype.hasOwnProperty.call(body, "settings") ? body.settings : current.settings,
        updatedAt: now()
    }, index, targetSectionId || String(section._id));

    const sourceIndex = sections.findIndex((item) => String(item._id) === String(section._id));
    blocks.splice(index, 1);
    sections[sourceIndex].blocks = sortBlocks(blocks, String(section._id));

    const destination = targetSectionId ? findSection({ sections }, targetSectionId) : section;
    const destinationIndex = sections.findIndex((item) => String(item._id) === String(destination._id));
    sections[destinationIndex].blocks = sortBlocks([...(sections[destinationIndex].blocks || []), updated], String(destination._id));

    const saved = await saveNormalizedPage({ ...page, sections }, userId);
    return { page: saved, block: (saved.blocks || []).find((item) => String(item._id) === String(blockValue)) || null };
}

async function deleteBlock(pageValue, blockValue, userId = null) {
    const page = await findPage(pageValue);
    if (!page) return null;
    const location = findBlockLocation(page, blockValue);
    if (!location) return null;
    const { sections, section, blocks } = location;
    const sourceIndex = sections.findIndex((item) => String(item._id) === String(section._id));
    sections[sourceIndex].blocks = sortBlocks(blocks.filter((block) => String(block._id) !== String(blockValue)), String(section._id));
    return saveNormalizedPage({ ...page, sections }, userId);
}

async function reorderBlocks(pageValue, order = [], userId = null) {
    const page = await findPage(pageValue);
    if (!page) return null;
    const sections = sortSections(page.sections || []);
    const positionMap = new Map((Array.isArray(order) ? order : []).map((item) => [String(item.blockId || item._id || item.id), {
        position: toNumber(item.position, 0),
        sectionId: item.sectionId ? String(item.sectionId) : ""
    }]));
    sections.forEach((section) => {
        section.blocks = sortBlocks((section.blocks || []).map((block) => ({ ...block, position: positionMap.get(String(block._id))?.position || block.position })), String(section._id));
    });
    return saveNormalizedPage({ ...page, sections }, userId);
}


function normalizeNavigationHref(page = {}) {
    if (page.key === "home" || page.slug === "inicio") return "index.html";
    return `pagina.html?slug=${encodeURIComponent(page.slug || page.key || "")}`;
}

function defaultNavigationItems() {
    return [
        { label: "Inicio", href: "index.html", source: "system", sortOrder: 1, isSystem: true },
        { label: "Tienda", href: "catalogo.html", source: "system", sortOrder: 10, isSystem: true },
        { label: "Crea tu Escena", href: "pedido-personalizado.html", source: "system", sortOrder: 20, isSystem: true },
        { label: "Sobre Nosotros", href: "quienes-somos.html", source: "system", sortOrder: 90, isSystem: true },
        { label: "Contáctanos", href: "contacto.html", source: "system", sortOrder: 100, isSystem: true },
        { label: "Preguntas Frecuentes", href: "preguntas-frecuentes.html", source: "system", sortOrder: 110, isSystem: true }
    ];
}

async function listNavigationPages() {
    await ensureIndexes();
    await ensureHomePage();
    const docs = await collection()
        .find({
            deletedAt: null,
            isPublished: { $ne: false },
            showInNavigation: true
        })
        .sort({ sortOrder: 1, title: 1 })
        .toArray();

    const dynamicItems = docs
        .map(serializePage)
        .filter((page) => page.key !== "home" && page.slug !== "inicio")
        .map((page) => ({
            label: cleanText(page.navigationLabel, page.title) || page.title || "Página",
            href: normalizeNavigationHref(page),
            pageId: page._id,
            slug: page.slug,
            source: "cms",
            sortOrder: toNumber(page.sortOrder, 50),
            isSystem: false
        }));

    const seen = new Set();
    return [...defaultNavigationItems(), ...dynamicItems]
        .sort((a, b) => toNumber(a.sortOrder, 999) - toNumber(b.sortOrder, 999) || String(a.label).localeCompare(String(b.label), "es"))
        .filter((item) => {
            const key = `${item.href}|${item.label}`.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
}

async function diagnostic() {
    await ensureIndexes();
    const col = collection();
    const totalPages = await col.countDocuments({ deletedAt: null });
    const visiblePages = await col.countDocuments({ deletedAt: null, showInSiteEditor: { $ne: false } });
    const home = await ensureHomePage();
    return {
        ok: true,
        module: "Editor del Sitio",
        storage: COLLECTION_NAME,
        version: "2.6-visual-editors",
        totalPages,
        visiblePages,
        home: {
            id: home._id,
            key: home.key,
            slug: home.slug,
            title: home.title,
            sectionsCount: Array.isArray(home.sections) ? home.sections.length : 0,
            blocksCount: Array.isArray(home.blocks) ? home.blocks.length : 0,
            updatedAt: home.updatedAt
        }
    };
}

module.exports = {
    COLLECTION_NAME,
    slugify,
    normalizeBlockType,
    normalizeSectionType,
    shouldBootstrapHome,
    defaultHomePage,
    defaultHomeSections,
    ensureHomePage,
    listPages,
    findPage,
    findPublicPage,
    listNavigationPages,
    createPage,
    updatePage,
    deletePage,
    addSection,
    updateSection,
    deleteSection,
    reorderSections,
    addBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks,
    diagnostic,
    serializePage,
    pageSummary,
    sortBlocks,
    sortSections
};
