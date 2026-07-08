"use strict";

const DELIVERY_STATUSES = Object.freeze([
    "listo",
    "enviado"
]);

function daysBetween(
    from,
    to = new Date()
) {
    const start = new Date(from || 0).getTime();
    const end = new Date(to || Date.now()).getTime();

    if (!start || Number.isNaN(start) || Number.isNaN(end)) {
        return 0;
    }

    return Math.max(
        0,
        Math.floor((end - start) / 86400000)
    );
}

function itemHasCustomization(item = {}) {
    const summaryType =
        item.personalizacionResumen?.tipo;

    if (
        summaryType &&
        summaryType !== "ninguna"
    ) {
        return true;
    }

    return Boolean(
        item.personalizacion ||
        item.customization
    );
}

function orderHasCustomization(order = {}) {
    return Array.isArray(order.items) &&
        order.items.some(itemHasCustomization);
}

function orderHasPendingDesign(order = {}) {
    if (!orderHasCustomization(order)) {
        return false;
    }

    return (order.items || []).some((item) => {
        if (!itemHasCustomization(item)) {
            return false;
        }

        const status = String(
            item.disenoFinal?.estado ||
            "pendiente"
        );

        return [
            "pendiente",
            "cambios_solicitados",
            "corregido"
        ].includes(status);
    });
}

function customerName(order = {}) {
    return String(
        order.cliente?.nombre ||
        "Cliente sin nombre"
    ).trim();
}

function itemCount(order = {}) {
    return (order.items || []).reduce(
        (total, item) => total + (Number(item.cantidad) || 1),
        0
    );
}

function classifyOrder(
    order = {},
    options = {}
) {
    const now =
        options.now ||
        new Date();

    const overdueDays =
        Number(options.overdueDays || 5);

    const ageDays =
        daysBetween(order.createdAt, now);

    const status =
        String(order.estadoPedido || "pendiente");

    const payment =
        String(order.estadoPago || "pendiente");

    const customized =
        orderHasCustomization(order);

    const pendingDesign =
        orderHasPendingDesign(order);

    if (
        status !== "cancelado" &&
        status !== "entregado" &&
        ageDays >= overdueDays
    ) {
        return {
            priority: 1,
            tone: "danger",
            category: "atrasado",
            title: "Revisar atraso",
            detail: `Pedido activo hace ${ageDays} días. Confirmar avance o contactar al cliente.`
        };
    }

    if (
        status !== "cancelado" &&
        payment !== "pagado"
    ) {
        return {
            priority: 2,
            tone: "warning",
            category: "pago",
            title: "Pago pendiente",
            detail: "Revisar Mercado Pago, comprobante de transferencia o enviar recordatorio."
        };
    }

    if (
        payment === "pagado" &&
        customized &&
        pendingDesign &&
        [
            "pendiente",
            "confirmado",
            "validacion_diseno"
        ].includes(status)
    ) {
        return {
            priority: 3,
            tone: "info",
            category: "diseno",
            title: "Preparar diseño",
            detail: "Pedido pagado con personalización pendiente de revisión o aprobación."
        };
    }

    if (
        payment === "pagado" &&
        [
            "confirmado",
            "validacion_diseno",
            "en_produccion"
        ].includes(status)
    ) {
        return {
            priority: 4,
            tone: "info",
            category: "produccion",
            title: "Avanzar producción",
            detail: "Pedido pagado listo para diseño, fabricación o actualización de estado."
        };
    }

    if (DELIVERY_STATUSES.includes(status)) {
        return {
            priority: 5,
            tone: "success",
            category: "entrega",
            title: "Coordinar entrega",
            detail: status === "listo"
                ? "Pedido listo para coordinar retiro o despacho."
                : "Pedido enviado: confirmar recepción cuando corresponda."
        };
    }

    return {
        priority: 9,
        tone: "muted",
        category: "seguimiento",
        title: "Seguimiento normal",
        detail: "Sin acción urgente registrada."
    };
}

function serializeOrderCard(order, options = {}) {
    const action =
        classifyOrder(order, options);

    return {
        id: order._id,
        numeroPedido: order.numeroPedido,
        cliente: customerName(order),
        total: Number(order.total) || 0,
        estadoPedido: order.estadoPedido,
        estadoPago: order.estadoPago,
        metodoEntrega: order.entrega?.metodo || "",
        fecha: order.createdAt,
        diasActivo: daysBetween(order.createdAt, options.now),
        items: itemCount(order),
        personalizado: orderHasCustomization(order),
        accion: action
    };
}

module.exports = {
    DELIVERY_STATUSES,
    daysBetween,
    itemHasCustomization,
    orderHasCustomization,
    orderHasPendingDesign,
    classifyOrder,
    serializeOrderCard
};
