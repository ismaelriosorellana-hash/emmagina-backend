"use strict";

const SiteContent = require("../models/SiteContent");
const {
    CONTENT_SLUGS,
    cloneDefaultContent
} = require("../services/siteContentDefaults");
const { cleanSlug } = require("../utils/contentNormalizer");

function publicShape(content) {
    const value = content?.toObject ? content.toObject() : { ...content };

    delete value.updatedBy;
    delete value.__v;

    return value;
}

async function getResolvedContent(slug) {
    const saved = await SiteContent.findOne({ slug }).lean();
    return saved || cloneDefaultContent(slug);
}

async function listPublicContent(req, res, next) {
    try {
        const saved = await SiteContent.find({
            slug: { $in: CONTENT_SLUGS }
        }).lean();

        const bySlug = new Map(saved.map((item) => [item.slug, item]));
        const pages = CONTENT_SLUGS
            .map((slug) => bySlug.get(slug) || cloneDefaultContent(slug))
            .filter((item) => item?.published !== false)
            .map((item) => ({
                slug: item.slug,
                label: item.label,
                title: item.title,
                summary: item.summary,
                updatedAt: item.updatedAt || null
            }));

        res.json({ pages });
    } catch (error) {
        next(error);
    }
}

async function getPublicContent(req, res, next) {
    try {
        const slug = cleanSlug(req.params.slug);
        const content = await getResolvedContent(slug);

        if (!content || content.published === false) {
            return res.status(404).json({
                error: "Esta página no está disponible.",
                requestId: req.requestId
            });
        }

        res.json(publicShape(content));
    } catch (error) {
        next(error);
    }
}

module.exports = {
    listPublicContent,
    getPublicContent,
    getResolvedContent
};
