"use strict";

const Resena = require("../models/Resena");
const Producto = require("../models/Producto");

function clean(body = {}) {
  const state = ["pendiente", "aprobada", "oculta"].includes(body.estado) ? body.estado : "pendiente";
  return {
    producto: body.producto,
    clienteNombre: String(body.clienteNombre || "").trim(),
    clienteEmail: String(body.clienteEmail || "").trim().toLowerCase(),
    titulo: String(body.titulo || "").trim(),
    comentario: String(body.comentario || "").trim(),
    estrellas: Math.max(1, Math.min(5, Number(body.estrellas) || 5)),
    compraVerificada: body.compraVerificada === true,
    destacada: body.destacada === true,
    estado: state,
    origen: "admin",
    publicadoEn: state === "aprobada" ? new Date() : null
  };
}

async function listReviews(req, res, next) {
  try {
    const filter = {};
    if (req.query.estado) filter.estado = req.query.estado;
    if (req.query.producto) filter.producto = req.query.producto;
    const reviews = await Resena.find(filter).populate("producto", "nombre sku slug").sort({ createdAt: -1 }).limit(500).lean();
    return res.json({ resenas: reviews, total: reviews.length });
  } catch (error) { next(error); }
}

async function createReview(req, res, next) {
  try {
    const data = clean(req.body);
    if (!data.producto || !data.clienteNombre || !data.comentario) return res.status(400).json({ error: "Producto, cliente y comentario son obligatorios." });
    const exists = await Producto.exists({ _id: data.producto });
    if (!exists) return res.status(404).json({ error: "Producto no encontrado." });
    const review = await Resena.create(data);
    return res.status(201).json(review);
  } catch (error) { next(error); }
}

async function updateReview(req, res, next) {
  try {
    const data = clean(req.body);
    if (!data.producto || !data.clienteNombre || !data.comentario) return res.status(400).json({ error: "Producto, cliente y comentario son obligatorios." });
    const review = await Resena.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!review) return res.status(404).json({ error: "Reseña no encontrada." });
    return res.json(review);
  } catch (error) { next(error); }
}

async function deleteReview(req, res, next) {
  try {
    const review = await Resena.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ error: "Reseña no encontrada." });
    return res.json({ ok: true });
  } catch (error) { next(error); }
}

module.exports = { listReviews, createReview, updateReview, deleteReview };
