"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

function resetEnv() {
    delete process.env.NOTIFICATIONS_ENABLED;
    delete process.env.EMAIL_PROVIDER;
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
    delete process.env.EMAIL_REPLY_TO;
    delete process.env.NOTIFICATION_ADMIN_EMAIL;
    delete process.env.WHATSAPP_SUPPORT_NUMBER;
    delete process.env.PUBLIC_FRONTEND_URL;
}

test("notificationConfigStatus detecta configuración pendiente", () => {
    resetEnv();
    const {
        notificationConfigStatus
    } = require("../services/notificationService");

    const status = notificationConfigStatus();

    assert.equal(status.enabled, true);
    assert.equal(status.configured, false);
    assert.equal(status.estado, "pendiente");
    assert.match(status.mensaje, /Faltan|Falta/);
});

test("notificationConfigStatus detecta Resend operativo", () => {
    resetEnv();
    process.env.NOTIFICATIONS_ENABLED = "true";
    process.env.EMAIL_PROVIDER = "resend";
    process.env.RESEND_API_KEY = "re_123";
    process.env.EMAIL_FROM = "Mommy Crafts <pedidos@example.com>";
    process.env.EMAIL_REPLY_TO = "soporte@example.com";
    process.env.NOTIFICATION_ADMIN_EMAIL = "admin@example.com,venta@example.com";
    process.env.WHATSAPP_SUPPORT_NUMBER = "56912345678";
    process.env.PUBLIC_FRONTEND_URL = "https://mommycrafts.onrender.com";

    const {
        notificationConfigStatus,
        emailReady
    } = require("../services/notificationService");

    const status = notificationConfigStatus();

    assert.equal(emailReady(), true);
    assert.equal(status.configured, true);
    assert.equal(status.estado, "operativo");
    assert.equal(status.adminEmailConfigured, true);
    assert.equal(status.whatsappSupportConfigured, true);
    assert.equal(status.frontendUrlConfigured, true);
    assert.equal(status.replyToConfigured, true);
    assert.deepEqual(status.adminEmailsMasked.length, 2);
});

test("buildNotification mantiene seguimiento cuando hay frontend público", () => {
    resetEnv();
    process.env.PUBLIC_FRONTEND_URL = "https://mommycrafts.onrender.com";
    const {
        buildNotification
    } = require("../services/notificationService");

    const notification = buildNotification({
        _id: "65f000000000000000000000",
        numeroPedido: "MC-1001",
        estadoPedido: "pendiente",
        estadoPago: "pendiente_comprobante",
        total: 12990,
        cliente: {
            nombre: "Cliente Prueba",
            email: "cliente@example.com",
            telefono: "+56 9 1234 5678"
        },
        items: [
            {
                nombre: "Taza personalizada",
                cantidad: 1
            }
        ]
    }, "order_created");

    assert.equal(notification.event, "order_created");
    assert.match(notification.trackingUrl, /seguimiento-pedido\.html/);
    assert.match(notification.whatsappText, /MC-1001/);
    assert.match(notification.subject, /Pedido recibido/);
});
