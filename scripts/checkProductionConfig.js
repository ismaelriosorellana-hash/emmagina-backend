"use strict";

require("dotenv").config();

const {
    validateSecurityConfig
} = require("../config/security");

const {
    validateProductionConfig
} = require("../config/runtime");

const originalEnvironment = process.env.NODE_ENV;
process.env.NODE_ENV = "production";

try {
    validateSecurityConfig();
    const report = validateProductionConfig();

    report.warnings.forEach((warning) => {
        console.warn(`⚠️ ${warning}`);
    });

    console.log("✅ Configuración de producción validada.");
    console.log(`✅ Orígenes autorizados: ${report.origins.length}`);
} catch (error) {
    console.error(`❌ ${error.message}`);
    process.exitCode = 1;
} finally {
    if (originalEnvironment === undefined) {
        delete process.env.NODE_ENV;
    } else {
        process.env.NODE_ENV = originalEnvironment;
    }
}
