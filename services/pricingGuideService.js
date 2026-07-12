"use strict";

const GUIDE = Object.freeze({
  currency: "CLP",
  city: "Santiago",
  minimumCustomOrder: 5990,
  freeShippingFrom: 25000,
  localShipping: 4000,
  productionTimes: {
    catalog: "2 a 5 días hábiles",
    custom: "5 a 10 días hábiles",
    memories: "7 a 12 días hábiles",
    alma: "10 a 18 días hábiles"
  },
  factors: [
    "Cantidad de material y tamaño final",
    "Horas de impresión y ocupación de máquina",
    "Preparación, soportes, montaje y terminaciones",
    "Corrección, adaptación o creación del modelo",
    "Cantidad de unidades y urgencia solicitada"
  ],
  coverage: [
    { zone: "Santiago urbano", method: "Despacho coordinado", price: 4000 },
    { zone: "Comunas periféricas", method: "Cotización según dirección", price: null },
    { zone: "Retiro coordinado", method: "Punto y horario confirmados al finalizar", price: 0 }
  ],
  notice: "Los valores son referenciales. La cotización final se confirma después de revisar el archivo, fotografía, medidas y uso solicitado."
});

function getPricingGuide() {
  return JSON.parse(JSON.stringify(GUIDE));
}

module.exports = { getPricingGuide };
