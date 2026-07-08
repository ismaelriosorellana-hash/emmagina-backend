"use strict";

const SiteContent = require("../models/SiteContent");
const {
    CONTENT_SLUGS,
    cloneDefaultContent
} = require("../services/siteContentDefaults");
const {
    cleanSlug,
    normalizeSiteContent
} = require("../utils/contentNormalizer");
const { securityEvent } = require("../utils/securityLogger");

async function listContent(req, res, next) {
    try {
        const saved = await SiteContent.find({
            slug: { $in: CONTENT_SLUGS }
        })
            .sort({ slug: 1 })
            .populate("updatedBy", "nombre email")
            .lean();

        const bySlug = new Map(saved.map((item) => [item.slug, item]));
        const pages = CONTENT_SLUGS.map((slug) => {
            const value = bySlug.get(slug) || cloneDefaultContent(slug);
            return {
                ...value,
                customized: bySlug.has(slug)
            };
        });

        res.json({ pages });
    } catch (error) {
        next(error);
    }
}

async function getContent(req, res, next) {
    try {
        const slug = cleanSlug(req.params.slug);
        const saved = await SiteContent.findOne({ slug })
            .populate("updatedBy", "nombre email")
            .lean();

        res.json({
            content: saved || cloneDefaultContent(slug),
            customized: Boolean(saved)
        });
    } catch (error) {
        next(error);
    }
}

async function updateContent(req, res, next) {
    try {
        const slug = cleanSlug(req.params.slug);
        const fallback = cloneDefaultContent(slug);
        const normalized = normalizeSiteContent(slug, req.body, fallback);

        const existing = await SiteContent.findOne({ slug }).select("revision").lean();
        const revision = Number(existing?.revision || 0) + 1;

        const content = await SiteContent.findOneAndUpdate(
            { slug },
            {
                $set: {
                    ...normalized,
                    updatedBy: req.user._id,
                    revision
                }
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        )
            .populate("updatedBy", "nombre email")
            .lean();

        securityEvent(req, "site_content_updated", {
            slug,
            revision,
            published: normalized.published
        });

        res.json({
            mensaje: "Contenido guardado correctamente.",
            content,
            customized: true
        });
    } catch (error) {
        next(error);
    }
}

async function resetContent(req, res, next) {
    try {
        const slug = cleanSlug(req.params.slug);
        await SiteContent.deleteOne({ slug });

        securityEvent(req, "site_content_reset", { slug });

        res.json({
            mensaje: "Se restauró el contenido predeterminado.",
            content: cloneDefaultContent(slug),
            customized: false
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    listContent,
    getContent,
    updateContent,
    resetContent
};
