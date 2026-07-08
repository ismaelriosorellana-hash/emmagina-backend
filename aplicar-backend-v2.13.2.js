"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const FILES = {
    defaults: path.join(ROOT, "services", "siteSettingsDefaults.js"),
    normalizer: path.join(ROOT, "utils", "siteSettingsNormalizer.js"),
    model: path.join(ROOT, "models", "SiteSettings.js"),
    adminController: path.join(ROOT, "controllers", "adminSiteSettingsController.js"),
    publicController: path.join(ROOT, "controllers", "siteSettingsController.js")
};

const missing = Object.values(FILES).filter((file) => !fs.existsSync(file));
if (missing.length) {
    console.error("ERROR: ejecuta este archivo desde la raíz del backend.");
    console.error("No se encontraron:");
    missing.forEach((file) => console.error(`  - ${path.relative(ROOT, file)}`));
    process.exit(1);
}

function read(file) {
    return fs.readFileSync(file, "utf8");
}

function write(file, content) {
    fs.writeFileSync(file, content, "utf8");
    console.log(`Actualizado: ${path.relative(ROOT, file)}`);
}

function findPropertyInsertion(text, startIndex, propertyNames, label) {
    const tail = text.slice(startIndex);
    const pattern = new RegExp(`^\\s*(?:${propertyNames.join("|")})\\s*:`, "m");
    const match = pattern.exec(tail);
    if (!match) {
        throw new Error(`No se encontró dónde insertar ${label}.`);
    }
    return startIndex + match.index;
}


const HEADER_DEFAULT = `    headerLayout: {
        social: { offsetX: 0, offsetY: 0 },
        brand: { offsetX: 0, offsetY: 0 },
        support: { offsetX: 0, offsetY: 0 },
        actions: { offsetX: 0, offsetY: 0 }
    },
`;

const HEADER_MERGE = `        headerLayout: {
            ...defaults.headerLayout,
            ...(value.headerLayout || {}),
            social: { ...defaults.headerLayout.social, ...(value.headerLayout?.social || {}) },
            brand: { ...defaults.headerLayout.brand, ...(value.headerLayout?.brand || {}) },
            support: { ...defaults.headerLayout.support, ...(value.headerLayout?.support || {}) },
            actions: { ...defaults.headerLayout.actions, ...(value.headerLayout?.actions || {}) }
        },
`;

const POSITION_HELPER = `
function normalizePositionGroup(value = {}, fallback = {}, label = "El elemento") {
    const source = value && typeof value === "object" ? value : {};
    const safeFallback = fallback && typeof fallback === "object" ? fallback : {};

    return {
        offsetX: cleanNumber(source.offsetX, {
            field: \`${"${label}"}: posición horizontal\`,
            min: -300,
            max: 300,
            fallback: Number(safeFallback.offsetX) || 0
        }),
        offsetY: cleanNumber(source.offsetY, {
            field: \`${"${label}"}: posición vertical\`,
            min: -160,
            max: 160,
            fallback: Number(safeFallback.offsetY) || 0
        })
    };
}
`;

const NORMALIZER_DECLARATION = `    const headerLayout = input.headerLayout && typeof input.headerLayout === "object"
        ? input.headerLayout
        : {};
    const fallbackHeaderLayout = fallback.headerLayout && typeof fallback.headerLayout === "object"
        ? fallback.headerLayout
        : cloneDefaultSiteSettings().headerLayout;
`;

const NORMALIZER_RETURN = `        headerLayout: {
            social: normalizePositionGroup(headerLayout.social, fallbackHeaderLayout.social, "Los iconos de redes sociales"),
            brand: normalizePositionGroup(headerLayout.brand, fallbackHeaderLayout.brand, "Los logos"),
            support: normalizePositionGroup(headerLayout.support, fallbackHeaderLayout.support, "El soporte al cliente"),
            actions: normalizePositionGroup(headerLayout.actions, fallbackHeaderLayout.actions, "Los iconos de acciones")
        },
`;

const MODEL_SCHEMA = `
const headerPositionSchema = new mongoose.Schema(
    {
        offsetX: { type: Number, default: 0, min: -300, max: 300 },
        offsetY: { type: Number, default: 0, min: -160, max: 160 }
    },
    { _id: false }
);
`;

const MODEL_FIELD = `        headerLayout: {
            social: { type: headerPositionSchema, default: () => ({}) },
            brand: { type: headerPositionSchema, default: () => ({}) },
            support: { type: headerPositionSchema, default: () => ({}) },
            actions: { type: headerPositionSchema, default: () => ({}) }
        },
`;

function patchDefaults() {
    const file = FILES.defaults;
    let text = read(file);
    let changed = false;

    if (!/headerLayout\s*:/.test(text)) {
        const defaultsStart = Math.max(0, text.indexOf("DEFAULT_SITE_SETTINGS"));
        const insertion = findPropertyInsertion(
            text,
            defaultsStart,
            ["announcementBar", "theme", "colors"],
            "headerLayout en siteSettingsDefaults.js"
        );
        text = text.slice(0, insertion) + HEADER_DEFAULT + text.slice(insertion);
        changed = true;
    }

    const mergeIndex = text.indexOf("function mergeSiteSettings");
    if (mergeIndex >= 0) {
        const mergeTail = text.slice(mergeIndex);
        if (!mergeTail.includes("...defaults.headerLayout")) {
            const insertion = findPropertyInsertion(
                text,
                mergeIndex,
                ["announcementBar", "theme", "colors"],
                "headerLayout en mergeSiteSettings"
            );
            text = text.slice(0, insertion) + HEADER_MERGE + text.slice(insertion);
            changed = true;
        }
    }

    const exportStart = text.indexOf("module.exports = {");
    if (exportStart >= 0) {
        const exportEnd = text.indexOf("};", exportStart);
        if (exportEnd >= 0) {
            const block = text.slice(exportStart, exportEnd);
            if (!block.includes("mergeSiteSettings")) {
                const lastLineBreak = text.lastIndexOf("\n", exportEnd);
                const before = text.slice(0, lastLineBreak).replace(/,?\s*$/, "");
                text = `${before},\n    mergeSiteSettings${text.slice(lastLineBreak)}`;
                changed = true;
            }
        }
    }

    if (changed) write(file, text);
    else console.log(`Sin cambios: ${path.relative(ROOT, file)}`);
}

function patchNormalizer() {
    const file = FILES.normalizer;
    let text = read(file);
    let changed = false;

    if (!text.includes("function normalizePositionGroup")) {
        const marker = "function cleanHttpsUrl";
        const index = text.indexOf(marker);
        if (index < 0) throw new Error("No se encontró cleanHttpsUrl en siteSettingsNormalizer.js.");
        text = text.slice(0, index) + POSITION_HELPER + "\n" + text.slice(index);
        changed = true;
    }

    if (!text.includes("const fallbackHeaderLayout")) {
        const marker = "    const colors = input.colors";
        const index = text.indexOf(marker);
        if (index < 0) throw new Error("No se encontró la declaración de colors en siteSettingsNormalizer.js.");
        text = text.slice(0, index) + NORMALIZER_DECLARATION + text.slice(index);
        changed = true;
    }

    if (!text.includes("social: normalizePositionGroup")) {
        const functionIndex = text.indexOf("function normalizeSiteSettings");
        const returnIndex = text.indexOf("    return {", functionIndex);
        if (returnIndex < 0) throw new Error("No se encontró el retorno de normalizeSiteSettings.");

        const insertion = findPropertyInsertion(
            text,
            returnIndex,
            ["announcementBar", "theme", "colors"],
            "headerLayout en el normalizador"
        );
        text = text.slice(0, insertion) + NORMALIZER_RETURN + text.slice(insertion);
        changed = true;
    }

    if (changed) write(file, text);
    else console.log(`Sin cambios: ${path.relative(ROOT, file)}`);
}

function patchModel() {
    const file = FILES.model;
    let text = read(file);
    let changed = false;

    if (!text.includes("const headerPositionSchema")) {
        const marker = "const siteSettingsSchema";
        const index = text.indexOf(marker);
        if (index < 0) throw new Error("No se encontró siteSettingsSchema en SiteSettings.js.");
        text = text.slice(0, index) + MODEL_SCHEMA + "\n" + text.slice(index);
        changed = true;
    }

    const schemaIndex = text.indexOf("const siteSettingsSchema");
    const schemaTail = text.slice(schemaIndex);
    if (!/headerLayout\s*:/.test(schemaTail)) {
        const insertion = findPropertyInsertion(
            text,
            schemaIndex,
            ["announcementBar", "theme", "colors"],
            "headerLayout en SiteSettings.js"
        );
        text = text.slice(0, insertion) + MODEL_FIELD + text.slice(insertion);
        changed = true;
    }

    if (changed) write(file, text);
    else console.log(`Sin cambios: ${path.relative(ROOT, file)}`);
}

function ensureMergedImport(text) {
    const simple = 'const { cloneDefaultSiteSettings } = require("../services/siteSettingsDefaults");';
    const merged = 'const { cloneDefaultSiteSettings, mergeSiteSettings } = require("../services/siteSettingsDefaults");';

    if (text.includes(simple)) return text.replace(simple, merged);
    if (text.includes("cloneDefaultSiteSettings") && !text.includes("mergeSiteSettings")) {
        return text.replace(
            /const\s*\{([^}]*cloneDefaultSiteSettings[^}]*)\}\s*=\s*require\("\.\.\/services\/siteSettingsDefaults"\);/,
            (whole, imports) => {
                const cleaned = imports.split(",").map((item) => item.trim()).filter(Boolean);
                if (!cleaned.includes("mergeSiteSettings")) cleaned.push("mergeSiteSettings");
                return `const { ${cleaned.join(", ")} } = require("../services/siteSettingsDefaults");`;
            }
        );
    }
    return text;
}

function patchController(file, isAdmin) {
    let text = read(file);
    const original = text;
    text = ensureMergedImport(text);

    if (isAdmin) {
        text = text.replace(
            /res\.json\(\{\s*settings:\s*saved\s*\|\|\s*cloneDefaultSiteSettings\(\),\s*customized:\s*Boolean\(saved\)\s*\}\);/g,
            'res.json({ settings: saved ? mergeSiteSettings(saved) : cloneDefaultSiteSettings(), customized: Boolean(saved) });'
        );
        text = text.replace(
            /settings:\s*saved\s*\|\|\s*cloneDefaultSiteSettings\(\)/g,
            'settings: saved ? mergeSiteSettings(saved) : cloneDefaultSiteSettings()'
        );
    } else {
        text = text.replace(
            /return\s+saved\s*\|\|\s*cloneDefaultSiteSettings\(\);/g,
            'return saved ? mergeSiteSettings(saved) : cloneDefaultSiteSettings();'
        );
    }

    if (text !== original) write(file, text);
    else console.log(`Sin cambios: ${path.relative(ROOT, file)}`);
}

try {
    patchDefaults();
    patchNormalizer();
    patchModel();
    patchController(FILES.adminController, true);
    patchController(FILES.publicController, false);

    console.log("\nBackend V2.13.2 aplicado correctamente.");
    console.log("Ahora valida los cinco archivos con node --check y publica el backend.");
} catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
}
