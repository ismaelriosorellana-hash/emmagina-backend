"use strict";

const {
    booleanValue,
    firstDefined,
    stringValue
} = require("./values");

const DEFAULT_SHIPPING_INSTRUCTIONS =
    "Dentro de la provincia de Santiago, el envío demora entre 5 y 7 días hábiles desde la confirmación del pedido y tiene un costo de $4.000. Para otros sectores de Chile, el despacho se realiza por Chilexpress desde 5 días hábiles, con costo por pagar y coordinación previa con el cliente.";

const DEFAULT_PICKUP_INSTRUCTIONS =
    "El lugar definido para retiros es la salida norte de la estación Macul, Línea 4 del Metro de Santiago. La fecha y hora de entrega serán coordinadas una vez confirmado el pedido.";

function normalizeDeliveryConfig(value = {}) {
    const raw =
        value &&
        typeof value === "object"
            ? value
            : {};

    const shipping =
        raw.envio &&
        typeof raw.envio === "object"
            ? raw.envio
            : {};

    const pickup =
        raw.retiro &&
        typeof raw.retiro === "object"
            ? raw.retiro
            : {};

    return {
        envio: {
            habilitado: booleanValue(
                firstDefined(
                    shipping.habilitado,
                    shipping.activo,
                    raw.envioHabilitado,
                    raw.permitirEnvio
                ),
                true
            ),
            instrucciones: stringValue(
                firstDefined(
                    shipping.instrucciones,
                    raw.instruccionesEnvio,
                    raw.textoEnvio
                ),
                DEFAULT_SHIPPING_INSTRUCTIONS
            ) || DEFAULT_SHIPPING_INSTRUCTIONS
        },
        retiro: {
            habilitado: booleanValue(
                firstDefined(
                    pickup.habilitado,
                    pickup.activo,
                    raw.retiroHabilitado,
                    raw.permitirRetiro
                ),
                true
            ),
            instrucciones: stringValue(
                firstDefined(
                    pickup.instrucciones,
                    raw.instruccionesRetiro,
                    raw.textoRetiro
                ),
                DEFAULT_PICKUP_INSTRUCTIONS
            ) || DEFAULT_PICKUP_INSTRUCTIONS
        }
    };
}

module.exports = {
    DEFAULT_SHIPPING_INSTRUCTIONS,
    DEFAULT_PICKUP_INSTRUCTIONS,
    normalizeDeliveryConfig
};
