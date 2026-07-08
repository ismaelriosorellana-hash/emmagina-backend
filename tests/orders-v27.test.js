"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { summarizeCustomization } = require("../utils/customizationSummary");
const {
    addBusinessDays,
    formatDateOnly,
    resolvePreferredDate
} = require("../utils/orderDates");
const {
    transferHours,
    transferDeadline
} = require("../utils/transferDeadline");

test("resume una personalización simple con texto e imágenes", () => {
    const summary = summarizeCustomization({
        type: "light",
        requestedName: "Ismael",
        assets: {
            images: [
                { url: "https://example.test/uno.png" },
                { url: "https://example.test/dos.png" }
            ]
        }
    });

    assert.equal(summary.tipo, "simple");
    assert.equal(summary.descripcion, "Texto + 2 imágenes");
    assert.equal(summary.imagenes.length, 2);
});

test("resume una personalización avanzada y conserva su vista previa", () => {
    const summary = summarizeCustomization({
        version: 2,
        mainText: "Gracias",
        imageName: "foto.png",
        assets: {
            preview: { url: "https://example.test/preview.png" }
        }
    });

    assert.equal(summary.tipo, "avanzada");
    assert.equal(summary.descripcion, "Texto + Imagen");
    assert.equal(summary.vistaPrevia, "https://example.test/preview.png");
});

test("calcula días hábiles omitiendo sábado y domingo", () => {
    const friday = new Date("2026-06-26T12:00:00.000Z");
    assert.equal(formatDateOnly(addBusinessDays(friday, 1)), "2026-06-29");
    assert.equal(formatDateOnly(addBusinessDays(friday, 3)), "2026-07-01");
});

test("rechaza una fecha preferida anterior al mínimo", () => {
    const now = new Date("2026-06-26T15:00:00.000Z");
    assert.throws(
        () => resolvePreferredDate("2026-06-30", 3, now),
        /primera fecha disponible es 2026-07-01/
    );
});

test("acepta la fecha mínima o una posterior", () => {
    const now = new Date("2026-06-26T15:00:00.000Z");
    const result = resolvePreferredDate("2026-07-01", 3, now);
    assert.equal(result.minimumText, "2026-07-01");
    assert.equal(result.selectedText, "2026-07-01");
});

test("el plazo de comprobante es de tres horas por defecto", () => {
    const previous = process.env.TRANSFER_RECEIPT_HOURS;
    delete process.env.TRANSFER_RECEIPT_HOURS;
    try {
        const start = new Date("2026-06-27T12:00:00.000Z");
        assert.equal(transferHours(), 3);
        assert.equal(
            transferDeadline(start).toISOString(),
            "2026-06-27T15:00:00.000Z"
        );
    } finally {
        if (previous === undefined) delete process.env.TRANSFER_RECEIPT_HOURS;
        else process.env.TRANSFER_RECEIPT_HOURS = previous;
    }
});

test("incluye la talla en el resumen de personalización", () => {
    const summary = summarizeCustomization({
        version: 2,
        talla: "2-4",
        mainText: "Sofía"
    });

    assert.equal(summary.tipo, "avanzada");
    assert.deepEqual(summary.elementos, ["Talla 2-4", "Texto"]);
    assert.equal(summary.descripcion, "Talla 2-4 + Texto");
});
