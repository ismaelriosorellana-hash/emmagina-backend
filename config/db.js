"use strict";

const mongoose = require("mongoose");

async function connectDatabase() {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        throw new Error(
            "Falta MONGODB_URI en el archivo .env."
        );
    }

    mongoose.set("strictQuery", true);

    await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000,
        family: 4
    });

    console.log("✅ Conectado a MongoDB Atlas");
    console.log(
        "📦 Base de datos:",
        mongoose.connection.db.databaseName
    );
}

module.exports = {
    connectDatabase
};
