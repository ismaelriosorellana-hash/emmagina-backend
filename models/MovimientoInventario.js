"use strict";

const mongoose = require("mongoose");

const inventoryMovementSchema =
    new mongoose.Schema(
        {
            productoId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Producto",
                required: true,
                index: true
            },

            varianteId: {
                type: String,
                default: ""
            },

            varianteNombre: {
                type: String,
                default: ""
            },

            sku: {
                type: String,
                default: ""
            },

            tipo: {
                type: String,
                enum: [
                    "entrada",
                    "salida",
                    "ajuste",
                    "venta",
                    "reserva",
                    "liberacion",
                    "devolucion",
                    "cancelacion"
                ],
                required: true
            },

            cantidad: {
                type: Number,
                required: true
            },

            stockAnterior: {
                type: Number,
                required: true
            },

            stockNuevo: {
                type: Number,
                required: true
            },

            motivo: {
                type: String,
                default: ""
            },

            pedidoId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Pedido",
                default: null
            },

            usuarioId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Usuario",
                default: null
            }
        },
        {
            timestamps: true,
            collection:
                "movimientosInventario"
        }
    );

module.exports =
    mongoose.models.MovimientoInventario ||
    mongoose.model(
        "MovimientoInventario",
        inventoryMovementSchema
    );
