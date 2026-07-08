"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { cloneDefaultSiteSettings, mergeSiteSettings } = require("../services/siteSettingsDefaults");
const { normalizeSiteSettings } = require("../utils/siteSettingsNormalizer");
const { DEFAULT_CSP } = require("../middleware/securityHeaders");

test("los ajustes predeterminados incluyen analítica desactivada", () => {
    const settings = cloneDefaultSiteSettings();
    assert.equal(settings.analytics.enabled, false);
    assert.equal(settings.analytics.ga4MeasurementId, "");
    assert.equal(settings.analytics.clarityProjectId, "");
    assert.equal(settings.analytics.trackEcommerce, true);
});

test("normaliza IDs válidos de GA4 y Clarity", () => {
    const normalized = normalizeSiteSettings({
        ...cloneDefaultSiteSettings(),
        analytics: {
            enabled: true,
            ga4MeasurementId: "g-abcd1234ef",
            clarityProjectId: "abc123xy",
            anonymizeIp: true,
            trackEcommerce: true
        }
    });
    assert.equal(normalized.analytics.enabled, true);
    assert.equal(normalized.analytics.ga4MeasurementId, "G-ABCD1234EF");
    assert.equal(normalized.analytics.clarityProjectId, "abc123xy");
});

test("rechaza IDs inválidos de analítica", () => {
    assert.throws(() => normalizeSiteSettings({
        ...cloneDefaultSiteSettings(),
        analytics: { enabled: true, ga4MeasurementId: "UA-OLD", clarityProjectId: "ok1234" }
    }), /Google Analytics 4/);

    assert.throws(() => normalizeSiteSettings({
        ...cloneDefaultSiteSettings(),
        analytics: { enabled: true, ga4MeasurementId: "G-ABC12345", clarityProjectId: "id con espacios" }
    }), /Microsoft Clarity/);
});

test("CSP permite cargar GA4 y Microsoft Clarity", () => {
    assert.match(DEFAULT_CSP, /googletagmanager\.com/);
    assert.match(DEFAULT_CSP, /google-analytics\.com/);
    assert.match(DEFAULT_CSP, /clarity\.ms/);
});
