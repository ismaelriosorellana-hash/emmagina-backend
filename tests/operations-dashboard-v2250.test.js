"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const operations = require("../utils/operationsDashboard");

const NOW = new Date("2026-07-07T12:00:00.000Z");

function sampleOrder(overrides = {}) {
    return {
        _id: "65f000000000000000000000",
        numeroPedido: "MC-2401",
        createdAt: "2026-07-07T08:00:00.000Z",
        estadoPedido: "pendiente",
        estadoPago: "pendiente",
        total: 12990,
        cliente: {
            nombre: "Cliente Prueba"
        },
        entrega: {
            metodo: "retiro"
        },
        items: [
            {
                nombre: "Taza personalizada",
                cantidad: 1,
                personalizacionResumen: {
                    tipo: "simple"
                },
                disenoFinal: {
                    estado: "pendiente"
                }
            }
        ],
        ...overrides
    };
}

test("classifyOrder prioriza pedidos atrasados por sobre otros estados", () => {
    const order = sampleOrder({
        createdAt: "2026-06-30T12:00:00.000Z",
        estadoPedido: "en_produccion",
        estadoPago: "pagado"
    });

    const action = operations.classifyOrder(order, {
        now: NOW,
        overdueDays: 5
    });

    assert.equal(action.category, "atrasado");
    assert.equal(action.tone, "danger");
});

test("classifyOrder detecta personalización pagada pendiente de diseño", () => {
    const order = sampleOrder({
        estadoPedido: "confirmado",
        estadoPago: "pagado"
    });

    const action = operations.classifyOrder(order, {
        now: NOW,
        overdueDays: 5
    });

    assert.equal(action.category, "diseno");
    assert.equal(action.title, "Preparar diseño");
});

test("serializeOrderCard entrega datos listos para el panel operativo", () => {
    const card = operations.serializeOrderCard(sampleOrder(), {
        now: NOW,
        overdueDays: 5
    });

    assert.equal(card.numeroPedido, "MC-2401");
    assert.equal(card.cliente, "Cliente Prueba");
    assert.equal(card.items, 1);
    assert.equal(card.personalizado, true);
    assert.equal(card.accion.category, "pago");
});
