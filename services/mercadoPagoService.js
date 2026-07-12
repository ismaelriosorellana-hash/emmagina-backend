"use strict";

const crypto = require("crypto");
const Pedido = require("../models/Pedido");
const {
    getMercadoPagoConfig,
    isMercadoPagoConfigured,
    isMercadoPagoReady,
    hasPublicWebhookUrl
} = require("../config/mercadoPago");
const {
    applyOrderStock
} = require("./inventoryService");

function httpError(message, statusCode = 500, details = null) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.details = details;
    return error;
}

async function mercadoPagoRequest(path, options = {}) {
    const config = getMercadoPagoConfig();

    if (!config.accessToken) {
        throw httpError(
            "Mercado Pago todavía no está configurado en el servidor.",
            503
        );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch(`${config.apiUrl}${path}`, {
            method: options.method || "GET",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${config.accessToken}`,
                ...(options.body ? { "Content-Type": "application/json" } : {}),
                ...(options.idempotencyKey
                    ? { "X-Idempotency-Key": options.idempotencyKey }
                    : {}),
                ...(options.headers || {})
            },
            body: options.body
                ? JSON.stringify(options.body)
                : undefined,
            signal: controller.signal
        });

        const contentType = response.headers.get("content-type") || "";
        const data = contentType.includes("application/json")
            ? await response.json()
            : await response.text();

        if (!response.ok) {
            const message =
                data?.message ||
                data?.error ||
                `Mercado Pago respondió con estado ${response.status}.`;

            throw httpError(message, 502, data);
        }

        return data;
    } catch (error) {
        if (error.name === "AbortError") {
            throw httpError(
                "Mercado Pago tardó demasiado en responder.",
                504
            );
        }

        if (error.statusCode) throw error;

        throw httpError(
            "No fue posible conectar con Mercado Pago.",
            502,
            error.message
        );
    } finally {
        clearTimeout(timeout);
    }
}

function checkoutUrlFromPreference(preference) {
    const { environment } = getMercadoPagoConfig();

    if (environment === "test") {
        return preference.sandbox_init_point || preference.init_point || "";
    }

    return preference.init_point || "";
}

function orderReturnUrl(order, result) {
    const config = getMercadoPagoConfig();
    const params = new URLSearchParams({
        resultado: result,
        pedido: String(order._id),
        token: order.consultaToken
    });

    return `${config.frontendUrl}/pago.html?${params}`;
}

function preferenceItems(order) {
    return order.items.map((item) => ({
        id: String(item.productoId),
        title: String(item.nombre).slice(0, 120),
        description: [item.color, item.talla, item.sku]
            .filter(Boolean)
            .join(" · ")
            .slice(0, 250),
        picture_url: item.imagen || undefined,
        quantity: Number(item.cantidad),
        currency_id: "CLP",
        unit_price: Number(item.precioUnitario)
    }));
}

function preferenceAmount(items, shippingCost = 0) {
    return items.reduce(
        (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
        Number(shippingCost) || 0
    );
}

function buildPreferenceBody(order) {
    const items = preferenceItems(order);
    const shippingCost = Math.max(0, Number(order.costoEnvio) || 0);
    const expectedTotal = Number(order.total) || 0;
    const calculatedTotal = preferenceAmount(items, shippingCost);
    const amountMatches = Math.abs(expectedTotal - calculatedTotal) < 0.01;

    const body = {
        items: amountMatches
            ? items
            : [{
                id: String(order._id),
                title: `Pedido ${order.numeroPedido}`.slice(0, 120),
                description: `${order.items.length} producto(s) Rhema Diseños`.slice(0, 250),
                quantity: 1,
                currency_id: "CLP",
                unit_price: expectedTotal
            }],
        payer: {
            name: order.cliente.nombre,
            email: order.cliente.email,
            phone: {
                number: order.cliente.telefono
            }
        },
        external_reference: order.numeroPedido,
        metadata: {
            order_id: String(order._id),
            order_number: order.numeroPedido
        },
        back_urls: {
            success: orderReturnUrl(order, "success"),
            pending: orderReturnUrl(order, "pending"),
            failure: orderReturnUrl(order, "failure")
        },
        auto_return: "approved"
    };

    if (amountMatches && shippingCost > 0) {
        body.shipments = {
            cost: shippingCost,
            mode: "not_specified"
        };
    }

    return body;
}

async function createPreference(order) {
    if (!isMercadoPagoReady()) {
        throw httpError(
            "Mercado Pago todavía no está completamente configurado en el servidor.",
            503
        );
    }

    if (!order.consultaToken) {
        order.consultaToken = crypto.randomBytes(24).toString("hex");
    }

    const config = getMercadoPagoConfig();
    const idempotencyKey = crypto.randomUUID();
    const body = buildPreferenceBody(order);

    if (hasPublicWebhookUrl()) {
        body.notification_url =
            `${config.backendUrl}/api/pagos/mercadopago/webhook?source_news=webhooks`;
    }

    const preference = await mercadoPagoRequest(
        "/checkout/preferences",
        {
            method: "POST",
            body,
            idempotencyKey
        }
    );

    order.mercadoPago = {
        ...(order.mercadoPago?.toObject
            ? order.mercadoPago.toObject()
            : order.mercadoPago || {}),
        preferenceId: preference.id || "",
        checkoutUrl: preference.init_point || "",
        sandboxCheckoutUrl: preference.sandbox_init_point || "",
        externalReference: order.numeroPedido,
        preferenceCreatedAt: new Date(),
        lastSyncAt: new Date(),
        idempotencyKey
    };

    await order.save();

    return {
        preferenceId: preference.id,
        checkoutUrl: checkoutUrlFromPreference(preference),
        environment: config.environment
    };
}

async function getPayment(paymentId) {
    const id = String(paymentId || "").trim();
    if (!/^\d+$/.test(id)) {
        throw httpError("El identificador de pago no es válido.", 400);
    }

    return mercadoPagoRequest(`/v1/payments/${encodeURIComponent(id)}`);
}

async function searchLatestPayment(externalReference) {
    const params = new URLSearchParams({
        external_reference: String(externalReference),
        sort: "date_created",
        criteria: "desc",
        limit: "1"
    });

    const result = await mercadoPagoRequest(`/v1/payments/search?${params}`);
    return Array.isArray(result?.results) ? result.results[0] || null : null;
}

function mappedPaymentStatus(status) {
    switch (String(status || "").toLowerCase()) {
        case "approved":
            return "pagado";
        case "refunded":
        case "charged_back":
            return "reembolsado";
        case "rejected":
        case "cancelled":
            return "rechazado";
        default:
            return "pendiente";
    }
}

function paymentMatchesOrder(order, payment) {
    const externalReference = String(payment.external_reference || "");
    const metadataOrderId = String(payment.metadata?.order_id || "");
    const expectedAmount = Number(order.total);
    const paidAmount = Number(payment.transaction_amount);

    const referenceMatches =
        externalReference === order.numeroPedido ||
        metadataOrderId === String(order._id);

    const amountMatches =
        Number.isFinite(paidAmount) &&
        Math.abs(expectedAmount - paidAmount) < 0.01;

    return referenceMatches && amountMatches;
}

function historyAlreadyContains(order, paymentId, status) {
    const needle = `Mercado Pago ${paymentId} · ${status}`;
    return order.historial.some((entry) => entry.detalle === needle);
}

async function syncOrderFromPayment(order, payment, userId = null) {
    if (!paymentMatchesOrder(order, payment)) {
        throw httpError(
            "El pago recibido no coincide con el pedido.",
            409
        );
    }

    const paymentStatus = mappedPaymentStatus(payment.status);
    const paymentId = String(payment.id || "");
    const previousPaymentStatus = order.estadoPago;

    order.mercadoPago = {
        ...(order.mercadoPago?.toObject
            ? order.mercadoPago.toObject()
            : order.mercadoPago || {}),
        paymentId,
        merchantOrderId: String(payment.order?.id || ""),
        status: String(payment.status || ""),
        statusDetail: String(payment.status_detail || ""),
        externalReference: String(payment.external_reference || ""),
        liveMode: Boolean(payment.live_mode),
        amount: Number(payment.transaction_amount || 0),
        currencyId: String(payment.currency_id || "CLP"),
        lastSyncAt: new Date()
    };

    order.estadoPago = paymentStatus;

    if (paymentStatus === "pagado") {
        if (!order.stockAplicado) {
            await applyOrderStock(order, "discount", userId);
            order.stockAplicado = true;
        }

        if (order.estadoPedido === "pendiente") {
            order.estadoPedido = "confirmado";
        }
    }

    if (!historyAlreadyContains(order, paymentId, String(payment.status))) {
        order.historial.push({
            estado: paymentStatus === "pagado"
                ? "confirmado"
                : order.estadoPedido,
            detalle: `Mercado Pago ${paymentId} · ${String(payment.status || "sin estado")}`,
            usuarioId: userId
        });
    }

    await order.save();

    return {
        changed: previousPaymentStatus !== order.estadoPago,
        estadoPago: order.estadoPago,
        estadoPedido: order.estadoPedido,
        mercadoPago: order.mercadoPago
    };
}

async function syncOrderByPaymentId(order, paymentId, userId = null) {
    const payment = await getPayment(paymentId);
    return syncOrderFromPayment(order, payment, userId);
}

async function syncOrderUsingLatestPayment(order, userId = null) {
    let payment = null;

    if (order.mercadoPago?.paymentId) {
        payment = await getPayment(order.mercadoPago.paymentId);
    } else {
        payment = await searchLatestPayment(order.numeroPedido);
    }

    if (!payment) {
        throw httpError(
            "Todavía no se encontró un pago asociado a este pedido.",
            404
        );
    }

    return syncOrderFromPayment(order, payment, userId);
}

function validateWebhookSignature(req) {
    const { webhookSecret } = getMercadoPagoConfig();

    if (!webhookSecret) {
        return {
            valid: true,
            skipped: true
        };
    }

    const signature = String(req.headers["x-signature"] || "");
    const requestId = String(req.headers["x-request-id"] || "");
    const dataId = String(
        req.query["data.id"] ||
        req.body?.data?.id ||
        req.query.id ||
        ""
    ).toLowerCase();

    const parts = Object.fromEntries(
        signature
            .split(",")
            .map((part) => part.trim().split("="))
            .filter(([key, value]) => key && value)
    );

    if (!parts.ts || !parts.v1 || !requestId || !dataId) {
        return { valid: false, skipped: false };
    }

    const manifest =
        `id:${dataId};request-id:${requestId};ts:${parts.ts};`;

    const expected = crypto
        .createHmac("sha256", webhookSecret)
        .update(manifest)
        .digest("hex");

    const receivedBuffer = Buffer.from(parts.v1, "utf8");
    const expectedBuffer = Buffer.from(expected, "utf8");

    return {
        valid:
            receivedBuffer.length === expectedBuffer.length &&
            crypto.timingSafeEqual(receivedBuffer, expectedBuffer),
        skipped: false
    };
}

async function findOrderForPayment(payment) {
    const metadataOrderId = String(payment.metadata?.order_id || "");

    if (metadataOrderId) {
        const byId = await Pedido.findById(metadataOrderId).select("+consultaToken");
        if (byId) return byId;
    }

    const externalReference = String(payment.external_reference || "");
    if (!externalReference) return null;

    return Pedido.findOne({
        numeroPedido: externalReference
    }).select("+consultaToken");
}

module.exports = {
    isMercadoPagoConfigured,
    createPreference,
    getPayment,
    searchLatestPayment,
    syncOrderFromPayment,
    syncOrderByPaymentId,
    syncOrderUsingLatestPayment,
    validateWebhookSignature,
    findOrderForPayment,
    preferenceItems,
    preferenceAmount,
    buildPreferenceBody,
    paymentMatchesOrder,
    mappedPaymentStatus
};
