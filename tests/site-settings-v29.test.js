"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { cloneDefaultSiteSettings } = require("../services/siteSettingsDefaults");
const { normalizeSiteSettings } = require("../utils/siteSettingsNormalizer");

test("entrega una configuración visual predeterminada completa", () => {
    const value = cloneDefaultSiteSettings();
    assert.equal(value.key, "main");
    assert.match(value.branding.logo.url, /^https:\/\//);
    assert.equal(value.branding.title.mode, "image");
    assert.match(value.colors.primary, /^#[0-9A-F]{6}$/i);
    assert.match(value.colors.footerBackground, /^#[0-9A-F]{6}$/i);
    assert.equal(value.announcementBar.enabled, true);
    assert.ok(value.announcementBar.items.length >= 1);
});

test("normaliza identidad, posiciones y colores válidos", () => {
    const value = normalizeSiteSettings({
        branding: {
            logo: { width: 80, offsetX: 12, offsetY: -4, alt: "Logo de prueba" },
            title: { mode: "text", text: "Mommy Crafts", fontSize: 40, gap: 18 }
        },
        colors: { primary: "#ABCDEF", text: "#101010" },
        announcementBar: {
            enabled: true,
            speedSeconds: 30,
            backgroundColor: "#222222",
            textColor: "#FFFFFF",
            linkColor: "#FFC0E6",
            items: [{ text: "Oferta", url: "catalogo.html" }]
        }
    });

    assert.equal(value.branding.logo.width, 80);
    assert.equal(value.branding.logo.offsetX, 12);
    assert.equal(value.branding.title.mode, "text");
    assert.equal(value.branding.title.fontSize, 40);
    assert.equal(value.colors.primary, "#ABCDEF");
    assert.equal(value.colors.text, "#101010");
    assert.equal(value.announcementBar.speedSeconds, 30);
    assert.equal(value.announcementBar.items[0].url, "catalogo.html");
});

test("rechaza colores y posiciones fuera de rango", () => {
    assert.throws(
        () => normalizeSiteSettings({ colors: { primary: "red" } }),
        /formato hexadecimal/i
    );
    assert.throws(
        () => normalizeSiteSettings({ branding: { logo: { offsetX: 999 } } }),
        /entre -300 y 300/i
    );
});
