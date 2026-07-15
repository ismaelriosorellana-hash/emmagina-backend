"use strict";
const assert=require("assert");
const {normalizeCategoryInput,normalizeCategoryOutput}=require("../utils/categoryNormalizer");
const input=normalizeCategoryInput({nombre:"Fundas",categoriaPadre:"507f1f77bcf86cd799439011"});
assert.equal(input.categoriaPadre,"507f1f77bcf86cd799439011");
const out=normalizeCategoryOutput({_id:"1",nombre:"Fundas",categoriaPadre:{_id:"2",nombre:"Accesorios para celular"}});
assert.equal(out.categoriaPadre,"2"); assert.equal(out.categoriaPadreNombre,"Accesorios para celular");
console.log("categories hierarchy v3.26.0 ok");
