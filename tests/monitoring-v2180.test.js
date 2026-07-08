"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
    databaseStatus,
    live,
    ready
} = require("../controllers/healthController");

function mockResponse() {
    const response = {
        statusCode: 200,
        payload: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.payload = payload;
            return this;
        }
    };

    return response;
}

test("expone estado seguro de base de datos sin credenciales", () => {
    const status = databaseStatus();

    assert.equal(typeof status.ok, "boolean");
    assert.equal(typeof status.estado, "string");
    assert.equal(typeof status.codigo, "number");
    assert.equal(Object.prototype.hasOwnProperty.call(status, "uri"), false);
    assert.equal(Object.prototype.hasOwnProperty.call(status, "password"), false);
});

test("health live responde sin consultar datos sensibles", () => {
    const res = mockResponse();

    live({ requestId: "test-request" }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.ok, true);
    assert.equal(res.payload.servicio, "emmagina-backend");
    assert.equal(res.payload.requestId, "test-request");
    assert.equal(typeof res.payload.uptimeSegundos, "number");
    assert.equal(Object.prototype.hasOwnProperty.call(res.payload, "jwt"), false);
});

test("health ready usa 200 o 503 según disponibilidad de MongoDB", () => {
    const res = mockResponse();

    ready({ requestId: "ready-request" }, res);

    assert.ok([200, 503].includes(res.statusCode));
    assert.equal(res.payload.requestId, "ready-request");
    assert.equal(typeof res.payload.database.ok, "boolean");
});
