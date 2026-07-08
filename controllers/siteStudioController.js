"use strict";

const SiteStudio = require("../models/SiteStudio");
const { cloneDefaultSiteStudio, mergeSiteStudio } = require("../services/siteStudioDefaults");

function publicShape(value) {
    const studio = value?.toObject ? value.toObject() : { ...value };
    delete studio.updatedBy;
    delete studio.__v;
    return studio;
}

async function getResolvedSiteStudio() {
    const saved = await SiteStudio.findOne({ key: "main" }).lean();
    return saved ? mergeSiteStudio(saved) : cloneDefaultSiteStudio();
}

async function getPublicSiteStudio(req, res, next) {
    try {
        res.json(publicShape(await getResolvedSiteStudio()));
    } catch (error) {
        next(error);
    }
}

module.exports = { getPublicSiteStudio, getResolvedSiteStudio };
