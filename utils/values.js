"use strict";

function firstDefined(...values) {
    return values.find(
        (value) =>
            value !== undefined &&
            value !== null
    );
}

function stringValue(value, fallback = "") {
    if (
        value === undefined ||
        value === null
    ) {
        return fallback;
    }

    return String(value).trim();
}

function numberValue(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number)
        ? number
        : fallback;
}

function booleanValue(value, fallback = false) {
    if (typeof value === "boolean") {
        return value;
    }

    if (typeof value === "number") {
        return value !== 0;
    }

    if (typeof value === "string") {
        const normalized =
            value.trim().toLowerCase();

        if (
            [
                "true",
                "verdadero",
                "1",
                "si",
                "sí",
                "yes"
            ].includes(normalized)
        ) {
            return true;
        }

        if (
            [
                "false",
                "falso",
                "0",
                "no"
            ].includes(normalized)
        ) {
            return false;
        }
    }

    return fallback;
}

function parsePrimitive(value) {
    const text = stringValue(value);

    if (/^-?\d+(\.\d+)?$/.test(text)) {
        return Number(text);
    }

    const lowered = text.toLowerCase();

    if (
        [
            "true",
            "verdadero",
            "si",
            "sí",
            "yes"
        ].includes(lowered)
    ) {
        return true;
    }

    if (
        [
            "false",
            "falso",
            "no"
        ].includes(lowered)
    ) {
        return false;
    }

    return text.replace(
        /^["']|["']$/g,
        ""
    );
}

function parseKeyValueArray(value) {
    if (!Array.isArray(value)) {
        return value;
    }

    const object = {};
    let found = false;

    value.forEach((entry) => {
        if (typeof entry !== "string") {
            return;
        }

        const separator =
            entry.indexOf(":");

        if (separator < 1) {
            return;
        }

        const key = entry
            .slice(0, separator)
            .trim();

        const rawValue = entry
            .slice(separator + 1)
            .trim();

        if (!key) return;

        object[key] =
            parsePrimitive(rawValue);

        found = true;
    });

    return found ? object : value;
}

function normalizeStringList(value) {
    if (Array.isArray(value)) {
        return value
            .map((item) => stringValue(item))
            .filter(Boolean);
    }

    if (typeof value === "string") {
        return value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    }

    return [];
}

function createSlug(value) {
    return stringValue(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

module.exports = {
    firstDefined,
    stringValue,
    numberValue,
    booleanValue,
    parsePrimitive,
    parseKeyValueArray,
    normalizeStringList,
    createSlug
};
