"use strict";

const Page = require("../models/Page");

function getDefaultHomePage() {
    return {
        key: "home",
        title: "Inicio",
        slug: "inicio",
        description: "Página principal editable de Emmagina.",
        isPublished: true,
        isSystem: true,
        canDelete: false,
        template: "home",
        pageType: "home",
        showInSiteEditor: true,
        showInNavigation: false,
        navigationLabel: "Inicio",
        sortOrder: 1,
        seo: {
            title: "Emmagina | Productos impresos en 3D",
            description: "Figuras, decoraciones y productos impresos en 3D para regalar, crear y conservar recuerdos.",
            image: "",
            noIndex: false
        },
        blocks: [
            {
                type: "hero_banner",
                name: "Hero principal",
                position: 1,
                isVisible: true,
                content: {
                    title: "Emmagina",
                    subtitle: "Productos impresos en 3D para regalar, decorar y crear recuerdos.",
                    imageDesktop: "",
                    imageMobile: "",
                    buttonText: "Comprar ahora",
                    buttonUrl: "catalogo.html"
                },
                style: {
                    heightDesktop: 323,
                    heightMobile: 220,
                    marginTop: 0,
                    marginBottom: 24
                }
            },
            {
                type: "info_cards",
                name: "Bloques informativos",
                position: 2,
                isVisible: true,
                content: {
                    cards: [
                        { title: "Destacados", text: "Selección especial de productos", image: "" },
                        { title: "Más vendidos", text: "Lo favorito de nuestros clientes", image: "" },
                        { title: "Más vistos", text: "Lo más explorado de la tienda", image: "" }
                    ]
                },
                style: {}
            },
            {
                type: "product_marquee",
                name: "Desde $14.990",
                position: 3,
                isVisible: true,
                content: {
                    title: "Desde $14.990",
                    filter: "desde14990",
                    limit: 12
                },
                style: {}
            },
            {
                type: "product_marquee",
                name: "Lanzamiento",
                position: 4,
                isVisible: true,
                content: {
                    title: "Lanzamiento",
                    filter: "lanzamiento",
                    limit: 12
                },
                style: {}
            },
            {
                type: "image_banner",
                name: "Línea Memories",
                position: 5,
                isVisible: true,
                content: {
                    title: "Línea Memories",
                    imageDesktop: "",
                    imageMobile: "",
                    buttonText: "Pedir el mío",
                    buttonUrl: "pedido-personalizado.html"
                },
                style: {
                    heightDesktop: 112,
                    heightMobile: 88,
                    marginTop: 0,
                    marginBottom: 18
                }
            },
            {
                type: "image_banner",
                name: "Línea Alma",
                position: 6,
                isVisible: true,
                content: {
                    title: "Línea Alma",
                    imageDesktop: "",
                    imageMobile: "",
                    buttonText: "Pedir el mío",
                    buttonUrl: "pedido-personalizado.html"
                },
                style: {
                    heightDesktop: 112,
                    heightMobile: 88,
                    marginTop: 0,
                    marginBottom: 18
                }
            },
            {
                type: "reviews_marquee",
                name: "Reseñas destacadas",
                position: 7,
                isVisible: true,
                content: {
                    title: "Lo que dicen nuestros clientes",
                    minRating: 4
                },
                style: {}
            }
        ]
    };
}

function shouldBootstrapHome(value) {
    const key = String(value || "").trim().toLowerCase();
    return key === "home" || key === "inicio" || key === "";
}

async function ensureDefaultHomePage() {
    const defaultHomePage = getDefaultHomePage();

    let page = await Page.findOne({
        $or: [
            { key: defaultHomePage.key },
            { slug: defaultHomePage.slug }
        ]
    });

    if (!page) {
        return Page.create(defaultHomePage);
    }

    page.isSystem = true;
    page.canDelete = false;
    page.showInSiteEditor = true;
    page.pageType = "home";
    page.template = "home";
    page.sortOrder = 1;

    if (!Array.isArray(page.blocks) || !page.blocks.length) {
        page.blocks = defaultHomePage.blocks;
    }

    return page.save();
}

module.exports = {
    getDefaultHomePage,
    shouldBootstrapHome,
    ensureDefaultHomePage
};
