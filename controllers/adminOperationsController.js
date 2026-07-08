"use strict";

const Pedido =
    require("../models/Pedido");
const Producto =
    require("../models/Producto");

const {
    DELIVERY_STATUSES,
    serializeOrderCard
} = require("../utils/operationsDashboard");

const ACTIVE_ORDER_FILTER = Object.freeze({
    estadoPedido: {
        $nin: [
            "entregado",
            "cancelado"
        ]
    }
});

const PRODUCTION_STATUSES = Object.freeze([
    "validacion_diseno",
    "en_produccion"
]);

async function operationsSummary(
    req,
    res,
    next
) {
    try {
        const now =
            new Date();

        const overdueDays =
            Number(
                process.env.OPERATION_OVERDUE_DAYS ||
                5
            );

        const sevenDaysAgo =
            new Date(
                now.getTime() -
                7 * 86400000
            );

        const lowStockLimit =
            Number(
                process.env.LOW_STOCK_LIMIT ||
                5
            );

        const [
            activeOrders,
            lowStockProducts,
            topProducts7Days,
            paidSales7Days
        ] = await Promise.all([
            Pedido.find(ACTIVE_ORDER_FILTER)
                .sort({
                    createdAt: -1
                })
                .limit(200)
                .lean(),
            Producto.find({
                activo: {
                    $ne: false
                },
                stock: {
                    $lte: lowStockLimit
                }
            })
                .sort({
                    stock: 1,
                    nombre: 1
                })
                .limit(12)
                .select("nombre slug sku stock categoriaPrincipal imagenes")
                .lean(),
            Pedido.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: sevenDaysAgo
                        },
                        estadoPedido: {
                            $ne: "cancelado"
                        },
                        estadoPago: "pagado"
                    }
                },
                {
                    $unwind: "$items"
                },
                {
                    $group: {
                        _id: {
                            productoId: "$items.productoId",
                            nombre: "$items.nombre"
                        },
                        unidades: {
                            $sum: "$items.cantidad"
                        },
                        ventas: {
                            $sum: "$items.subtotal"
                        }
                    }
                },
                {
                    $sort: {
                        unidades: -1,
                        ventas: -1
                    }
                },
                {
                    $limit: 8
                }
            ]),
            Pedido.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: sevenDaysAgo
                        },
                        estadoPedido: {
                            $ne: "cancelado"
                        },
                        estadoPago: "pagado"
                    }
                },
                {
                    $group: {
                        _id: null,
                        pedidos: {
                            $sum: 1
                        },
                        ventas: {
                            $sum: "$total"
                        }
                    }
                }
            ])
        ]);

        const options = {
            now,
            overdueDays
        };

        const cards = activeOrders
            .map((order) => serializeOrderCard(order, options))
            .sort((a, b) => {
                const priorityDiff =
                    Number(a.accion.priority) -
                    Number(b.accion.priority);

                if (priorityDiff !== 0) {
                    return priorityDiff;
                }

                return new Date(b.fecha || 0) -
                    new Date(a.fecha || 0);
            });

        const paymentPending = cards.filter(
            (order) => order.estadoPago !== "pagado"
        );

        const production = cards.filter(
            (order) => PRODUCTION_STATUSES.includes(order.estadoPedido)
        );

        const readyDelivery = cards.filter(
            (order) => DELIVERY_STATUSES.includes(order.estadoPedido)
        );

        const designPending = cards.filter(
            (order) => order.accion.category === "diseno"
        );

        const overdue = cards.filter(
            (order) => order.accion.category === "atrasado"
        );

        res.json({
            fecha: now.toISOString(),
            parametros: {
                overdueDays,
                lowStockLimit
            },
            resumen: {
                activos: cards.length,
                pagosPendientes: paymentPending.length,
                disenosPendientes: designPending.length,
                enProduccion: production.length,
                porEntregar: readyDelivery.length,
                atrasados: overdue.length,
                stockBajo: lowStockProducts.length,
                pedidosPagados7Dias: paidSales7Days[0]?.pedidos || 0,
                ventasPagadas7Dias: paidSales7Days[0]?.ventas || 0
            },
            prioridades: cards.slice(0, 12),
            produccion: production.slice(0, 12),
            entrega: readyDelivery.slice(0, 12),
            stock: lowStockProducts.map((product) => ({
                id: product._id,
                nombre: product.nombre,
                slug: product.slug,
                sku: product.sku,
                stock: Number(product.stock) || 0,
                categoria: product.categoriaPrincipal || "Sin categoría",
                imagen: Array.isArray(product.imagenes)
                    ? product.imagenes[0]
                    : ""
            })),
            topProductos7Dias: topProducts7Days.map((item) => ({
                productoId: item._id?.productoId || "",
                nombre: item._id?.nombre || "Producto",
                unidades: item.unidades || 0,
                ventas: item.ventas || 0
            }))
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    operationsSummary
};
