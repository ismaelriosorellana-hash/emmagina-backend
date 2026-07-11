"use strict";

require("dotenv").config();
const mongoose = require("mongoose");
const { connectDatabase } = require("../config/db");
const { ensureArchitecture } = require("../services/cmsArchitectureService");

(async () => {
    try {
        await connectDatabase();
        const result = await ensureArchitecture();
        console.log(JSON.stringify({ ok: true, versionEsquema: result.versionEsquema, pageCount: result.pageCount }, null, 2));
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error(error);
        try { await mongoose.connection.close(); } catch (_) {}
        process.exit(1);
    }
})();
