"use strict";

const mongoose = require("mongoose");
const crypto = require("crypto");
const { createOrderNumber } = require("../utils/orderNumber");

const assetSchema = new mongoose.Schema({
    url: { type: String, default: "" },
    downloadUrl: { type: String, default: "" },
    publicId: { type: String, default: "" },
    fileName: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    bytes: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    format: { type: String, default: "" },
    createdAt: { type: Date, default: null }
}, { _id: false });

const historySchema = new mongoose.Schema({
    estado: { type: String, required: true },
    detalle: { type: String, default: "" },
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", default: null },
    fecha: { type: Date, default: Date.now }
}, { _id: false });

const customerSchema = new mongoose.Schema({
    nombre: { type: String, required: true, trim: true },
    rut: { type: String, default: "", trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    telefono: { type: String, required: true, trim: true },
    direccion: { type: String, default: "", trim: true },
    comuna: { type: String, default: "", trim: true }
}, { _id: false });

const designSchema = new mongoose.Schema({
    estado: {
        type: String,
        enum: ["pendiente", "enviado", "aprobado", "cambios_solicitados", "corregido"],
        default: "pendiente"
    },
    asset: { type: assetSchema, default: null },
    mensaje: { type: String, default: "", maxlength: 1500 },
    canal: { type: String, enum: ["cuenta", "correo", "whatsapp", "mixto"], default: "cuenta" },
    observacionesCliente: { type: String, default: "", maxlength: 1500 },
    enviadoAt: { type: Date, default: null },
    respondidoAt: { type: Date, default: null },
    enviadoPor: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", default: null }
}, { _id: false });

const itemSchema = new mongoose.Schema({
    lineaId: { type: String, default: () => crypto.randomUUID(), index: true },
    productoId: { type: String, required: true },
    nombre: { type: String, required: true, trim: true },
    imagen: { type: String, default: "" },
    varianteId: { type: String, default: "" },
    color: { type: String, default: "" },
    talla: { type: String, default: "" },
    sku: { type: String, default: "" },
    cantidad: { type: Number, required: true, min: 1 },
    precioUnitario: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    personalizacion: { type: mongoose.Schema.Types.Mixed, default: null },
    personalizacionResumen: { type: mongoose.Schema.Types.Mixed, default: null },
    disenoFinal: { type: designSchema, default: () => ({}) },
    entrega: { type: mongoose.Schema.Types.Mixed, default: null }
}, { _id: false });

const recipientSchema = new mongoose.Schema({
    habilitado: { type: Boolean, default: false },
    nombre: { type: String, default: "", trim: true },
    telefono: { type: String, default: "", trim: true },
    relacion: { type: String, default: "", trim: true }
}, { _id: false });

const orderDeliverySchema = new mongoose.Schema({
    metodo: { type: String, enum: ["envio", "retiro"], required: true },
    instrucciones: { type: String, default: "", maxlength: 6000 },
    direccion: { type: String, default: "" },
    comuna: { type: String, default: "" },
    zonaEnvio: { type: String, enum: ["", "santiago", "otras_zonas"], default: "" },
    modalidadEnvio: { type: String, default: "" },
    envioGratis: { type: Boolean, default: false },
    umbralEnvioGratis: { type: Number, default: 25000, min: 0 },
    diasPreparacion: { type: Number, default: 3, min: 1, max: 90 },
    fechaMinima: { type: Date, default: null },
    fechaEstimadaHasta: { type: Date, default: null },
    fechaPreferida: { type: Date, default: null },
    receptorTercero: { type: recipientSchema, default: () => ({}) },
    detallesProductos: { type: [mongoose.Schema.Types.Mixed], default: [] }
}, { _id: false });

const transferSchema = new mongoose.Schema({
    venceAt: { type: Date, default: null, index: true },
    comprobante: { type: assetSchema, default: null },
    recibidoAt: { type: Date, default: null },
    validadoAt: { type: Date, default: null },
    validadoPor: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", default: null },
    canal: { type: String, enum: ["cuenta", "correo", "whatsapp", "manual"], default: "cuenta" },
    observaciones: { type: String, default: "", maxlength: 1500 },
    permiteReenvio: { type: Boolean, default: false }
}, { _id: false });


const productionSchema = new mongoose.Schema({
    etapa: {
        type: String,
        enum: [
            "revision",
            "diseno",
            "preparacion",
            "impresion",
            "postprocesado",
            "control_calidad",
            "listo_entrega",
            "en_ruta",
            "completado",
            "pausado"
        ],
        default: "revision"
    },
    progreso: { type: Number, default: 10, min: 0, max: 100 },
    mensajeCliente: { type: String, default: "Estamos revisando los detalles de tu pedido.", maxlength: 1200 },
    fechaEstimada: { type: Date, default: null },
    actualizadoAt: { type: Date, default: Date.now }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    numeroPedido: { type: String, unique: true, index: true },
    consultaToken: { type: String, default: () => crypto.randomBytes(24).toString("hex"), select: false },
    cliente: { type: customerSchema, required: true },
    usuarioClienteId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", default: null, index: true },
    items: {
        type: [itemSchema],
        validate: { validator: value => Array.isArray(value) && value.length > 0, message: "El pedido debe contener al menos un producto." }
    },
    subtotal: { type: Number, required: true, min: 0 },
    costoEnvio: { type: Number, default: 0, min: 0 },
    entrega: { type: orderDeliverySchema, required: true },
    descuento: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    metodoPago: { type: String, enum: ["mercadopago", "transferencia", "efectivo", "otro"], default: "transferencia" },
    estadoPago: {
        type: String,
        enum: ["pendiente", "pendiente_comprobante", "comprobante_recibido", "en_revision", "pagado", "rechazado", "vencido", "reembolsado"],
        default: "pendiente_comprobante",
        index: true
    },
    transferencia: { type: transferSchema, default: () => ({}) },
    mercadoPago: {
        preferenceId: { type: String, default: "" }, checkoutUrl: { type: String, default: "" },
        sandboxCheckoutUrl: { type: String, default: "" }, paymentId: { type: String, default: "" },
        merchantOrderId: { type: String, default: "" }, status: { type: String, default: "" },
        statusDetail: { type: String, default: "" }, externalReference: { type: String, default: "" },
        liveMode: { type: Boolean, default: false }, amount: { type: Number, default: 0 },
        currencyId: { type: String, default: "CLP" }, idempotencyKey: { type: String, default: "" },
        preferenceCreatedAt: { type: Date, default: null }, lastSyncAt: { type: Date, default: null },
        lastNotificationAt: { type: Date, default: null }
    },
    estadoPedido: {
        type: String,
        enum: ["pendiente", "confirmado", "validacion_diseno", "en_produccion", "listo", "enviado", "entregado", "cancelado"],
        default: "pendiente",
        index: true
    },
    observaciones: { type: String, default: "", maxlength: 3000 },
    notasInternas: { type: String, default: "", maxlength: 5000 },
    produccion: { type: productionSchema, default: () => ({}) },
    origen: { type: String, enum: ["web", "whatsapp", "administrador"], default: "web" },
    canceladoPorCliente: { type: Boolean, default: false, index: true },
    canceladoAt: { type: Date, default: null },
    canceladoMotivo: { type: String, default: "", maxlength: 600 },
    stockAplicado: { type: Boolean, default: false },
    historial: { type: [historySchema], default: [] }
}, { timestamps: true, collection: "pedidos", minimize: false });

orderSchema.pre("validate", function prepareOrder(next) {
    if (!this.numeroPedido) this.numeroPedido = createOrderNumber();
    if (!Array.isArray(this.historial) || this.historial.length === 0) {
        this.historial = [{ estado: this.estadoPedido || "pendiente", detalle: "Pedido creado." }];
    }
    next();
});

module.exports = mongoose.models.Pedido || mongoose.model("Pedido", orderSchema);
