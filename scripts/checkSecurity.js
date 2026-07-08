"use strict";

const fs =
    require("fs");

const path =
    require("path");

const {
    execFileSync
} =
    require("child_process");

const root =
    path.resolve(
        __dirname,
        ".."
    );

const required = [
    "middleware/requestContext.js",
    "middleware/requestSecurity.js",
    "middleware/rateLimits.js",
    "utils/securityLogger.js",
    "utils/validation.js",
    "tests/security.test.js",
    "models/SiteContent.js",
    "routes/content.js",
    "routes/admin/content.js",
    "utils/contentNormalizer.js"
];

const failures = [];

for (
    const relative
    of required
) {
    if (
        !fs.existsSync(
            path.join(
                root,
                relative
            )
        )
    ) {
        failures.push(
            `Falta ${relative}`
        );
    }
}

function getTrackedFiles() {
    try {
        const output =
            execFileSync(
                "git",
                [
                    "ls-files"
                ],
                {
                    cwd: root,
                    encoding: "utf8",
                    stdio: [
                        "ignore",
                        "pipe",
                        "ignore"
                    ]
                }
            );

        return output
            .split(/\r?\n/)
            .map(
                (entry) =>
                    entry.trim()
            )
            .filter(Boolean);
    } catch {
        return [];
    }
}

const trackedFiles =
    getTrackedFiles();

const trackedPrivateEnvFiles =
    trackedFiles.filter(
        (file) =>
            /^\.env(?:\.|$)/i.test(
                file
            ) &&
            file !== ".env.example"
    );

if (
    trackedPrivateEnvFiles.length
) {
    failures.push(
        `Git contiene archivos privados de entorno: ${trackedPrivateEnvFiles.join(", ")}`
    );
}

if (
    trackedFiles.some(
        (file) =>
            file === "node_modules" ||
            file.startsWith(
                "node_modules/"
            )
    )
) {
    failures.push(
        "Git contiene archivos de node_modules."
    );
}

const gitignorePath =
    path.join(
        root,
        ".gitignore"
    );

if (
    !fs.existsSync(
        gitignorePath
    )
) {
    failures.push(
        "Falta .gitignore."
    );
} else {
    const gitignore =
        fs.readFileSync(
            gitignorePath,
            "utf8"
        );

    for (
        const requiredLine
        of [
            ".env",
            "node_modules/"
        ]
    ) {
        if (
            !gitignore.includes(
                requiredLine
            )
        ) {
            failures.push(
                `.gitignore no contiene ${requiredLine}`
            );
        }
    }
}

const packageJson =
    JSON.parse(
        fs.readFileSync(
            path.join(
                root,
                "package.json"
            ),
            "utf8"
        )
    );

if (
    !/^\d+\.\d+\.\d+$/.test(
        String(
            packageJson.version || ""
        )
    )
) {
    failures.push(
        "La versión del backend debe usar el formato X.Y.Z."
    );
}

const versionModulePath =
    path.join(
        root,
        "config",
        "version.js"
    );

if (
    !fs.existsSync(
        versionModulePath
    )
) {
    failures.push(
        "Falta config/version.js."
    );
} else {
    const {
        APP_VERSION
    } = require(
        versionModulePath
    );

    if (
        APP_VERSION !==
        packageJson.version
    ) {
        failures.push(
            "La versión central no coincide con package.json."
        );
    }
}

if (failures.length) {
    failures.forEach(
        (failure) =>
            console.error(
                `❌ ${failure}`
            )
    );

    process.exit(1);
}

console.log(
    "✅ Revisión estática de seguridad completada."
);
