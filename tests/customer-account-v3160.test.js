"use strict";

const fs = require("fs");
const path = require("path");

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, "..", relativePath), "utf8");
}

const orderRoutes = read("routes/pedidos.js");
const accountRoutes = read("routes/account.js");
const authRoutes = read("routes/auth.js");

if (!orderRoutes.includes("optionalAuth")) {
  throw new Error("Los pedidos deben aceptar autenticación opcional para vincular la cuenta del cliente.");
}

for (const route of ["/perfil", "/pedidos"]) {
  if (!accountRoutes.includes(route)) throw new Error(`Falta la ruta de cuenta ${route}`);
}

for (const route of ["/registro", "/login", "/me"]) {
  if (!authRoutes.includes(route)) throw new Error(`Falta la ruta de autenticación ${route}`);
}

console.log("Cuenta cliente v3.16.0 verificada.");
