"use strict";

require("dotenv").config();

const mongoose = require("mongoose");
const {
    connectDatabase
} = require("./config/db");

async function test() {
    try {
        await connectDatabase();

        console.log(
            "✅ Prueba de conexión exitosa."
        );

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error(
            "❌ Error:",
            error.message
        );

        process.exit(1);
    }
}

test();
