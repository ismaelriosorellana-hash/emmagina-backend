from pathlib import Path
import sys

ROOT = Path.cwd()

FILES = {
    "defaults": ROOT / "services" / "siteSettingsDefaults.js",
    "normalizer": ROOT / "utils" / "siteSettingsNormalizer.js",
    "model": ROOT / "models" / "SiteSettings.js",
    "admin_controller": ROOT / "controllers" / "adminSiteSettingsController.js",
    "public_controller": ROOT / "controllers" / "siteSettingsController.js",
}

missing = [str(path) for path in FILES.values() if not path.exists()]
if missing:
    print("ERROR: Ejecuta este script desde la raíz del backend.")
    print("No se encontraron:")
    for item in missing:
        print(f"  - {item}")
    sys.exit(1)

HEADER_DEFAULT = '''    headerLayout: {
        social: { offsetX: 0, offsetY: 0 },
        brand: { offsetX: 0, offsetY: 0 },
        support: { offsetX: 0, offsetY: 0 },
        actions: { offsetX: 0, offsetY: 0 }
    },
'''

HEADER_MERGE = '''            headerLayout: {
                ...defaults.headerLayout,
                ...(value.headerLayout || {}),
                social: { ...defaults.headerLayout.social, ...(value.headerLayout?.social || {}) },
                brand: { ...defaults.headerLayout.brand, ...(value.headerLayout?.brand || {}) },
                support: { ...defaults.headerLayout.support, ...(value.headerLayout?.support || {}) },
                actions: { ...defaults.headerLayout.actions, ...(value.headerLayout?.actions || {}) }
            },
'''

FALLBACK_MERGE_FUNCTION = '''
function mergeSiteSettings(value = {}) {
    const defaults = cloneDefaultSiteSettings();
    const result = {
        ...defaults,
        ...value,
        branding: {
            ...defaults.branding,
            ...(value.branding || {}),
            logo: { ...defaults.branding.logo, ...(value.branding?.logo || {}) },
            title: { ...defaults.branding.title, ...(value.branding?.title || {}) }
        },
        headerLayout: {
            ...defaults.headerLayout,
            ...(value.headerLayout || {}),
            social: { ...defaults.headerLayout.social, ...(value.headerLayout?.social || {}) },
            brand: { ...defaults.headerLayout.brand, ...(value.headerLayout?.brand || {}) },
            support: { ...defaults.headerLayout.support, ...(value.headerLayout?.support || {}) },
            actions: { ...defaults.headerLayout.actions, ...(value.headerLayout?.actions || {}) }
        },
        colors: { ...defaults.colors, ...(value.colors || {}) }
    };

    if (defaults.announcementBar) {
        result.announcementBar = {
            ...defaults.announcementBar,
            ...(value.announcementBar || {}),
            items: Array.isArray(value.announcementBar?.items) && value.announcementBar.items.length
                ? value.announcementBar.items
                : defaults.announcementBar.items
        };
    }

    if (defaults.theme) {
        result.theme = { ...defaults.theme, ...(value.theme || {}) };
    }

    return result;
}
'''

POSITION_HELPER = '''
function normalizePositionGroup(value = {}, fallback = {}, label = "El elemento") {
    const source = value && typeof value === "object" ? value : {};
    const safeFallback = fallback && typeof fallback === "object" ? fallback : {};
    return {
        offsetX: cleanNumber(source.offsetX, {
            field: `${label}: posición horizontal`,
            min: -300,
            max: 300,
            fallback: Number(safeFallback.offsetX) || 0
        }),
        offsetY: cleanNumber(source.offsetY, {
            field: `${label}: posición vertical`,
            min: -160,
            max: 160,
            fallback: Number(safeFallback.offsetY) || 0
        })
    };
}
'''

NORMALIZER_DECLARATION = '''    const headerLayout = input.headerLayout && typeof input.headerLayout === "object" ? input.headerLayout : {};
    const fallbackHeaderLayout = fallback.headerLayout && typeof fallback.headerLayout === "object"
        ? fallback.headerLayout
        : cloneDefaultSiteSettings().headerLayout;
'''

NORMALIZER_RETURN = '''        headerLayout: {
            social: normalizePositionGroup(headerLayout.social, fallbackHeaderLayout.social, "Los iconos de redes sociales"),
            brand: normalizePositionGroup(headerLayout.brand, fallbackHeaderLayout.brand, "Los logos"),
            support: normalizePositionGroup(headerLayout.support, fallbackHeaderLayout.support, "El soporte al cliente"),
            actions: normalizePositionGroup(headerLayout.actions, fallbackHeaderLayout.actions, "Los iconos de acciones")
        },
'''

MODEL_SCHEMA = '''
const headerPositionSchema = new mongoose.Schema(
    {
        offsetX: { type: Number, default: 0, min: -300, max: 300 },
        offsetY: { type: Number, default: 0, min: -160, max: 160 }
    },
    { _id: false }
);
'''

MODEL_FIELD = '''        headerLayout: {
            social: { type: headerPositionSchema, default: () => ({}) },
            brand: { type: headerPositionSchema, default: () => ({}) },
            support: { type: headerPositionSchema, default: () => ({}) },
            actions: { type: headerPositionSchema, default: () => ({}) }
        },
'''


def write(path: Path, text: str):
    path.write_text(text, encoding="utf-8")
    print(f"Actualizado: {path.relative_to(ROOT)}")


def patch_defaults():
    path = FILES["defaults"]
    text = path.read_text(encoding="utf-8")
    changed = False

    if "headerLayout:" not in text:
        candidates = ["    announcementBar: {\n", "    theme: {\n", "    colors: {\n"]
        marker = next((item for item in candidates if item in text), None)
        if not marker:
            raise RuntimeError("No se encontró dónde insertar headerLayout en siteSettingsDefaults.js")
        text = text.replace(marker, HEADER_DEFAULT + marker, 1)
        changed = True

    if "function mergeSiteSettings" in text and "...defaults.headerLayout" not in text:
        candidates = [
            "        announcementBar: {\n",
            "        theme: {\n",
            "        colors: { ...defaults.colors"
        ]
        marker = next((item for item in candidates if item in text), None)
        if not marker:
            raise RuntimeError("No se encontró dónde combinar headerLayout en mergeSiteSettings")
        text = text.replace(marker, HEADER_MERGE + marker, 1)
        changed = True

    if "function mergeSiteSettings" not in text:
        marker = "module.exports = {"
        index = text.find(marker)
        if index < 0:
            raise RuntimeError("No se encontró module.exports en siteSettingsDefaults.js")
        text = text[:index] + FALLBACK_MERGE_FUNCTION + "\n" + text[index:]
        changed = True

    export_block_start = text.find("module.exports = {")
    export_block_end = text.find("};", export_block_start)
    if export_block_start >= 0 and export_block_end >= 0:
        export_block = text[export_block_start:export_block_end]
        if "mergeSiteSettings" not in export_block:
            insert_at = text.rfind("\n", export_block_start, export_block_end)
            text = text[:insert_at] + ",\n    mergeSiteSettings" + text[insert_at:]
            changed = True

    if changed:
        write(path, text)
    else:
        print("Sin cambios: services/siteSettingsDefaults.js")


def patch_normalizer():
    path = FILES["normalizer"]
    text = path.read_text(encoding="utf-8")
    changed = False

    if "function normalizePositionGroup" not in text:
        marker = "function cleanHttpsUrl"
        index = text.find(marker)
        if index < 0:
            raise RuntimeError("No se encontró cleanHttpsUrl en siteSettingsNormalizer.js")
        text = text[:index] + POSITION_HELPER + "\n" + text[index:]
        changed = True

    if "const fallbackHeaderLayout" not in text:
        marker = "    const colors = input.colors"
        index = text.find(marker)
        if index < 0:
            raise RuntimeError("No se encontró la declaración de colors en siteSettingsNormalizer.js")
        text = text[:index] + NORMALIZER_DECLARATION + text[index:]
        changed = True

    if "social: normalizePositionGroup" not in text:
        return_index = text.find("    return {", text.find("function normalizeSiteSettings"))
        if return_index < 0:
            raise RuntimeError("No se encontró el retorno de normalizeSiteSettings")
        candidates = ["        announcementBar: {\n", "        theme: {\n", "        colors: normalizedColors"]
        positions = [(text.find(item, return_index), item) for item in candidates]
        positions = [(pos, item) for pos, item in positions if pos >= 0]
        if not positions:
            raise RuntimeError("No se encontró dónde insertar headerLayout en el retorno")
        pos, marker = min(positions, key=lambda item: item[0])
        text = text[:pos] + NORMALIZER_RETURN + text[pos:]
        changed = True

    if changed:
        write(path, text)
    else:
        print("Sin cambios: utils/siteSettingsNormalizer.js")


def patch_model():
    path = FILES["model"]
    text = path.read_text(encoding="utf-8")
    changed = False

    if "const headerPositionSchema" not in text:
        marker = "const siteSettingsSchema"
        index = text.find(marker)
        if index < 0:
            raise RuntimeError("No se encontró siteSettingsSchema en SiteSettings.js")
        text = text[:index] + MODEL_SCHEMA + "\n" + text[index:]
        changed = True

    if "headerLayout:" not in text:
        schema_index = text.find("const siteSettingsSchema")
        candidates = ["        announcementBar:", "        theme:", "        colors:"]
        positions = [(text.find(item, schema_index), item) for item in candidates]
        positions = [(pos, item) for pos, item in positions if pos >= 0]
        if not positions:
            raise RuntimeError("No se encontró dónde insertar headerLayout en SiteSettings.js")
        pos, _ = min(positions, key=lambda item: item[0])
        text = text[:pos] + MODEL_FIELD + text[pos:]
        changed = True

    if changed:
        write(path, text)
    else:
        print("Sin cambios: models/SiteSettings.js")


def patch_controller(path: Path, admin: bool):
    text = path.read_text(encoding="utf-8")
    changed = False

    old_import = 'const { cloneDefaultSiteSettings } = require("../services/siteSettingsDefaults");'
    new_import = 'const { cloneDefaultSiteSettings, mergeSiteSettings } = require("../services/siteSettingsDefaults");'
    if old_import in text:
        text = text.replace(old_import, new_import, 1)
        changed = True

    if admin:
        old_value = 'res.json({ settings: saved || cloneDefaultSiteSettings(), customized: Boolean(saved) });'
        new_value = 'res.json({ settings: saved ? mergeSiteSettings(saved) : cloneDefaultSiteSettings(), customized: Boolean(saved) });'
        if old_value in text:
            text = text.replace(old_value, new_value, 1)
            changed = True
    else:
        old_value = 'return saved || cloneDefaultSiteSettings();'
        new_value = 'return saved ? mergeSiteSettings(saved) : cloneDefaultSiteSettings();'
        if old_value in text:
            text = text.replace(old_value, new_value, 1)
            changed = True

    if changed:
        write(path, text)
    else:
        print(f"Sin cambios: {path.relative_to(ROOT)}")


try:
    patch_defaults()
    patch_normalizer()
    patch_model()
    patch_controller(FILES["admin_controller"], admin=True)
    patch_controller(FILES["public_controller"], admin=False)
except RuntimeError as error:
    print(f"ERROR: {error}")
    sys.exit(1)

print("\nParche Backend V2.13.1 aplicado correctamente.")
print("Ejecuta: npm test (si existe) y npm run check:syntax o node --check en los archivos modificados.")
