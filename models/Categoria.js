"use strict";

const mongoose = require("mongoose");
const { createSlug } = require("../utils/values");

const categorySchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: true,
            trim: true,
            maxlength: 80
        },
        slug: {
            type: String,
            trim: true,
            lowercase: true,
            maxlength: 100,
            index: true,
            unique: true,
            sparse: true
        },
        descripcion: {
            type: String,
            trim: true,
            maxlength: 280,
            default: ""
        },
        icono: {
            type: String,
            trim: true,
            maxlength: 80,
            default: "fa-solid fa-tag"
        },
        imagen: {
            type: String,
            trim: true,
            maxlength: 1200,
            default: ""
        },
        color: {
            type: String,
            trim: true,
            maxlength: 20,
            default: "#219EBC"
        },
        activa: {
            type: Boolean,
            default: true
        },
        mostrarMenu: {
            type: Boolean,
            default: true
        },
        mostrarInicio: {
            type: Boolean,
            default: true
        },
        destacada: {
            type: Boolean,
            default: false
        },
        orden: {
            type: Number,
            default: 0,
            min: 0,
            max: 9999
        }
    },
    {
        timestamps: true,
        collection: "categorias",
        minimize: false
    }
);

categorySchema.pre("validate", function setSlug(next) {
    if (!this.slug && this.nombre) {
        this.slug = createSlug(this.nombre);
    }

    next();
});

categorySchema.index({ activa: 1, mostrarMenu: 1, orden: 1 });
categorySchema.index({ activa: 1, mostrarInicio: 1, orden: 1 });
categorySchema.index({ nombre: 1 });

module.exports =
    mongoose.models.Categoria ||
    mongoose.model("Categoria", categorySchema);
