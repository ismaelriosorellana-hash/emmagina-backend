"use strict";

const {
    validateSecurityConfig
} = require("../config/security");

const {
    validateProductionConfig
} = require("../config/runtime");

function run() {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    try {
        validateSecurityConfig();
        const report = validateProductionConfig();

        console.log("✅ Seguridad final backend: configuración base válida para producción.");

        if (report.warnings.length) {
            report.warnings.forEach((warning) => {
                console.warn(`⚠️ ${warning}`);
            });
        }
    } finally {
        process.env.NODE_ENV = originalNodeEnv;
    }
}

try {
    run();
} catch (error) {
    console.error("❌ Seguridad final backend: revisar configuración antes del lanzamiento.");
    console.error(error.message);
    process.exit(1);
}
