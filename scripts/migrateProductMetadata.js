"use strict";

require("dotenv").config();

const mongoose = require("mongoose");
const Producto = require("../models/Producto");
const { connectDatabase } = require("../config/db");
const {
    normalizeProductInput,
    normalizeProductOutput
} = require("../utils/productNormalizer");
const {
    assignProductSkus
} = require("../services/productSkuService");

async function main() {
    const apply = process.argv.includes("--apply");

    await connectDatabase();

    const products = await Producto.find({})
        .sort({ createdAt: 1, _id: 1 });

    let pending = 0;
    let updated = 0;
    let failed = 0;

    for (const product of products) {
        const current = normalizeProductOutput(product);
        const data = normalizeProductInput(current);
        const missingBefore = {
            sku: !current.sku,
            marca: !current.marca,
            variantSkus: (current.variantes || []).filter((item) => !item.sku).length
        };

        const requiresUpdate =
            missingBefore.sku ||
            missingBefore.marca ||
            missingBefore.variantSkus > 0 ||
            !product.seo ||
            !product.dimensiones;

        if (!requiresUpdate) continue;

        pending += 1;

        try {
            await assignProductSkus(
                Producto,
                data,
                {
                    excludeId: product._id,
                    existingSku: current.sku
                }
            );

            console.log(
                `${apply ? "ACTUALIZAR" : "SIMULAR"}: ${current.nombre} | SKU ${data.sku} | variantes sin SKU: ${missingBefore.variantSkus}`
            );

            if (apply) {
                await Producto.updateOne(
                    { _id: product._id },
                    {
                        $set: {
                            sku: data.sku,
                            marca: data.marca || "Mommy Crafts",
                            variantes: data.variantes,
                            dimensiones: data.dimensiones,
                            pesoGramos: data.pesoGramos,
                            seo: data.seo
                        }
                    },
                    { runValidators: true }
                );

                updated += 1;
            }
        } catch (error) {
            failed += 1;
            console.error(`ERROR: ${current.nombre}: ${error.message}`);
        }
    }

    if (apply) {
        console.log(
            `✅ Migración terminada. ${updated} productos actualizados y ${failed} con observaciones.`
        );
    } else {
        console.log(
            `ℹ️ Simulación terminada. ${pending} productos requieren normalización y ${failed} presentan conflictos. Usa --apply solo después de revisar este resultado.`
        );
    }
}

main()
    .catch((error) => {
        console.error("❌ No fue posible revisar los metadatos:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect().catch(() => {});
    });
