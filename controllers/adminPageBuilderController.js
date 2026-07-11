"use strict";

const mongoose = require("mongoose");
const Page = require("../models/Page");

function cleanPageKey(value) {
    return String(value || "").trim().toLowerCase();
}

function sortBlocks(blocks = []) {
    return [...blocks].sort((a, b) => Number(a.position || 0) - Number(b.position || 0));
}

async function findPageByIdKeyOrSlug(pageId) {
    const value = cleanPageKey(pageId);
    const query = mongoose.Types.ObjectId.isValid(value)
        ? { $or: [{ _id: value }, { key: value }, { slug: value }] }
        : { $or: [{ key: value }, { slug: value }] };

    return Page.findOne(query);
}

async function listPages(req, res, next) {
    try {
        const pages = await Page.find()
            .select("key title slug description isPublished updatedAt blocks")
            .sort({ updatedAt: -1 })
            .lean();

        res.json(pages.map((page) => ({
            ...page,
            blocksCount: Array.isArray(page.blocks) ? page.blocks.length : 0,
            blocks: undefined
        })));
    } catch (error) {
        next(error);
    }
}

async function getPage(req, res, next) {
    try {
        const page = await findPageByIdKeyOrSlug(req.params.pageId).lean();

        if (!page) {
            return res.status(404).json({ error: "Página no encontrada." });
        }

        page.blocks = sortBlocks(page.blocks);
        res.json(page);
    } catch (error) {
        next(error);
    }
}

async function createPage(req, res, next) {
    try {
        const payload = {
            key: cleanPageKey(req.body.key),
            title: req.body.title || "Nueva página",
            slug: cleanPageKey(req.body.slug || req.body.key),
            description: req.body.description || "",
            isPublished: req.body.isPublished !== false,
            blocks: Array.isArray(req.body.blocks) ? req.body.blocks : [],
            seo: req.body.seo || {},
            createdBy: req.user?._id || null,
            updatedBy: req.user?._id || null
        };

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

        const allowed = ["title", "description", "isPublished", "seo"];
        for (const field of allowed) {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                page[field] = req.body[field];
            }
        }

        if (req.body.slug) {
            page.slug = cleanPageKey(req.body.slug);
        }

        page.updatedBy = req.user?._id || null;
        await page.save();

        res.json(page);
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
            type: req.body.type,
            position: nextPosition,
            name: req.body.name || req.body.type,
            isVisible: req.body.isVisible !== false,
            content: req.body.content || {},
            style: req.body.style || {},
            settings: req.body.settings || {}
        };

        page.blocks.push(block);
        page.blocks = sortBlocks(page.blocks).map((item, index) => {
            item.position = index + 1;
            return item;
        });
        page.updatedBy = req.user?._id || null;
        await page.save();

        const created = page.blocks[page.blocks.length - 1];
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

        const allowed = ["type", "position", "name", "isVisible", "content", "style", "settings"];
        for (const field of allowed) {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                block[field] = req.body[field];
            }
        }

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
        page.blocks = sortBlocks(page.blocks).map((item, index) => {
            item.position = index + 1;
            return item;
        });
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

        const blocksOrder = Array.isArray(req.body.blocks)
            ? req.body.blocks
            : [];

        if (!blocksOrder.length) {
            return res.status(400).json({ error: "Debes enviar el arreglo blocks con blockId y position." });
        }

        const positionMap = new Map(
            blocksOrder.map((item) => [String(item.blockId || item._id), Number(item.position)])
        );

        page.blocks.forEach((block) => {
            const position = positionMap.get(String(block._id));
            if (Number.isFinite(position)) {
                block.position = position;
            }
        });

        page.blocks = sortBlocks(page.blocks).map((item, index) => {
            item.position = index + 1;
            return item;
        });
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
    addBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks
};
