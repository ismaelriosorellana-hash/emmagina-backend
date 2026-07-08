"use strict";

const mongoose = require("mongoose");
const { CONTENT_SLUGS } = require("../services/siteContentDefaults");

const sectionSchema = new mongoose.Schema(
    {
        title: { type: String, default: "", trim: true, maxlength: 180 },
        body: { type: String, default: "", trim: true, maxlength: 6000 },
        items: { type: [String], default: [] }
    },
    { _id: false }
);

const faqSchema = new mongoose.Schema(
    {
        question: { type: String, default: "", trim: true, maxlength: 260 },
        answer: { type: String, default: "", trim: true, maxlength: 4000 }
    },
    { _id: false }
);

const contactCardSchema = new mongoose.Schema(
    {
        title: { type: String, default: "", trim: true, maxlength: 160 },
        detail: { type: String, default: "", trim: true, maxlength: 2000 },
        actionLabel: { type: String, default: "", trim: true, maxlength: 100 },
        actionUrl: { type: String, default: "", trim: true, maxlength: 500 }
    },
    { _id: false }
);

const siteContentSchema = new mongoose.Schema(
    {
        slug: {
            type: String,
            required: true,
            unique: true,
            enum: CONTENT_SLUGS,
            index: true
        },
        label: { type: String, required: true, trim: true, maxlength: 120 },
        kicker: { type: String, default: "", trim: true, maxlength: 120 },
        title: { type: String, required: true, trim: true, maxlength: 220 },
        summary: { type: String, default: "", trim: true, maxlength: 3000 },
        sections: { type: [sectionSchema], default: [] },
        faqs: { type: [faqSchema], default: [] },
        contactCards: { type: [contactCardSchema], default: [] },
        notice: { type: String, default: "", trim: true, maxlength: 3000 },
        published: { type: Boolean, default: true },
        seoTitle: { type: String, default: "", trim: true, maxlength: 180 },
        seoDescription: { type: String, default: "", trim: true, maxlength: 320 },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Usuario",
            default: null
        },
        revision: { type: Number, default: 1, min: 1 }
    },
    {
        timestamps: true,
        collection: "site_content",
        minimize: false
    }
);

module.exports =
    mongoose.models.SiteContent ||
    mongoose.model("SiteContent", siteContentSchema);
