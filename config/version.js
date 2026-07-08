"use strict";

const {
    version
} = require(
    "../package.json"
);

const APP_VERSION =
    String(
        version || "0.0.0"
    );

module.exports = Object.freeze({
    APP_VERSION
});
