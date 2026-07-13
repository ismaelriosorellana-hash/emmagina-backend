"use strict";

const Producto = require("../models/Producto");
const Pedido = require("../models/Pedido");
const Categoria = require("../models/Categoria");
const SolicitudPersonalizada = require("../models/SolicitudPersonalizada");
const { buildSecurityStatus } = require("./adminSecurityController");
const { APP_VERSION } = require("../config/version");

function item(id, title, ok, detail, severity = "warning", action = "") {
    return { id, title, ok: Boolean(ok), detail, severity, action };
}

function summarize(checks) {
    return checks.reduce((acc, check) => {
        if (check.ok) acc.correctos += 1;
        else if (check.severity === "critical") acc.criticos += 1;
        else acc.observaciones += 1;
        return acc;
    }, { correctos: 0, observaciones: 0, criticos: 0 });
}

async function adminLaunchStatus(req, res, next) {
    try {
        const [
            totalProducts,
            publishedProducts,
            productsWithoutImage,
            productsWithoutPrice,
            categories,
            totalOrders,
            paidOrders,
            pendingOrders,
            openRequests
        ] = await Promise.all([
            Producto.countDocuments({ activo: { $ne: false } }),
            Producto.countDocuments({ activo: { $ne: false }, publicarCatalogo: true }),
            Producto.countDocuments({ activo: { $ne: false }, publicarCatalogo: true, $or: [{ imagenPrincipal: "" }, { imagenPrincipal: null }, { imagenPrincipal: { $exists: false } }] }),
            Producto.countDocuments({ activo: { $ne: false }, publicarCatalogo: true, $or: [{ precio: { $lte: 0 } }, { precio: null }, { precio: { $exists: false } }] }),
            Categoria.countDocuments({ activo: { $ne: false } }),
            Pedido.countDocuments({}),
            Pedido.countDocuments({ estadoPago: "pagado" }),
            Pedido.countDocuments({ estadoPago: { $in: ["pendiente", "pendiente_comprobante", "en_revision"] } }),
            SolicitudPersonalizada.countDocuments({ estado: { $nin: ["rechazada", "convertida_pedido", "cerrada"] } })
        ]);

        const security = buildSecurityStatus();
        const mpCheck = security.checks.find((check) => check.id === "mercadopago-mode");
        const mongoCheck = security.checks.find((check) => check.id === "mongodb-connected");
        const cloudinaryCheck = security.checks.find((check) => check.id === "cloudinary-complete");
        const corsCheck = security.checks.find((check) => check.id === "cors-origins");

        const checks = [
            item("catalog-products", "Catálogo publicado", publishedProducts >= 6, `${publishedProducts} productos publicados de ${totalProducts} activos.`, "critical", "Publica al menos 6 productos reales antes de abrir ventas."),
            item("catalog-images", "Imágenes de productos", productsWithoutImage === 0, productsWithoutImage ? `${productsWithoutImage} productos publicados no tienen imagen principal.` : "Todos los productos publicados tienen imagen principal.", "critical", "Agrega imágenes reales o provisionales válidas."),
            item("catalog-prices", "Precios válidos", productsWithoutPrice === 0, productsWithoutPrice ? `${productsWithoutPrice} productos publicados no tienen precio válido.` : "Todos los productos publicados tienen precio válido.", "critical", "Corrige precios antes de lanzar."),
            item("categories", "Categorías activas", categories >= 4, `${categories} categorías activas.`, "warning", "Mantén al menos cuatro categorías claras."),
            item("mercadopago", "Mercado Pago", Boolean(mpCheck?.ok), mpCheck?.detail || "No fue posible verificar Mercado Pago.", "critical", "Confirma credenciales y webhook del mismo entorno."),
            item("mongodb", "Base de datos", Boolean(mongoCheck?.ok), mongoCheck?.detail || "No fue posible verificar MongoDB.", "critical"),
            item("cloudinary", "Carga de imágenes", Boolean(cloudinaryCheck?.ok), cloudinaryCheck?.detail || "No fue posible verificar Cloudinary.", "critical"),
            item("cors", "Origen del frontend autorizado", Boolean(corsCheck?.ok), corsCheck?.detail || "No fue posible verificar CORS.", "critical"),
            item("test-order", "Pedido de prueba", totalOrders > 0, totalOrders ? `${totalOrders} pedidos registrados; ${paidOrders} pagados y ${pendingOrders} pendientes.` : "Todavía no existe un pedido de prueba.", "warning", "Realiza una compra completa de prueba."),
            item("paid-order", "Pago verificado", paidOrders > 0, paidOrders ? `${paidOrders} pedidos tienen pago confirmado.` : "Todavía no hay un pago confirmado en el sistema.", "warning", "Completa al menos una prueba de Mercado Pago."),
            item("requests", "Solicitudes personalizadas", true, `${openRequests} solicitudes abiertas actualmente.`, "warning"),
            item("domain", "Dominio definitivo", false, "Pendiente hasta contratar y conectar el dominio oficial.", "warning", "No bloquea el lanzamiento controlado en Render."),
            item("email", "Correo automático", false, "Zoho Mail y Resend están suspendidos hasta contar con dominio.", "warning", "Usa WhatsApp y seguimiento web temporalmente.")
        ];

        const summary = summarize(checks);
        const readiness = summary.criticos > 0 ? "bloqueado" : summary.observaciones > 0 ? "pruebas" : "listo";

        res.set("Cache-Control", "no-store, max-age=0, must-revalidate");
        res.json({
            version: APP_VERSION,
            generatedAt: new Date().toISOString(),
            readiness,
            canStartControlledLaunch: summary.criticos === 0,
            summary,
            metrics: {
                totalProducts,
                publishedProducts,
                categories,
                totalOrders,
                paidOrders,
                pendingOrders,
                openRequests
            },
            checks
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { adminLaunchStatus };
