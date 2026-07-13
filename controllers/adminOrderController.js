"use strict";

const Pedido =
    require("../models/Pedido");

const {
    applyOrderStock
} = require("../services/inventoryService");

const {
    adminSyncPayment
} = require("./paymentController");

const {
    expirePendingTransferOrders
} = require("../services/transferOrderService");

const {
    dispatchNotification,
    normalizedEvent
} = require("../services/notificationService");

async function listOrders(
    req,
    res,
    next
) {
    try {
        await expirePendingTransferOrders();
        const filter = {};

        if (req.query.estado) {
            filter.estadoPedido =
                req.query.estado;
        }

        if (req.query.pago) {
            filter.estadoPago =
                req.query.pago;
        }

        if (req.query.buscar) {
            const search =
                String(
                    req.query.buscar
                ).trim();

            filter.$or = [
                {
                    numeroPedido: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    "cliente.nombre": {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    "cliente.email": {
                        $regex: search,
                        $options: "i"
                    }
                }
            ];
        }

        const orders =
            await Pedido.find(filter)
                .sort({
                    createdAt: -1
                })
                .lean();

        res.json(orders);
    } catch (error) {
        next(error);
    }
}

async function getOrder(
    req,
    res,
    next
) {
    try {
        const order =
            await Pedido.findById(
                req.params.id
            ).lean();

        if (!order) {
            return res.status(404).json({
                error:
                    "Pedido no encontrado."
            });
        }

        res.json(order);
    } catch (error) {
        next(error);
    }
}

async function updateOrder(
    req,
    res,
    next
) {
    try {
        const order =
            await Pedido.findById(
                req.params.id
            );

        if (!order) {
            return res.status(404).json({
                error:
                    "Pedido no encontrado."
            });
        }

        const previousStatus =
            order.estadoPedido;

        const newStatus =
            req.body.estadoPedido ??
            req.body.estado ??
            previousStatus;

        if (
            newStatus === "cancelado" &&
            order.stockAplicado
        ) {
            await applyOrderStock(
                order,
                "restore",
                req.user._id
            );

            order.stockAplicado = false;
        }

        let statusChanged = false;

        if (
            newStatus !==
            previousStatus
        ) {
            order.estadoPedido =
                newStatus;

            statusChanged = true;

            order.historial.push({
                estado:
                    newStatus,
                detalle:
                    String(
                        req.body.detalle ||
                        "Estado actualizado."
                    ),
                usuarioId:
                    req.user._id
            });
        }

        if (req.body.estadoPago) {
            order.estadoPago =
                req.body.estadoPago;
        }

        if (
            req.body.notasInternas !==
            undefined
        ) {
            order.notasInternas =
                String(
                    req.body.notasInternas
                );
        }

        if (req.body.produccion && typeof req.body.produccion === "object") {
            const incoming = req.body.produccion;
            const previousStage = order.produccion?.etapa || "revision";
            const nextStage = String(incoming.etapa || previousStage);
            order.produccion = {
                etapa: nextStage,
                progreso: Math.max(0, Math.min(100, Number(incoming.progreso ?? order.produccion?.progreso ?? 10))),
                mensajeCliente: String(incoming.mensajeCliente ?? order.produccion?.mensajeCliente ?? "").slice(0, 1200),
                fechaEstimada: incoming.fechaEstimada ? new Date(incoming.fechaEstimada) : (order.produccion?.fechaEstimada || null),
                actualizadoAt: new Date()
            };

            if (nextStage !== previousStage) {
                order.historial.push({
                    estado: nextStage,
                    detalle: order.produccion.mensajeCliente || "Etapa de producción actualizada.",
                    usuarioId: req.user._id
                });
            }
        }

        if (statusChanged) {
            await dispatchNotification(
                order,
                normalizedEvent("", order),
                {
                    userId: req.user._id
                }
            ).catch(() => {});
        }

        await order.save();

        res.json(order);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    listOrders,
    getOrder,
    updateOrder,
    adminSyncPayment
};
