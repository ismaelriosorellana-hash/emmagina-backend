"use strict";

const Pedido = require("../models/Pedido");
const {
    getMercadoPagoConfig,
    isMercadoPagoConfigured,
    hasPublicWebhookUrl,
    isMercadoPagoReady
} = require("../config/mercadoPago");
const {
    createPreference,
    syncOrderByPaymentId,
    syncOrderUsingLatestPayment,
    validateWebhookSignature,
    findOrderForPayment,
    getPayment,
    syncOrderFromPayment
} = require("../services/mercadoPagoService");
const {
    dispatchNotification,
    notificationAlreadyLogged
} = require("../services/notificationService");
const { assertStoreOpen } = require("../services/storeStatusService");


async function notifyPaymentConfirmed(order, userId = null) {
    if (
        order.estadoPago === "pagado" &&
        !notificationAlreadyLogged(order, "payment_confirmed")
    ) {
        await dispatchNotification(order, "payment_confirmed", {
            userId
        });
        await order.save();
    }
}

function safePaymentSummary(order) {
    return {
        pedidoId: String(order._id),
        numeroPedido: order.numeroPedido,
        total: order.total,
        metodoPago: order.metodoPago,
        estadoPago: order.estadoPago,
        estadoPedido: order.estadoPedido,
        mercadoPago: {
            preferenceId: order.mercadoPago?.preferenceId || "",
            paymentId: order.mercadoPago?.paymentId || "",
            status: order.mercadoPago?.status || "",
            statusDetail: order.mercadoPago?.statusDetail || "",
            lastSyncAt: order.mercadoPago?.lastSyncAt || null
        }
    };
}

function tokenFromRequest(req) {
    return String(
        req.body?.token ||
        req.query?.token ||
        ""
    );
}

function canAccessOrder(req, order) {
    if (
        req.user &&
        ["administrador", "gestor"].includes(req.user.rol)
    ) {
        return true;
    }

    if (
        req.user?.rol === "cliente" &&
        String(order.usuarioClienteId || "") === String(req.user._id)
    ) {
        return true;
    }

    const token = tokenFromRequest(req);
    return Boolean(token && token === order.consultaToken);
}

async function loadAccessibleOrder(req) {
    const order = await Pedido.findById(req.params.id).select("+consultaToken");

    if (!order) {
        const error = new Error("Pedido no encontrado.");
        error.statusCode = 404;
        throw error;
    }

    if (!canAccessOrder(req, order)) {
        const error = new Error("No tienes permiso para consultar este pago.");
        error.statusCode = 403;
        throw error;
    }

    return order;
}

function getIntegrationStatus(req, res) {
    const config = getMercadoPagoConfig();

    const configured = isMercadoPagoConfigured();
    const webhookReady =
        hasPublicWebhookUrl() &&
        Boolean(config.webhookSecret);

    res.json({
        configured,
        available: isMercadoPagoReady(),
        environment: config.environment,
        webhookReady,
        localMode: !hasPublicWebhookUrl()
    });
}

async function createOrderPreference(req, res, next) {
    try {
        await assertStoreOpen();
        const order = await loadAccessibleOrder(req);

        if (order.metodoPago !== "mercadopago") {
            return res.status(409).json({
                error: "Este pedido no utiliza Mercado Pago."
            });
        }

        if (order.estadoPago === "pagado") {
            return res.status(409).json({
                error: "Este pedido ya está pagado."
            });
        }

        const preference = await createPreference(order);
        res.json({
            ...preference,
            pedido: safePaymentSummary(order)
        });
    } catch (error) {
        next(error);
    }
}

async function processReturn(req, res, next) {
    try {
        const order = await loadAccessibleOrder(req);
        const paymentId = String(req.body?.paymentId || "");

        if (!paymentId) {
            return res.status(400).json({
                error: "Falta el identificador del pago."
            });
        }

        await syncOrderByPaymentId(
            order,
            paymentId,
            req.user?._id || null
        );

        await notifyPaymentConfirmed(order, req.user?._id || null)
            .catch(() => {});

        res.json({
            pedido: safePaymentSummary(order)
        });
    } catch (error) {
        next(error);
    }
}

async function getPaymentStatus(req, res, next) {
    try {
        const order = await loadAccessibleOrder(req);
        res.json({
            pedido: safePaymentSummary(order)
        });
    } catch (error) {
        next(error);
    }
}

async function webhook(req, res, next) {
    try {
        const signature = validateWebhookSignature(req);

        if (!signature.valid) {
            return res.status(401).json({
                error: "Firma de Webhook no válida."
            });
        }

        const type = String(
            req.body?.type ||
            req.query?.type ||
            req.body?.topic ||
            ""
        ).toLowerCase();

        const paymentId = String(
            req.body?.data?.id ||
            req.query["data.id"] ||
            req.query.id ||
            ""
        );

        if (type && type !== "payment") {
            return res.status(200).json({ received: true });
        }

        if (!paymentId) {
            return res.status(200).json({ received: true });
        }

        const payment = await getPayment(paymentId);
        const order = await findOrderForPayment(payment);

        if (order) {
            await syncOrderFromPayment(order, payment, null);
            await notifyPaymentConfirmed(order, null)
                .catch(() => {});
            order.mercadoPago.lastNotificationAt = new Date();
            await order.save();
        }

        res.status(200).json({ received: true });
    } catch (error) {
        // Mercado Pago reintenta cuando no recibe 2xx. Errores reales pasan al middleware.
        next(error);
    }
}

async function adminSyncPayment(req, res, next) {
    try {
        const order = await Pedido.findById(req.params.id).select("+consultaToken");

        if (!order) {
            return res.status(404).json({ error: "Pedido no encontrado." });
        }

        if (order.metodoPago !== "mercadopago") {
            return res.status(409).json({
                error: "Este pedido no utiliza Mercado Pago."
            });
        }

        await syncOrderUsingLatestPayment(order, req.user._id);
        await notifyPaymentConfirmed(order, req.user._id)
            .catch(() => {});
        res.json(order);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getIntegrationStatus,
    createOrderPreference,
    processReturn,
    getPaymentStatus,
    webhook,
    adminSyncPayment
};
