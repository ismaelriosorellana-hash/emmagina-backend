"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

function resetEnv() {
    delete process.env.EMAIL_REPLY_TO;
    delete process.env.EMAIL_LOGO_URL;
    delete process.env.WHATSAPP_SUPPORT_NUMBER;
    delete process.env.PUBLIC_FRONTEND_URL;
}

const sampleOrder = {
    _id: "65f000000000000000000000",
    numeroPedido: "MC-2401",
    estadoPedido: "pendiente",
    estadoPago: "pendiente_comprobante",
    subtotal: 12990,
    costoEnvio: 0,
    total: 12990,
    cliente: {
        nombre: "Cliente Prueba",
        email: "cliente@example.com",
        telefono: "+56 9 1234 5678"
    },
    entrega: {
        metodo: "retiro",
        comuna: "Puente Alto",
        diasPreparacion: 3
    },
    items: [
        {
            nombre: "Taza personalizada",
            cantidad: 1,
            precioUnitario: 12990,
            subtotal: 12990,
            color: "Blanca",
            sku: "TAZA-BLANCA"
        }
    ]
};

test("buildNotification genera correo HTML con marca, resumen y contacto ventas", () => {
    resetEnv();
    process.env.PUBLIC_FRONTEND_URL = "https://emmagina.cl";
    process.env.EMAIL_REPLY_TO = "ventas@emmagina.cl";
    process.env.WHATSAPP_SUPPORT_NUMBER = "56954633848";

    const { buildNotification } = require("../services/notificationService");
    const notification = buildNotification(sampleOrder, "order_created");

    assert.equal(notification.event, "order_created");
    assert.match(notification.subject, /Emmagina/);
    assert.match(notification.html, /Resumen del pedido/);
    assert.match(notification.html, /Taza personalizada/);
    assert.match(notification.html, /ventas@emmagina\.cl/);
    assert.match(notification.html, /Ver seguimiento del pedido/);
    assert.match(notification.trackingUrl, /emmagina\.cl\/seguimiento-pedido\.html/);
});

test("buildNotification mantiene texto plano para WhatsApp", () => {
    resetEnv();
    const { buildNotification } = require("../services/notificationService");
    const notification = buildNotification(sampleOrder, "payment_confirmed");

    assert.match(notification.text, /MC-2401/);
    assert.match(notification.whatsappText, /MC-2401/);
    assert.doesNotMatch(notification.whatsappText, /<table/);
});
