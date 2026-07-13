"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("incluye endpoint administrativo de preparación de lanzamiento", () => {
    assert.match(read("app.js"), /\/api\/admin\/lanzamiento/);
    assert.match(read("routes/admin/lanzamiento.js"), /adminLaunchStatus/);
    assert.match(read("controllers/adminLaunchController.js"), /canStartControlledLaunch/);
    assert.match(read("controllers/adminLaunchController.js"), /Pedido de prueba/);
    assert.match(read("controllers/adminLaunchController.js"), /Mercado Pago/);
});
