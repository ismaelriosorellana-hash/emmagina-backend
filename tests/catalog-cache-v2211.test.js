"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const controllerSource = fs.readFileSync(
    path.join(__dirname, "..", "controllers", "productController.js"),
    "utf8"
);

test("la API publica de productos evita cache obsoleta de precios y stock", () => {
    assert.match(
        controllerSource,
        /Cache-Control[\s\S]*no-store, max-age=0, must-revalidate/
    );
    assert.match(controllerSource, /Pragma[\s\S]*no-cache/);
    assert.match(controllerSource, /Expires[\s\S]*0/);
});

test("la API de productos ya no declara cache publica con stale-while-revalidate", () => {
    assert.doesNotMatch(
        controllerSource,
        /public, max-age=.*stale-while-revalidate=300/
    );
});
