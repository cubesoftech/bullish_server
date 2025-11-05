import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";
import { membertrades_type, Prisma, recenttrades_type } from "@prisma/client";
import { subDays } from "date-fns";

export default async function generateTradingData(req: Request, res: Response, next: NextFunction) {
    try {
        const tradeTypes: recenttrades_type[] = [
            "nasdaq_1_min",
            "nasdaq_3_mins",
            "nasdaq_5_mins",
            "gold_1_min",
            "gold_3_mins",
            "gold_5_mins",
            "eurusd_1_min",
            "eurusd_3_mins",
            "eurusd_5_mins",
            "pltr_1_min",
            "pltr_3_mins",
            "pltr_5_mins",
            "tsla_1_min",
            "tsla_3_mins",
            "tsla_5_mins",
            "nvda_1_min",
            "nvda_3_mins",
            "nvda_5_mins",
        ]

        await Promise.all(
            tradeTypes.map(async (type) => {
                const interval = parseInt(type.split("_")[1])
                const lastData = await prisma.recenttrades.findFirst({
                    where: {
                        type
                    },
                    orderBy: {
                        tradinghours: "desc"
                    }
                })

                let startDate = subDays(new Date(), 1);

                if (lastData) {
                    startDate = lastData.tradinghours
                }

                await prisma.recenttrades.createMany({
                    data: generateRandomData({
                        type,
                        count: 1440 / interval,
                        interval,
                        startDate
                    }),
                    skipDuplicates: true
                })
            })
        )

        return res.status(200).json({ message: "Trading data generated successfully." })
    } catch (error) {
        console.log("Error core | generateTradingData:", error);
        return next()
    }
}

interface GenerateRandomDataProps {
    type: membertrades_type;
    count: number;
    interval: number;
    startDate: Date;
}

const generateRandomData = ({ type, count, interval, startDate }: GenerateRandomDataProps) => {
    let data: Prisma.recenttradesCreateManyInput[] = [];
    let date = new Date(startDate);

    const minutes = date.getMinutes();
    const roundedMinutes = Math.floor(minutes / interval) * interval;

    date.setMinutes(roundedMinutes, 0, 0);

    for (let i = 0; i < count; i++) {
        data.push({
            id: Math.random().toString(36).substring(7),
            type,
            tradinghours: new Date(date),
            result: Math.round(Math.random()) === 0 ? false : true,
        })

        date = new Date(date.getTime() + interval * 60 * 1000);
    }

    return data
}