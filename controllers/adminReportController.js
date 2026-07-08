"use strict";

const Pedido =
    require("../models/Pedido");

function dateRange(query) {
    const end =
        query.hasta
            ? new Date(query.hasta)
            : new Date();

    const start =
        query.desde
            ? new Date(query.desde)
            : new Date(
                end.getTime() -
                30 * 24 * 60 * 60 * 1000
            );

    end.setHours(
        23,
        59,
        59,
        999
    );

    start.setHours(
        0,
        0,
        0,
        0
    );

    return {
        start,
        end
    };
}

async function salesSummary(
    req,
    res,
    next
) {
    try {
        const { start, end } =
            dateRange(req.query);

        const baseMatch = {
            createdAt: {
                $gte: start,
                $lte: end
            },
            estadoPedido: {
                $ne: "cancelado"
            }
        };

        const [summary] =
            await Pedido.aggregate([
                {
                    $match: baseMatch
                },
                {
                    $group: {
                        _id: null,
                        pedidos: {
                            $sum: 1
                        },
                        ventas: {
                            $sum: "$total"
                        },
                        ticketPromedio: {
                            $avg: "$total"
                        },
                        productosVendidos: {
                            $sum: {
                                $sum: "$items.cantidad"
                            }
                        }
                    }
                }
            ]);

        const salesByDay =
            await Pedido.aggregate([
                {
                    $match: baseMatch
                },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format:
                                    "%Y-%m-%d",
                                date:
                                    "$createdAt"
                            }
                        },
                        pedidos: {
                            $sum: 1
                        },
                        ventas: {
                            $sum: "$total"
                        }
                    }
                },
                {
                    $sort: {
                        _id: 1
                    }
                }
            ]);

        const topProducts =
            await Pedido.aggregate([
                {
                    $match: baseMatch
                },
                {
                    $unwind: "$items"
                },
                {
                    $group: {
                        _id: {
                            productoId:
                                "$items.productoId",
                            nombre:
                                "$items.nombre"
                        },
                        unidades: {
                            $sum:
                                "$items.cantidad"
                        },
                        ventas: {
                            $sum:
                                "$items.subtotal"
                        }
                    }
                },
                {
                    $sort: {
                        unidades: -1
                    }
                },
                {
                    $limit: 10
                }
            ]);

        res.json({
            periodo: {
                desde: start,
                hasta: end
            },
            resumen: {
                pedidos:
                    summary?.pedidos || 0,
                ventas:
                    summary?.ventas || 0,
                ticketPromedio:
                    Math.round(
                        summary?.ticketPromedio ||
                        0
                    ),
                productosVendidos:
                    summary?.productosVendidos ||
                    0
            },
            ventasPorDia:
                salesByDay,
            productosMasVendidos:
                topProducts
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    salesSummary
};
