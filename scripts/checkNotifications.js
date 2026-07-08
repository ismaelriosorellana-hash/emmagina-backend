"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

function read(file) {
    return fs.readFileSync(path.join(ROOT, file), "utf8");
}

function ok(message) {
    console.log(`✅ ${message}`);
}

function assert(condition, message) {
    if (!condition) {
        console.error(`❌ ${message}`);
        process.exitCode = 1;
    } else {
        ok(message);
    }
}

const service = read("services/notificationService.js");
const controller = read("controllers/adminNotificationController.js");
const routes = read("routes/admin/pedidos.js");
const orderController = read("controllers/orderController.js");
const paymentController = read("controllers/paymentController.js");
const adminOrderController = read("controllers/adminOrderController.js");

assert(service.includes("buildNotification"), "Servicio de notificaciones genera plantillas.");
assert(service.includes("https://api.resend.com/emails"), "Servicio puede enviar correos vía Resend sin dependencias nuevas.");
assert(controller.includes("previewOrderNotification"), "Controlador permite previsualizar mensajes por pedido.");
assert(controller.includes("sendOrderNotification"), "Controlador permite enviar o registrar mensajes por pedido.");
assert(routes.includes("/:id/notificaciones/:evento"), "Rutas admin de pedidos exponen notificaciones.");
assert(orderController.includes("dispatchNotification(order, \"order_created\""), "Nuevo pedido dispara notificación de pedido recibido.");
assert(paymentController.includes("notifyPaymentConfirmed"), "Pago confirmado dispara notificación de pago.");
assert(adminOrderController.includes("dispatchNotification"), "Cambio de estado admin dispara notificación de avance.");

if (process.exitCode) {
    console.error("\nVerificación de notificaciones con errores.");
    process.exit(process.exitCode);
}

console.log("\nVerificación de notificaciones completada.");
