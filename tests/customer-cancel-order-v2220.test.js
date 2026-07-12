"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const accountController = fs.readFileSync(path.join(root, "controllers", "accountController.js"), "utf8");
const accountRoutes = fs.readFileSync(path.join(root, "routes", "account.js"), "utf8");
const pedidoModel = fs.readFileSync(path.join(root, "models", "Pedido.js"), "utf8");
const envExample = fs.readFileSync(path.join(root, ".env.example"), "utf8");

test("cliente puede cancelar solo pedidos pendientes antes del pago", () => {
    assert.match(accountController, /function canCustomerCancelOrder/);
    assert.match(accountController, /CUSTOMER_CANCEL_PAYMENT_STATES/);
    assert.match(accountController, /paymentId/);
    assert.match(accountController, /estadoPedido =\s*"cancelado"/);
    assert.match(accountController, /cancelado_por_cliente/);
    assert.match(accountRoutes, /\/pedidos\/:id\/cancelar/);
});

test("cancelacion queda auditada sin borrar el pedido", () => {
    assert.match(pedidoModel, /canceladoPorCliente/);
    assert.match(pedidoModel, /canceladoAt/);
    assert.match(accountController, /Pedido\.findOne/);
    assert.doesNotMatch(accountController, /deleteOne\(\{\s*_id:\s*req\.params\.id/);
});

test("correo visible de produccion usa venta@rhemadisenos.cl", () => {
    assert.match(envExample, /EMAIL_FROM=Rhema Diseños <venta@rhemadisenos\.cl>/);
    assert.match(envExample, /EMAIL_REPLY_TO=venta@rhemadisenos\.cl/);
    assert.match(envExample, /NOTIFICATION_ADMIN_EMAIL=venta@rhemadisenos\.cl/);
});
