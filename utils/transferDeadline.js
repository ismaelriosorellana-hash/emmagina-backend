"use strict";

function transferHours() {
    const configured = Number(process.env.TRANSFER_RECEIPT_HOURS);
    return Number.isFinite(configured)
        ? Math.min(24, Math.max(1, Math.round(configured)))
        : 3;
}

function transferWindowMs() {
    return transferHours() * 60 * 60 * 1000;
}

function transferDeadline(from = new Date()) {
    return new Date(new Date(from).getTime() + transferWindowMs());
}

module.exports = {
    transferHours,
    transferWindowMs,
    transferDeadline
};
