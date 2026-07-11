"use strict";

const mongoose = require("mongoose");

const COLLECTION_NAME = "site_editor_pages";
const HOME_KEYS = new Set(["", "home", "inicio"]);

function now() {
    return new Date();
}

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

function newId() {
    return new mongoose.Types.ObjectId();
}

function isObjectId(value) {
    return mongoose.Types.ObjectId.isValid(String(value || ""));
}

function asObjectId(value) {
    return new mongoose.Types.ObjectId(String(value));
}

function shouldBootstrapHome(value) {
    return HOME_KEYS.has(slugify(value || "home"));
}

function blockId(value) {
    return String(value?._id || value?.id || newId());
}

function normalizeBlock(block = {}, index = 0) {
    const type = slugify(block.type || "custom_html");
    const id = isObjectId(block._id || block.id) ? asObjectId(block._id || block.id) : newId();
    return {
        _id: id,
        type,
        position: Math.max(1, toNumber(block.position, index + 1)),
        name: cleanText(block.name, type || "Bloque") || "Bloque",
        isVisible: toBool(block.isVisible, true),
        content: block.content && typeof block.content === "object" && !Array.isArray(block.content) ? block.content : {},
        style: block.style && typeof block.style === "object" && !Array.isArray(block.style) ? block.style : {},
        settings: block.settings && typeof block.settings === "object" && !Array.isArray(block.settings) ? block.settings : {},
        createdAt: block.createdAt ? new Date(block.createdAt) : now(),
        updatedAt: block.updatedAt ? new Date(block.updatedAt) : now()
    };
}

function sortBlocks(blocks = []) {
    return (Array.isArray(blocks) ? blocks : [])
        .map(normalizeBlock)
        .sort((a, b) => Number(a.position || 0) - Number(b.position || 0))
        .map((block, index) => ({ ...block, position: index + 1 }));
}

function defaultHomePage() {
    const createdAt = now();
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
        blocks: sortBlocks([
            {
                type: "hero_banner",
                name: "Hero principal",
                position: 1,
                isVisible: true,
                content: {
                    title: "Emmagina",
                    subtitle: "Productos impresos en 3D para regalar, decorar y crear recuerdos.",
                    imageDesktop: "",
                    imageMobile: "",
                    buttonText: "Comprar ahora",
                    buttonUrl: "catalogo.html",
                    categories: [
                        "Accesorios", "Coleccionables", "Decoración", "Herramientas", "Línea Memories",
                        "Librería", "Línea Alma", "Ofertas", "Vasos Temáticos", "Todos"
                    ]
                },
                style: { heightDesktop: 323, heightMobile: 220, marginTop: 0, marginBottom: 24 }
            },
            {
                type: "info_cards",
                name: "Bloques informativos",
                position: 2,
                isVisible: true,
                content: {
                    title: "Explora Emmagina",
                    cards: [
                        { title: "Destacados", text: "Selección especial de productos", image: "", href: "catalogo.html?grupo=destacados" },
                        { title: "Más vendidos", text: "Lo favorito de nuestros clientes", image: "", href: "catalogo.html?grupo=vendidos" },
                        { title: "Más vistos", text: "Lo más explorado de la tienda", image: "", href: "catalogo.html?grupo=vistos" }
                    ]
                },
                style: { marginTop: 0, marginBottom: 24 }
            },
            {
                type: "product_marquee",
                name: "Desde $14.990",
                position: 3,
                isVisible: true,
                content: { title: "Desde $14.990", filter: "desde14990", limit: 12 },
                style: { marginTop: 0, marginBottom: 24 }
            },
            {
                type: "product_marquee",
                name: "Lanzamiento",
                position: 4,
                isVisible: true,
                content: { title: "Lanzamiento", filter: "lanzamiento", limit: 12 },
                style: { marginTop: 0, marginBottom: 24 }
            },
            {
                type: "image_banner",
                name: "Línea Memories",
                position: 5,
                isVisible: true,
                content: { title: "Línea Memories", imageDesktop: "", imageMobile: "", buttonText: "Pedir el mío", buttonUrl: "pedido-personalizado.html" },
                style: { heightDesktop: 112, heightMobile: 88, marginTop: 0, marginBottom: 18 }
            },
            {
                type: "image_banner",
                name: "Línea Alma",
                position: 6,
                isVisible: true,
                content: { title: "Línea Alma", imageDesktop: "", imageMobile: "", buttonText: "Pedir el mío", buttonUrl: "pedido-personalizado.html" },
                style: { heightDesktop: 112, heightMobile: 88, marginTop: 0, marginBottom: 18 }
            },
            {
                type: "reviews_marquee",
                name: "Reseñas destacadas",
                position: 7,
                isVisible: true,
                content: { title: "Lo que dicen nuestros clientes", minRating: 4, hideWhenEmpty: true },
                style: { marginTop: 0, marginBottom: 24 }
            }
        ]),
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

function normalizePage(page = {}) {
    const title = cleanText(page.title, "Nueva página") || "Nueva página";
    const key = slugify(page.key || page.slug || title);
    const slug = slugify(page.slug || key || title);
    const isHome = key === "home" || slug === "inicio" || page.pageType === "home";
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
        blocks: sortBlocks(page.blocks || []),
        createdBy: page.createdBy || null,
        updatedBy: page.updatedBy || null,
        createdAt: page.createdAt ? new Date(page.createdAt) : now(),
        updatedAt: page.updatedAt ? new Date(page.updatedAt) : now(),
        deletedAt: page.deletedAt || null
    };
}

function serializeBlock(block = {}) {
    return {
        ...block,
        _id: String(block._id),
        id: String(block._id),
        createdAt: block.createdAt,
        updatedAt: block.updatedAt
    };
}

function serializePage(page = {}) {
    const normalized = normalizePage(page);
    const id = String(normalized._id);
    return {
        ...normalized,
        _id: id,
        id,
        blocks: normalized.blocks.map(serializeBlock),
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
        try {
            await col.insertOne(page);
        } catch (error) {
            if (error && error.code !== 11000) throw error;
        }
        return serializePage(await col.findOne({ key: "home", deletedAt: null }) || page);
    }

    const normalized = normalizePage(existing);
    if (!normalized.blocks.length) normalized.blocks = defaultHomePage().blocks;
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

async function listPages() {
    await ensureIndexes();
    await ensureHomePage();
    const docs = await collection()
        .find({ deletedAt: null, showInSiteEditor: { $ne: false } })
        .sort({ sortOrder: 1, updatedAt: -1 })
        .toArray();
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
    return {
        ...page,
        blocks: (page.blocks || []).filter((block) => block.isVisible !== false)
    };
}

async function createPage(body = {}, userId = null) {
    await ensureIndexes();
    const title = cleanText(body.title, "Nueva página") || "Nueva página";
    const slug = await uniqueSlug("slug", body.slug || title);
    const key = await uniqueSlug("key", body.key || slug);
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
        blocks: Array.isArray(body.blocks) && body.blocks.length ? body.blocks : [{
            type: "custom_html",
            name: "Contenido principal",
            position: 1,
            isVisible: true,
            content: { title, html: `<p>Edita el contenido de ${title} desde el Editor del Sitio.</p>` },
            style: { marginTop: 0, marginBottom: 24 },
            settings: {}
        }],
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

async function addBlock(pageValue, body = {}, userId = null) {
    const page = await findPage(pageValue);
    if (!page) return null;
    const newBlock = normalizeBlock({
        ...body,
        _id: newId(),
        position: toNumber(body.position, (page.blocks || []).length + 1),
        createdAt: now(),
        updatedAt: now()
    });
    const blocks = sortBlocks([...(page.blocks || []), newBlock]);
    await collection().updateOne({ _id: asObjectId(page._id) }, { $set: { blocks, updatedBy: userId, updatedAt: now() } });
    const saved = await findPage(page._id);
    return { page: saved, block: (saved.blocks || []).find((item) => String(item._id) === String(newBlock._id)) || null };
}

async function updateBlock(pageValue, blockValue, body = {}, userId = null) {
    const page = await findPage(pageValue);
    if (!page) return null;
    const blocks = sortBlocks(page.blocks || []);
    const index = blocks.findIndex((block) => String(block._id) === String(blockValue) || String(block.id) === String(blockValue));
    if (index < 0) {
        const error = new Error("Bloque no encontrado.");
        error.statusCode = 404;
        error.expose = true;
        throw error;
    }
    const current = blocks[index];
    blocks[index] = normalizeBlock({
        ...current,
        type: Object.prototype.hasOwnProperty.call(body, "type") ? body.type : current.type,
        position: Object.prototype.hasOwnProperty.call(body, "position") ? body.position : current.position,
        name: Object.prototype.hasOwnProperty.call(body, "name") ? body.name : current.name,
        isVisible: Object.prototype.hasOwnProperty.call(body, "isVisible") ? body.isVisible : current.isVisible,
        content: Object.prototype.hasOwnProperty.call(body, "content") ? body.content : current.content,
        style: Object.prototype.hasOwnProperty.call(body, "style") ? body.style : current.style,
        settings: Object.prototype.hasOwnProperty.call(body, "settings") ? body.settings : current.settings,
        updatedAt: now()
    }, index);
    const normalizedBlocks = sortBlocks(blocks);
    await collection().updateOne({ _id: asObjectId(page._id) }, { $set: { blocks: normalizedBlocks, updatedBy: userId, updatedAt: now() } });
    const saved = await findPage(page._id);
    return { page: saved, block: (saved.blocks || []).find((item) => String(item._id) === String(blockValue)) || null };
}

async function deleteBlock(pageValue, blockValue, userId = null) {
    const page = await findPage(pageValue);
    if (!page) return null;
    const blocks = sortBlocks(page.blocks || []).filter((block) => String(block._id) !== String(blockValue));
    await collection().updateOne({ _id: asObjectId(page._id) }, { $set: { blocks, updatedBy: userId, updatedAt: now() } });
    return findPage(page._id);
}

async function reorderBlocks(pageValue, order = [], userId = null) {
    const page = await findPage(pageValue);
    if (!page) return null;
    const positionMap = new Map((Array.isArray(order) ? order : []).map((item) => [String(item.blockId || item._id || item.id), toNumber(item.position, 0)]));
    const blocks = sortBlocks((page.blocks || []).map((block) => ({
        ...block,
        position: positionMap.get(String(block._id)) || block.position
    })));
    await collection().updateOne({ _id: asObjectId(page._id) }, { $set: { blocks, updatedBy: userId, updatedAt: now() } });
    return findPage(page._id);
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
        totalPages,
        visiblePages,
        home: {
            id: home._id,
            key: home.key,
            slug: home.slug,
            title: home.title,
            blocksCount: Array.isArray(home.blocks) ? home.blocks.length : 0,
            updatedAt: home.updatedAt
        }
    };
}

module.exports = {
    COLLECTION_NAME,
    slugify,
    shouldBootstrapHome,
    defaultHomePage,
    ensureHomePage,
    listPages,
    findPage,
    findPublicPage,
    createPage,
    updatePage,
    deletePage,
    addBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks,
    diagnostic,
    serializePage,
    pageSummary,
    sortBlocks
};
