"use strict";

require("dotenv").config();

const mongoose = require("mongoose");
const { connectDatabase } = require("../config/db");
const { ensureDefaultHomePage } = require("../services/pageBuilderDefaults");

async function main() {
    await connectDatabase();
    await ensureDefaultHomePage();
    console.log("✅ Página Home creada/actualizada en colección pages.");
}

main()
    .catch((error) => {
        console.error("No fue posible crear Home Page Builder:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
