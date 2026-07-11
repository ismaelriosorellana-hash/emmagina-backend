"use strict";

const CmsPage = require("../models/CmsPage");
const CmsTemplate = require("../models/CmsTemplate");
const CmsBlockDefinition = require("../models/CmsBlockDefinition");
const cmsArchitectureService = require("../services/cmsArchitectureService");

async function status(req, res, next) {
    try {
        const [pageCount, templateCount, blockDefinitionCount] = await Promise.all([
            CmsPage.countDocuments({ eliminadoEn: null }),
            CmsTemplate.countDocuments({ activo: true }),
            CmsBlockDefinition.countDocuments({ activo: true })
        ]);
        res.set("Cache-Control", "no-store");
        res.json({
            ok: true,
            versionEsquema: "cms-layout-v1",
            colecciones: {
                paginas: "cms_pages",
                templates: "cms_templates",
                bloques: "cms_block_definitions"
            },
            counts: { pageCount, templateCount, blockDefinitionCount }
        });
    } catch (error) {
        next(error);
    }
}

async function bootstrap(req, res, next) {
    try {
        const summary = await cmsArchitectureService.ensureArchitecture();
        res.set("Cache-Control", "no-store");
        res.json({ message: "Arquitectura CMS preparada.", ...summary });
    } catch (error) {
        next(error);
    }
}

async function schema(req, res, next) {
    try {
        const summary = await cmsArchitectureService.getArchitectureSummary();
        res.set("Cache-Control", "no-store");
        res.json(summary);
    } catch (error) {
        next(error);
    }
}

async function listTemplates(req, res, next) {
    try {
        const templates = await CmsTemplate.find({ activo: true }).sort({ tipoPagina: 1, nombre: 1 }).lean();
        res.set("Cache-Control", "no-store");
        res.json({ templates });
    } catch (error) {
        next(error);
    }
}

async function listBlockDefinitions(req, res, next) {
    try {
        const blocks = await CmsBlockDefinition.find({ activo: true }).sort({ categoria: 1, nombre: 1 }).lean();
        res.set("Cache-Control", "no-store");
        res.json({ blocks });
    } catch (error) {
        next(error);
    }
}

async function listCmsPages(req, res, next) {
    try {
        const pages = await CmsPage.find({ eliminadoEn: null })
            .select("clave titulo slug tipoPagina templateKey estado navegacion sistema editable eliminable tieneCambiosSinPublicar updatedAt publicadoEn")
            .sort({ "navegacion.orden": 1, titulo: 1 })
            .lean();
        res.set("Cache-Control", "no-store");
        res.json({ pages });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    status,
    bootstrap,
    schema,
    listTemplates,
    listBlockDefinitions,
    listCmsPages
};
