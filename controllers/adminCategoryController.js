"use strict";

const Categoria = require("../models/Categoria");
const { fallbackCategoryDocuments } = require("../utils/categoryNormalizer");

const {
    normalizeCategoryInput,
    normalizeCategoryOutput
} = require("../utils/categoryNormalizer");

const {
    resolveUniqueCategorySlug
} = require("../services/categoryService");

async function listAdminCategories(req, res, next) {
    try {
        const categories = await Categoria.find({})
            .populate("categoriaPadre", "nombre slug")
            .sort({ categoriaPadre: 1, orden: 1, nombre: 1 })
            .lean();

        res.json({
            categorias: categories.map(normalizeCategoryOutput)
        });
    } catch (error) {
        next(error);
    }
}

async function createCategory(req, res, next) {
    try {
        const data = normalizeCategoryInput(req.body);

        if (!data.nombre) {
            return res.status(400).json({
                error: "El nombre de la categoría es obligatorio."
            });
        }

        if (data.categoriaPadre && !(await Categoria.exists({ _id: data.categoriaPadre }))) {
            return res.status(400).json({ error: "La categoría padre seleccionada no existe." });
        }

        data.slug = await resolveUniqueCategorySlug(data.slug);

        const category = await Categoria.create(data);

        res.status(201).json(
            normalizeCategoryOutput(category)
        );
    } catch (error) {
        next(error);
    }
}

async function updateCategory(req, res, next) {
    try {
        const data = normalizeCategoryInput(req.body);

        if (!data.nombre) {
            return res.status(400).json({
                error: "El nombre de la categoría es obligatorio."
            });
        }

        if (String(data.categoriaPadre || "") === String(req.params.id)) {
            return res.status(400).json({ error: "Una categoría no puede ser su propia categoría padre." });
        }
        if (data.categoriaPadre && !(await Categoria.exists({ _id: data.categoriaPadre }))) {
            return res.status(400).json({ error: "La categoría padre seleccionada no existe." });
        }

        data.slug = await resolveUniqueCategorySlug(
            data.slug,
            req.params.id
        );

        const category = await Categoria.findByIdAndUpdate(
            req.params.id,
            { $set: data },
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({
                error: "Categoría no encontrada."
            });
        }

        res.json(normalizeCategoryOutput(category));
    } catch (error) {
        next(error);
    }
}

async function deleteCategory(req, res, next) {
    try {
        const hasChildren = await Categoria.exists({ categoriaPadre: req.params.id });
        if (hasChildren) {
            return res.status(409).json({ error: "Primero elimina o reasigna las subcategorías asociadas." });
        }

        const category = await Categoria.findByIdAndDelete(req.params.id);

        if (!category) {
            return res.status(404).json({
                error: "Categoría no encontrada."
            });
        }

        res.json({ mensaje: "Categoría eliminada correctamente." });
    } catch (error) {
        next(error);
    }
}

async function installBaseCategories(req, res, next) {
    try {
        const base = fallbackCategoryDocuments();
        const baseSlugs = base.map((item) => item.slug);

        const operations = base.map((item) => ({
            updateOne: {
                filter: { slug: item.slug },
                update: { $set: item },
                upsert: true
            }
        }));

        if (operations.length) {
            await Categoria.bulkWrite(operations, { ordered: true });
        }

        const deactivateResult = await Categoria.updateMany(
            { slug: { $nin: baseSlugs } },
            {
                $set: {
                    activa: false,
                    mostrarMenu: false,
                    mostrarInicio: false,
                    destacada: false
                }
            }
        );

        const categories = await Categoria.find({})
            .sort({ orden: 1, nombre: 1 })
            .lean();

        res.json({
            mensaje: "Categorías base instaladas correctamente.",
            desactivadas: deactivateResult.modifiedCount || 0,
            categorias: categories.map(normalizeCategoryOutput)
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    listAdminCategories,
    installBaseCategories,
    createCategory,
    updateCategory,
    deleteCategory
};
