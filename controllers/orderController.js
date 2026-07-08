"use strict";

const Pedido = require("../models/Pedido");
const { normalizeOrderInput } = require("../services/orderService");
const { resolveOrderDelivery } = require("../services/deliveryService");
const { priceOrderItems, calculateOrderTotals } = require("../services/paymentPricingService");
const { applyOrderStock } = require("../services/inventoryService");
const { transferDeadline, transferHours } = require("../services/transferOrderService");
const { isMercadoPagoReady } = require("../config/mercadoPago");
const { summarizeCustomization } = require("../utils/customizationSummary");
const { cleanText, cleanEmail, cleanPhone, cleanRut } = require("../utils/validation");
const { securityEvent } = require("../utils/securityLogger");
const { dispatchNotification } = require("../services/notificationService");
const { assertStoreOpen } = require("../services/storeStatusService");

const ENABLED_PAYMENT_METHODS = new Set([
    "transferencia",
    "mercadopago"
]);

function validateOrderData(data) {
    data.cliente.nombre = cleanText(data.cliente.nombre, { field: "El nombre", maxLength: 120, required: true });
    data.cliente.email = cleanEmail(data.cliente.email, { required: true });
    data.cliente.telefono = cleanPhone(data.cliente.telefono, { required: true });
    data.cliente.rut = cleanRut(data.cliente.rut);
    data.cliente.direccion = cleanText(data.cliente.direccion, { field: "La dirección", maxLength: 300 });
    data.cliente.comuna = cleanText(data.cliente.comuna, { field: "La comuna", maxLength: 120 });
    data.observaciones = cleanText(data.observaciones, { field: "Las observaciones", maxLength: 1000, allowNewlines: true });

    if (!Array.isArray(data.items) || !data.items.length) {
        const error = new Error("El carrito está vacío.");
        error.statusCode = 400;
        throw error;
    }

    if (data.items.length > 50) {
        const error = new Error("El pedido contiene demasiados productos.");
        error.statusCode = 400;
        throw error;
    }

    data.items.forEach((item) => {
        item.nombre = cleanText(item.nombre, { field: "El nombre del producto", maxLength: 200, required: true });
        item.color = cleanText(item.color, { field: "El color", maxLength: 80 });
        item.talla = cleanText(item.talla, { field: "La talla", maxLength: 40 });
        item.sku = cleanText(item.sku, { field: "El SKU", maxLength: 120 });
        const quantity = Number(item.cantidad);

        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
            const error = new Error("La cantidad de un producto no es válida.");
            error.statusCode = 400;
            throw error;
        }
    });
}

function validatePaymentMethod(method) {
    if (!ENABLED_PAYMENT_METHODS.has(method)) {
        const error = new Error("La forma de pago seleccionada no está disponible.");
        error.statusCode = 400;
        throw error;
    }

    if (method === "mercadopago" && !isMercadoPagoReady()) {
        const error = new Error("Mercado Pago todavía no está habilitado en la tienda.");
        error.statusCode = 503;
        throw error;
    }
}

async function createOrder(req, res, next) {
    let order = null;
    let stockReserved = false;

    try {
        await assertStoreOpen();
        const data = normalizeOrderInput(req.body);

        if (req.user?.rol === "cliente") {
            data.usuarioClienteId = req.user._id;
            data.cliente.email = req.user.email;
            if (!data.cliente.nombre) data.cliente.nombre = req.user.nombre;
        }

        validateOrderData(data);
        validatePaymentMethod(data.metodoPago);

        data.items = await priceOrderItems(data.items);
        data.items = data.items.map((item) => ({
            ...item,
            personalizacionResumen: summarizeCustomization(item.personalizacion)
        }));

        Object.assign(data, calculateOrderTotals(data.items));

        const resolved = await resolveOrderDelivery(data.items, data.entrega, data.subtotal);
        data.items = resolved.items;
        data.entrega = resolved.entrega;
        data.costoEnvio = Math.max(0, Number(resolved.costoEnvio) || 0);
        data.total = data.subtotal + data.costoEnvio - (Number(data.descuento) || 0);
        data.cliente.direccion = cleanText(data.entrega.direccion, { field: "La dirección de entrega", maxLength: 300 });
        data.cliente.comuna = cleanText(data.entrega.comuna, { field: "La comuna de entrega", maxLength: 120 });
        data.estadoPedido = "pendiente";

        if (data.metodoPago === "transferencia") {
            data.estadoPago = "pendiente_comprobante";
            data.transferencia = {
                venceAt: transferDeadline(),
                canal: "cuenta"
            };
        } else {
            data.estadoPago = "pendiente";
            data.transferencia = {};
        }

        order = await Pedido.create(data);

        if (data.metodoPago === "transferencia") {
            await applyOrderStock(order, "reserve", req.user?._id || null);
            stockReserved = true;
            order.stockAplicado = true;
            order.historial.push({
                estado: "stock_reservado",
                detalle: `Stock reservado durante ${transferHours()} horas mientras se espera el comprobante.`
            });
        } else {
            order.historial.push({
                estado: "pendiente",
                detalle: "Pedido creado. Pago pendiente mediante Mercado Pago."
            });
        }

        await dispatchNotification(order, "order_created", {
            userId: req.user?._id || null
        }).catch((error) => {
            securityEvent(req, "notification_order_created_failed", {
                orderId: String(order._id),
                error: error.message
            });
        });

        await order.save();

        securityEvent(req, "order_created", {
            orderId: String(order._id),
            linkedAccount: Boolean(data.usuarioClienteId),
            paymentMethod: data.metodoPago
        });

        const transferPayment = data.metodoPago === "transferencia";

        res.status(201).json({
            mensaje: transferPayment
                ? `Pedido recibido. El stock quedó reservado durante ${transferHours()} horas.`
                : "Pedido creado. Continúa en Mercado Pago para completar el pago.",
            numeroPedido: order.numeroPedido,
            pedidoId: order._id,
            total: order.total,
            cuentaVinculada: Boolean(data.usuarioClienteId),
            metodoPago: order.metodoPago,
            estadoPago: order.estadoPago,
            venceAt: transferPayment ? order.transferencia.venceAt : null,
            siguientePaso: transferPayment
                ? "Sube el comprobante desde el detalle de tu pedido en Mi cuenta."
                : "Serás redirigido a Mercado Pago."
        });
    } catch (error) {
        if (order && stockReserved) {
            await applyOrderStock(
                order,
                "restore",
                req.user?._id || null
            ).catch(() => {});
        }

        if (order) {
            await Pedido.deleteOne({ _id: order._id }).catch(() => {});
        }

        next(error);
    }
}

module.exports = {
    createOrder,
    validateOrderData,
    validatePaymentMethod,
    ENABLED_PAYMENT_METHODS
};
