"use strict";

const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
    {
        url: { type: String, default: "", trim: true, maxlength: 1000 },
        publicId: { type: String, default: "", trim: true, maxlength: 300 }
    },
    { _id: false }
);

const logoSchema = new mongoose.Schema(
    {
        ...assetSchema.obj,
        alt: { type: String, default: "Logo Mommy Crafts", trim: true, maxlength: 160 },
        width: { type: Number, default: 52, min: 24, max: 240 },
        offsetX: { type: Number, default: 0, min: -300, max: 300 },
        offsetY: { type: Number, default: 0, min: -160, max: 160 }
    },
    { _id: false }
);

const titleSchema = new mongoose.Schema(
    {
        ...assetSchema.obj,
        mode: { type: String, enum: ["image", "text"], default: "image" },
        text: { type: String, default: "Mommy Crafts", trim: true, maxlength: 120 },
        width: { type: Number, default: 220, min: 60, max: 520 },
        fontSize: { type: Number, default: 32, min: 14, max: 92 },
        offsetX: { type: Number, default: 0, min: -300, max: 300 },
        offsetY: { type: Number, default: 0, min: -160, max: 160 },
        gap: { type: Number, default: 10, min: 0, max: 120 }
    },
    { _id: false }
);

const colorsSchema = new mongoose.Schema(
    {
        primary: { type: String, default: "#FCC0E6" },
        primaryDark: { type: String, default: "#8E456A" },
        primaryDeep: { type: String, default: "#71364F" },
        primarySoft: { type: String, default: "#FFF2FA" },
        secondary: { type: String, default: "#65445A" },
        accent: { type: String, default: "#F59BCF" },
        background: { type: String, default: "#FFF9FD" },
        surface: { type: String, default: "#FFFFFF" },
        surfaceSoft: { type: String, default: "#FFF2FA" },
        text: { type: String, default: "#372A32" },
        textSoft: { type: String, default: "#715F69" },
        border: { type: String, default: "#F0D6E6" },
        headerBackground: { type: String, default: "#FFF9FD" },
        footerBackground: { type: String, default: "#2F292C" },
        footerText: { type: String, default: "#F9F3F5" },
        buttonText: { type: String, default: "#FFFFFF" }
    },
    { _id: false }
);


const announcementItemSchema = new mongoose.Schema(
    {
        text: { type: String, required: true, trim: true, maxlength: 240 },
        url: { type: String, default: "", trim: true, maxlength: 1000 }
    },
    { _id: false }
);

const announcementBarSchema = new mongoose.Schema(
    {
        enabled: { type: Boolean, default: true },
        speedSeconds: { type: Number, default: 22, min: 6, max: 120 },
        backgroundColor: { type: String, default: "#71364F" },
        textColor: { type: String, default: "#FFFFFF" },
        linkColor: { type: String, default: "#FFFFFF" },
        items: { type: [announcementItemSchema], default: () => [] }
    },
    { _id: false }
);



const analyticsSchema = new mongoose.Schema(
    {
        enabled: { type: Boolean, default: false },
        ga4MeasurementId: { type: String, default: "", trim: true, maxlength: 32 },
        clarityProjectId: { type: String, default: "", trim: true, maxlength: 64 },
        anonymizeIp: { type: Boolean, default: true },
        trackEcommerce: { type: Boolean, default: true },
        updatedAt: { type: Date, default: null }
    },
    { _id: false }
);

const storeStatusSchema = new mongoose.Schema(
    {
        paused: { type: Boolean, default: false },
        message: {
            type: String,
            default: "Nuestra tienda online estará disponible próximamente. Si necesitas consultar por un producto, escríbenos por WhatsApp.",
            trim: true,
            maxlength: 500
        },
        whatsappNumber: { type: String, default: "56954633848", trim: true, maxlength: 20 },
        updatedAt: { type: Date, default: null }
    },
    { _id: false }
);

const headerPositionSchema = new mongoose.Schema(
    {
        offsetX: { type: Number, default: 0, min: -300, max: 300 },
        offsetY: { type: Number, default: 0, min: -160, max: 160 }
    },
    { _id: false }
);

const siteSettingsSchema = new mongoose.Schema(
    {
        key: { type: String, required: true, unique: true, default: "main", enum: ["main"] },
        branding: {
            logo: { type: logoSchema, default: () => ({}) },
            title: { type: titleSchema, default: () => ({}) }
        },
        headerLayout: {
            social: { type: headerPositionSchema, default: () => ({}) },
            brand: { type: headerPositionSchema, default: () => ({}) },
            support: { type: headerPositionSchema, default: () => ({}) },
            actions: { type: headerPositionSchema, default: () => ({}) }
        },
        colors: { type: colorsSchema, default: () => ({}) },
        announcementBar: { type: announcementBarSchema, default: () => ({}) },
        storeStatus: { type: storeStatusSchema, default: () => ({}) },
        analytics: { type: analyticsSchema, default: () => ({}) },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", default: null },
        revision: { type: Number, default: 1, min: 1 }
    },
    {
        timestamps: true,
        collection: "site_settings",
        minimize: false
    }
);

module.exports = mongoose.models.SiteSettings || mongoose.model("SiteSettings", siteSettingsSchema);
