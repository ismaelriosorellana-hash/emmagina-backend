"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
    normalizeSiteContent,
    cleanSlug
} = require("../utils/contentNormalizer");

const {
    cloneDefaultContent,
    CONTENT_SLUGS
} = require("../services/siteContentDefaults");

test("incluye todas las páginas editables esperadas", () => {
    assert.deepEqual(
        CONTENT_SLUGS,
        [
            "quienes-somos",
            "contacto",
            "preguntas-frecuentes",
            "despachos-retiros",
            "cambios-pedidos",
            "privacidad",
            "terminos",
            "seguridad"
        ]
    );
});

test("normaliza contenido seguro sin aceptar HTML libre", () => {
    const fallback = cloneDefaultContent("contacto");
    const result = normalizeSiteContent(
        "contacto",
        {
            ...fallback,
            title: "  Contacto oficial  ",
            sections: [
                {
                    title: "Canal",
                    body: "Línea 1\nLínea 2",
                    items: ["Uno", "Dos"]
                }
            ]
        },
        fallback
    );

    assert.equal(result.title, "Contacto oficial");
    assert.equal(result.sections[0].body, "Línea 1\nLínea 2");
    assert.deepEqual(result.sections[0].items, ["Uno", "Dos"]);
});

test("rechaza páginas fuera del catálogo editable", () => {
    assert.throws(
        () => cleanSlug("configuracion-secreta"),
        /no es editable/i
    );
});

test("rechaza enlaces con esquemas peligrosos", () => {
    const fallback = cloneDefaultContent("contacto");

    assert.throws(
        () => normalizeSiteContent(
            "contacto",
            {
                ...fallback,
                contactCards: [
                    {
                        title: "Enlace",
                        detail: "Prueba",
                        actionLabel: "Abrir",
                        actionUrl: "javascript:alert(1)"
                    }
                ]
            },
            fallback
        ),
        /deben comenzar/i
    );
});
