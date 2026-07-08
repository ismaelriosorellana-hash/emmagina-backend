"use strict";

const SiteSettings = require("../models/SiteSettings");
const { cloneDefaultSiteSettings, mergeSiteSettings } = require("../services/siteSettingsDefaults");

function publicShape(value) {
    const settings = value?.toObject ? value.toObject() : { ...value };
    delete settings.updatedBy;
    delete settings.__v;
    return settings;
}

async function getResolvedSiteSettings() {
    const saved = await SiteSettings.findOne({ key: "main" }).lean();
    return saved ? mergeSiteSettings(saved) : cloneDefaultSiteSettings();
}

async function getPublicSiteSettings(req, res, next) {
    try {
        res.set("Cache-Control", "no-store, max-age=0, must-revalidate");
        res.set("Pragma", "no-cache");
        res.set("Expires", "0");
        res.json(publicShape(await getResolvedSiteSettings()));
    } catch (error) {
        next(error);
    }
}

module.exports = { getPublicSiteSettings, getResolvedSiteSettings };
