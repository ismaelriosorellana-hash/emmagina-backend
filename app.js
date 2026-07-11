"use strict";

const express =
    require("express");

const cors =
    require("cors");

const helmet =
    require("helmet");

const morgan =
    require("morgan");

const {
    createCorsOptions
} = require(
    "./config/cors"
);

const {
    trustProxyHops
} = require(
    "./config/security"
);

const {
    APP_VERSION
} = require(
    "./config/version"
);

const {
    requestContext
} = require(
    "./middleware/requestContext"
);

const {
    applySecurityHeaders
} = require(
    "./middleware/securityHeaders"
);

const {
    enforceExpectedContentType,
    inspectRequestBody,
    inspectRequestQuery
} = require(
    "./middleware/requestSecurity"
);

const {
    generalApiLimiter,
    adminLimiter
} = require(
    "./middleware/rateLimits"
);

const {
    requireAuth,
    requireRole
} = require(
    "./middleware/auth"
);

const {
    notFound,
    errorHandler
} = require(
    "./middleware/errors"
);

const productosRoutes =
    require(
        "./routes/productos"
    );

const pedidosRoutes =
    require(
        "./routes/pedidos"
    );

const authRoutes =
    require(
        "./routes/auth"
    );

const accountRoutes =
    require(
        "./routes/account"
    );

const bannersRoutes =
    require(
        "./routes/banners"
    );

const categoriasRoutes =
    require(
        "./routes/categorias"
    );

const contentRoutes =
    require(
        "./routes/content"
    );

const uploadsRoutes =
    require(
        "./routes/uploads"
    );

const pagesRoutes =
    require(
        "./routes/pages"
    );

const editorSitioPagesRoutes =
    require(
        "./routes/editorSitioPages"
    );

const siteSettingsRoutes =
    require(
        "./routes/siteSettings"
    );

const pagosRoutes =
    require(
        "./routes/pagos"
    );

const siteStudioRoutes =
    require(
        "./routes/siteStudio"
    );

const adminProductosRoutes =
    require(
        "./routes/admin/productos"
    );

const adminPedidosRoutes =
    require(
        "./routes/admin/pedidos"
    );

const adminInventarioRoutes =
    require(
        "./routes/admin/inventario"
    );

const adminReportesRoutes =
    require(
        "./routes/admin/reportes"
    );

const adminBannersRoutes =
    require(
        "./routes/admin/banners"
    );

const adminCategoriasRoutes =
    require(
        "./routes/admin/categorias"
    );

const adminDashboardRoutes =
    require(
        "./routes/admin/dashboard"
    );

const adminContentRoutes =
    require(
        "./routes/admin/content"
    );

const adminSiteSettingsRoutes =
    require(
        "./routes/admin/siteSettings"
    );

const adminSiteStudioRoutes =
    require(
        "./routes/admin/siteStudio"
    );

const adminPagesRoutes =
    require(
        "./routes/admin/pages"
    );

const adminEditorSitioPagesRoutes =
    require(
        "./routes/admin/editorSitioPages"
    );

const seoRoutes =
    require(
        "./routes/seo"
    );

const healthRoutes =
    require(
        "./routes/health"
    );

const adminSystemRoutes =
    require(
        "./routes/admin/system"
    );

const adminNotificacionesRoutes =
    require(
        "./routes/admin/notificaciones"
    );

const adminSeguridadRoutes =
    require(
        "./routes/admin/seguridad"
    );

const adminOperacionesRoutes =
    require(
        "./routes/admin/operaciones"
    );

const app =
    express();

app.disable(
    "x-powered-by"
);

app.set(
    "trust proxy",
    trustProxyHops()
);

app.use(
    requestContext
);

app.use(
    applySecurityHeaders
);

app.use(
    helmet({
        contentSecurityPolicy:
            false,
        crossOriginResourcePolicy: {
            policy:
                "cross-origin"
        },
        referrerPolicy: {
            policy:
                "strict-origin-when-cross-origin"
        },
        strictTransportSecurity:
            process.env.NODE_ENV ===
            "production"
                ? {
                    maxAge:
                        31536000,
                    includeSubDomains:
                        true
                }
                : false
    })
);

app.use(
    cors(
        createCorsOptions()
    )
);

app.use(
    "/api",
    generalApiLimiter
);

app.use(
    enforceExpectedContentType
);

app.use(
    express.json({
        limit: "2mb",
        strict: true
    })
);

app.use(
    express.urlencoded({
        extended: false,
        limit: "256kb",
        parameterLimit: 100
    })
);

app.use(
    inspectRequestBody
);

if (
    process.env.NODE_ENV ===
    "development"
) {
    app.use(
        morgan("dev")
    );
}


app.get(
    "/favicon.ico",
    (req, res) => {
        res.status(204).end();
    }
);

app.get(
    "/",
    (req, res) => {
        res.json({
            nombre:
                "API Emmagina",
            version:
                APP_VERSION,
            estado:
                "funcionando",
            requestId:
                req.requestId
        });
    }
);

app.use(
    "/api/health",
    healthRoutes
);

// Rutas públicas SEO/pre-renderizadas para bots sociales y Google.
app.use(
    seoRoutes
);

// Rutas públicas
app.use(
    "/api/productos",
    productosRoutes
);

app.use(
    "/api/producto",
    productosRoutes
);

app.use(
    "/api/catalogo",
    productosRoutes
);

app.use(
    "/api/pedidos",
    pedidosRoutes
);

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/cuenta",
    accountRoutes
);

app.use(
    "/api/banners",
    bannersRoutes
);

app.use(
    "/api/categorias",
    categoriasRoutes
);

app.use(
    "/api/contenido",
    contentRoutes
);

app.use(
    "/api/uploads",
    uploadsRoutes
);

app.use(
    "/api/pages",
    pagesRoutes
);

app.use(
    "/api/editor-sitio",
    editorSitioPagesRoutes
);

app.use(
    "/api/configuracion-sitio",
    siteSettingsRoutes
);

app.use(
    "/api/pagos",
    pagosRoutes
);

app.use(
    "/api/estudio-sitio",
    siteStudioRoutes
);

// Todas las rutas administrativas pasan por límite de solicitudes, sesión y rol.
app.use(
    "/api/admin",
    adminLimiter
);

app.use(
    "/api/admin",
    requireAuth,
    requireRole(
        "administrador",
        "gestor"
    )
);

app.use(
    "/api/admin/system",
    adminSystemRoutes
);

app.use(
    "/api/admin/notificaciones",
    adminNotificacionesRoutes
);

app.use(
    "/api/admin/seguridad",
    adminSeguridadRoutes
);

app.use(
    "/api/admin/dashboard",
    adminDashboardRoutes
);

app.use(
    "/api/admin/operaciones",
    adminOperacionesRoutes
);

app.use(
    "/api/admin/productos",
    adminProductosRoutes
);

app.use(
    "/api/admin/pedidos",
    adminPedidosRoutes
);

app.use(
    "/api/admin/inventario",
    adminInventarioRoutes
);

app.use(
    "/api/admin/reportes",
    adminReportesRoutes
);

app.use(
    "/api/admin/banners",
    adminBannersRoutes
);

app.use(
    "/api/admin/categorias",
    adminCategoriasRoutes
);

app.use(
    "/api/admin/contenido",
    adminContentRoutes
);

app.use(
    "/api/admin/configuracion-sitio",
    adminSiteSettingsRoutes
);

app.use(
    "/api/admin/editor-sitio",
    adminEditorSitioPagesRoutes
);

app.use(
    "/api/admin/pages",
    adminPagesRoutes
);

app.use(
    "/api/admin/estudio-sitio",
    adminSiteStudioRoutes
);

app.use(
    notFound
);

app.use(
    errorHandler
);

module.exports = app;
