"use strict";

const Producto =
    require("../models/Producto");
const MovimientoInventario =
    require("../models/MovimientoInventario");
const {
    numberValue,
    stringValue
} = require("../utils/values");

function findVariant(product, item) {
    if (
        !Array.isArray(product.variantes)
    ) {
        return {
            variant: null,
            index: -1
        };
    }

    const variantId =
        stringValue(
            item.varianteId ||
            item.variantId
        );

    const color =
        stringValue(
            item.color ||
            item.varianteNombre
        ).toLowerCase();

    const index =
        product.variantes.findIndex(
            (variant) => {
                if (
                    !variant ||
                    typeof variant !== "object"
                ) {
                    return false;
                }

                const candidateId =
                    stringValue(
                        variant._id ||
                        variant.id ||
                        variant.codigo ||
                        variant.sku
                    );

                const candidateName =
                    stringValue(
                        variant.nombre ||
                        variant.color
                    ).toLowerCase();

                return (
                    (
                        variantId &&
                        candidateId ===
                            variantId
                    ) ||
                    (
                        color &&
                        candidateName === color
                    )
                );
            }
        );

    return {
        variant:
            index >= 0
                ? product.variantes[index]
                : null,
        index
    };
}

function variantStock(variant) {
    return Math.max(
        0,
        numberValue(
            variant?.stock ??
            variant?.existencias
        )
    );
}

function recalculateProductStock(product) {
    if (
        !Array.isArray(product.variantes) ||
        product.variantes.length === 0
    ) {
        return;
    }

    const variantsWithStock =
        product.variantes.filter(
            (variant) =>
                variant &&
                typeof variant === "object" &&
                (
                    variant.stock !== undefined ||
                    variant.existencias !== undefined
                )
        );

    if (
        variantsWithStock.length !==
        product.variantes.length
    ) {
        return;
    }

    product.stock =
        variantsWithStock.reduce(
            (sum, variant) =>
                sum +
                variantStock(variant),
            0
        );
}

async function applyInventoryDelta({
    productoId,
    varianteId = "",
    varianteNombre = "",
    cantidad,
    tipo = "ajuste",
    motivo = "",
    pedidoId = null,
    usuarioId = null
}) {
    const product =
        await Producto.findById(
            productoId
        );

    if (!product) {
        const error =
            new Error(
                "Producto no encontrado."
            );

        error.statusCode = 404;
        throw error;
    }

    const delta =
        numberValue(cantidad);

    if (!delta) {
        const error =
            new Error(
                "La cantidad del movimiento no puede ser cero."
            );

        error.statusCode = 400;
        throw error;
    }

    const lookup = findVariant(
        product,
        {
            varianteId,
            color: varianteNombre
        }
    );

    let previousStock;
    let newStock;
    let sku = "";

    if (lookup.variant) {
        previousStock =
            variantStock(
                lookup.variant
            );

        newStock =
            previousStock + delta;

        if (newStock < 0) {
            const error =
                new Error(
                    `Stock insuficiente para ${product.nombre} · ${varianteNombre || lookup.variant.nombre || "variante"}.`
                );

            error.statusCode = 409;
            throw error;
        }

        lookup.variant.stock =
            newStock;

        sku =
            stringValue(
                lookup.variant.sku
            );

        product.markModified(
            "variantes"
        );

        recalculateProductStock(
            product
        );
    } else {
        previousStock =
            Math.max(
                0,
                numberValue(
                    product.stock ??
                    product.existencias
                )
            );

        newStock =
            previousStock + delta;

        if (newStock < 0) {
            const error =
                new Error(
                    `Stock insuficiente para ${product.nombre}.`
                );

            error.statusCode = 409;
            throw error;
        }

        product.stock =
            newStock;

        if (
            product.existencias !==
            undefined
        ) {
            product.existencias =
                newStock;
        }
    }

    await product.save();

    const movement =
        await MovimientoInventario.create(
            {
                productoId:
                    product._id,
                varianteId,
                varianteNombre:
                    varianteNombre ||
                    lookup.variant?.nombre ||
                    "",
                sku,
                tipo,
                cantidad: delta,
                stockAnterior:
                    previousStock,
                stockNuevo:
                    newStock,
                motivo,
                pedidoId,
                usuarioId
            }
        );

    return {
        product,
        movement
    };
}

async function applyOrderStock(order, direction, userId = null) {
    const restoring = direction === "restore";
    const factor = restoring ? 1 : -1;
    const movementType = restoring ? "liberacion" : "reserva";
    const completed = [];

    try {
        for (const item of order.items) {
            await applyInventoryDelta({
                productoId: item.productoId,
                varianteId: item.varianteId,
                varianteNombre: item.color,
                cantidad: factor * item.cantidad,
                tipo: movementType,
                motivo: `${restoring ? "Liberación" : "Reserva"} por pedido ${order.numeroPedido}`,
                pedidoId: order._id,
                usuarioId: userId
            });
            completed.push(item);
        }
    } catch (error) {
        if (!restoring && completed.length) {
            for (const item of completed.reverse()) {
                try {
                    await applyInventoryDelta({
                        productoId: item.productoId,
                        varianteId: item.varianteId,
                        varianteNombre: item.color,
                        cantidad: item.cantidad,
                        tipo: "liberacion",
                        motivo: `Reversión automática de reserva fallida ${order.numeroPedido}`,
                        pedidoId: order._id,
                        usuarioId: userId
                    });
                } catch {}
            }
        }
        throw error;
    }
}

module.exports = {
    findVariant,
    applyInventoryDelta,
    applyOrderStock
};
