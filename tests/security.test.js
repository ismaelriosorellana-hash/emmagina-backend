"use strict";

const test =
    require("node:test");

const assert =
    require("node:assert/strict");

const {
    cleanEmail,
    cleanPhone,
    cleanRut,
    cleanPassword,
    cleanText
} = require(
    "../utils/validation"
);

const {
    inspectPayload
} = require(
    "../middleware/requestSecurity"
);

const {
    validSignature
} = require(
    "../middleware/imageSignature"
);

const {
    normalizeOrigin
} = require(
    "../config/cors"
);

const {
    validateSecurityConfig
} = require(
    "../config/security"
);

test(
    "normaliza datos válidos",
    () => {
        assert.equal(
            cleanEmail(
                "  Cliente@Ejemplo.CL ",
                {
                    required: true
                }
            ),
            "cliente@ejemplo.cl"
        );

        assert.equal(
            cleanPhone(
                "+56 9 1234 5678",
                {
                    required: true
                }
            ),
            "+56 9 1234 5678"
        );

        assert.equal(
            cleanRut(
                "12.345.678-5"
            ),
            "12.345.678-5"
        );

        assert.equal(
            cleanText(
                "  Ana   Pérez  ",
                {
                    required: true
                }
            ),
            "Ana Pérez"
        );
    }
);

test(
    "rechaza contraseñas débiles o excesivas",
    () => {
        assert.throws(
            () =>
                cleanPassword(
                    "corta"
                ),
            /entre 10 y 128/
        );

        assert.throws(
            () =>
                cleanPassword(
                    "a".repeat(129)
                ),
            /entre 10 y 128/
        );

        assert.equal(
            cleanPassword(
                "Frase-segura-2026"
            ),
            "Frase-segura-2026"
        );
    }
);

test(
    "rechaza claves peligrosas en JSON",
    () => {
        assert.throws(
            () =>
                inspectPayload({
                    "$where":
                        "malicioso"
                }),
            /clave no permitida/
        );

        assert.throws(
            () =>
                inspectPayload({
                    "perfil.nombre":
                        "malicioso"
                }),
            /clave no permitida/
        );

        assert.doesNotThrow(
            () =>
                inspectPayload({
                    cliente: {
                        nombre:
                            "Cliente"
                    },
                    items: [
                        {
                            cantidad:
                                1
                        }
                    ]
                })
        );
    }
);

test(
    "valida firmas básicas de imágenes",
    () => {
        assert.equal(
            validSignature({
                mimetype:
                    "image/png",
                buffer:
                    Buffer.from([
                        0x89,
                        0x50,
                        0x4e,
                        0x47,
                        0x0d,
                        0x0a,
                        0x1a,
                        0x0a
                    ])
            }),
            true
        );

        assert.equal(
            validSignature({
                mimetype:
                    "image/png",
                buffer:
                    Buffer.from(
                        "no-es-imagen"
                    )
            }),
            false
        );
    }
);

test(
    "normaliza orígenes sin barra final",
    () => {
        assert.equal(
            normalizeOrigin(
                "https://emmagina-cl.netlify.app/"
            ),
            "https://emmagina-cl.netlify.app"
        );
    }
);


test(
    "valida secretos y orígenes de producción",
    () => {
        const original = {
            NODE_ENV:
                process.env.NODE_ENV,
            JWT_SECRET:
                process.env.JWT_SECRET,
            SECURITY_LOG_SALT:
                process.env.SECURITY_LOG_SALT,
            FRONTEND_URLS:
                process.env.FRONTEND_URLS
        };

        try {
            process.env.NODE_ENV =
                "production";

            process.env.JWT_SECRET =
                "x".repeat(64);

            process.env.SECURITY_LOG_SALT =
                "y".repeat(64);

            process.env.FRONTEND_URLS =
                "https://emmagina-cl.netlify.app";

            assert.doesNotThrow(
                validateSecurityConfig
            );

            process.env.SECURITY_LOG_SALT =
                "corto";

            assert.throws(
                validateSecurityConfig,
                /SECURITY_LOG_SALT/
            );
        } finally {
            Object.entries(original)
                .forEach(([key, value]) => {
                    if (
                        value === undefined
                    ) {
                        delete process.env[key];
                    } else {
                        process.env[key] =
                            value;
                    }
                });
        }
    }
);
