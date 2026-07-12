"use strict";

function clean(value) {
    return String(value ?? "").trim();
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

function emailReady() {
    return Boolean(
        clean(process.env.NOTIFICATIONS_ENABLED || "true") !== "false" &&
        clean(process.env.EMAIL_PROVIDER || "resend").toLowerCase() === "resend" &&
        clean(process.env.RESEND_API_KEY) &&
        clean(process.env.EMAIL_FROM)
    );
}

function requestTypeLabel(type) {
    const labels = {
        figura: "Figura / retrato 3D",
        servicio: "Impresión 3D a pedido",
        idea: "Idea personalizada"
    };
    return labels[clean(type)] || "Solicitud personalizada";
}

function adminUrl() {
    const frontend = clean(process.env.PUBLIC_FRONTEND_URL || process.env.FRONTEND_URL || "").replace(/\/+$/, "");
    if (!frontend) return "";
    return `${frontend}/admin/solicitudes.html`;
}

async function sendEmail({ to, subject, html, text }) {
    if (!emailReady()) {
        return {
            sent: false,
            skipped: true,
            reason: "Correo automático no configurado."
        };
    }

    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${clean(process.env.RESEND_API_KEY)}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            from: clean(process.env.EMAIL_FROM),
            to,
            subject,
            html,
            text,
            reply_to: clean(process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM)
        })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        return {
            sent: false,
            skipped: false,
            reason: data?.message || `Resend respondió ${response.status}`
        };
    }

    return {
        sent: true,
        id: data?.id || ""
    };
}

function customerHtml(request) {
    const type = requestTypeLabel(request.tipoSolicitud);
    return `
        <div style="font-family:Arial,sans-serif;background:#EAF4F8;padding:28px;color:#023047">
            <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:20px;padding:28px;border:1px solid rgba(2,48,71,.12)">
                <h1 style="margin:0 0 10px;color:#023047">Recibimos tu solicitud</h1>
                <p style="margin:0 0 18px;color:#125373">Gracias por escribir a Rhema Diseños. Revisaremos tu solicitud y te responderemos con precio, tiempo estimado y recomendaciones.</p>
                <div style="background:#FFF3CD;border-radius:16px;padding:16px;margin:18px 0;color:#023047">
                    <strong>Folio:</strong> ${escapeHtml(request.folio)}<br>
                    <strong>Tipo:</strong> ${escapeHtml(type)}
                </div>
                <p style="color:#125373"><strong>Resumen enviado:</strong><br>${escapeHtml(request.proyecto?.descripcion || "Solicitud recibida para evaluación.")}</p>
                <p style="margin-top:22px;color:#125373">Equipo Rhema Diseños</p>
            </div>
        </div>
    `;
}

function adminHtml(request) {
    const type = requestTypeLabel(request.tipoSolicitud);
    const files = Array.isArray(request.archivos) ? request.archivos : [];
    const link = adminUrl();
    const fileList = files.length
        ? files.map((file) => `<li><a href="${escapeHtml(file.downloadUrl || file.url)}">${escapeHtml(file.fileName || "archivo")}</a></li>`).join("")
        : "<li>Sin archivos adjuntos.</li>";

    return `
        <div style="font-family:Arial,sans-serif;background:#EAF4F8;padding:28px;color:#023047">
            <div style="max-width:720px;margin:0 auto;background:#fff;border-radius:20px;padding:28px;border:1px solid rgba(2,48,71,.12)">
                <h1 style="margin:0 0 10px;color:#023047">Nueva solicitud personalizada</h1>
                <p style="margin:0 0 18px;color:#125373">Se recibió una solicitud desde el formulario de Rhema Diseños.</p>
                <div style="background:#EAF4F8;border-radius:16px;padding:16px;margin:18px 0;color:#023047">
                    <strong>Folio:</strong> ${escapeHtml(request.folio)}<br>
                    <strong>Tipo:</strong> ${escapeHtml(type)}<br>
                    <strong>Cliente:</strong> ${escapeHtml(request.cliente?.nombre)}<br>
                    <strong>WhatsApp:</strong> ${escapeHtml(request.cliente?.whatsapp)}<br>
                    <strong>Correo:</strong> ${escapeHtml(request.cliente?.correo || "No indicado")}<br>
                    <strong>Comuna:</strong> ${escapeHtml(request.cliente?.comuna || "No indicada")}
                </div>
                <p><strong>Descripción:</strong><br>${escapeHtml(request.proyecto?.descripcion || "Sin descripción.")}</p>
                <p><strong>Archivos:</strong></p>
                <ul>${fileList}</ul>
                ${link ? `<p><a href="${escapeHtml(link)}" style="display:inline-block;background:#FB8500;color:#023047;font-weight:700;text-decoration:none;border-radius:999px;padding:12px 18px">Abrir panel</a></p>` : ""}
            </div>
        </div>
    `;
}

function moneyClp(value) {
    return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0
    }).format(Number(value) || 0);
}

function quoteHtml(request) {
    const type = requestTypeLabel(request.tipoSolicitud);
    const quote = request.cotizacion || {};
    const amount = moneyClp(quote.montoEstimado);
    const validity = Number(quote.validezDias) || 7;
    const conditions = clean(quote.condiciones) || "La fabricación comienza después de confirmar la cotización y coordinar el pago.";
    return `
        <div style="font-family:Arial,sans-serif;background:#EAF4F8;padding:28px;color:#023047">
            <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:20px;padding:28px;border:1px solid rgba(2,48,71,.12)">
                <p style="margin:0 0 8px;color:#219EBC;font-weight:700;text-transform:uppercase;letter-spacing:.08em">Cotización Rhema Diseños</p>
                <h1 style="margin:0 0 10px;color:#023047">Tu cotización está lista</h1>
                <p style="margin:0 0 18px;color:#125373">Revisamos tu solicitud y preparamos una propuesta inicial. Si quieres avanzar, responde este correo o escríbenos por WhatsApp indicando tu folio.</p>
                <div style="background:#EAF4F8;border-radius:16px;padding:18px;margin:18px 0;color:#023047">
                    <strong>Folio:</strong> ${escapeHtml(request.folio)}<br>
                    <strong>Tipo:</strong> ${escapeHtml(type)}<br>
                    <strong>Monto estimado:</strong> ${escapeHtml(amount)}<br>
                    <strong>Tiempo estimado:</strong> ${escapeHtml(quote.tiempoEstimado || "Por confirmar")}
                </div>
                ${quote.requiereAbono ? `<p style="background:#FFF3CD;border-radius:14px;padding:14px;color:#023047"><strong>Abono sugerido:</strong> ${escapeHtml(moneyClp(quote.montoAbono))}</p>` : ""}
                ${quote.observaciones ? `<p style="color:#125373"><strong>Observaciones:</strong><br>${escapeHtml(quote.observaciones)}</p>` : ""}
                <p style="color:#125373"><strong>Condiciones:</strong><br>${escapeHtml(conditions)}</p>
                <p style="color:#125373">Esta cotización tiene una validez referencial de ${validity} día(s), salvo cambios en tamaño, material, archivo o nivel de detalle.</p>
                <p style="margin-top:22px;color:#125373">Equipo Rhema Diseños</p>
            </div>
        </div>
    `;
}

function quoteAdminHtml(request) {
    const quote = request.cotizacion || {};
    const link = adminUrl();
    return `
        <div style="font-family:Arial,sans-serif;background:#EAF4F8;padding:28px;color:#023047">
            <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:20px;padding:28px;border:1px solid rgba(2,48,71,.12)">
                <h1 style="margin:0 0 10px;color:#023047">Cotización enviada</h1>
                <p style="color:#125373">Se registró una cotización para la solicitud ${escapeHtml(request.folio)}.</p>
                <div style="background:#EAF4F8;border-radius:16px;padding:18px;margin:18px 0;color:#023047">
                    <strong>Cliente:</strong> ${escapeHtml(request.cliente?.nombre || "Cliente")}<br>
                    <strong>Monto:</strong> ${escapeHtml(moneyClp(quote.montoEstimado))}<br>
                    <strong>Tiempo:</strong> ${escapeHtml(quote.tiempoEstimado || "Por confirmar")}<br>
                    <strong>Estado:</strong> ${escapeHtml(request.estado || "cotizada")}
                </div>
                ${link ? `<p><a href="${escapeHtml(link)}" style="display:inline-block;background:#219EBC;color:#fff;font-weight:700;text-decoration:none;border-radius:999px;padding:12px 18px">Abrir solicitudes</a></p>` : ""}
            </div>
        </div>
    `;
}

async function notifyCustomQuote(request) {
    const adminEmails = splitEmails(process.env.NOTIFICATION_ADMIN_EMAIL);
    const tasks = [];

    if (clean(request.cliente?.correo)) {
        tasks.push(sendEmail({
            to: [clean(request.cliente.correo)],
            subject: `Cotización ${request.folio} | Rhema Diseños`,
            html: quoteHtml(request),
            text: `Tu cotización ${request.folio} está lista. Monto estimado: ${moneyClp(request.cotizacion?.montoEstimado)}. Tiempo estimado: ${request.cotizacion?.tiempoEstimado || "por confirmar"}.`
        }));
    }

    if (adminEmails.length) {
        tasks.push(sendEmail({
            to: adminEmails,
            subject: `Cotización enviada ${request.folio} | Rhema Diseños`,
            html: quoteAdminHtml(request),
            text: `Cotización enviada ${request.folio}: ${moneyClp(request.cotizacion?.montoEstimado)}.`
        }));
    }

    if (!tasks.length) {
        return [{ sent: false, skipped: true, reason: "No hay destinatarios configurados." }];
    }

    return Promise.allSettled(tasks).then((results) => results.map((item) => item.status === "fulfilled" ? item.value : {
        sent: false,
        skipped: false,
        reason: item.reason?.message || "Error enviando cotización."
    }));
}

async function notifyCustomRequest(request) {
    const adminEmails = splitEmails(process.env.NOTIFICATION_ADMIN_EMAIL);
    const tasks = [];

    if (clean(request.cliente?.correo)) {
        tasks.push(sendEmail({
            to: [clean(request.cliente.correo)],
            subject: `Recibimos tu solicitud ${request.folio} | Rhema Diseños`,
            html: customerHtml(request),
            text: `Recibimos tu solicitud ${request.folio}. Revisaremos tu proyecto y te responderemos con una cotización.`
        }));
    }

    if (adminEmails.length) {
        tasks.push(sendEmail({
            to: adminEmails,
            subject: `Nueva solicitud ${request.folio} | ${requestTypeLabel(request.tipoSolicitud)}`,
            html: adminHtml(request),
            text: `Nueva solicitud ${request.folio} de ${request.cliente?.nombre || "cliente"}.`
        }));
    }

    if (!tasks.length) {
        return [{ sent: false, skipped: true, reason: "No hay destinatarios configurados." }];
    }

    return Promise.allSettled(tasks).then((results) => results.map((item) => item.status === "fulfilled" ? item.value : {
        sent: false,
        skipped: false,
        reason: item.reason?.message || "Error enviando notificación."
    }));
}

module.exports = {
    notifyCustomRequest,
    notifyCustomQuote
};
