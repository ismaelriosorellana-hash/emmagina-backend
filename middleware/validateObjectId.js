"use strict";

const mongoose = require("mongoose");

function validateObjectId(paramName = "id") {
    return (req, res, next) => {
        const value = req.params[paramName];

        if (
            !mongoose.isValidObjectId(value)
        ) {
            return res.status(400).json({
                error:
                    "El identificador no es válido."
            });
        }

        next();
    };
}

module.exports = {
    validateObjectId
};
