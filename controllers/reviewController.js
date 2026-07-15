"use strict";

const mongoose = require("mongoose");
const Resena = require("../models/Resena");

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
    const reviews = await Resena.find({ producto: req.params.productoId, estado: "aprobada" })
      .sort({ destacada: -1, publicadoEn: -1, createdAt: -1 }).lean();
    res.set("Cache-Control", "no-store");
    return res.json({ resenas: reviews, resumen: summary(reviews) });
  } catch (error) { next(error); }
}

module.exports = { listProductReviews, summary };
