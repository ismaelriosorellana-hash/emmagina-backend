"use strict";

const Pedido =
    require("../models/Pedido");

const {
    publicUser
} = require(
    "./authController"
);

const {
    cleanText,
    cleanPhone,
    cleanRut
} = require(
    "../utils/validation"
);

const {
    securityEvent
} = require(
    "../utils/securityLogger"
);

const {
    expirePendingTransferOrders,
    expireOrder
} = require("../services/transferOrderService");

const {
    applyOrderStock
} = require("../services/inventoryService");

const CUSTOMER_CANCEL_PAYMENT_STATES = new Set([
    "pendiente",
    "pendiente_comprobante",
    "rechazado",
    "vencido"
]);

const CUSTOMER_CANCEL_ORDER_STATES = new Set([
    "pendiente",
    "confirmado"
]);

function canCustomerCancelOrder(order) {
    if (!order) return false;

    if (order.estadoPedido === "cancelado") return false;

    if (!CUSTOMER_CANCEL_ORDER_STATES.has(order.estadoPedido)) {
        return false;
    }

    if (!CUSTOMER_CANCEL_PAYMENT_STATES.has(order.estadoPago)) {
        return false;
    }

    const mpStatus = String(order.mercadoPago?.status || "").toLowerCase();
    const hasPaymentId = Boolean(String(order.mercadoPago?.paymentId || "").trim());

    if (hasPaymentId) return false;

    if ([
        "approved",
        "authorized",
        "in_process",
        "accredited"
    ].includes(mpStatus)) {
        return false;
    }

    return true;
}

function orderWasCustomerCancelled(order) {
    return Boolean(
        order?.canceladoPorCliente ||
        (
            Array.isArray(order?.historial) &&
            order.historial.some((entry) => entry?.estado === "cancelado_por_cliente")
        )
    );
}

function cleanOrder(order) {
    const raw =
        order?.toObject
            ? order.toObject()
            : { ...order };

    delete raw.notasInternas;
    delete raw.stockAplicado;
    delete raw.usuarioClienteId;
    delete raw.__v;
    delete raw.consultaToken;

    if (raw.transferencia) {
        delete raw.transferencia.validadoPor;
    }

    if (Array.isArray(raw.items)) {
        raw.items = raw.items.map((item) => {
            const cleanItem = { ...item };
            if (cleanItem.disenoFinal) {
                cleanItem.disenoFinal = { ...cleanItem.disenoFinal };
                delete cleanItem.disenoFinal.enviadoPor;
            }
            return cleanItem;
        });
    }

    raw.id =
        String(
            raw._id ||
            raw.id ||
            ""
        );

    raw.puedeCancelar =
        canCustomerCancelOrder(
            raw
        );

    if (
        Array.isArray(
            raw.historial
        )
    ) {
        raw.historial =
            raw.historial.map(
                (entry) => ({
                    estado:
                        entry.estado,
                    detalle:
                        entry.detalle ||
                        "",
                    fecha:
                        entry.fecha
                })
            );
    }

    return raw;
}

function getProfile(
    req,
    res
) {
    res.json({
        usuario:
            publicUser(
                req.user
            )
    });
}

async function updateProfile(
    req,
    res,
    next
) {
    try {
        if (
            req.body.nombre !==
            undefined
        ) {
            req.user.nombre =
                cleanText(
                    req.body.nombre,
                    {
                        field:
                            "El nombre",
                        maxLength: 120,
                        required: true
                    }
                );
        }

        if (
            req.body.telefono !==
            undefined
        ) {
            req.user.telefono =
                cleanPhone(
                    req.body.telefono
                );
        }

        if (
            req.body.rut !==
            undefined
        ) {
            req.user.rut =
                cleanRut(
                    req.body.rut
                );
        }

        if (
            req.body.direccion !==
            undefined
        ) {
            req.user.direccion =
                cleanText(
                    req.body.direccion,
                    {
                        field:
                            "La dirección",
                        maxLength: 300
                    }
                );
        }

        if (
            req.body.comuna !==
            undefined
        ) {
            req.user.comuna =
                cleanText(
                    req.body.comuna,
                    {
                        field:
                            "La comuna",
                        maxLength: 120
                    }
                );
        }

        await req.user.save();

        securityEvent(
            req,
            "profile_updated"
        );

        res.json({
            mensaje:
                "Datos actualizados correctamente.",
            usuario:
                publicUser(
                    req.user
                )
        });
    } catch (error) {
        next(error);
    }
}

async function listOrders(
    req,
    res,
    next
) {
    try {
        await expirePendingTransferOrders();
        const filter = {
            usuarioClienteId:
                req.user._id
        };

        if (req.query.incluirCancelados !== "true") {
            filter.canceladoPorCliente = {
                $ne: true
            };
        }

        const orders =
            await Pedido.find(filter)
                .sort({
                    createdAt: -1
                })
                .select(
                    "numeroPedido items total estadoPago estadoPedido metodoPago entrega transferencia mercadoPago observaciones canceladoPorCliente canceladoAt canceladoMotivo createdAt updatedAt"
                )
                .lean();

        res.json({
            pedidos:
                orders.map(
                    (order) => ({
                        id:
                            String(
                                order._id
                            ),
                        numeroPedido:
                            order.numeroPedido,
                        fecha:
                            order.createdAt,
                        actualizado:
                            order.updatedAt,
                        total:
                            order.total,
                        estadoPago:
                            order.estadoPago,
                        estadoPedido:
                            order.estadoPedido,
                        metodoPago:
                            order.metodoPago,
                        puedePagar:
                            order.metodoPago ===
                                "mercadopago" &&
                            order.estadoPago !==
                                "pagado" &&
                            order.estadoPedido !==
                                "cancelado",
                        puedeCancelar:
                            canCustomerCancelOrder(
                                order
                            ),
                        canceladoPorCliente:
                            orderWasCustomerCancelled(
                                order
                            ),
                        mercadoPagoEstado:
                            order.mercadoPago
                                ?.status ||
                            "",
                        metodoEntrega:
                            order.entrega
                                ?.metodo ||
                            "envio",
                        venceAt:
                            order.transferencia
                                ?.venceAt ||
                            null,
                        cantidadProductos:
                            Array.isArray(
                                order.items
                            )
                                ? order.items.reduce(
                                    (
                                        sum,
                                        item
                                    ) =>
                                        sum +
                                        (
                                            Number(
                                                item.cantidad
                                            ) ||
                                            0
                                        ),
                                    0
                                )
                                : 0,
                        productos:
                            Array.isArray(
                                order.items
                            )
                                ? order.items
                                    .slice(
                                        0,
                                        3
                                    )
                                    .map(
                                        (
                                            item
                                        ) => ({
                                            nombre:
                                                item.nombre,
                                            imagen:
                                                item.imagen ||
                                                ""
                                        })
                                    )
                                : []
                    })
                )
        });
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
            await Pedido.findOne({
                _id:
                    req.params.id,
                usuarioClienteId:
                    req.user._id
            });

        if (!order) {
            return res.status(404).json({
                error:
                    "Pedido no encontrado."
            });
        }

        await expireOrder(order);

        res.json({
            pedido:
                cleanOrder(order)
        });
    } catch (error) {
        next(error);
    }
}

async function cancelOrder(
    req,
    res,
    next
) {
    try {
        const order =
            await Pedido.findOne({
                _id:
                    req.params.id,
                usuarioClienteId:
                    req.user._id
            });

        if (!order) {
            return res.status(404).json({
                error:
                    "Pedido no encontrado."
            });
        }

        await expireOrder(order);

        if (!canCustomerCancelOrder(order)) {
            return res.status(409).json({
                error:
                    "Este pedido ya no se puede cancelar desde la cuenta. Si el pago fue realizado o el pedido ya avanzó, contáctanos para revisarlo."
            });
        }

        if (order.stockAplicado) {
            await applyOrderStock(
                order,
                "restore",
                req.user._id
            );

            order.stockAplicado = false;
        }

        order.estadoPedido =
            "cancelado";

        if (order.estadoPago !== "pagado") {
            order.estadoPago =
                "vencido";
        }

        order.canceladoPorCliente =
            true;

        order.canceladoAt =
            new Date();

        order.canceladoMotivo =
            "Cancelado por el cliente antes de pagar.";

        order.historial.push({
            estado:
                "cancelado_por_cliente",
            detalle:
                "El cliente canceló este pedido pendiente desde su cuenta antes de pagar.",
            usuarioId:
                req.user._id
        });

        await order.save();

        securityEvent(
            req,
            "customer_order_cancelled"
        );

        res.json({
            mensaje:
                "Pedido pendiente cancelado correctamente.",
            pedido:
                cleanOrder(
                    order
                )
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getProfile,
    updateProfile,
    listOrders,
    getOrder,
    cancelOrder
};
