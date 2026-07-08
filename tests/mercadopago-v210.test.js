"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
    buildPreferenceBody,
    preferenceAmount,
    mappedPaymentStatus,
    paymentMatchesOrder
} = require("../services/mercadoPagoService");
const {
    validatePaymentMethod
} = require("../controllers/orderController");

function sampleOrder(overrides = {}) {
    return {
        _id: "66a123456789012345678901",
        numeroPedido: "MC-2026-0001",
        consultaToken: "token-consulta",
        cliente: {
            nombre: "Cliente Prueba",
            email: "comprador@example.com",
            telefono: "+56911111111"
        },
        items: [
            {
                productoId: "66b123456789012345678901",
                nombre: "Polera personalizada",
                color: "Blanco",
                talla: "M",
                sku: "POL-M-BLA",
                imagen: "https://example.com/polera.jpg",
                cantidad: 2,
                precioUnitario: 10000
            }
        ],
        costoEnvio: 4000,
        total: 24000,
        ...overrides
    };
}

test("crea una preferencia con envío separado y URLs de retorno", () => {
    const previous = process.env.PUBLIC_FRONTEND_URL;
    process.env.PUBLIC_FRONTEND_URL = "https://emmagina.onrender.com";

    try {
        const body = buildPreferenceBody(sampleOrder());

        assert.equal(body.items.length, 1);
        assert.match(body.items[0].description, /Blanco · M · POL-M-BLA/);
        assert.deepEqual(body.shipments, {
            cost: 4000,
            mode: "not_specified"
        });
        assert.equal(
            preferenceAmount(body.items, body.shipments.cost),
            24000
        );
        assert.equal(body.external_reference, "MC-2026-0001");
        assert.match(body.back_urls.success, /^https:\/\/emmagina\.onrender\.com\/pago\.html\?/);
        assert.equal(body.auto_return, "approved");
    } finally {
        if (previous === undefined) delete process.env.PUBLIC_FRONTEND_URL;
        else process.env.PUBLIC_FRONTEND_URL = previous;
    }
});

test("consolida el cobro si el total no coincide con productos y envío", () => {
    const body = buildPreferenceBody(sampleOrder({ total: 23000 }));

    assert.equal(body.items.length, 1);
    assert.equal(body.items[0].title, "Pedido MC-2026-0001");
    assert.equal(body.items[0].unit_price, 23000);
    assert.equal(body.shipments, undefined);
});

test("mapea estados de Mercado Pago y valida el monto del pedido", () => {
    const order = sampleOrder();
    const payment = {
        id: 123,
        status: "approved",
        transaction_amount: 24000,
        external_reference: order.numeroPedido,
        metadata: {}
    };

    assert.equal(mappedPaymentStatus("approved"), "pagado");
    assert.equal(mappedPaymentStatus("rejected"), "rechazado");
    assert.equal(mappedPaymentStatus("in_process"), "pendiente");
    assert.equal(paymentMatchesOrder(order, payment), true);
    assert.equal(paymentMatchesOrder(order, { ...payment, transaction_amount: 20000 }), false);
});

test("acepta los dos métodos habilitados y rechaza otros", () => {
    const previousToken = process.env.MP_ACCESS_TOKEN;
    const previousSecret = process.env.MP_WEBHOOK_SECRET;
    const previousBackendUrl = process.env.PUBLIC_BACKEND_URL;
    process.env.MP_ACCESS_TOKEN = "APP_USR-TEST";
    process.env.MP_WEBHOOK_SECRET = "test-webhook-secret";
    process.env.PUBLIC_BACKEND_URL = "https://emmagina-backend.onrender.com";

    try {
        assert.doesNotThrow(() => validatePaymentMethod("transferencia"));
        assert.doesNotThrow(() => validatePaymentMethod("mercadopago"));
        assert.throws(
            () => validatePaymentMethod("efectivo"),
            /no está disponible/i
        );
    } finally {
        if (previousToken === undefined) delete process.env.MP_ACCESS_TOKEN;
        else process.env.MP_ACCESS_TOKEN = previousToken;
        if (previousSecret === undefined) delete process.env.MP_WEBHOOK_SECRET;
        else process.env.MP_WEBHOOK_SECRET = previousSecret;
        if (previousBackendUrl === undefined) delete process.env.PUBLIC_BACKEND_URL;
        else process.env.PUBLIC_BACKEND_URL = previousBackendUrl;
    }
});
