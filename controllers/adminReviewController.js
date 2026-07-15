"use strict";
const Resena = require("../models/Resena");
async function listReviews(req, res, next) {
  try {
    const filter = {};
    if (req.query.estado) filter.estado = req.query.estado;
    if (req.query.producto) filter.producto = req.query.producto;
    const reviews = await Resena.find(filter).populate("producto", "nombre sku slug").populate("pedido", "numeroPedido").sort({ createdAt: -1 }).limit(500).lean();
    return res.json({ resenas: reviews, total: reviews.length });
  } catch (error) { next(error); }
}
async function updateReview(req, res, next) {
  try {
    const update = {};
    if (["pendiente", "aprobada", "oculta"].includes(req.body.estado)) update.estado = req.body.estado;
    if (typeof req.body.destacada === "boolean") update.destacada = req.body.destacada;
    if (update.estado === "aprobada") update.publicadoEn = new Date();
    if (update.estado && update.estado !== "aprobada") update.publicadoEn = null;
    const review = await Resena.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
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
module.exports = { listReviews, updateReview, deleteReview };
