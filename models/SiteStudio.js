"use strict";

const mongoose = require("mongoose");

const buttonSchema = new mongoose.Schema(
    {
        label: { type: String, default: "", trim: true, maxlength: 120 },
        url: { type: String, default: "", trim: true, maxlength: 1000 },
        style: { type: String, enum: ["primary", "secondary", "link"], default: "primary" },
        openNewTab: { type: Boolean, default: false }
    },
    { _id: false }
);

const sectionSchema = new mongoose.Schema(
    {
        id: { type: String, required: true, trim: true, maxlength: 80 },
        type: {
            type: String,
            enum: ["core", "hero", "richText", "imageText", "cta", "notice", "productGrid", "categoryLinks", "spacer", "divider"],
            required: true
        },
        zone: { type: String, enum: ["main", "left", "right", "before", "after"], default: "main" },
        enabled: { type: Boolean, default: true },
        order: { type: Number, default: 10, min: 0, max: 9999 },
        eyebrow: { type: String, default: "", trim: true, maxlength: 160 },
        title: { type: String, default: "", trim: true, maxlength: 260 },
        body: { type: String, default: "", trim: true, maxlength: 12000 },
        imageUrl: { type: String, default: "", trim: true, maxlength: 1000 },
        imageAlt: { type: String, default: "", trim: true, maxlength: 260 },
        buttonLabel: { type: String, default: "", trim: true, maxlength: 120 },
        buttonUrl: { type: String, default: "", trim: true, maxlength: 1000 },
        buttons: { type: [buttonSchema], default: [] },
        alignment: { type: String, enum: ["left", "center", "right"], default: "left" },
        imagePosition: { type: String, enum: ["left", "right", "top", "background"], default: "right" },
        backgroundColor: { type: String, default: "", trim: true, maxlength: 7 },
        textColor: { type: String, default: "", trim: true, maxlength: 7 },
        paddingY: { type: Number, default: 0, min: 0, max: 180 },
        borderRadius: { type: Number, default: 0, min: 0, max: 80 },
        anchor: { type: String, default: "", trim: true, maxlength: 80 },
        productMode: { type: String, enum: ["featured", "new", "best-sellers", "category", "manual"], default: "featured" },
        productCategory: { type: String, default: "", trim: true, maxlength: 160 },
        productIds: { type: [String], default: [] },
        itemLimit: { type: Number, default: 4, min: 1, max: 24 },
        categoryItems: {
            type: [
                new mongoose.Schema(
                    {
                        label: { type: String, required: true, trim: true, maxlength: 120 },
                        url: { type: String, required: true, trim: true, maxlength: 1000 },
                        imageUrl: { type: String, default: "", trim: true, maxlength: 1000 }
                    },
                    { _id: false }
                )
            ],
            default: []
        }
    },
    { _id: false }
);

const layoutSchema = new mongoose.Schema(
    {
        maxWidth: { type: Number, default: 1320, min: 720, max: 1800 },
        contentPadding: { type: Number, default: 20, min: 0, max: 80 },
        sectionGap: { type: Number, default: 40, min: 0, max: 140 },
        backgroundColor: { type: String, default: "#EAF4F8", trim: true, maxlength: 7 }
    },
    { _id: false }
);

const pageSchema = new mongoose.Schema(
    {
        id: { type: String, required: true, trim: true, maxlength: 80 },
        type: { type: String, enum: ["core", "custom"], default: "core" },
        label: { type: String, required: true, trim: true, maxlength: 160 },
        path: { type: String, required: true, trim: true, maxlength: 500 },
        enabled: { type: Boolean, default: true },
        seoTitle: { type: String, default: "", trim: true, maxlength: 180 },
        seoDescription: { type: String, default: "", trim: true, maxlength: 320 },
        layout: { type: layoutSchema, default: () => ({}) },
        sections: { type: [sectionSchema], default: [] }
    },
    { _id: false }
);

const navigationItemSchema = new mongoose.Schema(
    {
        id: { type: String, required: true, trim: true, maxlength: 80 },
        label: { type: String, required: true, trim: true, maxlength: 120 },
        url: { type: String, default: "", trim: true, maxlength: 1000 },
        kind: { type: String, enum: ["link", "categories", "customization"], default: "link" },
        enabled: { type: Boolean, default: true },
        openNewTab: { type: Boolean, default: false },
        order: { type: Number, default: 10, min: 0, max: 9999 }
    },
    { _id: false }
);

const footerLinkSchema = new mongoose.Schema(
    {
        label: { type: String, required: true, trim: true, maxlength: 120 },
        url: { type: String, required: true, trim: true, maxlength: 1000 },
        enabled: { type: Boolean, default: true },
        order: { type: Number, default: 10, min: 0, max: 9999 }
    },
    { _id: false }
);

const adminItemSchema = new mongoose.Schema(
    {
        id: { type: String, required: true, trim: true, maxlength: 80 },
        label: { type: String, required: true, trim: true, maxlength: 120 },
        href: { type: String, required: true, trim: true, maxlength: 1000 },
        icon: { type: String, default: "fa-link", trim: true, maxlength: 80 },
        enabled: { type: Boolean, default: true },
        order: { type: Number, default: 10, min: 0, max: 9999 },
        custom: { type: Boolean, default: false }
    },
    { _id: false }
);

const siteStudioSchema = new mongoose.Schema(
    {
        key: { type: String, required: true, unique: true, default: "main", enum: ["main"] },
        navigation: {
            items: { type: [navigationItemSchema], default: [] }
        },
        footer: {
            enabled: { type: Boolean, default: true },
            heading: { type: String, default: "Emmagina", trim: true, maxlength: 160 },
            description: { type: String, default: "", trim: true, maxlength: 1200 },
            copyright: { type: String, default: "", trim: true, maxlength: 300 },
            showNewsletter: { type: Boolean, default: true },
            links: { type: [footerLinkSchema], default: [] }
        },
        components: {
            contentMaxWidth: { type: Number, default: 1320, min: 720, max: 1800 },
            buttonRadius: { type: Number, default: 14, min: 0, max: 40 },
            buttonHeight: { type: Number, default: 48, min: 34, max: 72 },
            buttonFontSize: { type: Number, default: 15, min: 11, max: 24 },
            cardRadius: { type: Number, default: 20, min: 0, max: 60 },
            cardShadow: { type: String, enum: ["none", "soft", "medium", "strong"], default: "soft" },
            modalMaxWidth: { type: Number, default: 1120, min: 520, max: 1600 },
            modalRadius: { type: Number, default: 24, min: 0, max: 60 },
            modalOverlayOpacity: { type: Number, default: 0.62, min: 0.2, max: 0.95 },
            headingScale: { type: Number, default: 1, min: 0.75, max: 1.5 },
            bodyScale: { type: Number, default: 1, min: 0.8, max: 1.3 },
            headerSticky: { type: Boolean, default: false }
        },
        adminPanel: {
            accentColor: { type: String, default: "#219EBC", trim: true, maxlength: 7 },
            sidebarBackground: { type: String, default: "#2F2930", trim: true, maxlength: 7 },
            sidebarText: { type: String, default: "#FFFFFF", trim: true, maxlength: 7 },
            items: { type: [adminItemSchema], default: [] }
        },
        pages: { type: [pageSchema], default: [] },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", default: null },
        revision: { type: Number, default: 1, min: 1 }
    },
    {
        timestamps: true,
        collection: "site_studio",
        minimize: false
    }
);

module.exports = mongoose.models.SiteStudio || mongoose.model("SiteStudio", siteStudioSchema);
