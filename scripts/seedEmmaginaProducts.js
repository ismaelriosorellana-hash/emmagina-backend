"use strict";

require("dotenv").config();
const mongoose = require("mongoose");
const Producto = require("../models/Producto");
const Categoria = require("../models/Categoria");
const { connectDatabase } = require("../config/db");

const categories = [
  ["Accesorios", "Complementos y piezas pequeñas para regalos personalizados", "fa-solid fa-star", "#d8c6b6", 10],
  ["Coleccionables", "Figuras y piezas pensadas para conservar recuerdos", "fa-solid fa-cube", "#c9d9e4", 20],
  ["Decoración", "Objetos decorativos con identidad familiar y emocional", "fa-solid fa-house", "#e9ddcf", 30],
  ["Herramientas", "Útiles y accesorios prácticos para uso cotidiano", "fa-solid fa-screwdriver-wrench", "#d9e7ea", 40],
  ["Linea Memories", "Escenas 3D familiares inspiradas en momentos reales", "fa-solid fa-heart", "#d6c6b8", 50],
  ["Librería", "Papelería, libretas y piezas complementarias", "fa-solid fa-book", "#eaf3f7", 60],
  ["Linea Alma", "Figuras emotivas, simples y pintadas a mano", "fa-solid fa-cloud", "#f1e7da", 70],
  ["Ofertas", "Promociones y productos de lanzamiento", "fa-solid fa-tag", "#f6dfcf", 80],
  ["Otros", "Solicitudes especiales y productos por evaluar", "fa-solid fa-ellipsis", "#edf2f5", 90],
  ["Vasos Temáticos", "Vasos y piezas temáticas personalizables", "fa-solid fa-mug-hot", "#d7e8ef", 100],
  ["Todos", "Catálogo completo de Emmagina", "fa-solid fa-layer-group", "#f4efe8", 110]
].map(([nombre, descripcion, icono, color, orden]) => ({ nombre, descripcion, icono, color, orden }));

function placeholder(title, subtitle) {
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fbfdff"/><stop offset=".52" stop-color="#eaf6fb"/><stop offset="1" stop-color="#f8efe3"/></linearGradient></defs>
      <rect width="1000" height="1000" rx="90" fill="url(#g)"/>
      <circle cx="330" cy="360" r="120" fill="#fff" opacity=".72"/><circle cx="520" cy="330" r="150" fill="#fff" opacity=".58"/><circle cx="690" cy="390" r="110" fill="#fff" opacity=".66"/>
      <path d="M260 655c80-130 156-185 240-185s160 55 240 185" fill="#d8c6b6" opacity=".62"/>
      <text x="500" y="800" text-anchor="middle" font-family="Arial, sans-serif" font-size="46" font-weight="700" fill="#45505f">${title}</text>
      <text x="500" y="858" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" fill="#738093">${subtitle}</text>
    </svg>`);
}

const products = [
  ["EMM-MINI-ALMA", "Mini Alma 3D", 14990, "Linea Alma", ["Linea Alma", "Coleccionables", "Todos", "Ofertas"], "Desde $14.990", "Figura pequeña personalizada sin pintar, ideal para conservar un recuerdo simple en formato 3D.", 25, 7, 10, true],
  ["EMM-MINI-PLACA", "Mini Alma con Placa", 18990, "Linea Alma", ["Linea Alma", "Coleccionables", "Todos"], "Entrada", "Figura pequeña sin pintar con base simple y placa personalizada con nombre, fecha o frase corta.", 35, 7, 20, true],
  ["EMM-FIGURA-ESENCIAL", "Figura Esencial", 24990, "Coleccionables", ["Coleccionables", "Decoración", "Todos"], "Simple", "Figura de una persona, sin pintura completa, con base personalizada simple.", 55, 8, 30, true],
  ["EMM-FIGURA-COLOR", "Figura Esencial + Color", 29990, "Coleccionables", ["Coleccionables", "Linea Alma", "Todos"], "Color básico", "Figura individual con detalles mínimos pintados a mano: cabello, ropa o accesorio simple.", 65, 9, 40, true],
  ["EMM-FIGURA-ALMA", "Figura con Alma", 39990, "Linea Alma", ["Linea Alma", "Decoración", "Todos"], "Pintada a mano", "Figura personalizada pintada a mano, con acabado artesanal y estilo tierno.", 80, 10, 50, true],
  ["EMM-FIGURA-PLACA", "Figura con Alma + Placa", 44990, "Linea Alma", ["Linea Alma", "Decoración", "Todos"], "Más elegido", "Figura pintada a mano con placa personalizada. Recomendada para nacimiento, cumpleaños o regalo familiar.", 90, 10, 60, true],
  ["EMM-ESCENA-DUO", "Escena Dúo con Alma", 69990, "Linea Memories", ["Linea Memories", "Decoración", "Todos"], "2 personas", "Escena de 2 personas pintadas a mano, con base y placa personalizada.", 140, 12, 70, true],
  ["EMM-ESCENA-FAMILIAR", "Escena Familiar con Alma", 99990, "Linea Memories", ["Linea Memories", "Decoración", "Todos"], "Hasta 3 personas", "Escena familiar personalizada de hasta 3 personas, pintada a mano, con contexto simple y placa.", 220, 12, 80, true],
  ["EMM-ESCENA-PREMIUM", "Escena Familiar Premium", 119990, "Linea Memories", ["Linea Memories", "Decoración", "Todos"], "Premium", "Escena de hasta 3 personas con pintura detallada, contexto más elaborado y placa premium.", 260, 14, 90, true],
  ["EMM-CAJA-REGALO", "Caja Regalo Premium", 3990, "Accesorios", ["Accesorios", "Todos"], "Extra", "Presentación especial para regalo: caja, protección interior y tarjeta breve. No se vende por separado.", 0, 1, 100, false]
].map(([sku, nombre, precio, categoriaPrincipal, categorias, insignia, descripcion, pesoGramos, diasPreparacion, orden, personalizable]) => ({
  sku,
  nombre,
  precio,
  categoriaPrincipal,
  categorias,
  insignia,
  descripcion,
  pesoGramos,
  diasPreparacion,
  orden,
  marca: "Emmagina",
  precioOriginal: 0,
  imagenes: [placeholder(nombre, categoriaPrincipal)],
  destacado: ["EMM-MINI-ALMA", "EMM-FIGURA-ALMA", "EMM-FIGURA-PLACA", "EMM-ESCENA-DUO", "EMM-ESCENA-FAMILIAR"].includes(sku),
  personalizable,
  publicarCatalogo: true,
  activo: true,
  stock: sku === "EMM-CAJA-REGALO" ? 100 : 30,
  ajusteImagenTarjeta: "contain",
  ajusteImagenDetalle: "contain",
  personalizacionLigera: personalizable ? {
    habilitada: true,
    permitirNombre: true,
    permitirImagen: true,
    permitirObservacion: true,
    cantidadMaximaImagenes: 2,
    descripcion: "Sube 2 fotos por persona y describe el momento, lugar o acción que quieres recrear.",
    aviso: "La pieza final es una interpretación artística basada en tus referencias, no una réplica exacta."
  } : { habilitada: false },
  caracteristicas: [
    `Categoría: ${categoriaPrincipal}`,
    `Acabado: ${categoriaPrincipal === "Linea Memories" || categoriaPrincipal === "Linea Alma" ? "pintado a mano según producto" : "PLA con acabado simple"}`,
    `Plazo estimado: ${diasPreparacion} a ${diasPreparacion + 3} días hábiles`,
    "Fotos recomendadas: 2 referencias por persona"
  ],
  entrega: {
    envio: { habilitado: true, instrucciones: "Santiago: despacho local coordinado. Regiones: envío por pagar o cotizado antes de fabricar." },
    retiro: { habilitado: true, instrucciones: "Retiro en Santiago previa coordinación." }
  },
  seo: {
    titulo: `${nombre} | Emmagina`,
    descripcion: descripcion.slice(0, 180),
    palabrasClave: ["figuras 3D personalizadas", "regalos personalizados", "Emmagina"],
    noIndex: false
  }
}));

async function upsertCategory(category) {
  await Categoria.findOneAndUpdate(
    { nombre: category.nombre },
    { $set: { ...category, activa: true, mostrarMenu: true, mostrarInicio: true } },
    { upsert: true, new: true, runValidators: true }
  );
}

async function upsertProduct(product) {
  await Producto.findOneAndUpdate(
    { sku: product.sku },
    { $set: product },
    { upsert: true, new: true, runValidators: true }
  );
}

async function main() {
  await connectDatabase();
  for (const category of categories) await upsertCategory(category);
  for (const product of products) await upsertProduct(product);
  console.log(`Seed Emmagina aplicado: ${categories.length} categorías y ${products.length} productos.`);
}

main()
  .catch((error) => {
    console.error("No fue posible aplicar seed Emmagina:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close().catch(() => {});
  });
