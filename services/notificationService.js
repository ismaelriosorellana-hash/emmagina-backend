"use strict";

const { URLSearchParams } = require("url");

const ORDER_STATUS_LABELS = Object.freeze({
    pendiente: "recibido",
    confirmado: "confirmado",
    validacion_diseno: "en revisión de diseño",
    en_produccion: "en producción",
    listo: "listo para retiro o envío",
    enviado: "enviado",
    entregado: "entregado",
    cancelado: "cancelado"
});

const PAYMENT_STATUS_LABELS = Object.freeze({
    pendiente: "pendiente",
    pendiente_comprobante: "pendiente de comprobante",
    comprobante_recibido: "comprobante recibido",
    en_revision: "en revisión",
    pagado: "pagado",
    rechazado: "rechazado",
    vencido: "vencido",
    reembolsado: "reembolsado"
});

const EVENT_LABELS = Object.freeze({
    order_created: "Pedido recibido",
    payment_confirmed: "Pago confirmado",
    design_review: "Diseño en revisión",
    production_started: "Pedido en producción",
    ready: "Pedido listo",
    shipped: "Pedido enviado",
    delivered: "Pedido entregado",
    cancelled: "Pedido cancelado",
    status_update: "Estado actualizado"
});

function clean(value) {
    return String(value ?? "").trim();
}

function money(value) {
    return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0
    }).format(Number(value) || 0);
}

function publicFrontendUrl() {
    return clean(process.env.PUBLIC_FRONTEND_URL || process.env.FRONTEND_URL || "").replace(/\/+$/, "");
}

function maskEmail(value) {
    const email = clean(value);
    if (!email) return "";

    const match = email.match(/<([^>]+)>/);
    const target = match ? match[1] : email;
    const [local, domain] = target.split("@");

    if (!local || !domain) return email.replace(/.(?=.{3})/g, "•");

    const visible = local.length <= 2
        ? `${local[0] || ""}•`
        : `${local.slice(0, 2)}•••${local.slice(-1)}`;

    return `${visible}@${domain}`;
}

function splitEmails(value) {
    return clean(value)
        .split(/[;,]/)
        .map((item) => clean(item))
        .filter(Boolean);
}

function escapeHtml(value) {
    return clean(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#039;"
    }[char]));
}

function notificationsEnabled() {
    return clean(process.env.NOTIFICATIONS_ENABLED || "true") !== "false";
}

function emailProvider() {
    return clean(process.env.EMAIL_PROVIDER || "resend").toLowerCase() || "resend";
}

function emailReady() {
    return Boolean(
        notificationsEnabled() &&
        emailProvider() === "resend" &&
        clean(process.env.RESEND_API_KEY) &&
        clean(process.env.EMAIL_FROM)
    );
}

function notificationConfigStatus() {
    const adminEmails = splitEmails(process.env.NOTIFICATION_ADMIN_EMAIL);
    const enabled = notificationsEnabled();
    const provider = emailProvider();
    const from = clean(process.env.EMAIL_FROM);
    const resendConfigured = Boolean(clean(process.env.RESEND_API_KEY));
    const fromConfigured = Boolean(from);
    const configured = Boolean(enabled && provider === "resend" && resendConfigured && fromConfigured);

    let estado = "manual";
    let mensaje = "Los mensajes se pueden copiar o abrir por WhatsApp, pero el correo automático no está completamente configurado.";

    if (!enabled) {
        estado = "desactivado";
        mensaje = "Las notificaciones automáticas están desactivadas por NOTIFICATIONS_ENABLED=false.";
    } else if (configured) {
        estado = "operativo";
        mensaje = "El envío de correos por Resend está configurado.";
    } else if (provider !== "resend") {
        estado = "revisar";
        mensaje = `El proveedor configurado es ${provider}, pero esta versión usa Resend.`;
    } else if (!resendConfigured && !fromConfigured) {
        estado = "pendiente";
        mensaje = "Faltan RESEND_API_KEY y EMAIL_FROM para enviar correos reales.";
    } else if (!resendConfigured) {
        estado = "pendiente";
        mensaje = "Falta RESEND_API_KEY para enviar correos reales.";
    } else if (!fromConfigured) {
        estado = "pendiente";
        mensaje = "Falta EMAIL_FROM para enviar correos reales.";
    }

    return {
        enabled,
        estado,
        mensaje,
        provider,
        configured,
        resendConfigured,
        fromConfigured,
        fromMasked: maskEmail(from),
        replyToConfigured: Boolean(clean(process.env.EMAIL_REPLY_TO)),
        adminEmailConfigured: adminEmails.length > 0,
        adminEmailsMasked: adminEmails.map(maskEmail),
        whatsappSupportConfigured: Boolean(whatsappDigits(process.env.WHATSAPP_SUPPORT_NUMBER || "")),
        frontendUrlConfigured: Boolean(publicFrontendUrl())
    };
}

function orderUrl(order) {
    const base = publicFrontendUrl();
    if (!base) return "";

    const params = new URLSearchParams({
        pedido: String(order._id || ""),
        numero: clean(order.numeroPedido)
    });

    return `${base}/seguimiento-pedido.html?${params}`;
}

function whatsappDigits(value) {
    const digits = clean(value).replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("56")) return digits;
    if (digits.length === 9) return `56${digits}`;
    return digits;
}

function firstName(order) {
    return clean(order?.cliente?.nombre).split(/\s+/)[0] || "";
}

function productSummary(order) {
    const items = Array.isArray(order?.items) ? order.items : [];
    if (!items.length) return "productos Rhema Diseños";

    if (items.length === 1) {
        const item = items[0];
        return `${item.nombre || "producto"} x${Number(item.cantidad) || 1}`;
    }

    const units = items.reduce((sum, item) => sum + (Number(item.cantidad) || 1), 0);
    return `${items.length} productos · ${units} unidades`;
}

function statusLabel(status) {
    const key = clean(status);
    return ORDER_STATUS_LABELS[key] || key.replaceAll("_", " ") || "sin estado";
}

function paymentLabel(status) {
    const key = clean(status);
    return PAYMENT_STATUS_LABELS[key] || key.replaceAll("_", " ") || "sin estado";
}


function brandName() {
    return clean(process.env.EMAIL_BRAND_NAME || "Rhema Diseños") || "Rhema Diseños";
}

function supportEmail() {
    return clean(process.env.EMAIL_REPLY_TO || "venta@rhemadisenos.cl") || "venta@rhemadisenos.cl";
}

function emailLogoUrl() {
    return clean(
        process.env.EMAIL_LOGO_URL ||
        process.env.BRAND_LOGO_URL ||
        ""
    );
}

function formatDate(value) {
    if (!value) return "";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    }).format(date);
}

function itemVariantText(item) {
    const parts = [
        clean(item?.color),
        clean(item?.talla),
        clean(item?.sku)
    ].filter(Boolean);
    return parts.join(" · ");
}

function orderItemsRows(order) {
    const items = Array.isArray(order?.items) ? order.items : [];
    if (!items.length) {
        return `<tr><td colspan="3" style="padding:12px 0;color:#125373">Productos no disponibles en el detalle.</td></tr>`;
    }

    return items.map((item) => {
        const quantity = Number(item?.cantidad) || 1;
        const subtotal = Number(item?.subtotal ?? ((Number(item?.precioUnitario) || 0) * quantity)) || 0;
        const variant = itemVariantText(item);
        return `
            <tr>
                <td style="padding:12px 0;border-top:1px solid rgba(2, 48, 71, 0.14)">
                    <strong style="color:#023047">${escapeHtml(item?.nombre || "Producto Rhema Diseños")}</strong>
                    ${variant ? `<br><span style="font-size:13px;color:#125373">${escapeHtml(variant)}</span>` : ""}
                </td>
                <td style="padding:12px 8px;border-top:1px solid rgba(2, 48, 71, 0.14);text-align:center;color:#125373">${quantity}</td>
                <td style="padding:12px 0;border-top:1px solid rgba(2, 48, 71, 0.14);text-align:right;color:#023047;font-weight:700">${escapeHtml(money(subtotal))}</td>
            </tr>
        `;
    }).join("");
}

function deliverySummary(order) {
    const delivery = order?.entrega || {};
    const method = clean(delivery.metodo) === "retiro" ? "Retiro" : "Despacho";
    const details = [];
    if (clean(delivery.comuna)) details.push(clean(delivery.comuna));
    if (clean(delivery.modalidadEnvio)) details.push(clean(delivery.modalidadEnvio));
    const estimated = formatDate(delivery.fechaEstimadaHasta || delivery.fechaMinima || delivery.fechaPreferida);
    if (estimated) details.push(`estimado hasta ${estimated}`);
    return `${method}${details.length ? ` · ${details.join(" · ")}` : ""}`;
}

function emailButton(url, label) {
    if (!url) return "";
    return `
        <p style="margin:22px 0 10px">
            <a href="${escapeHtml(url)}" style="display:inline-block;background:#219EBC;color:#FFFFFF;text-decoration:none;border-radius:999px;padding:12px 18px;font-weight:700">
                ${escapeHtml(label)}
            </a>
        </p>
    `;
}

function emailFooterHtml() {
    const email = supportEmail();
    const whatsapp = whatsappDigits(process.env.WHATSAPP_SUPPORT_NUMBER || "56954633848");
    const whatsappUrl = whatsapp ? `https://wa.me/${whatsapp}` : "";
    return `
        <div style="background:#EAF4F8;border-top:1px solid rgba(2, 48, 71, 0.14);padding:18px 22px;color:#125373;font-size:13px;line-height:1.5">
            <p style="margin:0 0 6px"><strong style="color:#65445A">${escapeHtml(brandName())}</strong></p>
            <p style="margin:0">Correo: <a href="mailto:${escapeHtml(email)}" style="color:#219EBC">${escapeHtml(email)}</a>${whatsappUrl ? ` · WhatsApp: <a href="${escapeHtml(whatsappUrl)}" style="color:#219EBC">${escapeHtml(whatsapp)}</a>` : ""}</p>
            <p style="margin:8px 0 0">Este correo fue enviado por una compra o actualización solicitada en rhemadisenos.cl.</p>
        </div>
    `;
}

function wrapBrandedEmail({ preheader = "", title = "", introHtml = "", mainHtml = "", ctaUrl = "", ctaLabel = "Ver pedido", footerNote = "" }) {
    const logo = emailLogoUrl();
    return `
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(preheader)}</div>
        <div style="margin:0;padding:0;background:#EAF4F8;font-family:Arial,Helvetica,sans-serif;color:#023047">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#EAF4F8;margin:0;padding:28px 12px">
                <tr>
                    <td align="center">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#FFFFFF;border:1px solid rgba(2, 48, 71, 0.14);border-radius:22px;overflow:hidden">
                            <tr>
                                <td style="background:#EAF4F8;padding:24px 24px 18px;text-align:center;border-bottom:1px solid rgba(2, 48, 71, 0.14)">
                                    ${logo ? `<img src="${escapeHtml(logo)}" width="72" alt="${escapeHtml(brandName())}" style="display:block;margin:0 auto 12px;border:0;max-width:72px;height:auto">` : ""}
                                    <p style="margin:0;color:#219EBC;font-size:13px;letter-spacing:.08em;text-transform:uppercase;font-weight:700">${escapeHtml(brandName())}</p>
                                    <h1 style="margin:8px 0 0;color:#65445A;font-size:24px;line-height:1.2">${escapeHtml(title)}</h1>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:24px 26px;line-height:1.6;font-size:15px">
                                    ${introHtml}
                                    ${emailButton(ctaUrl, ctaLabel)}
                                    ${mainHtml}
                                    ${footerNote ? `<p style="margin:18px 0 0;color:#125373;font-size:13px">${escapeHtml(footerNote)}</p>` : ""}
                                </td>
                            </tr>
                            <tr>
                                <td>${emailFooterHtml()}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </div>
    `;
}

function buildCustomerEmailHtml(order, body) {
    const paragraphs = body.text
        .split("\n\n")
        .filter(Boolean)
        .map((line) => `<p style="margin:0 0 14px">${escapeHtml(line)}</p>`)
        .join("\n");

    const summary = `
        <div style="margin-top:22px;border:1px solid rgba(2, 48, 71, 0.14);border-radius:16px;padding:16px;background:#EAF4F8">
            <p style="margin:0 0 10px;color:#65445A;font-weight:700">Resumen del pedido</p>
            <p style="margin:0 0 6px"><strong>N° pedido:</strong> ${escapeHtml(body.number)}</p>
            <p style="margin:0 0 6px"><strong>Total:</strong> ${escapeHtml(body.total)}</p>
            <p style="margin:0 0 6px"><strong>Estado:</strong> ${escapeHtml(body.status)} · Pago: ${escapeHtml(body.payment)}</p>
            <p style="margin:0"><strong>Entrega:</strong> ${escapeHtml(deliverySummary(order))}</p>
        </div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:16px;border-collapse:collapse">
            <thead>
                <tr>
                    <th align="left" style="font-size:12px;color:#125373;text-transform:uppercase;letter-spacing:.05em;padding-bottom:8px">Producto</th>
                    <th align="center" style="font-size:12px;color:#125373;text-transform:uppercase;letter-spacing:.05em;padding-bottom:8px">Cant.</th>
                    <th align="right" style="font-size:12px;color:#125373;text-transform:uppercase;letter-spacing:.05em;padding-bottom:8px">Subtotal</th>
                </tr>
            </thead>
            <tbody>${orderItemsRows(order)}</tbody>
        </table>
    `;

    return wrapBrandedEmail({
        preheader: `${EVENT_LABELS[body.event] || "Actualización de pedido"} · ${body.number}`,
        title: EVENT_LABELS[body.event] || "Actualización de pedido",
        introHtml: paragraphs,
        mainHtml: summary,
        ctaUrl: body.tracking,
        ctaLabel: "Ver seguimiento del pedido",
        footerNote: "La vista previa de personalización es referencial. Si necesitamos confirmar algún detalle, te contactaremos antes de preparar el producto."
    });
}

function buildAdminEmailHtml(order, data) {
    const adminUrl = data.adminUrl || "";
    const mainHtml = `
        <div style="border:1px solid rgba(2, 48, 71, 0.14);border-radius:16px;padding:16px;background:#EAF4F8">
            <p style="margin:0 0 8px"><strong>Cliente:</strong> ${escapeHtml(data.customer)}</p>
            <p style="margin:0 0 8px"><strong>Correo:</strong> ${escapeHtml(data.email)}</p>
            <p style="margin:0 0 8px"><strong>Teléfono:</strong> ${escapeHtml(data.phone)}</p>
            <p style="margin:0 0 8px"><strong>Total:</strong> ${escapeHtml(data.total)}</p>
            <p style="margin:0"><strong>Entrega:</strong> ${escapeHtml(deliverySummary(order))}</p>
        </div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:16px;border-collapse:collapse">
            <tbody>${orderItemsRows(order)}</tbody>
        </table>
    `;

    return wrapBrandedEmail({
        preheader: `${data.label}: ${data.number}`,
        title: data.label,
        introHtml: `<p style="margin:0 0 14px">Hay una actualización operativa en Rhema Diseños.</p><p style="margin:0 0 14px"><strong>Pedido:</strong> ${escapeHtml(data.number)}</p>`,
        mainHtml,
        ctaUrl: adminUrl,
        ctaLabel: "Abrir pedido en admin",
        footerNote: "Este aviso interno ayuda a revisar pedidos y pagos desde el panel de administración."
    });
}

function normalizedEvent(eventName, order) {
    const requested = clean(eventName) || "status_update";
    if (EVENT_LABELS[requested]) return requested;

    switch (clean(order?.estadoPedido)) {
        case "validacion_diseno": return "design_review";
        case "en_produccion": return "production_started";
        case "listo": return "ready";
        case "enviado": return "shipped";
        case "entregado": return "delivered";
        case "cancelado": return "cancelled";
        default: return "status_update";
    }
}

function buildBase(order, eventName) {
    const event = normalizedEvent(eventName, order);
    const name = firstName(order);
    const greeting = name ? `Hola ${name}` : "Hola";
    const tracking = orderUrl(order);
    const number = clean(order.numeroPedido) || "tu pedido";
    const products = productSummary(order);
    const status = statusLabel(order.estadoPedido);
    const payment = paymentLabel(order.estadoPago);
    const total = money(order.total);

    return { event, greeting, tracking, number, products, status, payment, total };
}

function eventBody(order, eventName) {
    const data = buildBase(order, eventName);

    const linesByEvent = {
        order_created: [
            `${data.greeting}, recibimos tu pedido ${data.number}.`,
            `Resumen: ${data.products}.`,
            `Total: ${data.total}.`,
            "Revisaremos la información y te avisaremos los próximos pasos."
        ],
        payment_confirmed: [
            `${data.greeting}, confirmamos el pago de tu pedido ${data.number}.`,
            "Ahora pasará a revisión de diseño o preparación, según corresponda.",
            `Estado del pedido: ${data.status}.`
        ],
        design_review: [
            `${data.greeting}, tu pedido ${data.number} entró a revisión de diseño.`,
            "Te contactaremos si necesitamos confirmar algún detalle antes de fabricar.",
            "Cuando el diseño final esté listo, podrás revisarlo desde tu cuenta o por el canal acordado."
        ],
        production_started: [
            `${data.greeting}, tu pedido ${data.number} ya está en producción.`,
            "Estamos preparando tu producto personalizado con cuidado."
        ],
        ready: [
            `${data.greeting}, tu pedido ${data.number} está listo.`,
            "Coordinaremos contigo el retiro o envío según la modalidad seleccionada."
        ],
        shipped: [
            `${data.greeting}, tu pedido ${data.number} fue enviado.`,
            "Revisa el seguimiento o contáctanos si necesitas apoyo con la entrega."
        ],
        delivered: [
            `${data.greeting}, tu pedido ${data.number} figura como entregado.`,
            "Gracias por confiar en Rhema Diseños."
        ],
        cancelled: [
            `${data.greeting}, tu pedido ${data.number} fue cancelado.`,
            "Si crees que esto fue un error, contáctanos para revisarlo."
        ],
        status_update: [
            `${data.greeting}, actualizamos tu pedido ${data.number}.`,
            `Estado actual: ${data.status}.`,
            `Pago: ${data.payment}.`
        ]
    };

    const lines = linesByEvent[data.event] || linesByEvent.status_update;
    if (data.tracking) lines.push(`Puedes revisar el avance aquí: ${data.tracking}`);

    return {
        ...data,
        subject: `${EVENT_LABELS[data.event] || "Actualización de pedido"} · ${data.number}`,
        text: lines.join("\n\n")
    };
}

function buildNotification(order, eventName = "status_update") {
    const body = eventBody(order, eventName);
    const supportPhone = whatsappDigits(process.env.WHATSAPP_SUPPORT_NUMBER || "");
    const customerPhone = whatsappDigits(order?.cliente?.telefono || "");

    return {
        event: body.event,
        label: EVENT_LABELS[body.event] || "Actualización de pedido",
        to: clean(order?.cliente?.email),
        customerPhone,
        subject: `Rhema Diseños · ${body.subject}`,
        text: body.text,
        html: buildCustomerEmailHtml(order, body),
        whatsappText: body.text,
        customerWhatsappUrl: customerPhone
            ? `https://wa.me/${customerPhone}?text=${encodeURIComponent(body.text)}`
            : "",
        supportWhatsappUrl: supportPhone
            ? `https://wa.me/${supportPhone}?text=${encodeURIComponent(`Necesito revisar el pedido ${body.number}.`)}`
            : "",
        trackingUrl: body.tracking
    };
}

function availableNotifications(order) {
    const entries = [
        "order_created",
        "payment_confirmed",
        "design_review",
        "production_started",
        "ready",
        "shipped",
        "delivered",
        "cancelled",
        "status_update"
    ];

    return entries.map((event) => buildNotification(order, event));
}

function notificationAlreadyLogged(order, event) {
    return Array.isArray(order?.historial) && order.historial.some((entry) => (
        clean(entry.estado) === `notificacion_${event}`
    ));
}

function logNotification(order, event, detail, userId = null) {
    if (!order || !Array.isArray(order.historial)) return;

    order.historial.push({
        estado: `notificacion_${event}`,
        detalle: clean(detail).slice(0, 400) || "Notificación preparada.",
        usuarioId: userId || null
    });
}

async function sendResendEmail(notification, override = {}) {
    const apiKey = clean(process.env.RESEND_API_KEY);
    const from = clean(process.env.EMAIL_FROM);
    const to = override.to || notification.to;

    if (!apiKey || !from || !to) {
        return {
            sent: false,
            skipped: true,
            reason: !to
                ? "No hay destinatario configurado."
                : "Faltan RESEND_API_KEY o EMAIL_FROM."
        };
    }

    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            from,
            to,
            subject: override.subject || notification.subject,
            html: override.html || notification.html,
            text: override.text || notification.text,
            reply_to: clean(process.env.EMAIL_REPLY_TO) || undefined
        })
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
        return {
            sent: false,
            skipped: false,
            reason: body?.message || `Resend respondió con estado ${response.status}.`,
            details: body
        };
    }

    return {
        sent: true,
        skipped: false,
        provider: "resend",
        id: body?.id || ""
    };
}

function buildAdminNotification(order, event, customerNotification) {
    const base = publicFrontendUrl();
    const adminUrl = base
        ? `${base}/admin/pedidos.html?id=${encodeURIComponent(String(order?._id || ""))}`
        : "";

    const number = clean(order?.numeroPedido) || "pedido";
    const customer = clean(order?.cliente?.nombre) || "Cliente";
    const email = clean(order?.cliente?.email) || "sin correo";
    const phone = clean(order?.cliente?.telefono) || "sin teléfono";
    const products = productSummary(order);
    const total = money(order?.total);
    const label = EVENT_LABELS[event] || customerNotification.label || "Actualización de pedido";

    const lines = [
        `${label}: ${number}`,
        `Cliente: ${customer}`,
        `Correo: ${email}`,
        `Teléfono: ${phone}`,
        `Resumen: ${products}`,
        `Total: ${total}`,
        `Estado del pedido: ${statusLabel(order?.estadoPedido)}`,
        `Estado del pago: ${paymentLabel(order?.estadoPago)}`
    ];

    if (adminUrl) lines.push(`Revisar pedido en el panel: ${adminUrl}`);

    const text = lines.join("\n");
    const html = buildAdminEmailHtml(order, {
        adminUrl,
        number,
        customer,
        email,
        phone,
        products,
        total,
        label
    });

    return {
        subject: `[Rhema Diseños] ${label} · ${number}`,
        text,
        html
    };
}

async function sendAdminNotification(order, event, customerNotification) {
    const recipients = splitEmails(process.env.NOTIFICATION_ADMIN_EMAIL);

    if (!recipients.length) {
        return {
            sent: false,
            skipped: true,
            reason: "No hay NOTIFICATION_ADMIN_EMAIL configurado."
        };
    }

    const adminNotification = buildAdminNotification(order, event, customerNotification);

    return sendResendEmail(
        customerNotification,
        {
            to: recipients,
            subject: adminNotification.subject,
            text: adminNotification.text,
            html: adminNotification.html
        }
    );
}

async function dispatchNotification(order, eventName, options = {}) {
    const event = normalizedEvent(eventName, order);
    const notification = buildNotification(order, event);
    const enabled = notificationsEnabled();

    let email = {
        sent: false,
        skipped: true,
        reason: "Envío automático desactivado."
    };

    if (enabled && options.email !== false) {
        email = await sendResendEmail(notification);
    }

    let adminEmail = {
        sent: false,
        skipped: true,
        reason: "Aviso interno no solicitado."
    };

    if (
        enabled &&
        options.adminEmail !== false &&
        event === "order_created"
    ) {
        adminEmail = await sendAdminNotification(order, event, notification);
    }

    if (options.log !== false && order?.historial) {
        const status = email.sent
            ? "correo enviado"
            : `mensaje preparado${email.reason ? ` · ${email.reason}` : ""}`;
        logNotification(order, event, `${notification.label}: ${status}.`, options.userId || null);
    }

    return {
        notification,
        email,
        adminEmail
    };
}

module.exports = {
    EVENT_LABELS,
    buildNotification,
    availableNotifications,
    dispatchNotification,
    notificationAlreadyLogged,
    logNotification,
    normalizedEvent,
    notificationConfigStatus,
    emailReady
};
