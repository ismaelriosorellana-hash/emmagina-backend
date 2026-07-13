"use strict";

const ExcelJS = require("exceljs");
const Producto = require("../models/Producto");
const { normalizeProductInput, normalizeProductOutput, normalizeSku } = require("../utils/productNormalizer");
const { resolveUniqueProductSlug } = require("./productSlugService");
const { assignProductSkus } = require("./productSkuService");

const PRODUCT_SHEET = "Productos";
const VARIANT_SHEET = "Variantes";

const PRODUCT_HEADERS = [
  "Accion","SKU","Nombre","Slug","Marca","CodigoBarras","Precio","PrecioOriginal","Stock",
  "CategoriaPrincipal","Categorias","DescripcionCorta","Descripcion","ImagenPrincipal","Imagenes",
  "Insignia","TextoDisponibilidad","Destacado","HabilitarEscenaPersonalizada","Personalizable","FabricadoPedido","BajoPedido",
  "PublicarCatalogo","Activo","Orden","DiasPreparacion","PesoGramos","LargoCm","AnchoCm","AltoCm",
  "Caracteristicas","Beneficios","Cuidados","PreguntasFrecuentes","MensajeCompra","Garantia",
  "SEO_Titulo","SEO_Descripcion","SEO_PalabrasClave","SEO_NoIndex","EnvioHabilitado","EnvioInstrucciones",
  "RetiroHabilitado","RetiroInstrucciones","AjusteImagenTarjeta","AjusteImagenDetalle","PosicionImagen"
];

const VARIANT_HEADERS = [
  "ProductoSKU","SKU","Key","Nombre","Tipo","Opciones","CodigoHex","Stock","StockReservado","StockMinimo",
  "Precio","PrecioOriginal","Activo","EstadoComercial","ImagenPrincipal","Imagenes","DiasPreparacion","PesoGramos",
  "LargoCm","AnchoCm","AltoCm"
];

function text(value) { return String(value ?? "").trim(); }
function number(value, fallback = 0) {
  if (value === "" || value === null || value === undefined) return fallback;
  const normalized = typeof value === "string" ? value.replace(/[$.\s]/g, "").replace(",", ".") : value;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}
function bool(value, fallback = false) {
  if (typeof value === "boolean") return value;
  const normalized = text(value).toLowerCase();
  if (["si","sí","true","1","x","activo","habilitado"].includes(normalized)) return true;
  if (["no","false","0","inactivo","deshabilitado"].includes(normalized)) return false;
  return fallback;
}
function list(value) { return text(value).split(/[|;,\n]+/).map((item) => item.trim()).filter(Boolean); }
function imageList(value) { return list(value).map((url, index) => ({ url, principal: index === 0, orden: index + 1 })); }
function keyValueList(value) {
  return text(value).split(/\n|\|/).map((line) => {
    const [title, ...rest] = line.split("::");
    const val = rest.join("::").trim();
    return title?.trim() && val ? { titulo: title.trim(), etiqueta: title.trim(), valor: val } : null;
  }).filter(Boolean);
}
function faqList(value) {
  return text(value).split(/\n|\|/).map((line) => {
    const [question, ...rest] = line.split("::");
    const answer = rest.join("::").trim();
    return question?.trim() && answer ? { pregunta: question.trim(), respuesta: answer } : null;
  }).filter(Boolean);
}
function optionsObject(value) {
  const result = {};
  for (const part of text(value).split(/\n|\|/)) {
    const [key, ...rest] = part.split("::");
    const val = rest.join("::").trim();
    if (key?.trim() && val) result[key.trim()] = val;
  }
  return result;
}

function rowToProduct(row) {
  const primaryImage = text(row.ImagenPrincipal);
  const images = imageList(row.Imagenes);
  if (primaryImage && !images.some((item) => item.url === primaryImage)) images.unshift({ url: primaryImage, principal: true, orden: 0 });
  const badge = text(row.Insignia);
  return {
    nombre: text(row.Nombre), slug: text(row.Slug), sku: normalizeSku(row.SKU), marca: text(row.Marca) || "Rhema Diseños",
    codigoBarras: text(row.CodigoBarras), precio: Math.max(0, Math.round(number(row.Precio))),
    precioOriginal: Math.max(0, Math.round(number(row.PrecioOriginal))), stock: Math.max(0, Math.round(number(row.Stock))),
    categoriaPrincipal: text(row.CategoriaPrincipal), categorias: list(row.Categorias), descripcionCorta: text(row.DescripcionCorta),
    descripcion: text(row.Descripcion), imagenPrincipal: primaryImage || images[0]?.url || "", imagenes: images,
    insignia: badge, badges: badge ? [{ tipo: "insignia", activo: true, texto: badge, color: "#219EBC", textoColor: "#ffffff", orden: 1 }] : [],
    textoDisponibilidad: text(row.TextoDisponibilidad), destacado: bool(row.Destacado), habilitarEscenaPersonalizada: bool(row.HabilitarEscenaPersonalizada), personalizable: bool(row.Personalizable),
    fabricadoPedido: bool(row.FabricadoPedido), bajoPedido: bool(row.BajoPedido), publicarCatalogo: bool(row.PublicarCatalogo, true),
    activo: bool(row.Activo, true), orden: Math.round(number(row.Orden)), diasPreparacion: Math.max(1, Math.round(number(row.DiasPreparacion, 3))),
    pesoGramos: Math.max(0, Math.round(number(row.PesoGramos))), dimensiones: { largoCm: number(row.LargoCm), anchoCm: number(row.AnchoCm), altoCm: number(row.AltoCm) },
    caracteristicas: keyValueList(row.Caracteristicas), contenidoPDP: {
      beneficios: list(row.Beneficios), cuidados: list(row.Cuidados), preguntasFrecuentes: faqList(row.PreguntasFrecuentes),
      mensajeCompra: text(row.MensajeCompra), garantia: text(row.Garantia)
    },
    seo: { titulo: text(row.SEO_Titulo), descripcion: text(row.SEO_Descripcion), palabrasClave: list(row.SEO_PalabrasClave), noIndex: bool(row.SEO_NoIndex) },
    entrega: {
      envio: { habilitado: bool(row.EnvioHabilitado, true), instrucciones: text(row.EnvioInstrucciones) },
      retiro: { habilitado: bool(row.RetiroHabilitado, true), instrucciones: text(row.RetiroInstrucciones) }
    },
    ajusteImagenTarjeta: ["cover","contain"].includes(text(row.AjusteImagenTarjeta)) ? text(row.AjusteImagenTarjeta) : "cover",
    ajusteImagenDetalle: ["cover","contain"].includes(text(row.AjusteImagenDetalle)) ? text(row.AjusteImagenDetalle) : "contain",
    posicionImagen: text(row.PosicionImagen) || "center"
  };
}

function rowToVariant(row) {
  const primaryImage = text(row.ImagenPrincipal);
  const images = imageList(row.Imagenes);
  return {
    key: text(row.Key), sku: normalizeSku(row.SKU), nombre: text(row.Nombre), tipo: text(row.Tipo) || "opcion",
    opciones: optionsObject(row.Opciones), codigoHex: text(row.CodigoHex), stock: Math.max(0, Math.round(number(row.Stock))),
    stockReservado: Math.max(0, Math.round(number(row.StockReservado))), stockMinimo: Math.max(0, Math.round(number(row.StockMinimo, 5))),
    precio: row.Precio === "" || row.Precio == null ? null : Math.max(0, Math.round(number(row.Precio))),
    precioOriginal: row.PrecioOriginal === "" || row.PrecioOriginal == null ? null : Math.max(0, Math.round(number(row.PrecioOriginal))),
    activo: bool(row.Activo, true), estadoComercial: text(row.EstadoComercial), imagenPrincipal: primaryImage,
    imagenes: images, diasPreparacion: Math.max(1, Math.round(number(row.DiasPreparacion, 3))), pesoGramos: Math.max(0, Math.round(number(row.PesoGramos))),
    dimensiones: { largoCm: number(row.LargoCm), anchoCm: number(row.AnchoCm), altoCm: number(row.AltoCm) }
  };
}

function cellText(cell) {
  const value = cell?.value;
  if (value == null) return "";
  if (typeof value === "object") {
    if (value.text != null) return String(value.text);
    if (value.result != null) return String(value.result);
    if (Array.isArray(value.richText)) return value.richText.map((item) => item.text || "").join("");
  }
  return String(value);
}

function worksheetRows(worksheet) {
  if (!worksheet) return [];
  const headers = [];
  worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber] = cellText(cell).trim();
  });
  const rows = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const item = {};
    let hasValue = false;
    headers.forEach((header, colNumber) => {
      if (!header) return;
      const value = cellText(row.getCell(colNumber));
      item[header] = value;
      if (value !== "") hasValue = true;
    });
    if (hasValue) rows.push(item);
  });
  return rows;
}

async function parseWorkbook(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const productsSheet = workbook.getWorksheet(PRODUCT_SHEET) || workbook.worksheets[0];
  if (!productsSheet) throw new Error("La plantilla no contiene la hoja Productos.");
  return {
    rows: worksheetRows(productsSheet),
    variantRows: worksheetRows(workbook.getWorksheet(VARIANT_SHEET))
  };
}

function validateRows(rows, variantRows) {
  const errors = [];
  const seen = new Set();
  const variantsByProduct = new Map();
  variantRows.forEach((row, index) => {
    const productSku = normalizeSku(row.ProductoSKU);
    if (!productSku) errors.push({ hoja: VARIANT_SHEET, fila: index + 2, campo: "ProductoSKU", mensaje: "ProductoSKU es obligatorio." });
    const variant = rowToVariant(row);
    if (!variant.nombre) errors.push({ hoja: VARIANT_SHEET, fila: index + 2, campo: "Nombre", mensaje: "El nombre de variante es obligatorio." });
    if (productSku) {
      const list = variantsByProduct.get(productSku) || [];
      list.push(variant); variantsByProduct.set(productSku, list);
    }
  });
  const parsed = rows.map((row, index) => {
    const action = text(row.Accion).toLowerCase() || "actualizar";
    const product = rowToProduct(row);
    if (!product.sku) errors.push({ hoja: PRODUCT_SHEET, fila: index + 2, campo: "SKU", mensaje: "SKU es obligatorio para actualización masiva." });
    if (!product.nombre && action !== "desactivar") errors.push({ hoja: PRODUCT_SHEET, fila: index + 2, campo: "Nombre", mensaje: "Nombre es obligatorio." });
    if (product.precio < 0) errors.push({ hoja: PRODUCT_SHEET, fila: index + 2, campo: "Precio", mensaje: "Precio no puede ser negativo." });
    if (!["crear","actualizar","upsert","desactivar","ignorar"].includes(action)) errors.push({ hoja: PRODUCT_SHEET, fila: index + 2, campo: "Accion", mensaje: "Usa crear, actualizar, upsert, desactivar o ignorar." });
    if (product.sku && seen.has(product.sku)) errors.push({ hoja: PRODUCT_SHEET, fila: index + 2, campo: "SKU", mensaje: "SKU repetido dentro del archivo." });
    seen.add(product.sku);
    product.variantes = variantsByProduct.get(product.sku) || [];
    return { fila: index + 2, action, product };
  });
  return { parsed, errors };
}

async function previewImport(buffer) {
  const { rows, variantRows } = await parseWorkbook(buffer);
  const { parsed, errors } = validateRows(rows, variantRows);
  const skus = parsed.map((item) => item.product.sku).filter(Boolean);
  const existing = await Producto.find({ sku: { $in: skus } }).select("sku nombre").lean();
  const existingMap = new Map(existing.map((item) => [item.sku, item]));
  const preview = parsed.map((item) => ({
    fila: item.fila, sku: item.product.sku, nombre: item.product.nombre || existingMap.get(item.product.sku)?.nombre || "",
    accion: item.action, existe: existingMap.has(item.product.sku), variantes: item.product.variantes.length,
    resultado: item.action === "ignorar" ? "Sin cambios" : item.action === "desactivar" ? "Desactivar" : existingMap.has(item.product.sku) ? "Actualizar" : "Crear"
  }));
  return { parsed, errors, preview, resumen: {
    filas: parsed.length, crear: preview.filter((x) => x.resultado === "Crear").length,
    actualizar: preview.filter((x) => x.resultado === "Actualizar").length,
    desactivar: preview.filter((x) => x.resultado === "Desactivar").length,
    ignorar: preview.filter((x) => x.resultado === "Sin cambios").length,
    errores: errors.length
  }};
}

async function applyImport(buffer) {
  const result = await previewImport(buffer);
  if (result.errors.length) return result;
  const applied = [];
  for (const item of result.parsed) {
    if (item.action === "ignorar") continue;
    const existing = await Producto.findOne({ sku: item.product.sku });
    if (item.action === "desactivar") {
      if (existing) { existing.activo = false; existing.publicarCatalogo = false; await existing.save(); applied.push({ sku: item.product.sku, accion: "desactivado" }); }
      continue;
    }
    if (item.action === "crear" && existing) throw new Error(`El SKU ${item.product.sku} ya existe y la acción es crear.`);
    if (item.action === "actualizar" && !existing) throw new Error(`El SKU ${item.product.sku} no existe y la acción es actualizar.`);
    const data = normalizeProductInput(item.product);
    if (existing) {
      data.slug = await resolveUniqueProductSlug(Producto, { name: data.nombre || existing.nombre, requestedSlug: data.slug || existing.slug, excludeId: existing._id });
      await assignProductSkus(Producto, data, { excludeId: existing._id, existingSku: existing.sku });
      await Producto.findByIdAndUpdate(existing._id, { $set: data }, { runValidators: true });
      applied.push({ sku: data.sku, accion: "actualizado" });
    } else {
      data.slug = await resolveUniqueProductSlug(Producto, { name: data.nombre, requestedSlug: data.slug });
      await assignProductSkus(Producto, data);
      await Producto.create(data);
      applied.push({ sku: data.sku, accion: "creado" });
    }
  }
  return { ...result, applied };
}

function productToRow(product) {
  const p = normalizeProductOutput(product);
  const imgs = (p.imagenes || []).map((item) => typeof item === "string" ? item : item.url).filter(Boolean);
  return {
    Accion: "actualizar", SKU: p.sku || "", Nombre: p.nombre || "", Slug: p.slug || "", Marca: p.marca || "Rhema Diseños",
    CodigoBarras: p.codigoBarras || "", Precio: p.precio || 0, PrecioOriginal: p.precioOriginal || 0, Stock: p.stock || 0,
    CategoriaPrincipal: p.categoriaPrincipal || "", Categorias: Array.isArray(p.categorias) ? p.categorias.join(" | ") : p.categorias || "",
    DescripcionCorta: p.descripcionCorta || "", Descripcion: p.descripcion || "", ImagenPrincipal: p.imagenPrincipal || imgs[0] || "", Imagenes: imgs.join(" | "),
    Insignia: p.insignia || "", TextoDisponibilidad: p.textoDisponibilidad || "", Destacado: p.destacado ? "Sí" : "No", HabilitarEscenaPersonalizada: p.habilitarEscenaPersonalizada ? "Sí" : "No", Personalizable: p.personalizable ? "Sí" : "No",
    FabricadoPedido: p.fabricadoPedido ? "Sí" : "No", BajoPedido: p.bajoPedido ? "Sí" : "No", PublicarCatalogo: p.publicarCatalogo !== false ? "Sí" : "No", Activo: p.activo !== false ? "Sí" : "No",
    Orden: p.orden || 0, DiasPreparacion: p.diasPreparacion || 3, PesoGramos: p.pesoGramos || 0, LargoCm: p.dimensiones?.largoCm || 0, AnchoCm: p.dimensiones?.anchoCm || 0, AltoCm: p.dimensiones?.altoCm || 0,
    Caracteristicas: (p.caracteristicas || []).map((i) => `${i.titulo || i.etiqueta || "Detalle"}::${i.valor || ""}`).join(" | "),
    Beneficios: (p.contenidoPDP?.beneficios || []).join(" | "), Cuidados: (p.contenidoPDP?.cuidados || []).join(" | "),
    PreguntasFrecuentes: (p.contenidoPDP?.preguntasFrecuentes || []).map((i) => `${i.pregunta}::${i.respuesta}`).join(" | "),
    MensajeCompra: p.contenidoPDP?.mensajeCompra || "", Garantia: p.contenidoPDP?.garantia || "", SEO_Titulo: p.seo?.titulo || "", SEO_Descripcion: p.seo?.descripcion || "",
    SEO_PalabrasClave: (p.seo?.palabrasClave || []).join(" | "), SEO_NoIndex: p.seo?.noIndex ? "Sí" : "No", EnvioHabilitado: p.entrega?.envio?.habilitado !== false ? "Sí" : "No",
    EnvioInstrucciones: p.entrega?.envio?.instrucciones || "", RetiroHabilitado: p.entrega?.retiro?.habilitado !== false ? "Sí" : "No", RetiroInstrucciones: p.entrega?.retiro?.instrucciones || "",
    AjusteImagenTarjeta: p.ajusteImagenTarjeta || "cover", AjusteImagenDetalle: p.ajusteImagenDetalle || "contain", PosicionImagen: p.posicionImagen || "center"
  };
}

function variantToRow(productSku, variant) {
  return {
    ProductoSKU: productSku, SKU: variant.sku || "", Key: variant.key || "", Nombre: variant.nombre || "", Tipo: variant.tipo || "opcion",
    Opciones: Object.entries(variant.opciones || {}).map(([k,v]) => `${k}::${v}`).join(" | "), CodigoHex: variant.codigoHex || "", Stock: variant.stock || 0,
    StockReservado: variant.stockReservado || 0, StockMinimo: variant.stockMinimo || 5, Precio: variant.precio ?? "", PrecioOriginal: variant.precioOriginal ?? "", Activo: variant.activo !== false ? "Sí" : "No",
    EstadoComercial: variant.estadoComercial || "", ImagenPrincipal: variant.imagenPrincipal || "", Imagenes: (variant.imagenes || []).map((i) => typeof i === "string" ? i : i.url).filter(Boolean).join(" | "),
    DiasPreparacion: variant.diasPreparacion || 3, PesoGramos: variant.pesoGramos || 0, LargoCm: variant.dimensiones?.largoCm || 0, AnchoCm: variant.dimensiones?.anchoCm || 0, AltoCm: variant.dimensiones?.altoCm || 0
  };
}

async function buildTemplateBuffer(includeCurrent = true) {
  const products = includeCurrent ? await Producto.find({}).sort({ orden: 1, nombre: 1 }).lean() : [];
  const productRows = products.length ? products.map(productToRow) : [Object.fromEntries(PRODUCT_HEADERS.map((header) => [header, ""]))];
  const variantRows = products.flatMap((p) => (p.variantes || []).map((v) => variantToRow(p.sku, v)));
  if (!variantRows.length) variantRows.push(Object.fromEntries(VARIANT_HEADERS.map((header) => [header, ""])));

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Rhema Diseños";
  workbook.created = new Date();

  const productsSheet = workbook.addWorksheet(PRODUCT_SHEET, { views: [{ state: "frozen", ySplit: 1, xSplit: 3 }] });
  productsSheet.columns = PRODUCT_HEADERS.map((header) => ({ header, key: header, width: Math.min(42, Math.max(12, header.length + 2)) }));
  productsSheet.addRows(productRows);
  productsSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  productsSheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF023047" } };
  productsSheet.getRow(1).alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  productsSheet.autoFilter = { from: "A1", to: `${productsSheet.getColumn(PRODUCT_HEADERS.length).letter}${productsSheet.rowCount}` };

  const variantsSheet = workbook.addWorksheet(VARIANT_SHEET, { views: [{ state: "frozen", ySplit: 1 }] });
  variantsSheet.columns = VARIANT_HEADERS.map((header) => ({ header, key: header, width: Math.min(38, Math.max(12, header.length + 2)) }));
  variantsSheet.addRows(variantRows);
  variantsSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  variantsSheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF125373" } };

  const instructions = workbook.addWorksheet("Instrucciones");
  const rows = [
    ["Plantilla masiva Rhema Diseños", ""],
    ["Regla", "Detalle"],
    ["SKU", "Obligatorio y único. Es la llave para actualizar productos."],
    ["Accion", "crear, actualizar, upsert, desactivar o ignorar."],
    ["Listas", "Separar valores con |. Ejemplo: Regalos | Decoración | Todos"],
    ["Características", "Título::Valor | Título::Valor"],
    ["FAQ", "Pregunta::Respuesta | Pregunta::Respuesta"],
    ["Variantes", "Usar la hoja Variantes y relacionar con ProductoSKU."],
    ["Seguridad", "Primero usa Vista previa. Aplica cambios solo cuando no existan errores."],
    ["Imágenes", "Usar URLs públicas de Cloudinary; no incrustar archivos dentro del Excel."]
  ];
  instructions.addRows(rows);
  instructions.mergeCells("A1:B1");
  instructions.getCell("A1").font = { bold: true, color: { argb: "FFFFFFFF" }, size: 16 };
  instructions.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF023047" } };
  instructions.getColumn(1).width = 24;
  instructions.getColumn(2).width = 90;
  instructions.eachRow((row) => { row.alignment = { vertical: "top", wrapText: true }; });

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

module.exports = { PRODUCT_HEADERS, VARIANT_HEADERS, previewImport, applyImport, buildTemplateBuffer };
