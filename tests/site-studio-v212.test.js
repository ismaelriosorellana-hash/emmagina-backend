"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { cloneDefaultSiteStudio, mergeSiteStudio } = require("../services/siteStudioDefaults");
const { normalizeSiteStudio } = require("../utils/siteStudioNormalizer");

function validPayload() {
    const value = cloneDefaultSiteStudio();
    value.pages[0].sections.push({
        id: "custom-welcome",
        type: "richText",
        zone: "main",
        enabled: true,
        order: 15,
        eyebrow: "Nuevo",
        title: "Bloque administrable",
        body: "Texto seguro",
        alignment: "center",
        imagePosition: "right",
        backgroundColor: "#FFFFFF",
        textColor: "#372A32",
        paddingY: 30,
        borderRadius: 20,
        productMode: "featured",
        itemLimit: 4
    });
    value.pages.push({
        id: "custom-guia-regalos",
        type: "custom",
        label: "Guía de regalos",
        path: "pagina.html?slug=guia-regalos",
        enabled: true,
        seoTitle: "Guía de regalos | Emmagina",
        seoDescription: "Ideas de regalos personalizados.",
        layout: { maxWidth: 1100, contentPadding: 20, sectionGap: 32, backgroundColor: "#EAF4F8" },
        sections: [{
            id: "intro",
            type: "hero",
            zone: "main",
            enabled: true,
            order: 10,
            eyebrow: "Ideas",
            title: "Encuentra un regalo",
            body: "Elige una opción para cada ocasión.",
            alignment: "center",
            imagePosition: "background",
            backgroundColor: "#EAF4F8",
            textColor: "#372A32",
            paddingY: 50,
            borderRadius: 24,
            productMode: "featured",
            itemLimit: 4
        }]
    });
    return value;
}

test("el editor incluye páginas centrales y el módulo administrador", () => {
    const studio = cloneDefaultSiteStudio();
    assert.ok(studio.pages.some((page) => page.id === "home"));
    assert.ok(studio.pages.some((page) => page.id === "checkout"));
    assert.ok(studio.adminPanel.items.some((item) => item.id === "studio"));
});

test("normaliza bloques y páginas personalizadas", () => {
    const normalized = normalizeSiteStudio(validPayload());
    const home = normalized.pages.find((page) => page.id === "home");
    const custom = normalized.pages.find((page) => page.id === "custom-guia-regalos");
    assert.ok(home.sections.some((section) => section.id === "custom-welcome"));
    assert.equal(custom.path, "pagina.html?slug=guia-regalos");
    assert.equal(custom.sections[0].title, "Encuentra un regalo");
});

test("rechaza enlaces inseguros y colores inválidos", () => {
    const payload = validPayload();
    payload.navigation.items[0].url = "javascript:alert(1)";
    assert.throws(() => normalizeSiteStudio(payload), /ruta interna/);

    const colors = validPayload();
    colors.adminPanel.accentColor = "red";
    assert.throws(() => normalizeSiteStudio(colors), /hexadecimal/);
});

test("merge conserva páginas centrales cuando la base guardada es antigua", () => {
    const merged = mergeSiteStudio({
        pages: [{ id: "home", label: "Portada", sections: [] }]
    });
    assert.ok(merged.pages.some((page) => page.id === "cart"));
    assert.equal(merged.pages.find((page) => page.id === "home").label, "Portada");
});
