"use strict";

const mongoose = require("mongoose");

function slugify(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "pagina";
}

const blockSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            default: "custom_html"
        },
        position: {
            type: Number,
            required: true,
            default: 1,
            min: 1
        },
        name: {
            type: String,
            trim: true,
            default: "Bloque"
        },
        isVisible: {
            type: Boolean,
            default: true,
            index: true
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
            trim: true,
            default: "Nueva página"
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
        isSystem: {
            type: Boolean,
            default: false,
            index: true
        },
        canDelete: {
            type: Boolean,
            default: true
        },
        template: {
            type: String,
            trim: true,
            lowercase: true,
            default: "page"
        },
        pageType: {
            type: String,
            trim: true,
            lowercase: true,
            enum: ["home", "landing", "content", "catalog", "product", "checkout", "custom"],
            default: "custom"
        },
        showInSiteEditor: {
            type: Boolean,
            default: true,
            index: true
        },
        showInNavigation: {
            type: Boolean,
            default: false
        },
        navigationLabel: {
            type: String,
            trim: true,
            default: ""
        },
        sortOrder: {
            type: Number,
            default: 100
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
    const title = String(this.title || "Nueva página").trim() || "Nueva página";
    this.title = title;

    if (!this.slug) {
        this.slug = slugify(this.key || title);
    } else {
        this.slug = slugify(this.slug);
    }

    if (!this.key) {
        this.key = this.slug;
    } else {
        this.key = slugify(this.key);
    }

    if (!this.navigationLabel) {
        this.navigationLabel = title;
    }

    if (!this.seo) {
        this.seo = {};
    }

    if (!this.seo.title) {
        this.seo.title = title;
    }

    if (Array.isArray(this.blocks)) {
        this.blocks = this.blocks
            .map((block, index) => {
                if (!block.type) block.type = "custom_html";
                if (!block.name) block.name = block.type;
                block.position = Number(block.position || index + 1);
                if (!Number.isFinite(block.position) || block.position < 1) {
                    block.position = index + 1;
                }
                return block;
            })
            .sort((a, b) => Number(a.position || 0) - Number(b.position || 0));

        this.blocks.forEach((block, index) => {
            block.position = index + 1;
        });
    }

    next();
});

pageSchema.index({ key: 1, isPublished: 1 });
pageSchema.index({ slug: 1, isPublished: 1 });
pageSchema.index({ showInSiteEditor: 1, sortOrder: 1 });

pageSchema.statics.slugify = slugify;

module.exports = mongoose.model("Page", pageSchema);
