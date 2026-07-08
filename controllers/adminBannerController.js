"use strict";

const Banner =
    require("../models/Banner");

async function listBanners(
    req,
    res,
    next
) {
    try {
        const banners =
            await Banner.find()
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

async function createBanner(
    req,
    res,
    next
) {
    try {
        const banner =
            await Banner.create(
                req.body
            );

        res.status(201).json(
            banner
        );
    } catch (error) {
        next(error);
    }
}

async function updateBanner(
    req,
    res,
    next
) {
    try {
        const banner =
            await Banner.findByIdAndUpdate(
                req.params.id,
                {
                    $set: req.body
                },
                {
                    new: true,
                    runValidators: true
                }
            );

        if (!banner) {
            return res.status(404).json({
                error:
                    "Banner no encontrado."
            });
        }

        res.json(banner);
    } catch (error) {
        next(error);
    }
}

async function deleteBanner(
    req,
    res,
    next
) {
    try {
        const banner =
            await Banner.findByIdAndDelete(
                req.params.id
            );

        if (!banner) {
            return res.status(404).json({
                error:
                    "Banner no encontrado."
            });
        }

        res.json({
            mensaje:
                "Banner eliminado."
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    listBanners,
    createBanner,
    updateBanner,
    deleteBanner
};
