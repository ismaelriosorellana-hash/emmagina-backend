"use strict";

const CHILE_TIME_ZONE = "America/Santiago";

function dateOnly(value) {
    const raw = String(value || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
    const date = new Date(`${raw}T12:00:00.000Z`);
    return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateOnly(date) {
    return date.toISOString().slice(0, 10);
}

function todayInChile(now = new Date()) {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: CHILE_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(now);

    const values = Object.fromEntries(
        parts
            .filter((part) => ["year", "month", "day"].includes(part.type))
            .map((part) => [part.type, part.value])
    );

    return dateOnly(`${values.year}-${values.month}-${values.day}`);
}

function addBusinessDays(start, days) {
    const date = new Date(start);
    date.setUTCHours(12, 0, 0, 0);
    let remaining = Math.max(0, Number(days) || 0);

    while (remaining > 0) {
        date.setUTCDate(date.getUTCDate() + 1);
        const weekday = date.getUTCDay();
        if (weekday !== 0 && weekday !== 6) remaining -= 1;
    }

    return date;
}

function resolvePreferredDate(value, minimumDays, now = new Date()) {
    const minimum = addBusinessDays(todayInChile(now), minimumDays);
    const selected = dateOnly(value);

    if (!selected) {
        const error = new Error("Debes elegir una fecha preferida de entrega.");
        error.statusCode = 400;
        throw error;
    }

    if (selected.getTime() < minimum.getTime()) {
        const error = new Error(`La primera fecha disponible es ${formatDateOnly(minimum)}.`);
        error.statusCode = 400;
        throw error;
    }

    return {
        selected,
        minimum,
        selectedText: formatDateOnly(selected),
        minimumText: formatDateOnly(minimum)
    };
}

module.exports = {
    CHILE_TIME_ZONE,
    dateOnly,
    todayInChile,
    addBusinessDays,
    formatDateOnly,
    resolvePreferredDate
};
