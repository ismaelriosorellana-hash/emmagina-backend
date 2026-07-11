"use strict";

const Categoria = require("../models/Categoria");
const Producto = require("../models/Producto");
const { normalizeCategoryOutput, mergeCategoryDocuments, fallbackCategoryDocuments } = require("../utils/categoryNormalizer");
const { normalizeProductOutput } = require("../utils/productNormalizer");

function firstImageFromProduct(product = {}) {
    const images = product.imagenes || product.images || product.galeria || [];
    const list = Array.isArray(images) ? images : [images].filter(Boolean);
    const sorted = list.slice().sort((a, b) => {
        const ap = a && typeof a === "object" && (a.principal || a.isMain) ? -1 : 0;
        const bp = b && typeof b === "object" && (b.principal || b.isMain) ? -1 : 0;
        return ap - bp || (Number(a?.orden || 0) - Number(b?.orden || 0));
    });
    const first = sorted[0];
    if (!first) return product.imagenPrincipal || product.image || "";
    if (typeof first === "string") return first;
    return first.secure_url || first.url || first.src || first.href || product.imagenPrincipal || product.image || "";
}

function categoryToEditorOption(category = {}) {
    const item = normalizeCategoryOutput(category);
    return {
        id: item.id,
        _id: item._id,
        nombre: item.nombre,
        label: item.nombre,
        slug: item.slug,
        href: `catalogo.html?categoria=${encodeURIComponent(item.nombre)}`,
        image: item.imagen || "",
        imagen: item.imagen || "",
        icono: item.icono,
        color: item.color,
        activa: item.activa,
        mostrarMenu: item.mostrarMenu,
        mostrarInicio: item.mostrarInicio,
        destacada: item.destacada,
        orden: item.orden
    };
}

function productToEditorOption(product = {}) {
    const item = normalizeProductOutput(product);
    return {
        id: item.id,
        _id: item.id,
        nombre: item.nombre,
        slug: item.slug,
        sku: item.sku || "",
        precio: item.precio,
        precioOriginal: item.precioOriginal || 0,
        stock: item.stock,
        activo: item.activo !== false,
        publicarCatalogo: item.publicarCatalogo !== false,
        destacado: item.destacado === true,
        lanzamiento: item.lanzamiento === true,
        masVendido: item.masVendido === true,
        masVisto: item.masVisto === true,
        categorias: item.categorias || [],
        categoriaPrincipal: item.categoriaPrincipal || "",
        imagenPrincipal: firstImageFromProduct(item),
        href: `producto.html?slug=${encodeURIComponent(item.slug || item.id || "")}`,
        label: item.nombre
    };
}

function predefinedFilters() {
    return [
        { value: "todos", label: "Todos los productos" },
        { value: "destacados", label: "Destacados" },
        { value: "desde14990", label: "Desde $14.990" },
        { value: "lanzamiento", label: "Lanzamiento" },
        { value: "vendidos", label: "Más vendidos" },
        { value: "vistos", label: "Más vistos" }
    ];
}

async function loadCategories() {
    const saved = await Categoria.find({}).sort({ orden: 1, nombre: 1 }).lean();
    return mergeCategoryDocuments(saved, fallbackCategoryDocuments()).map(categoryToEditorOption);
}

async function loadProducts() {
    const docs = await Producto.find({})
        .sort({ orden: 1, createdAt: -1 })
        .limit(700)
        .lean();
    return docs.map(productToEditorOption);
}

async function getCatalogData(req, res, next) {
    try {
        res.set("Cache-Control", "no-store");
        const [categorias, productos] = await Promise.all([
            loadCategories(),
            loadProducts()
        ]);
        res.json({
            categorias,
            productos,
            filtros: predefinedFilters(),
            totals: {
                categorias: categorias.length,
                productos: productos.length
            }
        });
    } catch (error) {
        next(error);
    }
}

async function getCategories(req, res, next) {
    try {
        res.set("Cache-Control", "no-store");
        res.json({ categorias: await loadCategories() });
    } catch (error) {
        next(error);
    }
}

async function getProducts(req, res, next) {
    try {
        res.set("Cache-Control", "no-store");
        res.json({ productos: await loadProducts() });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getCatalogData,
    getCategories,
    getProducts
};
