"use strict";

const {
    cleanText,
    validationError
} = require("./validation");

const {
    CONTENT_SLUGS
} = require("../services/siteContentDefaults");

function cleanSlug(value) {
    const slug = cleanText(value, {
        field: "La página",
        maxLength: 80,
        required: true
    }).toLowerCase();

    if (!CONTENT_SLUGS.includes(slug)) {
        throw validationError("La página indicada no es editable.");
    }

    return slug;
}

function cleanBoolean(value, fallback = false) {
    if (value === undefined || value === null || value === "") {
        return fallback;
    }

    if (typeof value === "boolean") return value;
    if (value === "true" || value === 1 || value === "1") return true;
    if (value === "false" || value === 0 || value === "0") return false;

    throw validationError("El estado de publicación no es válido.");
}

function cleanUrl(value) {
    const url = cleanText(value, {
        field: "El enlace",
        maxLength: 500
    });

    if (!url) return "";

    if (!/^(https?:\/\/|mailto:|tel:)/i.test(url)) {
        throw validationError("Los enlaces deben comenzar con https://, http://, mailto: o tel:.");
    }

    return url;
}

function limitedArray(value, max, field) {
    if (value === undefined || value === null) return [];
    if (!Array.isArray(value)) {
        throw validationError(`${field} debe ser una lista.`);
    }
    if (value.length > max) {
        throw validationError(`${field} supera el máximo de ${max} elementos.`);
    }
    return value;
}

function normalizeItems(value) {
    return limitedArray(value, 15, "Los puntos")
        .map((item) => cleanText(item, {
            field: "Cada punto",
            maxLength: 500
        }))
        .filter(Boolean);
}

function normalizeSections(value) {
    return limitedArray(value, 14, "Las secciones")
        .map((section) => {
            if (!section || typeof section !== "object" || Array.isArray(section)) {
                throw validationError("Una sección no tiene un formato válido.");
            }

            return {
                title: cleanText(section.title, {
                    field: "El título de la sección",
                    maxLength: 180,
                    required: true
                }),
                body: cleanText(section.body, {
                    field: "El contenido de la sección",
                    maxLength: 6000,
                    allowNewlines: true
                }),
                items: normalizeItems(section.items)
            };
        })
        .filter((section) => section.title);
}

function normalizeFaqs(value) {
    return limitedArray(value, 30, "Las preguntas frecuentes")
        .map((faq) => {
            if (!faq || typeof faq !== "object" || Array.isArray(faq)) {
                throw validationError("Una pregunta frecuente no tiene un formato válido.");
            }

            return {
                question: cleanText(faq.question, {
                    field: "La pregunta",
                    maxLength: 260,
                    required: true
                }),
                answer: cleanText(faq.answer, {
                    field: "La respuesta",
                    maxLength: 4000,
                    required: true,
                    allowNewlines: true
                })
            };
        });
}

function normalizeContactCards(value) {
    return limitedArray(value, 10, "Los canales de contacto")
        .map((card) => {
            if (!card || typeof card !== "object" || Array.isArray(card)) {
                throw validationError("Un canal de contacto no tiene un formato válido.");
            }

            return {
                title: cleanText(card.title, {
                    field: "El título del canal",
                    maxLength: 160,
                    required: true
                }),
                detail: cleanText(card.detail, {
                    field: "El detalle del canal",
                    maxLength: 2000,
                    allowNewlines: true
                }),
                actionLabel: cleanText(card.actionLabel, {
                    field: "El texto del botón",
                    maxLength: 100
                }),
                actionUrl: cleanUrl(card.actionUrl)
            };
        });
}

function normalizeSiteContent(slugValue, input = {}, fallback = {}) {
    const slug = cleanSlug(slugValue);

    return {
        slug,
        label: cleanText(input.label ?? fallback.label, {
            field: "El nombre de la página",
            maxLength: 120,
            required: true
        }),
        kicker: cleanText(input.kicker ?? fallback.kicker, {
            field: "El encabezado breve",
            maxLength: 120
        }),
        title: cleanText(input.title ?? fallback.title, {
            field: "El título",
            maxLength: 220,
            required: true
        }),
        summary: cleanText(input.summary ?? fallback.summary, {
            field: "El resumen",
            maxLength: 3000,
            allowNewlines: true
        }),
        sections: normalizeSections(input.sections ?? fallback.sections),
        faqs: normalizeFaqs(input.faqs ?? fallback.faqs),
        contactCards: normalizeContactCards(
            input.contactCards ?? fallback.contactCards
        ),
        notice: cleanText(input.notice ?? fallback.notice, {
            field: "El aviso final",
            maxLength: 3000,
            allowNewlines: true
        }),
        published: cleanBoolean(
            input.published,
            fallback.published !== false
        ),
        seoTitle: cleanText(input.seoTitle ?? fallback.seoTitle, {
            field: "El título SEO",
            maxLength: 180
        }),
        seoDescription: cleanText(
            input.seoDescription ?? fallback.seoDescription,
            {
                field: "La descripción SEO",
                maxLength: 320
            }
        )
    };
}

module.exports = {
    cleanSlug,
    normalizeSiteContent,
    normalizeSections,
    normalizeFaqs,
    normalizeContactCards
};
