"use strict";

require("dotenv").config();
const Producto = require("../models/Producto");
const Categoria = require("../models/Categoria");
const { connectDatabase } = require("../config/db");

function solidPlaceholder(title, label, bg = "#EAF4F8", accent = "#219EBC") {
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000">
    <rect width="1000" height="1000" fill="${bg}"/>
    <rect x="170" y="170" width="660" height="530" rx="70" fill="#FFFFFF" stroke="${accent}" stroke-width="18"/>
    <circle cx="500" cy="410" r="145" fill="${accent}"/>
    <rect x="335" y="555" width="330" height="45" rx="22" fill="#023047"/>
    <text x="500" y="790" text-anchor="middle" font-family="Arial, sans-serif" font-size="46" font-weight="700" fill="#023047">${title}</text>
    <text x="500" y="850" text-anchor="middle" font-family="Arial, sans-serif" font-size="27" fill="#125373">${label}</text>
  </svg>`);
}

const categories = [
  ["Librería y Escritorio", "Productos útiles para estudio, oficina y organización", 10],
  ["Juguetería y Coleccionables", "Figuras articuladas, sensoriales y coleccionables propios", 20],
  ["Decoración y Hogar", "Objetos decorativos ligeros fabricados en PLA", 30],
  ["Memories", "Retratos, relieves y recuerdos creados desde fotografías", 40],
  ["Alma", "Figuras y escenas personalizadas con carácter y expresión", 50],
  ["Servicio 3D", "Impresiones bajo demanda desde archivos o referencias", 60],
  ["Todos", "Catálogo completo de Rhema Diseños", 100]
].map(([nombre, descripcion, orden]) => ({ nombre, descripcion, orden, activo: true, mostrarMenu: true }));

const products = [
  { sku:"RHE-ESC-001", nombre:"Organizador Modular de Escritorio", precio:8990, categoriaPrincipal:"Librería y Escritorio", categorias:["Librería y Escritorio","Todos"], stock:6, textoDisponibilidad:"6 unidades disponibles", diasPreparacion:2, insignia:"Listo para comprar", destacado:true, descripcionCorta:"Organizador modular para lápices, notas y accesorios pequeños.", descripcion:"Organizador de escritorio impreso en PLA. Se entrega listo para usar y puede combinarse con otros módulos.", color:"#8ECAE6" },
  { sku:"RHE-ESC-002", nombre:"Soporte Compacto para Celular", precio:5990, categoriaPrincipal:"Librería y Escritorio", categorias:["Librería y Escritorio","Todos"], stock:10, textoDisponibilidad:"10 unidades disponibles", diasPreparacion:2, insignia:"Producto de entrada", masVendido:true, descripcionCorta:"Soporte estable para escritorio, estudio o videollamadas.", descripcion:"Soporte liviano fabricado en PLA para teléfonos de tamaño habitual. Ideal como producto de entrada al catálogo.", color:"#219EBC" },
  { sku:"RHE-ESC-003", nombre:"Marcapáginas 3D Pack de 3", precio:4990, categoriaPrincipal:"Librería y Escritorio", categorias:["Librería y Escritorio","Todos"], stock:12, textoDisponibilidad:"12 packs disponibles", diasPreparacion:2, insignia:"Pack", descripcionCorta:"Tres diseños livianos para lectura, regalos y detalles escolares.", descripcion:"Pack de tres marcapáginas impresos en PLA con diseños propios de Rhema Diseños.", color:"#FFB703" },
  { sku:"RHE-JUG-001", nombre:"Animal Articulado Rhema", precio:7990, categoriaPrincipal:"Juguetería y Coleccionables", categorias:["Juguetería y Coleccionables","Todos"], stock:8, textoDisponibilidad:"8 unidades disponibles", diasPreparacion:3, insignia:"Tendencia", lanzamiento:true, descripcionCorta:"Figura articulada de diseño propio para jugar, decorar o coleccionar.", descripcion:"Animal articulado impreso en una sola pieza. Diseño propio, sin uso de personajes protegidos.", color:"#FB8500" },
  { sku:"RHE-JUG-002", nombre:"Fidget Geométrico", precio:5990, categoriaPrincipal:"Juguetería y Coleccionables", categorias:["Juguetería y Coleccionables","Todos"], stock:10, textoDisponibilidad:"10 unidades disponibles", diasPreparacion:2, insignia:"Sensorial", descripcionCorta:"Objeto sensorial compacto con movimiento repetitivo y tacto suave.", descripcion:"Fidget geométrico de PLA pensado para manos inquietas y demostraciones en redes sociales.", color:"#8ECAE6" },
  { sku:"RHE-DEC-001", nombre:"Macetero Geométrico Pequeño", precio:10990, categoriaPrincipal:"Decoración y Hogar", categorias:["Decoración y Hogar","Todos"], stock:4, textoDisponibilidad:"4 unidades disponibles", diasPreparacion:3, insignia:"Decoración", destacado:true, descripcionCorta:"Macetero decorativo para suculentas o plantas artificiales pequeñas.", descripcion:"Macetero liviano de PLA. Se recomienda usar con recipiente interior para controlar humedad y filtraciones.", color:"#125373" },
  { sku:"RHE-DEC-002", nombre:"Lámpara Litofanía Memories", precio:24990, categoriaPrincipal:"Memories", categorias:["Memories","Decoración y Hogar","Todos"], stock:0, fabricadoPedido:true, bajoPedido:true, personalizable:true, textoDisponibilidad:"Fabricado a pedido", diasPreparacion:10, insignia:"Memories", destacado:true, descripcionCorta:"Convierte una fotografía en una imagen visible al encender su luz.", descripcion:"Litofanía personalizada a partir de una fotografía. La imagen debe revisarse antes de confirmar el pedido. Luz o sistema eléctrico se informa según la opción seleccionada.", color:"#FFB703" },
  { sku:"RHE-MEM-002", nombre:"Cuadro Memories en Relieve", precio:29990, categoriaPrincipal:"Memories", categorias:["Memories","Decoración y Hogar","Todos"], stock:0, fabricadoPedido:true, bajoPedido:true, personalizable:true, textoDisponibilidad:"Requiere revisión de fotografía", diasPreparacion:12, insignia:"Recuerdo personalizado", descripcionCorta:"Retrato familiar o de mascota transformado en relieve decorativo.", descripcion:"Cuadro en relieve creado desde una fotografía clara. El precio base considera una composición simple y puede variar según complejidad.", color:"#219EBC" },
  { sku:"RHE-ALM-001", nombre:"Figura Alma Individual", precio:39990, categoriaPrincipal:"Alma", categorias:["Alma","Todos"], stock:0, fabricadoPedido:true, bajoPedido:true, personalizable:true, textoDisponibilidad:"Cotización antes de fabricar", diasPreparacion:14, insignia:"Alma", destacado:true, descripcionCorta:"Figura personalizada de una persona o mascota con estilo amigable.", descripcion:"Figura individual basada en fotografías o referencias. Requiere revisión visual, definición de estilo y aprobación antes de fabricación.", color:"#FB8500" },
  { sku:"RHE-ALM-002", nombre:"Escena Alma Dúo", precio:69990, categoriaPrincipal:"Alma", categorias:["Alma","Todos"], stock:0, fabricadoPedido:true, bajoPedido:true, personalizable:true, textoDisponibilidad:"Cotización personalizada", diasPreparacion:18, insignia:"2 personas", descripcionCorta:"Escena personalizada de dos personas, mascotas o una combinación.", descripcion:"Escena Alma para dos protagonistas. El precio publicado es referencial y se confirma tras revisar vestuario, pose, base y accesorios.", color:"#125373" },
  { sku:"RHE-SER-001", nombre:"Impresión desde Archivo 3D", precio:5990, categoriaPrincipal:"Servicio 3D", categorias:["Servicio 3D","Todos"], stock:0, fabricadoPedido:true, bajoPedido:true, personalizable:true, publicarCatalogo:true, textoDisponibilidad:"Desde $5.990 · requiere cotización", diasPreparacion:7, insignia:"Servicio 3D", descripcionCorta:"Envía tu STL, 3MF u OBJ para revisar material, tamaño y tiempo.", descripcion:"Servicio de impresión en PLA bajo demanda. El valor base corresponde al pedido mínimo y no constituye una cotización automática.", color:"#023047" },
  { sku:"RHE-SER-002", nombre:"Pieza desde Foto o Referencia", precio:9990, categoriaPrincipal:"Servicio 3D", categorias:["Servicio 3D","Todos"], stock:0, fabricadoPedido:true, bajoPedido:true, personalizable:true, textoDisponibilidad:"Evaluación técnica obligatoria", diasPreparacion:10, insignia:"Sin archivo 3D", descripcionCorta:"Revisamos si una pieza simple puede modelarse desde fotos y medidas.", descripcion:"Servicio para ideas o repuestos no críticos sin archivo 3D. El modelado, las pruebas y la impresión se cotizan por separado cuando corresponda.", color:"#8ECAE6" }
].map((p, i) => ({
  ...p,
  marca:"Rhema Diseños",
  slug:p.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""),
  imagenPrincipal:solidPlaceholder(p.nombre, p.textoDisponibilidad, "#EAF4F8", p.color),
  imagenes:[solidPlaceholder(p.nombre, p.textoDisponibilidad, "#EAF4F8", p.color)],
  precioOriginal:0,
  publicarCatalogo:true,
  activo:true,
  orden:(i+1)*10,
  stock:p.stock || 0,
  ventas:0,
  movimiento:0,
  personalizable:Boolean(p.personalizable),
  fabricadoPedido:Boolean(p.fabricadoPedido),
  bajoPedido:Boolean(p.bajoPedido),
  caracteristicas:[
    { etiqueta:"Material", valor:"PLA" },
    { etiqueta:"Fabricación", valor:p.fabricadoPedido ? "A pedido" : "Stock inicial" },
    { etiqueta:"Preparación", valor:`${p.diasPreparacion} días hábiles referenciales` }
  ]
}));

async function run() {
  await connectDatabase();
  for (const category of categories) {
    await Categoria.findOneAndUpdate({ nombre: category.nombre }, { $set: category }, { upsert:true, new:true, setDefaultsOnInsert:true });
  }
  for (const product of products) {
    await Producto.findOneAndUpdate({ sku: product.sku }, { $set: product }, { upsert:true, new:true, setDefaultsOnInsert:true });
  }
  console.log(`Catálogo Rhema: ${products.length} productos y ${categories.length} categorías actualizados.`);
  process.exit(0);
}

run().catch((error) => { console.error(error); process.exit(1); });
