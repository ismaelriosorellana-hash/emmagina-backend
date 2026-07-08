"use strict";

const mongoose =
    require("mongoose");

const bcrypt =
    require("bcryptjs");

const userSchema =
    new mongoose.Schema(
        {
            nombre: {
                type: String,
                required: true,
                trim: true,
                maxlength: 120
            },
            email: {
                type: String,
                required: true,
                unique: true,
                lowercase: true,
                trim: true,
                index: true,
                maxlength: 254
            },
            passwordHash: {
                type: String,
                required: true,
                select: false
            },
            rol: {
                type: String,
                enum: [
                    "administrador",
                    "gestor",
                    "cliente"
                ],
                default: "cliente"
            },
            telefono: {
                type: String,
                default: "",
                trim: true,
                maxlength: 40
            },
            rut: {
                type: String,
                default: "",
                trim: true,
                maxlength: 30
            },
            direccion: {
                type: String,
                default: "",
                trim: true,
                maxlength: 300
            },
            comuna: {
                type: String,
                default: "",
                trim: true,
                maxlength: 120
            },
            activo: {
                type: Boolean,
                default: true
            },
            sessionVersion: {
                type: Number,
                default: 0,
                min: 0
            },
            passwordChangedAt: {
                type: Date,
                default: null
            },
            ultimoAcceso: {
                type: Date,
                default: null
            }
        },
        {
            timestamps: true,
            collection: "usuarios"
        }
    );

userSchema.methods.compararPassword =
    function compararPassword(
        password
    ) {
        return bcrypt.compare(
            password,
            this.passwordHash
        );
    };

module.exports =
    mongoose.models.Usuario ||
    mongoose.model(
        "Usuario",
        userSchema
    );
