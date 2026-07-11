"use strict";

const Page = require("../models/Page");

const HOME_KEYS = ["home", "inicio"];

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
                    buttonUrl: "catalogo.html",
                    categories: [
                        "Accesorios",
                        "Coleccionables",
                        "Decoración",
                        "Herramientas",
                        "Linea Memories",
                        "Librería",
                        "Linea Alma",
                        "Ofertas",
                        "Vasos Temáticos",
                        "Todos"
                    ]
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
                    title: "Explora Emmagina",
                    cards: [
                        { title: "Destacados", text: "Selección especial de productos", image: "", href: "catalogo.html?grupo=destacados" },
                        { title: "Más vendidos", text: "Lo favorito de nuestros clientes", image: "", href: "catalogo.html?grupo=vendidos" },
                        { title: "Más vistos", text: "Lo más explorado de la tienda", image: "", href: "catalogo.html?grupo=vistos" }
                    ]
                },
                style: {
                    marginTop: 0,
                    marginBottom: 24
                }
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
                style: {
                    marginTop: 0,
                    marginBottom: 24
                }
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
                style: {
                    marginTop: 0,
                    marginBottom: 24
                }
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
                    minRating: 4,
                    hideWhenEmpty: true
                },
                style: {
                    marginTop: 0,
                    marginBottom: 24
                }
            }
        ]
    };
}

function normalizeText(value) {
    return String(value || "").trim().toLowerCase();
}

function shouldBootstrapHome(value) {
    const key = normalizeText(value);
    return key === "" || HOME_KEYS.includes(key);
}

function hasBlocks(page) {
    return Array.isArray(page?.blocks) && page.blocks.length > 0;
}

function chooseCanonicalHome(candidates) {
    const list = Array.isArray(candidates) ? candidates : [];

    return list.find((page) => page.key === "home" && page.slug === "inicio") ||
        list.find((page) => page.key === "home" && hasBlocks(page)) ||
        list.find((page) => page.slug === "inicio" && hasBlocks(page)) ||
        list.find((page) => hasBlocks(page)) ||
        list[0] ||
        null;
}

async function archiveDuplicateHomePages(candidates, canonicalId) {
    const duplicates = (Array.isArray(candidates) ? candidates : [])
        .filter((page) => String(page._id) !== String(canonicalId));

    for (const duplicate of duplicates) {
        const suffix = String(duplicate._id).slice(-8);
        await Page.updateOne(
            { _id: duplicate._id },
            {
                $set: {
                    key: `archivo-home-${suffix}`,
                    slug: `archivo-home-${suffix}`,
                    title: duplicate.title ? `[Archivo técnico] ${duplicate.title}` : "[Archivo técnico] Inicio duplicado",
                    isPublished: false,
                    isSystem: true,
                    canDelete: false,
                    showInSiteEditor: false,
                    showInNavigation: false,
                    sortOrder: 9999
                }
            },
            { runValidators: false }
        );
    }
}

async function findHomeCandidates() {
    return Page.find({
        $or: [
            { key: { $in: HOME_KEYS } },
            { slug: { $in: HOME_KEYS } }
        ]
    }).sort({ updatedAt: -1, createdAt: -1 });
}

async function ensureDefaultHomePage() {
    const defaults = getDefaultHomePage();
    let candidates = await findHomeCandidates();

    if (!candidates.length) {
        try {
            return await Page.create(defaults);
        } catch (error) {
            if (error?.code !== 11000) throw error;
            candidates = await findHomeCandidates();
            if (!candidates.length) throw error;
        }
    }

    let canonical = chooseCanonicalHome(candidates);

    await archiveDuplicateHomePages(candidates, canonical._id);

    const update = {
        key: "home",
        slug: "inicio",
        isPublished: true,
        isSystem: true,
        canDelete: false,
        template: "home",
        pageType: "home",
        showInSiteEditor: true,
        showInNavigation: false,
        navigationLabel: canonical.navigationLabel || canonical.title || "Inicio",
        sortOrder: 1
    };

    if (!canonical.title) update.title = defaults.title;
    if (!canonical.description) update.description = defaults.description;
    if (!canonical.seo || !canonical.seo.title) update.seo = defaults.seo;
    if (!hasBlocks(canonical)) update.blocks = defaults.blocks;

    try {
        await Page.updateOne(
            { _id: canonical._id },
            { $set: update },
            { runValidators: false }
        );
    } catch (error) {
        if (error?.code !== 11000) throw error;
        candidates = await findHomeCandidates();
        canonical = chooseCanonicalHome(candidates);
        await archiveDuplicateHomePages(candidates, canonical._id);
        await Page.updateOne(
            { _id: canonical._id },
            { $set: update },
            { runValidators: false }
        );
    }

    return Page.findById(canonical._id);
}

async function getPageBuilderStatus() {
    const home = await ensureDefaultHomePage();
    const totalPages = await Page.countDocuments({ showInSiteEditor: { $ne: false } });
    return {
        ok: true,
        module: "Editor del Sitio",
        totalPages,
        home: {
            id: home._id,
            key: home.key,
            slug: home.slug,
            title: home.title,
            blocksCount: Array.isArray(home.blocks) ? home.blocks.length : 0,
            updatedAt: home.updatedAt
        }
    };
}

module.exports = {
    HOME_KEYS,
    getDefaultHomePage,
    shouldBootstrapHome,
    ensureDefaultHomePage,
    getPageBuilderStatus
};
