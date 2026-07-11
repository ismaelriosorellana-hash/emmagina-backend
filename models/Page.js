"use strict";

const mongoose = require("mongoose");

const blockSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        position: {
            type: Number,
            required: true,
            default: 0,
            min: 0
        },
        name: {
            type: String,
            trim: true,
            default: ""
        },
        isVisible: {
            type: Boolean,
            default: true
        },
        content: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        style: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        settings: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true
    }
);

const pageSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            index: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            index: true
        },
        description: {
            type: String,
            trim: true,
            default: ""
        },
        isPublished: {
            type: Boolean,
            default: true,
            index: true
        },
        blocks: {
            type: [blockSchema],
            default: []
        },
        seo: {
            title: {
                type: String,
                trim: true,
                default: ""
            },
            description: {
                type: String,
                trim: true,
                default: ""
            },
            image: {
                type: String,
                trim: true,
                default: ""
            },
            noIndex: {
                type: Boolean,
                default: false
            }
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Usuario",
            default: null
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Usuario",
            default: null
        }
    },
    {
        timestamps: true
    }
);

pageSchema.pre("validate", function normalizePage(next) {
    if (this.key) {
        this.key = String(this.key).trim().toLowerCase();
    }

    if (this.slug) {
        this.slug = String(this.slug).trim().toLowerCase();
    }

    if (Array.isArray(this.blocks)) {
        this.blocks.sort((a, b) => Number(a.position || 0) - Number(b.position || 0));
        this.blocks.forEach((block, index) => {
            if (block.position === undefined || block.position === null) {
                block.position = index + 1;
            }
        });
    }

    next();
});

pageSchema.index({ key: 1, isPublished: 1 });
pageSchema.index({ slug: 1, isPublished: 1 });

module.exports = mongoose.model("Page", pageSchema);
