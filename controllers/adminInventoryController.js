"use strict";

const MovimientoInventario =
    require("../models/MovimientoInventario");
const Producto =
    require("../models/Producto");

const {
    applyInventoryDelta
} = require("../services/inventoryService");

async function listMovements(
    req,
    res,
    next
) {
    try {
        const filter = {};

        if (req.query.productoId) {
            filter.productoId =
                req.query.productoId;
        }

        const movements =
            await MovimientoInventario.find(
                filter
            )
                .populate(
                    "productoId",
                    "nombre"
                )
                .populate(
                    "usuarioId",
                    "nombre email"
                )
                .sort({
                    createdAt: -1
                })
                .limit(500)
                .lean();

        res.json(movements);
    } catch (error) {
        next(error);
    }
}

async function adjustStock(
    req,
    res,
    next
) {
    try {
        const result =
            await applyInventoryDelta({
                productoId:
                    req.body.productoId,
                varianteId:
                    req.body.varianteId,
                varianteNombre:
                    req.body.varianteNombre,
                cantidad:
                    req.body.cantidad,
                tipo:
                    req.body.tipo ||
                    "ajuste",
                motivo:
                    req.body.motivo ||
                    "Ajuste manual",
                usuarioId:
                    req.user._id
            });

        res.json({
            mensaje:
                "Inventario actualizado.",
            producto:
                result.product,
            movimiento:
                result.movement
        });
    } catch (error) {
        next(error);
    }
}

async function lowStock(
    req,
    res,
    next
) {
    try {
        const limit =
            Number(
                process.env.LOW_STOCK_LIMIT ||
                5
            );

        const products =
            await Producto.find({
                activo: {
                    $ne: false
                },
                stock: {
                    $lte: limit
                }
            })
                .sort({
                    stock: 1
                })
                .lean();

        res.json({
            limite: limit,
            productos: products
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    listMovements,
    adjustStock,
    lowStock
};
