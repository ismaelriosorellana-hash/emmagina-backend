"use strict";

const crypto = require("crypto");
const SiteSettings = require("../models/SiteSettings");
const { cloneDefaultSiteSettings, mergeSiteSettings } = require("../services/siteSettingsDefaults");
const { normalizeSiteSettings } = require("../utils/siteSettingsNormalizer");
const { cleanSegment, uploadBuffer, toAsset, deleteAsset } = require("../services/uploadService");
const { securityEvent } = require("../utils/securityLogger");

function firstFile(files, field) {
    return Array.isArray(files?.[field]) ? files[field][0] : null;
}

async function getSettings(req, res, next) {
    try {
        const saved = await SiteSettings.findOne({ key: "main" })
            .populate("updatedBy", "nombre email")
            .lean();
        res.json({ settings: saved ? mergeSiteSettings(saved) : cloneDefaultSiteSettings(), customized: Boolean(saved) });
    } catch (error) {
        next(error);
    }
}

async function updateSettings(req, res, next) {
    try {
        const fallback = cloneDefaultSiteSettings();
        const normalized = normalizeSiteSettings(req.body, fallback);
        const existing = await SiteSettings.findOne({ key: "main" }).lean();
        const previousPaused = Boolean(existing?.storeStatus?.paused);
        if (Boolean(normalized.storeStatus?.paused) !== previousPaused) {
            normalized.storeStatus.updatedAt = new Date();
        } else {
            normalized.storeStatus.updatedAt = existing?.storeStatus?.updatedAt || normalized.storeStatus.updatedAt || null;
        }

        const analyticsSnapshot = JSON.stringify({
            enabled: Boolean(existing?.analytics?.enabled),
            ga4MeasurementId: existing?.analytics?.ga4MeasurementId || "",
            clarityProjectId: existing?.analytics?.clarityProjectId || "",
            anonymizeIp: existing?.analytics?.anonymizeIp !== false,
            trackEcommerce: existing?.analytics?.trackEcommerce !== false
        });
        const normalizedAnalyticsSnapshot = JSON.stringify({
            enabled: Boolean(normalized.analytics?.enabled),
            ga4MeasurementId: normalized.analytics?.ga4MeasurementId || "",
            clarityProjectId: normalized.analytics?.clarityProjectId || "",
            anonymizeIp: normalized.analytics?.anonymizeIp !== false,
            trackEcommerce: normalized.analytics?.trackEcommerce !== false
        });
        if (analyticsSnapshot !== normalizedAnalyticsSnapshot) {
            normalized.analytics.updatedAt = new Date();
        } else {
            normalized.analytics.updatedAt = existing?.analytics?.updatedAt || normalized.analytics.updatedAt || null;
        }
        const revision = Number(existing?.revision || 0) + 1;
        const settings = await SiteSettings.findOneAndUpdate(
            { key: "main" },
            { $set: { ...normalized, updatedBy: req.user._id, revision } },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        ).populate("updatedBy", "nombre email").lean();

        const obsoleteAssets = [
            existing?.branding?.logo?.publicId && existing.branding.logo.publicId !== normalized.branding.logo.publicId
                ? existing.branding.logo.publicId
                : "",
            existing?.branding?.title?.publicId && existing.branding.title.publicId !== normalized.branding.title.publicId
                ? existing.branding.title.publicId
                : ""
        ].filter(Boolean);

        await Promise.allSettled(obsoleteAssets.map((publicId) => deleteAsset(publicId)));

        securityEvent(req, "site_settings_updated", { revision });
        res.json({ mensaje: "La apariencia del sitio fue guardada.", settings, customized: true });
    } catch (error) {
        next(error);
    }
}

async function resetSettings(req, res, next) {
    try {
        const existing = await SiteSettings.findOne({ key: "main" }).lean();
        await SiteSettings.deleteOne({ key: "main" });
        const assets = [
            existing?.branding?.logo?.publicId,
            existing?.branding?.title?.publicId
        ].filter(Boolean);
        await Promise.allSettled(assets.map((publicId) => deleteAsset(publicId)));
        securityEvent(req, "site_settings_reset", {});
        res.json({ mensaje: "Se restauró la apariencia predeterminada.", settings: cloneDefaultSiteSettings(), customized: false });
    } catch (error) {
        next(error);
    }
}

async function uploadBrandAsset(req, res, next) {
    try {
        const file = firstFile(req.files, "image");
        if (!file) return res.status(400).json({ error: "Selecciona una imagen." });

        const type = String(req.body.type || "logo").toLowerCase() === "title" ? "title" : "logo";
        const folderRoot = String(process.env.CLOUDINARY_SITE_FOLDER || "emmagina/sitio")
            .split("/").map((part) => cleanSegment(part, "sitio")).join("/");
        const token = cleanSegment(`${type}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`, type);
        const result = await uploadBuffer(file.buffer, {
            folder: `${folderRoot}/identidad`,
            publicId: token,
            context: { assetType: type, uploadedBy: String(req.user?._id || "admin") },
            tags: ["emmagina", "site-branding", type]
        });

        const asset = toAsset(result, file);
        securityEvent(req, "site_brand_asset_uploaded", { type, publicId: asset.publicId });
        res.status(201).json({ type, asset });
    } catch (error) {
        next(error);
    }
}

module.exports = { getSettings, updateSettings, resetSettings, uploadBrandAsset };
