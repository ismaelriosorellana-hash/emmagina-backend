"use strict";

const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  producto: { type: mongoose.Schema.Types.ObjectId, ref: "Producto", required: true, index: true },
  clienteNombre: { type: String, trim: true, maxlength: 120, required: true },
  clienteEmail: { type: String, trim: true, lowercase: true, maxlength: 180, default: "" },
  titulo: { type: String, trim: true, maxlength: 120, default: "" },
  comentario: { type: String, trim: true, maxlength: 1500, required: true },
  estrellas: { type: Number, required: true, min: 1, max: 5 },
  imagenes: { type: [String], default: [] },
  compraVerificada: { type: Boolean, default: false },
  estado: { type: String, enum: ["pendiente", "aprobada", "oculta"], default: "pendiente", index: true },
  origen: { type: String, enum: ["admin", "cliente"], default: "admin" },
  destacada: { type: Boolean, default: false },
  fechaCompra: { type: Date, default: null },
  publicadoEn: { type: Date, default: null }
}, { timestamps: true, minimize: false });

reviewSchema.index({ producto: 1, estado: 1, createdAt: -1 });

module.exports = mongoose.model("Resena", reviewSchema);
