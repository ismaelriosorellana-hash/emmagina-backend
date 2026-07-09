"use strict";

const mongoose = require("mongoose");
const { createSlug } = require("../utils/values");

const dimensionsSchema = new mongoose.Schema(
    {
        largoCm: {
            type: Number,
            default: 0,
            min: 0,
            max: 1000
        },
        anchoCm: {
            type: Number,
            default: 0,
            min: 0,
            max: 1000
        },
        altoCm: {
            type: Number,
            default: 0,
            min: 0,
            max: 1000
        }
    },
    {
        _id: false,
        minimize: false
    }
);

const seoSchema = new mongoose.Schema(
    {
        titulo: {
            type: String,
            trim: true,
            maxlength: 70,
            default: ""
        },
        descripcion: {
            type: String,
            trim: true,
            maxlength: 180,
            default: ""
        },
        imagen: {
            type: String,
            trim: true,
            maxlength: 1200,
            default: ""
        },
        palabrasClave: {
            type: [String],
            default: []
        },
        noIndex: {
            type: Boolean,
            default: false
        }
    },
    {
        _id: false,
        minimize: false
    }
);

const variantSchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            trim: true,
            maxlength: 120,
            default: ""
        },
        codigoHex: {
            type: String,
            trim: true,
            maxlength: 20,
            default: ""
        },
        stock: {
            type: Number,
            default: 0,
            min: 0
        },
        precio: {
            type: Number,
            default: null,
            min: 0
        },
        sku: {
            type: String,
            trim: true,
            uppercase: true,
            maxlength: 80,
            default: ""
        },
        activo: {
            type: Boolean,
            default: true
        },
        imagenes: {
            type: [mongoose.Schema.Types.Mixed],
            default: []
        },
        pesoGramos: {
            type: Number,
            default: 0,
            min: 0,
            max: 100000
        },
        dimensiones: {
            type: dimensionsSchema,
            default: () => ({})
        }
    },
    {
        _id: false,
        strict: false,
        minimize: false
    }
);

const productSchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: true,
            trim: true,
            maxlength: 180
        },

        slug: {
            type: String,
            trim: true,
            lowercase: true,
            maxlength: 140,
            index: true,
            sparse: true
        },

        sku: {
            type: String,
            trim: true,
            uppercase: true,
            maxlength: 80,
            default: ""
        },

        marca: {
            type: String,
            trim: true,
            maxlength: 120,
            default: "Emmagina"
        },

        codigoBarras: {
            type: String,
            trim: true,
            maxlength: 80,
            default: ""
        },

        precio: {
            type: Number,
            required: true,
            min: 0
        },

        precioOriginal: {
            type: Number,
            default: 0,
            min: 0
        },

        descripcion: {
            type: String,
            default: "",
            maxlength: 10000
        },

        imagenes: {
            type: [mongoose.Schema.Types.Mixed],
            default: []
        },

        categorias: {
            type: mongoose.Schema.Types.Mixed,
            default: []
        },

        tallas: {
            type: [String],
            default: []
        },

        categoriaPrincipal: {
            type: String,
            default: "",
            trim: true
        },

        insignia: {
            type: String,
            default: "",
            trim: true
        },

        destacado: {
            type: Boolean,
            default: false
        },

        orden: {
            type: Number,
            default: 0
        },

        personalizable: {
            type: Boolean,
            default: false
        },

        fabricadoPedido: {
            type: Boolean,
            default: false
        },

        bajoPedido: {
            type: Boolean,
            default: false
        },

        publicarCatalogo: {
            type: Boolean,
            default: true
        },

        activo: {
            type: Boolean,
            default: true
        },

        stock: {
            type: Number,
            default: 0,
            min: 0
        },

        ventas: {
            type: Number,
            default: 0,
            min: 0
        },

        movimiento: {
            type: Number,
            default: 0
        },

        variantes: {
            type: [variantSchema],
            default: []
        },

        personalizacionLigera: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },

        caracteristicas: {
            type: mongoose.Schema.Types.Mixed,
            default: []
        },

        precioBasePersonalizacion: {
            type: Number,
            default: null,
            min: 0
        },

        costosPersonalizacion: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },

        diasPreparacion: {
            type: Number,
            default: 3,
            min: 1,
            max: 90
        },

        pesoGramos: {
            type: Number,
            default: 0,
            min: 0,
            max: 100000
        },

        dimensiones: {
            type: dimensionsSchema,
            default: () => ({})
        },

        seo: {
            type: seoSchema,
            default: () => ({})
        },

        entrega: {
            envio: {
                habilitado: {
                    type: Boolean,
                    default: true
                },
                instrucciones: {
                    type: String,
                    default: "Santiago: despacho local coordinado. Regiones: envío por pagar o cotizado antes de fabricar. El plazo de producción se confirma según complejidad.",
                    maxlength: 3000
                }
            },
            retiro: {
                habilitado: {
                    type: Boolean,
                    default: true
                },
                instrucciones: {
                    type: String,
                    default: "Retiro en Santiago previa coordinación. La fecha y hora se confirmarán cuando la pieza esté lista.",
                    maxlength: 3000
                }
            }
        },

        ajusteImagenTarjeta: {
            type: String,
            enum: ["cover", "contain"],
            default: "cover"
        },

        ajusteImagenDetalle: {
            type: String,
            enum: ["cover", "contain"],
            default: "contain"
        },

        posicionImagen: {
            type: String,
            default: "center"
        }
    },
    {
        timestamps: true,
        collection: "productos",
        strict: false,
        minimize: false
    }
);

productSchema.pre("validate", function setSlug(next) {
    if (!this.slug && this.nombre) {
        this.slug = createSlug(this.nombre);
    }

    next();
});

productSchema.index({
    nombre: "text",
    descripcion: "text",
    categoriaPrincipal: "text"
});

productSchema.index({
    activo: 1,
    publicarCatalogo: 1,
    orden: 1,
    destacado: -1
});

productSchema.index({
    categoriaPrincipal: 1,
    precio: 1
});

productSchema.index({ sku: 1 });
productSchema.index({ "variantes.sku": 1 });
productSchema.index({ marca: 1 });

module.exports =
    mongoose.models.Producto ||
    mongoose.model("Producto", productSchema);
