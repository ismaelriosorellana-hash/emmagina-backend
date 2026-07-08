"use strict";

const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Usuario = require("../models/Usuario");

const {
    jwtIssuer,
    jwtAudience,
    jwtExpiresIn
} = require("../config/security");

const {
    cleanText,
    cleanEmail,
    cleanPhone,
    cleanRut,
    cleanPassword,
    cleanRoleArea
} = require("../utils/validation");

const {
    securityEvent,
    hashValue
} = require("../utils/securityLogger");

const DUMMY_HASH =
    bcrypt.hashSync(
        "emmagina-dummy-password",
        12
    );

function publicUser(user) {
    return {
        id: String(user._id),
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        telefono: user.telefono || "",
        rut: user.rut || "",
        direccion: user.direccion || "",
        comuna: user.comuna || ""
    };
}

function createToken(user) {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error(
            "Falta JWT_SECRET en el servidor."
        );
    }

    return jwt.sign(
        {
            sub: String(user._id),
            rol: user.rol,
            sv: Number(
                user.sessionVersion || 0
            ),
            typ: "access"
        },
        secret,
        {
            algorithm: "HS256",
            issuer: jwtIssuer(),
            audience: jwtAudience(),
            expiresIn: jwtExpiresIn(),
            jwtid: crypto.randomUUID()
        }
    );
}

function loginRejected(res) {
    return res.status(401).json({
        error:
            "No fue posible iniciar sesión con los datos ingresados."
    });
}

async function register(req, res, next) {
    try {
        const nombre = cleanText(
            req.body.nombre,
            {
                field: "El nombre",
                maxLength: 120,
                required: true
            }
        );

        const email = cleanEmail(
            req.body.email,
            {
                required: true
            }
        );

        const password =
            cleanPassword(
                req.body.password
            );

        const telefono =
            cleanPhone(
                req.body.telefono
            );

        const rut =
            cleanRut(
                req.body.rut
            );

        const direccion =
            cleanText(
                req.body.direccion,
                {
                    field: "La dirección",
                    maxLength: 300
                }
            );

        const comuna =
            cleanText(
                req.body.comuna,
                {
                    field: "La comuna",
                    maxLength: 120
                }
            );

        const existing =
            await Usuario.exists({
                email
            });

        if (existing) {
            securityEvent(
                req,
                "registration_rejected",
                {
                    accountHash:
                        hashValue(email)
                }
            );

            return res.status(400).json({
                error:
                    "No fue posible crear la cuenta con los datos ingresados."
            });
        }

        const user =
            await Usuario.create({
                nombre,
                email,
                passwordHash:
                    await bcrypt.hash(
                        password,
                        12
                    ),
                rol: "cliente",
                telefono,
                rut,
                direccion,
                comuna,
                ultimoAcceso:
                    new Date(),
                passwordChangedAt:
                    new Date()
            });

        securityEvent(
            req,
            "registration_success",
            {
                accountHash:
                    hashValue(email)
            }
        );

        res.status(201).json({
            mensaje:
                "Cuenta creada correctamente.",
            token:
                createToken(user),
            usuario:
                publicUser(user)
        });
    } catch (error) {
        if (error.code === 11000) {
            securityEvent(
                req,
                "registration_rejected",
                {
                    reason: "duplicate"
                }
            );

            return res.status(400).json({
                error:
                    "No fue posible crear la cuenta con los datos ingresados."
            });
        }

        next(error);
    }
}

async function login(req, res, next) {
    try {
        const email =
            cleanEmail(
                req.body.email,
                {
                    required: true
                }
            );

        const password =
            String(
                req.body.password || ""
            );

        const area =
            cleanRoleArea(
                req.body.area
            );

        if (
            !password ||
            password.length > 128
        ) {
            securityEvent(
                req,
                "login_rejected",
                {
                    accountHash:
                        hashValue(email),
                    reason:
                        "invalid_credentials"
                }
            );

            return loginRejected(res);
        }

        const user =
            await Usuario.findOne({
                email
            }).select(
                "+passwordHash"
            );

        const passwordHash =
            user?.passwordHash ||
            DUMMY_HASH;

        const matches =
            await bcrypt.compare(
                password,
                passwordHash
            );

        const validRole =
            area === "admin"
                ? [
                    "administrador",
                    "gestor"
                ].includes(user?.rol)
                : user?.rol ===
                    "cliente";

        if (
            !user ||
            !user.activo ||
            !matches ||
            !validRole
        ) {
            securityEvent(
                req,
                "login_rejected",
                {
                    accountHash:
                        hashValue(email),
                    area,
                    reason:
                        "invalid_credentials"
                }
            );

            return loginRejected(res);
        }

        user.ultimoAcceso =
            new Date();

        await user.save();

        securityEvent(
            req,
            "login_success",
            {
                accountHash:
                    hashValue(email),
                area,
                role: user.rol
            }
        );

        res.json({
            token:
                createToken(user),
            usuario:
                publicUser(user)
        });
    } catch (error) {
        next(error);
    }
}

function me(req, res) {
    res.json({
        usuario:
            publicUser(req.user)
    });
}

async function changePassword(
    req,
    res,
    next
) {
    try {
        const currentPassword =
            String(
                req.body.passwordActual ||
                ""
            );

        const newPassword =
            cleanPassword(
                req.body.passwordNueva,
                {
                    field:
                        "La nueva contraseña"
                }
            );

        if (
            !currentPassword ||
            currentPassword.length > 128
        ) {
            return res.status(400).json({
                error:
                    "No fue posible cambiar la contraseña con los datos ingresados."
            });
        }

        const user =
            await Usuario.findById(
                req.user._id
            ).select(
                "+passwordHash"
            );

        if (
            !user ||
            !user.activo ||
            !(
                await user.compararPassword(
                    currentPassword
                )
            )
        ) {
            securityEvent(
                req,
                "password_change_rejected",
                {
                    reason:
                        "current_password"
                }
            );

            return res.status(400).json({
                error:
                    "No fue posible cambiar la contraseña con los datos ingresados."
            });
        }

        if (
            await user.compararPassword(
                newPassword
            )
        ) {
            return res.status(400).json({
                error:
                    "La nueva contraseña debe ser diferente de la actual."
            });
        }

        user.passwordHash =
            await bcrypt.hash(
                newPassword,
                12
            );

        user.sessionVersion =
            Number(
                user.sessionVersion || 0
            ) + 1;

        user.passwordChangedAt =
            new Date();

        await user.save();

        securityEvent(
            req,
            "password_changed"
        );

        res.json({
            mensaje:
                "Contraseña actualizada. Las demás sesiones fueron cerradas.",
            token:
                createToken(user),
            usuario:
                publicUser(user)
        });
    } catch (error) {
        next(error);
    }
}

async function revokeSessions(
    req,
    res,
    next
) {
    try {
        const user =
            await Usuario.findById(
                req.user._id
            );

        if (
            !user ||
            !user.activo
        ) {
            return res.status(401).json({
                error:
                    "La sesión ya no es válida."
            });
        }

        user.sessionVersion =
            Number(
                user.sessionVersion || 0
            ) + 1;

        await user.save();

        securityEvent(
            req,
            "sessions_revoked"
        );

        res.json({
            mensaje:
                "Todas las sesiones fueron cerradas."
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    register,
    login,
    me,
    changePassword,
    revokeSessions,
    publicUser,
    createToken
};
