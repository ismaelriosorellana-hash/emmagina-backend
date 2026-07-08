"use strict";

require("dotenv")
    .config();

const mongoose =
    require("mongoose");

const app =
    require("./app");

const {
    connectDatabase
} = require(
    "./config/db"
);

const {
    validateSecurityConfig
} = require(
    "./config/security"
);

const {
    APP_VERSION
} = require(
    "./config/version"
);

const {
    validateProductionConfig
} = require(
    "./config/runtime"
);

const {
    expirePendingTransferOrders
} = require("./services/transferOrderService");

const port =
    Number(
        process.env.PORT
    ) || 3000;

let shuttingDown =
    false;

async function start() {
    try {
        validateSecurityConfig();

        const productionReport =
            validateProductionConfig();

        productionReport.warnings
            .forEach((warning) => {
                console.warn(
                    `⚠️ Configuración: ${warning}`
                );
            });

        await connectDatabase();

        await expirePendingTransferOrders();

        const expirationTimer = setInterval(
            () => expirePendingTransferOrders().catch(
                (error) => console.error("No se pudo revisar vencimientos:", error.message)
            ),
            5 * 60 * 1000
        );
        expirationTimer.unref();

        const server =
            app.listen(
                port,
                () => {
                    console.log(
                        `🚀 Servidor Mommy Crafts v${APP_VERSION} en puerto ${port}`
                    );
                }
            );

        async function shutdown(
            signal
        ) {
            if (shuttingDown) {
                return;
            }

            shuttingDown =
                true;

            console.log(
                `\n${signal}: cerrando servidor...`
            );

            const forced =
                setTimeout(
                    () => {
                        process.exit(1);
                    },
                    10000
                );

            forced.unref();

            clearInterval(expirationTimer);

            server.close(
                async () => {
                    await mongoose
                        .connection
                        .close();

                    clearTimeout(
                        forced
                    );

                    process.exit(0);
                }
            );
        }

        process.on(
            "SIGINT",
            () =>
                shutdown(
                    "SIGINT"
                )
        );

        process.on(
            "SIGTERM",
            () =>
                shutdown(
                    "SIGTERM"
                )
        );
    } catch (error) {
        console.error(
            "❌ No fue posible iniciar el servidor:",
            error.message
        );

        process.exit(1);
    }
}

process.on(
    "unhandledRejection",
    (error) => {
        console.error(
            "❌ Promesa no controlada:",
            error?.message ||
            "Error desconocido"
        );
    }
);

start();
