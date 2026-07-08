"use strict";

const express =
    require("express");

const {
    register,
    login,
    me,
    changePassword,
    revokeSessions
} = require(
    "../controllers/authController"
);

const {
    requireAuth
} = require(
    "../middleware/auth"
);

const {
    loginLimiter,
    registerLimiter,
    passwordLimiter
} = require(
    "../middleware/rateLimits"
);

const router =
    express.Router();

router.post(
    "/registro",
    registerLimiter,
    register
);

router.post(
    "/login",
    loginLimiter,
    login
);

router.get(
    "/me",
    requireAuth,
    me
);

router.post(
    "/cambiar-password",
    requireAuth,
    passwordLimiter,
    changePassword
);

router.post(
    "/revocar-sesiones",
    requireAuth,
    passwordLimiter,
    revokeSessions
);

module.exports = router;
