"use strict";

const Pedido =
    require("../models/Pedido");
const Producto =
    require("../models/Producto");

const {
    APP_VERSION
} = require("../config/version");

const {
    databaseStatus
} = require("./healthController");

async function dashboard(
    req,
    res,
    next
) {
    try {
        const start =
            new Date();

        start.setHours(
            0,
            0,
            0,
            0
        );

        const [
            pedidosPendientes,
            pedidosHoy,
            productosActivos,
            stockBajo,
            ventasHoy
        ] = await Promise.all([
            Pedido.countDocuments({
                estadoPedido:
                    "pendiente"
            }),
            Pedido.countDocuments({
                createdAt: {
                    $gte: start
                }
            }),
            Producto.countDocuments({
                activo: {
                    $ne: false
                }
            }),
            Producto.countDocuments({
                activo: {
                    $ne: false
                },
                stock: {
                    $lte: Number(
                        process.env
                            .LOW_STOCK_LIMIT ||
                        5
                    )
                }
            }),
            Pedido.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: start
                        },
                        estadoPedido: {
                            $ne:
                                "cancelado"
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: "$total"
                        }
                    }
                }
            ])
        ]);

        res.json({
            pedidosPendientes,
            pedidosHoy,
            productosActivos,
            stockBajo,
            ventasHoy:
                ventasHoy[0]?.total ||
                0,
            sistema: {
                version:
                    APP_VERSION,
                entorno:
                    process.env.NODE_ENV ||
                    "development",
                database:
                    databaseStatus(),
                uptimeSegundos:
                    Math.round(
                        process.uptime()
                    ),
                fecha:
                    new Date()
                        .toISOString()
            }
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    dashboard
};
