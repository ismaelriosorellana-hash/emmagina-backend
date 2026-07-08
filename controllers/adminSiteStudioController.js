"use strict";

const crypto = require("crypto");
const SiteStudio = require("../models/SiteStudio");
const { cloneDefaultSiteStudio, mergeSiteStudio } = require("../services/siteStudioDefaults");
const { normalizeSiteStudio } = require("../utils/siteStudioNormalizer");
const { cleanSegment, uploadBuffer, toAsset, deleteAsset } = require("../services/uploadService");
const { securityEvent } = require("../utils/securityLogger");

function firstFile(files, field) {
    return Array.isArray(files?.[field]) ? files[field][0] : null;
}

async function getStudio(req, res, next) {
    try {
        const saved = await SiteStudio.findOne({ key: "main" })
            .populate("updatedBy", "nombre email")
            .lean();
        res.json({ studio: saved ? mergeSiteStudio(saved) : cloneDefaultSiteStudio(), customized: Boolean(saved) });
    } catch (error) {
        next(error);
    }
}

async function updateStudio(req, res, next) {
    try {
        const existing = await SiteStudio.findOne({ key: "main" }).lean();
        const fallback = existing ? mergeSiteStudio(existing) : cloneDefaultSiteStudio();
        const normalized = normalizeSiteStudio(req.body, fallback);
        const revision = Number(existing?.revision || 0) + 1;

        const studio = await SiteStudio.findOneAndUpdate(
            { key: "main" },
            { $set: { ...normalized, updatedBy: req.user._id, revision } },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        )
            .populate("updatedBy", "nombre email")
            .lean();

        securityEvent(req, "site_studio_updated", {
            revision,
            pages: studio.pages?.length || 0,
            navigationItems: studio.navigation?.items?.length || 0
        });

        res.json({ mensaje: "El editor del sitio fue guardado.", studio: mergeSiteStudio(studio), customized: true });
    } catch (error) {
        next(error);
    }
}

async function resetStudio(req, res, next) {
    try {
        const existing = await SiteStudio.findOne({ key: "main" }).lean();
        await SiteStudio.deleteOne({ key: "main" });

        const publicIds = [];
        for (const page of existing?.pages || []) {
            for (const section of page.sections || []) {
                if (section.imagePublicId) publicIds.push(section.imagePublicId);
            }
        }
        await Promise.allSettled(publicIds.map((publicId) => deleteAsset(publicId)));
        securityEvent(req, "site_studio_reset", {});
        res.json({ mensaje: "Se restauró el editor del sitio.", studio: cloneDefaultSiteStudio(), customized: false });
    } catch (error) {
        next(error);
    }
}

async function uploadStudioImage(req, res, next) {
    try {
        const file = firstFile(req.files, "image");
        if (!file) return res.status(400).json({ error: "Selecciona una imagen." });

        const folderRoot = String(process.env.CLOUDINARY_SITE_FOLDER || "emmagina/sitio")
            .split("/")
            .map((part) => cleanSegment(part, "sitio"))
            .join("/");
        const token = cleanSegment(`studio-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`, "studio");
        const result = await uploadBuffer(file.buffer, {
            folder: `${folderRoot}/editor`,
            publicId: token,
            context: { assetType: "site-studio", uploadedBy: String(req.user?._id || "admin") },
            tags: ["emmagina", "site-studio"]
        });
        const asset = toAsset(result, file);
        securityEvent(req, "site_studio_image_uploaded", { publicId: asset.publicId });
        res.status(201).json({ asset });
    } catch (error) {
        next(error);
    }
}

module.exports = { getStudio, updateStudio, resetStudio, uploadStudioImage };
