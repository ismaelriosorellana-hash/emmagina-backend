"use strict";

const Banner =
    require("../models/Banner");

async function listPublicBanners(
    req,
    res,
    next
) {
    try {
        const banners =
            await Banner.find({
                activo: true
            })
                .sort({
                    orden: 1,
                    createdAt: -1
                })
                .lean();

        res.json(banners);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    listPublicBanners
};
