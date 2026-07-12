"use strict";

require("dotenv").config();
const mongoose = require("mongoose");
const Producto = require("../models/Producto");
const Categoria = require("../models/Categoria");
const { connectDatabase } = require("../config/db");

const categories = [
  { nombre: "Figuras Esenciales", descripcion: "Opciones de entrada desde $14.990", icono: "fa-solid fa-cloud", color: "#b9d8e6", orden: 10 },
  { nombre: "Figuras Pintadas a Mano", descripcion: "Piezas con acabado artesanal", icono: "fa-solid fa-palette", color: "#d9b7a3", orden: 20 },
  { nombre: "Escenas Familiares", descripcion: "Recuerdos de 2 a 3 personas", icono: "fa-solid fa-heart", color: "#d8c6b6", orden: 30 },
  { nombre: "Packs y Regalos", descripcion: "Opciones para sorprender", icono: "fa-solid fa-gift", color: "#c7d8cf", orden: 40 },
  { nombre: "Placas y Extras", descripcion: "Detalles complementarios", icono: "fa-solid fa-message", color: "#c9cfe3", orden: 50 }
];

function placeholder(title, subtitle) {
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fbfdff"/><stop offset=".5" stop-color="#eaf6fb"/><stop offset="1" stop-color="#f8efe3"/></linearGradient></defs>
      <rect width="1000" height="1000" rx="90" fill="url(#g)"/>
      <circle cx="330" cy="360" r="120" fill="#fff" opacity=".7"/><circle cx="520" cy="330" r="150" fill="#fff" opacity=".55"/><circle cx="690" cy="390" r="110" fill="#fff" opacity=".62"/>
      <path d="M270 650c78-130 150-180 230-180s152 50 230 180" fill="#d8c6b6" opacity=".6"/>
      <text x="500" y="805" text-anchor="middle" font-family="Arial" font-size="46" font-weight="700" fill="#45505f">${title}</text>
      <text x="500" y="862" text-anchor="middle" font-family="Arial" font-size="26" fill="#738093">${subtitle}</text>
    </svg>`);
}

const products = [
  ["KSD-MINI-ALMA", "Mini Alma 3D", 14990, "Figuras Esenciales", ["Figuras Esenciales"], "Desde $14.990", "Figura pequeña personalizada inspirada en tus fotografías. Incluye 1 persona, base simple y acabado sin pintar.", 25, 7, 10],
  ["KSD-MINI-PLACA", "Mini Alma con Placa", 18990, "Figuras Esenciales", ["Figuras Esenciales", "Placas y Extras"], "Entrada", "Figura pequeña sin pintar con base y placa personalizada con nombre, fecha o frase corta.", 35, 7, 20],
  ["KSD-ESENCIAL", "Figura Esencial", 24990, "Figuras Esenciales", ["Figuras Esenciales"], "Simple", "Figura individual en tamaño esencial, sin pintura completa, con base personalizada simple.", 55, 8, 30],
  ["KSD-ESENCIAL-COLOR", "Figura Esencial + Detalles de Color", 29990, "Figuras Esenciales", ["Figuras Esenciales", "Figuras Pintadas a Mano"], "Color básico", "Figura individual con detalles mínimos pintados a mano: cabello, ropa o accesorio simple.", 60, 9, 40],
  ["KSD-ALMA", "Figura con Alma", 39990, "Figuras Pintadas a Mano", ["Figuras Pintadas a Mano"], "Pintada a mano", "Figura individual personalizada, pintada a mano con una mezcla de estilo realista y tierno.", 80, 10, 50],
  ["KSD-ALMA-PLACA", "Figura con Alma + Placa", 44990, "Figuras Pintadas a Mano", ["Figuras Pintadas a Mano", "Placas y Extras"], "Más elegido", "Figura pintada a mano con placa personalizada. Recomendada para nacimiento, cumpleaños o regalo familiar.", 90, 10, 60],
  ["KSD-PREMIUM", "Figura Recuerdo Premium", 54990, "Figuras Pintadas a Mano", ["Figuras Pintadas a Mano"], "Premium suave", "Figura individual con pintura más detallada, base trabajada y placa personalizada.", 110, 12, 70],
  ["KSD-DUO-ALMA", "Escena Dúo con Alma", 69990, "Escenas Familiares", ["Escenas Familiares", "Figuras Pintadas a Mano"], "2 personas", "Escena de 2 personas pintadas a mano, con base y placa personalizada.", 140, 12, 80],
  ["KSD-FAMILIAR-ALMA", "Escena Familiar con Alma", 99990, "Escenas Familiares", ["Escenas Familiares"], "Hasta 3 personas", "Escena familiar personalizada de hasta 3 personas, pintada a mano, con contexto simple y placa.", 220, 12, 90],
  ["KSD-FAMILIAR-PREMIUM", "Escena Familiar Premium", 119990, "Escenas Familiares", ["Escenas Familiares"], "Mayor detalle", "Escena de hasta 3 personas con pintura detallada, contexto más elaborado y placa premium.", 260, 14, 100],
  ["KSD-PACK-ABUELOS", "Pack Abuelos", 69990, "Packs y Regalos", ["Packs y Regalos", "Figuras Esenciales"], "Pack regalo", "Pack pensado para regalar a abuelos: dos copias pequeñas de una figura o recuerdo simple.", 120, 12, 110],
  ["KSD-EXTRA-CAJA", "Caja Regalo Premium", 3990, "Packs y Regalos", ["Packs y Regalos", "Placas y Extras"], "Extra", "Presentación especial para regalo: caja, protección interior y tarjeta breve. No se vende por separado.", 0, 1, 120]
].map(([sku, nombre, precio, categoriaPrincipal, categorias, insignia, descripcion, pesoGramos, diasPreparacion, orden]) => ({
  sku, nombre, precio, categoriaPrincipal, categorias, insignia, descripcion, pesoGramos, diasPreparacion, orden,
  marca: "Rhema Diseños",
  precioOriginal: 0,
  imagenes: [placeholder(nombre, categoriaPrincipal)],
  destacado: ["KSD-MINI-ALMA", "KSD-ALMA", "KSD-ALMA-PLACA", "KSD-DUO-ALMA", "KSD-FAMILIAR-ALMA"].includes(sku),
  personalizable: sku !== "KSD-EXTRA-CAJA",
  publicarCatalogo: true,
  activo: true,
  stock: sku === "KSD-EXTRA-CAJA" ? 100 : 30,
  ajusteImagenTarjeta: "cover",
  ajusteImagenDetalle: "contain",
  personalizacionLigera: sku === "KSD-EXTRA-CAJA" ? null : {
    habilitada: true,
    permitirNombre: true,
    permitirImagen: true,
    permitirObservacion: true,
    maxImages: 2,
    descripcion: "Sube 2 fotos por persona y describe el momento, lugar o acción que quieres recrear.",
    aviso: "La pieza final es una interpretación artística basada en tus referencias, no una réplica exacta."
  },
  caracteristicas: [
    `Categoría: ${categoriaPrincipal}`,
    `Acabado: ${categorias.includes("Figuras Pintadas a Mano") || categoriaPrincipal === "Escenas Familiares" ? "pintado a mano según producto" : "PLA sin pintura completa"}`,
    `Plazo estimado: ${diasPreparacion} a ${diasPreparacion + 3} días hábiles`,
    "Fotos recomendadas: 2 referencias por persona"
  ],
  entrega: {
    envio: { habilitado: true, instrucciones: "Santiago: despacho local coordinado. Regiones: envío por pagar o cotizado antes de fabricar." },
    retiro: { habilitado: true, instrucciones: "Retiro en Santiago previa coordinación." }
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
  console.log(`Seed Rhema Diseños aplicado: ${categories.length} categorías y ${products.length} productos.`);
}

main()
  .catch((error) => {
    console.error("No fue posible aplicar seed Rhema Diseños:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close().catch(() => {});
  });
