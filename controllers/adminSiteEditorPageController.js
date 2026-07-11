"use strict";

const store = require("../services/siteEditorStore");

function userId(req) {
    return req?.user?._id || req?.user?.id || null;
}

function notFound(res) {
    return res.status(404).json({ error: "Página no encontrada." });
}

async function status(req, res, next) {
    try {
        res.set("Cache-Control", "no-store");
        res.json(await store.diagnostic());
    } catch (error) {
        next(error);
    }
}

async function repair(req, res, next) {
    try {
        const page = await store.ensureHomePage();
        res.set("Cache-Control", "no-store");
        res.json({ message: "Editor del Sitio reparado.", page });
    } catch (error) {
        next(error);
    }
}

async function listPages(req, res, next) {
    try {
        const pages = await store.listPages();
        res.set("Cache-Control", "no-store");
        res.json(pages);
    } catch (error) {
        next(error);
    }
}

async function getPage(req, res, next) {
    try {
        const page = await store.findPage(req.params.pageId || "home");
        if (!page) return notFound(res);
        res.set("Cache-Control", "no-store");
        res.json(page);
    } catch (error) {
        next(error);
    }
}

async function createPage(req, res, next) {
    try {
        const page = await store.createPage(req.body || {}, userId(req));
        res.status(201).json(page);
    } catch (error) {
        next(error);
    }
}

async function updatePage(req, res, next) {
    try {
        const page = await store.updatePage(req.params.pageId, req.body || {}, userId(req));
        if (!page) return notFound(res);
        res.json(page);
    } catch (error) {
        next(error);
    }
}

async function deletePage(req, res, next) {
    try {
        const result = await store.deletePage(req.params.pageId);
        if (!result) return notFound(res);
        res.json({ message: "Página eliminada.", ...result });
    } catch (error) {
        next(error);
    }
}

async function addBlock(req, res, next) {
    try {
        const result = await store.addBlock(req.params.pageId, req.body || {}, userId(req));
        if (!result) return notFound(res);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
}

async function updateBlock(req, res, next) {
    try {
        const result = await store.updateBlock(req.params.pageId, req.params.blockId, req.body || {}, userId(req));
        if (!result) return notFound(res);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

async function deleteBlock(req, res, next) {
    try {
        const page = await store.deleteBlock(req.params.pageId, req.params.blockId, userId(req));
        if (!page) return notFound(res);
        res.json({ message: "Bloque eliminado.", page });
    } catch (error) {
        next(error);
    }
}

async function reorderBlocks(req, res, next) {
    try {
        const page = await store.reorderBlocks(req.params.pageId, req.body?.blocks || [], userId(req));
        if (!page) return notFound(res);
        res.json(page);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    status,
    diagnostic: status,
    repair,
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
