"use strict";
const fs = require("fs");
const path = require("path");
const source = fs.readFileSync(path.join(__dirname, "..", "models", "Producto.js"), "utf8");
const matches = source.match(/imagenPrincipal:\s*\{[\s\S]*?maxlength:\s*10000/g) || [];
if (matches.length < 2) throw new Error("imagenPrincipal debe aceptar data URI extensos en producto y variantes.");
console.log("OK product image length v3.16.2");
