"use strict";

require("dotenv").config();

const mongoose = require("mongoose");
const Producto = require("../models/Producto");
const { connectDatabase } = require("../config/db");
const { resolveUniqueProductSlug } = require("../services/productSlugService");

async function main() {
    const apply = process.argv.includes("--apply");

    await connectDatabase();

    const products = await Producto.find({})
        .select("nombre slug")
        .sort({ createdAt: 1, _id: 1 });

    let pending = 0;
    let updated = 0;

    for (const product of products) {
        const nextSlug = await resolveUniqueProductSlug(
            Producto,
            {
                name: product.nombre,
                requestedSlug: product.slug || product.nombre,
                excludeId: product._id
            }
        );

        if (String(product.slug || "") === nextSlug) {
            continue;
        }

        pending += 1;
        console.log(
            `${apply ? "ACTUALIZAR" : "SIMULAR"}: ${product.nombre} -> ${nextSlug}`
        );

        if (apply) {
            product.slug = nextSlug;
            await product.save();
            updated += 1;
        }
    }

    console.log(
        apply
            ? `✅ Migración terminada. ${updated} productos actualizados.`
            : `ℹ️ Simulación terminada. ${pending} productos requieren actualización. Usa --apply para guardar.`
    );
}

main()
    .catch((error) => {
        console.error("❌ No fue posible migrar slugs:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect().catch(() => {});
    });
