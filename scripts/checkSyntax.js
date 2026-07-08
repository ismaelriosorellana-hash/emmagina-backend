"use strict";

const fs = require("fs");
const path = require("path");
const {
    spawnSync
} = require("child_process");

const root =
    path.resolve(
        __dirname,
        ".."
    );

const ignored =
    new Set([
        "node_modules",
        ".git"
    ]);

function collect(directory) {
    const files = [];

    for (
        const entry of
        fs.readdirSync(
            directory,
            {
                withFileTypes: true
            }
        )
    ) {
        if (
            ignored.has(entry.name)
        ) {
            continue;
        }

        const fullPath =
            path.join(
                directory,
                entry.name
            );

        if (entry.isDirectory()) {
            files.push(
                ...collect(fullPath)
            );
            continue;
        }

        if (
            entry.isFile() &&
            entry.name.endsWith(".js")
        ) {
            files.push(fullPath);
        }
    }

    return files;
}

const files = collect(root);
let failed = false;

for (const file of files) {
    const result =
        spawnSync(
            process.execPath,
            [
                "--check",
                file
            ],
            {
                encoding: "utf8"
            }
        );

    if (
        result.status !== 0
    ) {
        failed = true;
        console.error(
            result.stderr
        );
    }
}

if (failed) {
    process.exit(1);
}

console.log(
    `✅ ${files.length} archivos JavaScript validados.`
);
