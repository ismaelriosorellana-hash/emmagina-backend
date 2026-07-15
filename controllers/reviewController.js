"use strict";
const mongoose = require("mongoose");
const Resena = require("../models/Resena");
const Pedido = require("../models/Pedido");

function summary(items) {
  const total = items.length;
  const average = total ? items.reduce((sum, item) => sum + Number(item.estrellas || 0), 0) / total : 0;
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  items.forEach((item) => { distribution[item.estrellas] = (distribution[item.estrellas] || 0) + 1; });
  return { total, promedio: Number(average.toFixed(1)), distribucion: distribution };
}
async function listProductReviews(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.productoId)) return res.status(400).json({ error: "Producto inválido." });
    const reviews = await Resena.find({ producto: req.params.productoId, estado: "aprobada", origen: "cliente", compraVerificada: true })
      .sort({ destacada: -1, publicadoEn: -1, createdAt: -1 }).lean();
    res.set("Cache-Control", "no-store");
    return res.json({ resenas: reviews, resumen: summary(reviews) });
  } catch (error) { next(error); }
}
async function listBestReviews(req, res, next) {
  try {
    const reviews = await Resena.find({ estado: "aprobada", origen: "cliente", compraVerificada: true, estrellas: { $gte: 4 } })
      .populate("producto", "nombre slug imagenPrincipal")
      .sort({ destacada: -1, estrellas: -1, publicadoEn: -1, createdAt: -1 })
      .limit(12).lean();
    res.set("Cache-Control", "public, max-age=120");
    return res.json({ resenas: reviews });
  } catch (error) { next(error); }
}
async function reviewEligibility(req, res, next) {
  try {
    const order = await Pedido.findOne({ _id: req.params.pedidoId, usuarioClienteId: req.user._id, estadoPedido: "entregado" }).lean();
    if (!order) return res.status(404).json({ error: "El pedido no está disponible para reseñar." });
    const existing = await Resena.find({ pedido: order._id, usuarioClienteId: req.user._id }).lean();
    const used = new Set(existing.map((r) => r.lineaId));
    const items = (order.items || []).map((item) => ({
      lineaId: item.lineaId,
      productoId: item.productoId,
      nombre: item.nombre,
      imagen: item.imagen,
      puedeResenar: !used.has(item.lineaId),
      resena: existing.find((r) => r.lineaId === item.lineaId) || null
    }));
    return res.json({ pedido: order.numeroPedido, items });
  } catch (error) { next(error); }
}
async function createCustomerReview(req, res, next) {
  try {
    const order = await Pedido.findOne({ _id: req.params.pedidoId, usuarioClienteId: req.user._id, estadoPedido: "entregado" });
    if (!order) return res.status(404).json({ error: "Solo puedes reseñar pedidos recibidos." });
    const item = (order.items || []).find((entry) => String(entry.lineaId) === String(req.params.lineaId));
    if (!item || !mongoose.isValidObjectId(item.productoId)) return res.status(404).json({ error: "Producto no encontrado dentro del pedido." });
    const comentario = String(req.body.comentario || "").trim();
    const titulo = String(req.body.titulo || "").trim();
    const estrellas = Number(req.body.estrellas);
    if (!comentario || comentario.length < 10) return res.status(400).json({ error: "Escribe un comentario de al menos 10 caracteres." });
    if (!Number.isInteger(estrellas) || estrellas < 1 || estrellas > 5) return res.status(400).json({ error: "La valoración debe ser de 1 a 5 estrellas." });
    const review = await Resena.create({
      producto: item.productoId,
      pedido: order._id,
      lineaId: item.lineaId,
      usuarioClienteId: req.user._id,
      clienteNombre: req.user.nombre || order.cliente.nombre,
      clienteEmail: req.user.email || order.cliente.email,
      titulo,
      comentario,
      estrellas,
      compraVerificada: true,
      estado: "pendiente",
      origen: "cliente",
      fechaCompra: order.createdAt
    });
    return res.status(201).json({ resena: review, mensaje: "Tu reseña fue enviada y quedará visible después de su revisión." });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ error: "Ya enviaste una reseña para este producto del pedido." });
    next(error);
  }
}
module.exports = { listProductReviews, listBestReviews, reviewEligibility, createCustomerReview, summary };
