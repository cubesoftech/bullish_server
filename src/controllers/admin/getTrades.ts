import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";
import { membertrades_type, recenttrades_type } from "@prisma/client";

export default async function getTrades(req: Request, res: Response, next: NextFunction) {
    try {
        const [nasdaq, gold, eurusd, pltr, tsla, nvda] = await Promise.all([
            nasdaqTrades(),
            goldTrades(),
            eurusdTrades(),
            pltrTrades(),
            tslaTrades(),
            nvdaTrades(),
        ]);

        return res.status(200).json({
            nasdaq,
            gold,
            eurusd,
            pltr,
            tsla,
            nvda
        });
    } catch (error) {
        console.log("Error admin | getTrades: ", error);
        return next();
    }
}

const nasdaqTrades = async () => {
    try {
        const types: recenttrades_type[] = ["nasdaq_1_min", "nasdaq_3_mins", "nasdaq_5_mins"];
        const promises = types.map(type =>
            prisma.recenttrades.findMany({
                where: {
                    tradinghours: {
                        // greater than current time
                        gte: new Date(),
                    },
                    type
                },
                take: 50,
                orderBy: {
                    tradinghours: "asc",
                },
            })
        );

        const [nasdaq_1_min, nasdaq_3_mins, nasdaq_5_mins] = await Promise.all(promises);
        return { one_min: nasdaq_1_min, three_min: nasdaq_3_mins, five_min: nasdaq_5_mins };
    } catch (error) {
        console.log("Error admin | nasdaqTrades: ", error);
        throw new Error("Failed to fetch nasdaq trades");
    }
}

const goldTrades = async () => {
    try {
        const types: recenttrades_type[] = ["gold_1_min", "gold_3_mins", "gold_5_mins"];
        const promises = types.map(type =>
            prisma.recenttrades.findMany({
                where: {
                    tradinghours: {
                        // greater than current time
                        gte: new Date(),
                    },
                    type
                },
                take: 50,
                orderBy: {
                    tradinghours: "asc",
                },
            })
        );

        const [gold_1_min, gold_3_mins, gold_5_mins] = await Promise.all(promises);
        return { one_min: gold_1_min, three_min: gold_3_mins, five_min: gold_5_mins };
    } catch (error) {
        console.log("Error admin | goldTrades: ", error);
        throw new Error("Failed to fetch gold trades");
    }
}

const eurusdTrades = async () => {
    try {
        const types: recenttrades_type[] = ["eurusd_1_min", "eurusd_3_mins", "eurusd_5_mins"];
        const promises = types.map(type =>
            prisma.recenttrades.findMany({
                where: {
                    tradinghours: {
                        // greater than current time
                        gte: new Date(),
                    },
                    type
                },
                take: 50,
                orderBy: {
                    tradinghours: "asc",
                },
            })
        );

        const [eurusd_1_min, eurusd_3_mins, eurusd_5_mins] = await Promise.all(promises);
        return { one_min: eurusd_1_min, three_min: eurusd_3_mins, five_min: eurusd_5_mins };
    } catch (error) {
        console.log("Error admin | eurusdTrades: ", error);
        throw new Error("Failed to fetch eurusd trades");
    }
}

const pltrTrades = async () => {
    try {
        const types: recenttrades_type[] = ["pltr_1_min", "pltr_3_mins", "pltr_5_mins"];
        const promises = types.map(type =>
            prisma.recenttrades.findMany({
                where: {
                    tradinghours: {
                        // greater than current time
                        gte: new Date(),
                    },
                    type
                },
                take: 50,
                orderBy: {
                    tradinghours: "asc",
                },
            })
        );

        const [pltr_1_min, pltr_3_mins, pltr_5_mins] = await Promise.all(promises);
        return { one_min: pltr_1_min, three_min: pltr_3_mins, five_min: pltr_5_mins };
    } catch (error) {
        console.log("Error admin | pltrTrades: ", error);
        throw new Error("Failed to fetch pltr trades");
    }
}

const tslaTrades = async () => {
    try {
        const types: recenttrades_type[] = ["tsla_1_min", "tsla_3_mins", "tsla_5_mins"];
        const promises = types.map(type =>
            prisma.recenttrades.findMany({
                where: {
                    tradinghours: {
                        // greater than current time
                        gte: new Date(),
                    },
                    type
                },
                take: 50,
                orderBy: {
                    tradinghours: "asc",
                },
            })
        );

        const [tsla_1_min, tsla_3_mins, tsla_5_mins] = await Promise.all(promises);
        return { one_min: tsla_1_min, three_min: tsla_3_mins, five_min: tsla_5_mins };
    } catch (error) {
        console.log("Error admin | tslaTrades: ", error);
        throw new Error("Failed to fetch tsla trades");
    }
}

const nvdaTrades = async () => {
    try {
        const types: recenttrades_type[] = ["nvda_1_min", "nvda_3_mins", "nvda_5_mins"];
        const promises = types.map(type =>
            prisma.recenttrades.findMany({
                where: {
                    tradinghours: {
                        // greater than current time
                        gte: new Date(),
                    },
                    type
                },
                take: 50,
                orderBy: {
                    tradinghours: "asc",
                },
            })
        );

        const [nvda_1_min, nvda_3_mins, nvda_5_mins] = await Promise.all(promises);
        return { one_min: nvda_1_min, three_min: nvda_3_mins, five_min: nvda_5_mins };
    } catch (error) {
        console.log("Error admin | nvdaTrades: ", error);
        throw new Error("Failed to fetch nvda trades");
    }
}