"use strict";

const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: true,
            trim: true
        },
        eyebrow: {
            type: String,
            default: ""
        },
        titulo: {
            type: String,
            required: true
        },
        textoBoton: {
            type: String,
            default: "Ver productos"
        },
        destino: {
            type: String,
            default: "#lo-mas-vendido"
        },
        destinoTipo: {
            type: String,
            enum: ["seccion", "categoria", "url"],
            default: "seccion"
        },
        categoriaDestino: {
            type: String,
            default: "",
            trim: true
        },
        imagenEscritorio: {
            type: String,
            required: true
        },
        imagenMovil: {
            type: String,
            default: ""
        },
        posicion: {
            type: String,
            default: "center"
        },
        activo: {
            type: Boolean,
            default: true
        },
        orden: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true,
        collection: "banners"
    }
);

module.exports =
    mongoose.models.Banner ||
    mongoose.model("Banner", bannerSchema);
