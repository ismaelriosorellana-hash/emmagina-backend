"use strict";

const mongoose = require("mongoose");
const Producto = require("../models/Producto");
const { normalizeDeliveryConfig } = require("../utils/delivery");
const {
    resolvePreferredDate,
    todayInChile,
    addBusinessDays
} = require("../utils/orderDates");
const { cleanText, cleanPhone } = require("../utils/validation");

const SANTIAGO_SHIPPING_COST = 4000;
const FREE_SHIPPING_THRESHOLD = 25000;
const SANTIAGO_MIN_DAYS = 5;
const SANTIAGO_MAX_DAYS = 7;
const NATIONAL_MIN_DAYS = 5;

function createHttpError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

function shippingZone(value) {
    return String(value || "").trim().toLowerCase() === "otras_zonas"
        ? "otras_zonas"
        : "santiago";
}

function calculateShippingCost({ method = "envio", zone = "santiago", subtotal = 0 } = {}) {
    if (method !== "envio" || zone !== "santiago") return 0;
    return Number(subtotal) >= FREE_SHIPPING_THRESHOLD ? 0 : SANTIAGO_SHIPPING_COST;
}

function deliveryTitle(method, productName) {
    return `${method === "retiro" ? "Instrucciones de retiro" : "Instrucciones de envío"}: ${productName}`;
}

async function resolveOrderDelivery(items, requestedDelivery = {}, orderSubtotal = 0) {
    const method = requestedDelivery.metodo === "retiro" ? "retiro" : "envio";
    const zone = method === "envio" ? shippingZone(requestedDelivery.zonaEnvio) : "";
    const validIds = [...new Set(
        items
            .map((item) => String(item.productoId || ""))
            .filter(mongoose.isValidObjectId)
    )];

    const products = await Producto.find({
        _id: { $in: validIds },
        activo: { $ne: false }
    }).lean();

    const productMap = new Map(
        products.map((product) => [String(product._id), product])
    );

    const details = [];
    let maxDays = 1;

    const normalizedItems = items.map((item) => {
        const product = productMap.get(String(item.productoId));

        if (!product) {
            throw createHttpError(
                `El producto "${item.nombre}" ya no está disponible.`,
                409
            );
        }

        const delivery = normalizeDeliveryConfig(product.entrega);

        if (!delivery[method].habilitado) {
            throw createHttpError(
                `"${product.nombre}" no permite ${method === "envio" ? "envío" : "retiro"}.`,
                409
            );
        }

        const days = Math.min(
            90,
            Math.max(1, Math.round(Number(product.diasPreparacion) || 3))
        );

        maxDays = Math.max(maxDays, days);
        details.push({
            productoId: String(product._id),
            nombre: product.nombre,
            titulo: deliveryTitle(method, product.nombre),
            instrucciones: delivery[method].instrucciones,
            diasPreparacion: days
        });

        return { ...item, entrega: delivery };
    });

    if (
        method === "envio" &&
        (
            !String(requestedDelivery.direccion || "").trim() ||
            !String(requestedDelivery.comuna || "").trim()
        )
    ) {
        throw createHttpError("Debes indicar dirección y comuna para el envío.");
    }

    const recipient = requestedDelivery.receptorTercero || {};
    const recipientEnabled = Boolean(recipient.habilitado);
    const normalizedRecipient = {
        habilitado: recipientEnabled,
        nombre: cleanText(recipient.nombre, {
            field: "El nombre de quien recibe",
            maxLength: 120,
            required: recipientEnabled
        }),
        telefono: cleanPhone(recipient.telefono, {
            required: recipientEnabled
        }),
        relacion: cleanText(recipient.relacion, {
            field: "La relación o referencia",
            maxLength: 120,
            required: recipientEnabled
        })
    };

    let fechaMinima = null;
    let fechaEstimadaHasta = null;
    let fechaPreferida = null;
    let costoEnvio = 0;
    let modalidadEnvio = "";

    if (method === "retiro") {
        const preferred = resolvePreferredDate(
            requestedDelivery.fechaPreferida,
            maxDays
        );

        fechaMinima = preferred.minimum;
        fechaPreferida = preferred.selected;
    } else {
        const minimumDays = Math.max(
            maxDays,
            zone === "santiago" ? SANTIAGO_MIN_DAYS : NATIONAL_MIN_DAYS
        );
        const maximumDays = zone === "santiago"
            ? Math.max(minimumDays, SANTIAGO_MAX_DAYS)
            : minimumDays;
        const today = todayInChile();

        fechaMinima = addBusinessDays(today, minimumDays);
        fechaEstimadaHasta = addBusinessDays(today, maximumDays);
        costoEnvio = calculateShippingCost({ method, zone, subtotal: orderSubtotal });
        modalidadEnvio = zone === "santiago"
            ? (costoEnvio === 0 ? "envio_gratis_santiago" : "envio_local_santiago")
            : "chilexpress_por_pagar";
    }

    const instructions = details
        .map((detail) => `${detail.titulo}\n${detail.instrucciones}`)
        .join("\n\n");

    return {
        items: normalizedItems,
        costoEnvio,
        entrega: {
            metodo: method,
            instrucciones: instructions,
            direccion: method === "envio"
                ? String(requestedDelivery.direccion || "").trim()
                : "",
            comuna: method === "envio"
                ? String(requestedDelivery.comuna || "").trim()
                : "",
            zonaEnvio: zone,
            modalidadEnvio,
            envioGratis: method === "envio" && zone === "santiago" && costoEnvio === 0,
            umbralEnvioGratis: FREE_SHIPPING_THRESHOLD,
            diasPreparacion: Math.max(
                maxDays,
                method === "envio" ? NATIONAL_MIN_DAYS : 1
            ),
            fechaMinima,
            fechaEstimadaHasta,
            fechaPreferida,
            receptorTercero: normalizedRecipient,
            detallesProductos: details
        }
    };
}

module.exports = {
    SANTIAGO_SHIPPING_COST,
    FREE_SHIPPING_THRESHOLD,
    calculateShippingCost,
    SANTIAGO_MIN_DAYS,
    SANTIAGO_MAX_DAYS,
    NATIONAL_MIN_DAYS,
    resolveOrderDelivery
};
