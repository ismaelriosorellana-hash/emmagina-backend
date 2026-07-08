"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
    DEFAULT_CSP,
    startsWithAny,
    isHtmlRequest
} = require("../middleware/securityHeaders");

const {
    inspectPayload
} = require("../middleware/requestSecurity");

function req(path, accept = "") {
    return {
        path,
        get(name) {
            if (name.toLowerCase() === "accept") return accept;
            return "";
        }
    };
}

test("CSP final mantiene fuentes necesarias y bloqueos básicos", () => {
    assert.match(DEFAULT_CSP, /default-src 'self'/);
    assert.match(DEFAULT_CSP, /object-src 'none'/);
    assert.match(DEFAULT_CSP, /frame-ancestors 'none'/);
    assert.match(DEFAULT_CSP, /script-src 'self'/);
    assert.match(DEFAULT_CSP, /connect-src 'self'/);
    assert.match(DEFAULT_CSP, /cloudinary/);
});

test("detecta rutas API sensibles para no-store", () => {
    assert.equal(startsWithAny("/api/admin/dashboard", ["/api/admin"]), true);
    assert.equal(startsWithAny("/api/cuenta/perfil", ["/api/cuenta"]), true);
    assert.equal(startsWithAny("/api/productos", ["/api/admin"]), false);
});

test("solo las páginas HTML reciben CSP de página", () => {
    assert.equal(isHtmlRequest(req("/producto/cuaderno", "text/html")), true);
    assert.equal(isHtmlRequest(req("/api/productos", "application/json")), false);
});

test("request security bloquea claves peligrosas también en query/body", () => {
    assert.throws(
        () => inspectPayload({ filtro: { "$where": "this.precio > 0" } }),
        /clave no permitida/
    );

    assert.throws(
        () => inspectPayload({ "perfil.nombre": "test" }),
        /clave no permitida/
    );

    assert.doesNotThrow(
        () => inspectPayload({ filtro: { categoria: "Tazas" }, pagina: 1 })
    );
});
