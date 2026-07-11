"use strict";

require("dotenv").config();

const mongoose = require("mongoose");
const { connectDatabase } = require("../config/db");
const { ensureHomePage, diagnostic } = require("../services/siteEditorStore");

async function main() {
    await connectDatabase();
    const home = await ensureHomePage();
    const status = await diagnostic();
    console.log("✅ Editor del Sitio inicializado.");
    console.log(`Página Inicio: ${home._id} · ${home.blocks.length} bloques`);
    console.log(`Colección: ${status.storage} · Páginas visibles: ${status.visiblePages}`);
}

main()
    .catch((error) => {
        console.error("❌ No fue posible inicializar el Editor del Sitio:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.connection.close().catch(() => {});
    });
