"use strict";

const mongoose = require("mongoose");
const Page = require("../models/Page");
const { ensureDefaultHomePage, shouldBootstrapHome } = require("../services/pageBuilderDefaults");

function cleanText(value, fallback = "") {
    return String(value ?? fallback).trim();
}

function toBool(value, fallback = false) {
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;
    return fallback;
}

function slugify(value) {
    return Page.slugify ? Page.slugify(value) : String(value || "pagina").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "pagina";
}

function sortBlocks(blocks = []) {
    return [...blocks]
        .sort((a, b) => Number(a.position || 0) - Number(b.position || 0))
        .map((block, index) => {
            block.position = index + 1;
            return block;
        });
}

async function uniqueValue(field, base, ignoreId = null) {
    const safeBase = slugify(base);
    let candidate = safeBase;
    let suffix = 2;

    while (true) {
        const query = { [field]: candidate };
        if (ignoreId) query._id = { $ne: ignoreId };
        const exists = await Page.exists(query);
        if (!exists) return candidate;
        candidate = `${safeBase}-${suffix}`;
        suffix += 1;
    }
}

async function normalizePagePayload(body = {}, options = {}) {
    const title = cleanText(body.title, "Nueva página") || "Nueva página";
    const rawSlug = cleanText(body.slug, "") || title;
    const rawKey = cleanText(body.key, "") || rawSlug;

    return {
        key: await uniqueValue("key", rawKey, options.ignoreId),
        title,
        slug: await uniqueValue("slug", rawSlug, options.ignoreId),
        description: cleanText(body.description, ""),
        isPublished: toBool(body.isPublished, true),
        isSystem: toBool(body.isSystem, false),
        canDelete: toBool(body.canDelete, true),
        template: slugify(body.template || body.pageType || "page"),
        pageType: ["home", "landing", "content", "catalog", "product", "checkout", "custom"].includes(String(body.pageType || "").toLowerCase())
            ? String(body.pageType).toLowerCase()
            : "custom",
        showInSiteEditor: toBool(body.showInSiteEditor, true),
        showInNavigation: toBool(body.showInNavigation, false),
        navigationLabel: cleanText(body.navigationLabel, title),
        sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 100,
        blocks: Array.isArray(body.blocks) ? sortBlocks(body.blocks) : [],
        seo: body.seo && typeof body.seo === "object" ? body.seo : {}
    };
}

function findPageQuery(value) {
    const cleaned = slugify(value);
    const or = [{ key: cleaned }, { slug: cleaned }];

    if (mongoose.Types.ObjectId.isValid(String(value || ""))) {
        or.unshift({ _id: String(value) });
    }

    return { $or: or };
}

async function findPageByIdKeyOrSlug(pageId) {
    return Page.findOne(findPageQuery(pageId));
}

function publicPagePath(page = {}) {
    if (page.key === "home" || page.slug === "inicio") return "/";
    return `/pagina.html?slug=${encodeURIComponent(page.slug || page.key || "")}`;
}

function toSummary(page) {
    return {
        _id: page._id,
        key: page.key,
        title: page.title,
        slug: page.slug,
        description: page.description || "",
        isPublished: page.isPublished !== false,
        isSystem: page.isSystem === true,
        canDelete: page.canDelete !== false && page.isSystem !== true,
        template: page.template || "page",
        pageType: page.pageType || "custom",
        showInNavigation: page.showInNavigation === true,
        navigationLabel: page.navigationLabel || page.title,
        sortOrder: Number(page.sortOrder || 100),
        blocksCount: Array.isArray(page.blocks) ? page.blocks.length : 0,
        publicPath: publicPagePath(page),
        updatedAt: page.updatedAt,
        createdAt: page.createdAt
    };
}

async function listPages(req, res, next) {
    try {
        await ensureDefaultHomePage();

        const pages = await Page.find({ showInSiteEditor: { $ne: false } })
            .sort({ sortOrder: 1, updatedAt: -1 })
            .lean();

        res.json(pages.map(toSummary));
    } catch (error) {
        next(error);
    }
}

async function getPage(req, res, next) {
    try {
        let page = await findPageByIdKeyOrSlug(req.params.pageId).lean();

        if (!page && shouldBootstrapHome(req.params.pageId)) {
            page = await ensureDefaultHomePage().then((createdPage) => createdPage.toObject());
        }

        if (!page) {
            return res.status(404).json({ error: "Página no encontrada." });
        }

        page.blocks = sortBlocks(page.blocks || []);
        page.publicPath = publicPagePath(page);
        page.canDelete = page.canDelete !== false && page.isSystem !== true;
        res.json(page);
    } catch (error) {
        next(error);
    }
}

async function createPage(req, res, next) {
    try {
        const payload = await normalizePagePayload(req.body, {});
        payload.createdBy = req.user?._id || null;
        payload.updatedBy = req.user?._id || null;

        if (!Array.isArray(payload.blocks) || !payload.blocks.length) {
            payload.blocks = [
                {
                    type: "custom_html",
                    name: "Contenido principal",
                    position: 1,
                    isVisible: true,
                    content: {
                        title: payload.title,
                        html: `<p>Edita el contenido de ${payload.title} desde el Editor del Sitio.</p>`
                    },
                    style: {}
                }
            ];
        }

        const page = await Page.create(payload);
        res.status(201).json(page);
    } catch (error) {
        next(error);
    }
}

async function updatePage(req, res, next) {
    try {
        const page = await findPageByIdKeyOrSlug(req.params.pageId);

        if (!page) {
            return res.status(404).json({ error: "Página no encontrada." });
        }

        if (Object.prototype.hasOwnProperty.call(req.body, "title")) {
            page.title = cleanText(req.body.title, page.title) || page.title;
        }
        if (Object.prototype.hasOwnProperty.call(req.body, "description")) {
            page.description = cleanText(req.body.description, "");
        }
        if (Object.prototype.hasOwnProperty.call(req.body, "isPublished")) {
            page.isPublished = toBool(req.body.isPublished, page.isPublished !== false);
        }
        if (Object.prototype.hasOwnProperty.call(req.body, "showInNavigation")) {
            page.showInNavigation = toBool(req.body.showInNavigation, page.showInNavigation === true);
        }
        if (Object.prototype.hasOwnProperty.call(req.body, "navigationLabel")) {
            page.navigationLabel = cleanText(req.body.navigationLabel, page.title);
        }
        if (Object.prototype.hasOwnProperty.call(req.body, "sortOrder")) {
            const sortOrder = Number(req.body.sortOrder);
            if (Number.isFinite(sortOrder)) page.sortOrder = sortOrder;
        }
        if (req.body.pageType && !page.isSystem) {
            const value = String(req.body.pageType).toLowerCase();
            if (["home", "landing", "content", "catalog", "product", "checkout", "custom"].includes(value)) {
                page.pageType = value;
            }
        }
        if (req.body.template && !page.isSystem) {
            page.template = slugify(req.body.template);
        }
        if (req.body.slug && !page.isSystem) {
            page.slug = await uniqueValue("slug", req.body.slug, page._id);
        }
        if (req.body.key && !page.isSystem) {
            page.key = await uniqueValue("key", req.body.key, page._id);
        }
        if (req.body.seo && typeof req.body.seo === "object") {
            page.seo = {
                ...(page.seo?.toObject ? page.seo.toObject() : page.seo || {}),
                ...req.body.seo
            };
        }

        page.updatedBy = req.user?._id || null;
        await page.save();
        res.json(page);
    } catch (error) {
        next(error);
    }
}

async function deletePage(req, res, next) {
    try {
        const page = await findPageByIdKeyOrSlug(req.params.pageId);

        if (!page) {
            return res.status(404).json({ error: "Página no encontrada." });
        }

        if (page.isSystem || page.canDelete === false || page.key === "home") {
            return res.status(400).json({ error: "La página Inicio es del sistema y no se puede eliminar." });
        }

        await page.deleteOne();
        res.json({ message: "Página eliminada.", deletedId: page._id });
    } catch (error) {
        next(error);
    }
}

async function addBlock(req, res, next) {
    try {
        const page = await findPageByIdKeyOrSlug(req.params.pageId);

        if (!page) {
            return res.status(404).json({ error: "Página no encontrada." });
        }

        const nextPosition = Number.isFinite(Number(req.body.position))
            ? Number(req.body.position)
            : page.blocks.length + 1;

        const block = {
            type: slugify(req.body.type || "custom_html"),
            position: nextPosition,
            name: cleanText(req.body.name, req.body.type || "Bloque"),
            isVisible: toBool(req.body.isVisible, true),
            content: req.body.content && typeof req.body.content === "object" ? req.body.content : {},
            style: req.body.style && typeof req.body.style === "object" ? req.body.style : {},
            settings: req.body.settings && typeof req.body.settings === "object" ? req.body.settings : {}
        };

        page.blocks.push(block);
        page.blocks = sortBlocks(page.blocks);
        page.updatedBy = req.user?._id || null;
        await page.save();

        const created = page.blocks.find((item) => item.position === nextPosition) || page.blocks[page.blocks.length - 1];
        res.status(201).json({ page, block: created });
    } catch (error) {
        next(error);
    }
}

async function updateBlock(req, res, next) {
    try {
        const page = await findPageByIdKeyOrSlug(req.params.pageId);

        if (!page) {
            return res.status(404).json({ error: "Página no encontrada." });
        }

        const block = page.blocks.id(req.params.blockId);

        if (!block) {
            return res.status(404).json({ error: "Bloque no encontrado." });
        }

        if (Object.prototype.hasOwnProperty.call(req.body, "type")) block.type = slugify(req.body.type || block.type);
        if (Object.prototype.hasOwnProperty.call(req.body, "position")) block.position = Number(req.body.position || block.position);
        if (Object.prototype.hasOwnProperty.call(req.body, "name")) block.name = cleanText(req.body.name, block.name);
        if (Object.prototype.hasOwnProperty.call(req.body, "isVisible")) block.isVisible = toBool(req.body.isVisible, block.isVisible !== false);
        if (Object.prototype.hasOwnProperty.call(req.body, "content")) block.content = req.body.content && typeof req.body.content === "object" ? req.body.content : {};
        if (Object.prototype.hasOwnProperty.call(req.body, "style")) block.style = req.body.style && typeof req.body.style === "object" ? req.body.style : {};
        if (Object.prototype.hasOwnProperty.call(req.body, "settings")) block.settings = req.body.settings && typeof req.body.settings === "object" ? req.body.settings : {};

        page.blocks = sortBlocks(page.blocks);
        page.updatedBy = req.user?._id || null;
        await page.save();

        res.json({ page, block });
    } catch (error) {
        next(error);
    }
}

async function deleteBlock(req, res, next) {
    try {
        const page = await findPageByIdKeyOrSlug(req.params.pageId);

        if (!page) {
            return res.status(404).json({ error: "Página no encontrada." });
        }

        const block = page.blocks.id(req.params.blockId);

        if (!block) {
            return res.status(404).json({ error: "Bloque no encontrado." });
        }

        block.deleteOne();
        page.blocks = sortBlocks(page.blocks);
        page.updatedBy = req.user?._id || null;
        await page.save();

        res.json({ message: "Bloque eliminado.", page });
    } catch (error) {
        next(error);
    }
}

async function reorderBlocks(req, res, next) {
    try {
        const page = await findPageByIdKeyOrSlug(req.params.pageId);

        if (!page) {
            return res.status(404).json({ error: "Página no encontrada." });
        }

        const blocksOrder = Array.isArray(req.body.blocks) ? req.body.blocks : [];

        if (!blocksOrder.length) {
            return res.status(400).json({ error: "Debes enviar el arreglo blocks con blockId y position." });
        }

        const positionMap = new Map(
            blocksOrder.map((item) => [String(item.blockId || item._id), Number(item.position)])
        );

        page.blocks.forEach((block) => {
            const position = positionMap.get(String(block._id));
            if (Number.isFinite(position)) block.position = position;
        });

        page.blocks = sortBlocks(page.blocks);
        page.updatedBy = req.user?._id || null;
        await page.save();

        res.json(page);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    listPages,
    getPage,
    createPage,
    updatePage,
    deletePage,
    addBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks
};
