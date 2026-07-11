"use strict";

const CmsPage = require("../models/CmsPage");
const CmsTemplate = require("../models/CmsTemplate");
const CmsBlockDefinition = require("../models/CmsBlockDefinition");

function blockDefinitionSeed() {
    return [
        {
            tipo: "hero_banner",
            nombre: "Hero / Banner principal",
            categoria: "portada",
            icono: "fa-image",
            descripcion: "Portada visual con título, subtítulo, imágenes y llamados a la acción.",
            contenidoInicial: { titulo: "Título principal", subtitulo: "Texto breve de apoyo", botonTexto: "Comprar ahora", botonUrl: "catalogo.html", imagenDesktop: "", imagenMobile: "" },
            estiloInicial: { alturaDesktop: 420, alturaMobile: 320, alineacion: "left", fondo: "#EAF4F8" },
            campos: [
                { key: "contenido.titulo", label: "Título", kind: "text", required: true },
                { key: "contenido.subtitulo", label: "Subtítulo", kind: "textarea" },
                { key: "contenido.botonTexto", label: "Texto del botón", kind: "text" },
                { key: "contenido.botonUrl", label: "URL del botón", kind: "url" },
                { key: "contenido.imagenDesktop", label: "Imagen escritorio", kind: "image" },
                { key: "contenido.imagenMobile", label: "Imagen móvil", kind: "image" },
                { key: "estilo.alturaDesktop", label: "Altura escritorio", kind: "number", min: 180, max: 720 },
                { key: "estilo.fondo", label: "Color de fondo", kind: "color" }
            ]
        },
        {
            tipo: "category_sidebar",
            nombre: "Lista lateral de categorías",
            categoria: "navegacion",
            icono: "fa-list",
            descripcion: "Lista de categorías para acompañar el hero o una página de catálogo.",
            contenidoInicial: { titulo: "Categorías", origen: "reales_inicio", categorias: [], mostrarVerTodas: true, verTodasTexto: "Ver todas", verTodasUrl: "catalogo.html" },
            estiloInicial: { mostrarDesktop: true, mostrarMobile: false },
            campos: [
                { key: "contenido.titulo", label: "Título", kind: "text" },
                { key: "contenido.origen", label: "Origen", kind: "select", options: ["manual", "reales_inicio", "reales_menu", "reales_destacadas"] },
                { key: "contenido.categorias", label: "Categorías", kind: "category_selector" },
                { key: "estilo.mostrarDesktop", label: "Mostrar en escritorio", kind: "boolean" },
                { key: "estilo.mostrarMobile", label: "Mostrar en móvil", kind: "boolean" }
            ]
        },
        {
            tipo: "category_grid",
            nombre: "Grilla de categorías",
            categoria: "navegacion",
            icono: "fa-table-cells-large",
            descripcion: "Grilla visual con categorías destacadas.",
            contenidoInicial: { titulo: "Categorías", origen: "reales_inicio", categorias: [] },
            estiloInicial: { columnasDesktop: 4, columnasMobile: 2 },
            campos: [
                { key: "contenido.titulo", label: "Título", kind: "text" },
                { key: "contenido.categorias", label: "Categorías", kind: "category_selector" }
            ]
        },
        {
            tipo: "info_cards",
            nombre: "Tarjetas informativas",
            categoria: "contenido",
            icono: "fa-layer-group",
            descripcion: "Grupo de tarjetas para beneficios, accesos o información comercial.",
            contenidoInicial: { titulo: "Información destacada", tarjetas: [] },
            estiloInicial: { columnasDesktop: 3, columnasMobile: 1 },
            campos: [
                { key: "contenido.titulo", label: "Título", kind: "text" },
                { key: "contenido.tarjetas", label: "Tarjetas", kind: "repeater" }
            ]
        },
        {
            tipo: "product_carousel",
            nombre: "Carrusel de productos",
            categoria: "catalogo",
            icono: "fa-cart-shopping",
            descripcion: "Carrusel horizontal con productos reales filtrados o seleccionados manualmente.",
            contenidoInicial: { titulo: "Productos destacados", origen: "destacados", categoriaId: "", productos: [], limite: 12 },
            estiloInicial: { mostrarPrecio: true, mostrarBotonCarrito: true, velocidad: "normal" },
            campos: [
                { key: "contenido.titulo", label: "Título", kind: "text" },
                { key: "contenido.origen", label: "Origen", kind: "select", options: ["destacados", "nuevos", "ofertas", "categoria", "manual"] },
                { key: "contenido.categoriaId", label: "Categoría", kind: "category_selector" },
                { key: "contenido.productos", label: "Productos", kind: "product_selector" },
                { key: "contenido.limite", label: "Cantidad máxima", kind: "number", min: 1, max: 24 }
            ]
        },
        {
            tipo: "product_grid",
            nombre: "Grilla de productos",
            categoria: "catalogo",
            icono: "fa-grip",
            descripcion: "Grilla de productos reales para secciones de catálogo o landing pages.",
            contenidoInicial: { titulo: "Productos", origen: "destacados", categoriaId: "", productos: [], limite: 12 },
            estiloInicial: { columnasDesktop: 4, columnasMobile: 2, mostrarFiltros: false },
            campos: [
                { key: "contenido.titulo", label: "Título", kind: "text" },
                { key: "contenido.productos", label: "Productos", kind: "product_selector" }
            ]
        },
        {
            tipo: "image_banner",
            nombre: "Banner de imagen",
            categoria: "venta",
            icono: "fa-panorama",
            descripcion: "Banner comercial con imagen, texto y llamado a la acción.",
            contenidoInicial: { titulo: "Banner", texto: "", imagenDesktop: "", imagenMobile: "", botonTexto: "Ver más", botonUrl: "catalogo.html" },
            estiloInicial: { alturaDesktop: 240, alturaMobile: 160, alineacion: "center" },
            campos: [
                { key: "contenido.titulo", label: "Título", kind: "text" },
                { key: "contenido.imagenDesktop", label: "Imagen escritorio", kind: "image" },
                { key: "contenido.botonTexto", label: "Texto del botón", kind: "text" },
                { key: "contenido.botonUrl", label: "URL del botón", kind: "url" }
            ]
        },
        {
            tipo: "reviews_carousel",
            nombre: "Carrusel de reseñas",
            categoria: "venta",
            icono: "fa-star",
            descripcion: "Reseñas destacadas o testimonios manuales.",
            contenidoInicial: { titulo: "Lo que dicen nuestros clientes", origen: "reales", resenas: [], ratingMinimo: 4 },
            estiloInicial: {},
            campos: [
                { key: "contenido.titulo", label: "Título", kind: "text" },
                { key: "contenido.ratingMinimo", label: "Rating mínimo", kind: "number", min: 1, max: 5 }
            ]
        },
        {
            tipo: "text_block",
            nombre: "Texto simple",
            categoria: "contenido",
            icono: "fa-align-left",
            descripcion: "Bloque de texto para páginas informativas.",
            contenidoInicial: { titulo: "Título", texto: "Contenido de la sección" },
            estiloInicial: { ancho: "normal", alineacion: "left" },
            campos: [
                { key: "contenido.titulo", label: "Título", kind: "text" },
                { key: "contenido.texto", label: "Texto", kind: "richtext" }
            ]
        },
        {
            tipo: "faq_block",
            nombre: "Preguntas frecuentes",
            categoria: "contenido",
            icono: "fa-circle-question",
            descripcion: "Listado de preguntas y respuestas.",
            contenidoInicial: { titulo: "Preguntas frecuentes", items: [] },
            estiloInicial: {},
            campos: [
                { key: "contenido.titulo", label: "Título", kind: "text" },
                { key: "contenido.items", label: "Preguntas", kind: "repeater" }
            ]
        },
        { tipo: "contact_block", nombre: "Formulario de contacto", categoria: "contenido", icono: "fa-envelope", descripcion: "Bloque para contacto o soporte.", contenidoInicial: { titulo: "Contáctanos", texto: "" }, estiloInicial: {}, campos: [] },
        { tipo: "cart_summary", nombre: "Resumen del carrito", categoria: "checkout", icono: "fa-basket-shopping", descripcion: "Resumen de productos en carrito.", contenidoInicial: {}, estiloInicial: {}, campos: [] },
        { tipo: "checkout_form", nombre: "Formulario de compra", categoria: "checkout", icono: "fa-credit-card", descripcion: "Formulario de datos de cliente y entrega.", contenidoInicial: {}, estiloInicial: {}, campos: [] },
        { tipo: "spacer", nombre: "Separador / espacio", categoria: "contenido", icono: "fa-arrows-up-down", descripcion: "Espaciado vertical entre bloques.", contenidoInicial: { alto: 32 }, estiloInicial: {}, campos: [{ key: "contenido.alto", label: "Alto", kind: "number", min: 0, max: 240 }] },
        { tipo: "custom_html", nombre: "HTML controlado", categoria: "sistema", icono: "fa-code", descripcion: "HTML limitado para casos especiales.", contenidoInicial: { html: "" }, estiloInicial: {}, campos: [{ key: "contenido.html", label: "HTML", kind: "textarea" }] }
    ];
}

function templateSeed() {
    const mainRegion = {
        id: "main",
        nombre: "Contenido principal",
        tipo: "main",
        orden: 1,
        obligatoria: true,
        maxSecciones: 0,
        tiposSeccionPermitidos: ["hero_section", "content_section", "products_section", "brand_section", "reviews_section", "generic_section"],
        tiposBloquePermitidos: []
    };

    return [
        {
            templateKey: "home",
            nombre: "Home flexible",
            descripcion: "Plantilla principal para la portada de Emmagina.",
            tipoPagina: "home",
            regiones: [mainRegion],
            layoutInicial: homeLayoutJson()
        },
        {
            templateKey: "default_page",
            nombre: "Página flexible",
            descripcion: "Plantilla estándar para páginas informativas y landing pages.",
            tipoPagina: "page",
            regiones: [mainRegion],
            layoutInicial: emptyLayoutJson("default_page")
        },
        {
            templateKey: "product_page",
            nombre: "Ficha de producto",
            descripcion: "Plantilla futura para PDP modular.",
            tipoPagina: "product",
            regiones: [mainRegion],
            layoutInicial: emptyLayoutJson("product_page")
        },
        {
            templateKey: "category_page",
            nombre: "Página de categoría",
            descripcion: "Plantilla futura para páginas de categoría.",
            tipoPagina: "category",
            regiones: [mainRegion],
            layoutInicial: emptyLayoutJson("category_page")
        },
        {
            templateKey: "checkout_page",
            nombre: "Checkout",
            descripcion: "Plantilla futura para carrito y checkout.",
            tipoPagina: "checkout",
            regiones: [mainRegion],
            layoutInicial: emptyLayoutJson("checkout_page")
        }
    ];
}

function emptyLayoutJson(templateKey = "default_page") {
    return {
        versionEsquema: "cms-layout-v1",
        templateKey,
        configuracion: {
            maxWidth: 1320,
            fondo: "#EAF4F8",
            espaciadoSecciones: 40
        },
        regiones: [
            {
                id: "main",
                tipo: "main",
                nombre: "Contenido principal",
                orden: 1,
                visible: true,
                configuracion: {},
                estilo: {},
                secciones: []
            }
        ]
    };
}

function homeLayoutJson() {
    return {
        versionEsquema: "cms-layout-v1",
        templateKey: "home",
        configuracion: {
            maxWidth: 1320,
            fondo: "#EAF4F8",
            espaciadoSecciones: 40
        },
        regiones: [
            {
                id: "main",
                tipo: "main",
                nombre: "Contenido principal",
                orden: 1,
                visible: true,
                configuracion: {},
                estilo: {},
                secciones: [
                    {
                        id: "sec_home_hero",
                        tipo: "hero_section",
                        nombre: "Sección Hero",
                        orden: 1,
                        visible: true,
                        layout: "hero_with_sidebar",
                        contenido: {},
                        estilo: { marginTop: 0, marginBottom: 32 },
                        configuracion: {},
                        bloques: [
                            {
                                id: "blk_home_categories",
                                tipo: "category_sidebar",
                                nombre: "Lista lateral de categorías",
                                orden: 1,
                                visible: true,
                                contenido: { titulo: "Categorías", origen: "reales_inicio", categorias: [], mostrarVerTodas: true, verTodasTexto: "Ver todas", verTodasUrl: "catalogo.html" },
                                estilo: { mostrarDesktop: true, mostrarMobile: false },
                                configuracion: {},
                                fuentesDatos: { tipo: "categorias", modo: "inicio" },
                                reglas: {}
                            },
                            {
                                id: "blk_home_hero",
                                tipo: "hero_banner",
                                nombre: "Hero principal",
                                orden: 2,
                                visible: true,
                                contenido: { titulo: "Emmagina", subtitulo: "Productos impresos en 3D para regalar, decorar y crear recuerdos.", botonTexto: "Ver productos", botonUrl: "catalogo.html", imagenDesktop: "", imagenMobile: "" },
                                estilo: { alturaDesktop: 420, alturaMobile: 320, alineacion: "left", fondo: "#EAF4F8" },
                                configuracion: {},
                                fuentesDatos: {},
                                reglas: {}
                            }
                        ]
                    },
                    {
                        id: "sec_home_products",
                        tipo: "products_section",
                        nombre: "Productos destacados",
                        orden: 2,
                        visible: true,
                        layout: "stack",
                        contenido: {},
                        estilo: { marginTop: 0, marginBottom: 32 },
                        configuracion: {},
                        bloques: [
                            {
                                id: "blk_home_product_carousel",
                                tipo: "product_carousel",
                                nombre: "Carrusel de productos",
                                orden: 1,
                                visible: true,
                                contenido: { titulo: "Productos destacados", origen: "destacados", categoriaId: "", productos: [], limite: 12 },
                                estilo: { mostrarPrecio: true, mostrarBotonCarrito: true },
                                configuracion: {},
                                fuentesDatos: { tipo: "productos", modo: "destacados" },
                                reglas: {}
                            }
                        ]
                    }
                ]
            }
        ]
    };
}

async function ensureArchitecture() {
    const blocks = blockDefinitionSeed();
    const templates = templateSeed();

    await Promise.all(blocks.map((block) => CmsBlockDefinition.updateOne({ tipo: block.tipo }, { $set: block }, { upsert: true })));
    await Promise.all(templates.map((template) => CmsTemplate.updateOne({ templateKey: template.templateKey }, { $set: template }, { upsert: true })));

    const existingHome = await CmsPage.findOne({ clave: "home", eliminadoEn: null }).lean();
    if (!existingHome) {
        await CmsPage.create({
            clave: "home",
            titulo: "Inicio",
            slug: "inicio",
            tipoPagina: "home",
            templateKey: "home",
            estado: "publicada",
            sistema: true,
            editable: true,
            eliminable: false,
            navegacion: { mostrarEnMenu: true, mostrarEnFooter: false, etiqueta: "Inicio", orden: 1 },
            seo: { titulo: "Emmagina | Productos impresos en 3D", descripcion: "Productos impresos en 3D para regalar, decorar y crear recuerdos.", imagen: "", noIndex: false },
            layoutBorrador: homeLayoutJson(),
            layoutPublicado: homeLayoutJson(),
            tieneCambiosSinPublicar: false,
            versionActual: 1,
            publicadoEn: new Date(),
            versiones: []
        });
    }

    return getArchitectureSummary();
}

async function getArchitectureSummary() {
    const [blocks, templates, pageCount] = await Promise.all([
        CmsBlockDefinition.find({ activo: true }).sort({ categoria: 1, nombre: 1 }).lean(),
        CmsTemplate.find({ activo: true }).sort({ tipoPagina: 1, nombre: 1 }).lean(),
        CmsPage.countDocuments({ eliminadoEn: null })
    ]);

    return {
        versionEsquema: "cms-layout-v1",
        colecciones: ["cms_pages", "cms_templates", "cms_block_definitions"],
        pageCount,
        templates,
        blocks,
        ejemploHome: homeLayoutJson()
    };
}

module.exports = {
    blockDefinitionSeed,
    templateSeed,
    emptyLayoutJson,
    homeLayoutJson,
    ensureArchitecture,
    getArchitectureSummary
};
