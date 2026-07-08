"use strict";

const Pedido = require("../models/Pedido");
const {
    buildNotification,
    availableNotifications,
    dispatchNotification
} = require("../services/notificationService");

async function loadOrder(id) {
    const order = await Pedido.findById(id);
    if (!order) {
        const error = new Error("Pedido no encontrado.");
        error.statusCode = 404;
        throw error;
    }
    return order;
}

function publicResult(order, result) {
    return {
        pedidoId: String(order._id),
        numeroPedido: order.numeroPedido,
        evento: result.notification.event,
        etiqueta: result.notification.label,
        asunto: result.notification.subject,
        correo: {
            para: result.notification.to,
            ...result.email
        },
        avisoInterno: result.adminEmail || {
            sent: false,
            skipped: true
        },
        whatsapp: {
            telefonoCliente: result.notification.customerPhone,
            texto: result.notification.whatsappText,
            url: result.notification.customerWhatsappUrl
        },
        seguimientoUrl: result.notification.trackingUrl
    };
}

async function listOrderNotifications(req, res, next) {
    try {
        const order = await loadOrder(req.params.id);
        res.json({
            pedidoId: String(order._id),
            numeroPedido: order.numeroPedido,
            notificaciones: availableNotifications(order).map((notification) => ({
                evento: notification.event,
                etiqueta: notification.label,
                asunto: notification.subject,
                correoPara: notification.to,
                whatsappTexto: notification.whatsappText,
                whatsappUrl: notification.customerWhatsappUrl,
                seguimientoUrl: notification.trackingUrl
            }))
        });
    } catch (error) {
        next(error);
    }
}

async function previewOrderNotification(req, res, next) {
    try {
        const order = await loadOrder(req.params.id);
        const notification = buildNotification(order, req.params.evento || req.body?.evento || "status_update");

        res.json({
            pedidoId: String(order._id),
            numeroPedido: order.numeroPedido,
            evento: notification.event,
            etiqueta: notification.label,
            asunto: notification.subject,
            correoPara: notification.to,
            texto: notification.text,
            html: notification.html,
            whatsappTexto: notification.whatsappText,
            whatsappUrl: notification.customerWhatsappUrl,
            seguimientoUrl: notification.trackingUrl
        });
    } catch (error) {
        next(error);
    }
}

async function sendOrderNotification(req, res, next) {
    try {
        const order = await loadOrder(req.params.id);
        const event = req.params.evento || req.body?.evento || "status_update";
        const email = req.body?.email !== false;
        const result = await dispatchNotification(order, event, {
            email,
            userId: req.user?._id || null
        });

        await order.save();
        res.json(publicResult(order, result));
    } catch (error) {
        next(error);
    }
}

module.exports = {
    listOrderNotifications,
    previewOrderNotification,
    sendOrderNotification
};
