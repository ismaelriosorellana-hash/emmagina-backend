"use strict";

function createOrderNumber() {
    const now = new Date();

    const date = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0")
    ].join("");

    const random =
        Math.random()
            .toString(36)
            .slice(2, 7)
            .toUpperCase();

    return `MC-${date}-${random}`;
}

module.exports = {
    createOrderNumber
};
