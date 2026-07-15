"use strict";
const mongoose = require("mongoose");
const reviewSchema = new mongoose.Schema({
  producto: { type: mongoose.Schema.Types.ObjectId, ref: "Producto", required: true, index: true },
  pedido: { type: mongoose.Schema.Types.ObjectId, ref: "Pedido", required: true, index: true },
  lineaId: { type: String, required: true, trim: true, maxlength: 120 },
  usuarioClienteId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true, index: true },
  clienteNombre: { type: String, trim: true, maxlength: 120, required: true },
  clienteEmail: { type: String, trim: true, lowercase: true, maxlength: 180, default: "" },
  titulo: { type: String, trim: true, maxlength: 120, default: "" },
  comentario: { type: String, trim: true, maxlength: 1500, required: true },
  estrellas: { type: Number, required: true, min: 1, max: 5 },
  imagenes: { type: [String], default: [] },
  compraVerificada: { type: Boolean, default: true },
  estado: { type: String, enum: ["pendiente", "aprobada", "oculta"], default: "pendiente", index: true },
  origen: { type: String, enum: ["cliente"], default: "cliente" },
  destacada: { type: Boolean, default: false },
  fechaCompra: { type: Date, default: null },
  publicadoEn: { type: Date, default: null }
}, { timestamps: true, minimize: false });
reviewSchema.index({ producto: 1, estado: 1, createdAt: -1 });
reviewSchema.index({ pedido: 1, lineaId: 1, usuarioClienteId: 1 }, { unique: true });
module.exports = mongoose.models.Resena || mongoose.model("Resena", reviewSchema);
