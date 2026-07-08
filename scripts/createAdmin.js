"use strict";

require("dotenv").config();

const bcrypt = require("bcryptjs");

const {
    connectDatabase
} = require("../config/db");

const Usuario =
    require("../models/Usuario");

async function createAdmin() {
    const nombre =
        String(
            process.env.ADMIN_NAME ||
            "Administrador Emmagina"
        ).trim();

    const email =
        String(
            process.env.ADMIN_EMAIL ||
            ""
        )
            .trim()
            .toLowerCase();

    const password =
        String(
            process.env.ADMIN_PASSWORD ||
            ""
        );

    if (!email || !password) {
        throw new Error(
            "Completa ADMIN_EMAIL y ADMIN_PASSWORD en .env antes de ejecutar este comando."
        );
    }

    if (password.length < 10) {
        throw new Error(
            "La contraseña debe tener al menos 10 caracteres."
        );
    }

    await connectDatabase();

    const passwordHash =
        await bcrypt.hash(
            password,
            12
        );

    const user =
        await Usuario.findOneAndUpdate(
            {
                email
            },
            {
                nombre,
                email,
                passwordHash,
                rol:
                    "administrador",
                activo: true
            },
            {
                new: true,
                upsert: true,
                runValidators: true
            }
        );

    console.log(
        "✅ Usuario administrador creado o actualizado:"
    );

    console.log({
        id:
            String(user._id),
        nombre:
            user.nombre,
        email:
            user.email,
        rol:
            user.rol
    });

    console.log(
        "🔐 Por seguridad, elimina ADMIN_PASSWORD del archivo .env."
    );

    process.exit(0);
}

createAdmin().catch((error) => {
    console.error(
        "❌",
        error.message
    );

    process.exit(1);
});
