"use strict";

function validationError(message) {
    const error = new Error(message);
    error.statusCode = 400;
    error.expose = true;
    return error;
}

function scalarString(value, field) {
    if (
        value === undefined ||
        value === null
    ) {
        return "";
    }

    if (
        typeof value !== "string" &&
        typeof value !== "number"
    ) {
        throw validationError(
            `${field} no tiene un formato válido.`
        );
    }

    return String(value);
}

function cleanText(
    value,
    {
        field = "El campo",
        maxLength = 300,
        required = false,
        allowNewlines = false
    } = {}
) {
    let text =
        scalarString(value, field)
            .normalize("NFKC");

    text = allowNewlines
        ? text.replace(
            /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,
            ""
        )
        : text.replace(
            /[\u0000-\u001F\u007F]/g,
            " "
        );

    text = allowNewlines
        ? text
            .replace(/\r\n?/g, "\n")
            .replace(/[ \t]+/g, " ")
            .trim()
        : text
            .replace(/\s+/g, " ")
            .trim();

    if (
        required &&
        !text
    ) {
        throw validationError(
            `${field} es obligatorio.`
        );
    }

    if (
        text.length >
        maxLength
    ) {
        throw validationError(
            `${field} supera el máximo de ${maxLength} caracteres.`
        );
    }

    return text;
}

function cleanEmail(
    value,
    {
        required = false,
        field = "El correo"
    } = {}
) {
    const email = cleanText(
        value,
        {
            field,
            maxLength: 254,
            required
        }
    ).toLowerCase();

    if (
        email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
        throw validationError(
            "Ingresa un correo válido."
        );
    }

    return email;
}

function cleanPhone(
    value,
    {
        required = false,
        field = "El teléfono"
    } = {}
) {
    const phone = cleanText(
        value,
        {
            field,
            maxLength: 40,
            required
        }
    );

    if (
        phone &&
        !/^[0-9+().\-\s]{7,40}$/.test(phone)
    ) {
        throw validationError(
            "Ingresa un teléfono válido."
        );
    }

    return phone;
}

function cleanRut(value) {
    const rut = cleanText(
        value,
        {
            field: "El RUT",
            maxLength: 30
        }
    );

    if (
        rut &&
        !/^[0-9kK.\-\s]{7,30}$/.test(rut)
    ) {
        throw validationError(
            "Ingresa un RUT válido."
        );
    }

    return rut;
}

function cleanPassword(
    value,
    {
        field = "La contraseña"
    } = {}
) {
    if (
        typeof value !== "string"
    ) {
        throw validationError(
            `${field} no tiene un formato válido.`
        );
    }

    if (
        value.length < 10 ||
        value.length > 128
    ) {
        throw validationError(
            `${field} debe tener entre 10 y 128 caracteres.`
        );
    }

    if (
        /[\u0000-\u001F\u007F]/.test(value)
    ) {
        throw validationError(
            `${field} contiene caracteres no permitidos.`
        );
    }

    return value;
}

function cleanRoleArea(value) {
    const area = cleanText(
        value,
        {
            field: "El tipo de acceso",
            maxLength: 20,
            required: true
        }
    ).toLowerCase();

    if (
        !["cliente", "admin"]
            .includes(area)
    ) {
        throw validationError(
            "El tipo de acceso no es válido."
        );
    }

    return area;
}

module.exports = {
    validationError,
    cleanText,
    cleanEmail,
    cleanPhone,
    cleanRut,
    cleanPassword,
    cleanRoleArea
};
