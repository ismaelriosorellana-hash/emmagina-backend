"use strict";

const crypto = require("crypto");
const { firstDefined, stringValue, numberValue } = require("../utils/values");

function normalizeCustomer(body) {
    const source = body.cliente && typeof body.cliente === "object" ? body.cliente : body;
    return {
        nombre: stringValue(source.nombre), rut: stringValue(source.rut),
        email: stringValue(source.email).toLowerCase(), telefono: stringValue(source.telefono),
        direccion: stringValue(source.direccion), comuna: stringValue(source.comuna)
    };
}

function sanitizeCustomization(value) {
    if (!value || typeof value !== "object") return null;
    const copy = JSON.parse(JSON.stringify(value));
    delete copy.imageData;
    delete copy.imageDataList;
    return copy;
}

function normalizeItems(body) {
    if (!Array.isArray(body.items) || !body.items.length) return [];
    return body.items.map((item) => {
        const quantity = Math.max(1, numberValue(firstDefined(item.cantidad, item.quantity), 1));
        const unitPrice = Math.max(0, numberValue(firstDefined(item.precioUnitario, item.precio, item.price)));
        return {
            lineaId: stringValue(firstDefined(item.lineaId, item.lineId), crypto.randomUUID()),
            productoId: stringValue(firstDefined(item.productoId, item.productId, item.id)),
            nombre: stringValue(firstDefined(item.nombre, item.name)),
            imagen: stringValue(firstDefined(item.imagen, item.image)),
            varianteId: stringValue(firstDefined(item.varianteId, item.variantId)),
            color: stringValue(firstDefined(item.color, item.productVariant)),
            talla: stringValue(firstDefined(item.talla, item.size, item.personalizacion?.size, item.personalizacion?.talla)),
            sku: stringValue(item.sku), cantidad: quantity, precioUnitario: unitPrice,
            subtotal: quantity * unitPrice,
            personalizacion: sanitizeCustomization(firstDefined(item.personalizacion, item.customization)),
            entrega: firstDefined(item.entrega, item.delivery) || null
        };
    });
}

function normalizeOrderInput(body) {
    const items = normalizeItems(body);
    const customer = normalizeCustomer(body);
    const rawDelivery = body.entrega && typeof body.entrega === "object" ? body.entrega : {};
    const recipient = rawDelivery.receptorTercero && typeof rawDelivery.receptorTercero === "object"
        ? rawDelivery.receptorTercero : {};
    const method = stringValue(firstDefined(rawDelivery.metodo, body.metodoEntrega), "envio").toLowerCase();
    return {
        cliente: customer,
        items,
        subtotal: 0,
        costoEnvio: Math.max(0, numberValue(firstDefined(body.costoEnvio, body.shipping))),
        entrega: {
            metodo: method === "retiro" ? "retiro" : "envio",
            direccion: stringValue(firstDefined(rawDelivery.direccion, customer.direccion)),
            comuna: stringValue(firstDefined(rawDelivery.comuna, customer.comuna)),
            zonaEnvio: stringValue(firstDefined(rawDelivery.zonaEnvio, body.zonaEnvio), "santiago"),
            fechaPreferida: stringValue(rawDelivery.fechaPreferida),
            receptorTercero: {
                habilitado: Boolean(recipient.habilitado),
                nombre: stringValue(recipient.nombre),
                telefono: stringValue(recipient.telefono),
                relacion: stringValue(recipient.relacion)
            },
            instrucciones: "", detallesProductos: []
        },
        descuento: Math.max(0, numberValue(firstDefined(body.descuento, body.discount))),
        total: 0,
        metodoPago: stringValue(firstDefined(body.metodoPago, body["pedido-pago"], body.formaPago), "transferencia").toLowerCase(),
        observaciones: stringValue(body.observaciones),
        origen: stringValue(body.origen, "web")
    };
}

module.exports = { normalizeCustomer, normalizeItems, normalizeOrderInput };
