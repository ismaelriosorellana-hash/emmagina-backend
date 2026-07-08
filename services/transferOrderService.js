"use strict";

const Pedido = require("../models/Pedido");
const { applyOrderStock } = require("./inventoryService");

const { transferHours, transferWindowMs, transferDeadline } = require("../utils/transferDeadline");

async function expireOrder(order) {
    if (!order || order.metodoPago !== "transferencia" || order.estadoPago !== "pendiente_comprobante") return false;
    if (!order.transferencia?.venceAt || order.transferencia.venceAt.getTime() > Date.now()) return false;

    if (order.stockAplicado) {
        await applyOrderStock(order, "restore");
        order.stockAplicado = false;
    }
    order.estadoPago = "vencido";
    order.estadoPedido = "cancelado";
    order.historial.push({
        estado: "vencido",
        detalle: `El plazo de ${transferHours()} horas para enviar el comprobante finalizó. El stock fue liberado.`
    });
    await order.save();
    return true;
}

async function expirePendingTransferOrders() {
    const orders = await Pedido.find({
        metodoPago: "transferencia",
        estadoPago: "pendiente_comprobante",
        "transferencia.venceAt": { $lte: new Date() },
        estadoPedido: { $ne: "cancelado" }
    }).limit(100);
    let count = 0;
    for (const order of orders) {
        try { if (await expireOrder(order)) count += 1; } catch (error) { console.error("No se pudo vencer pedido", order.numeroPedido, error.message); }
    }
    return count;
}

module.exports = {
    transferHours,
    transferWindowMs,
    transferDeadline,
    expireOrder,
    expirePendingTransferOrders
};
