import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { generateRandomString } from "../../utils";
import { series_log, users } from "@prisma/client";

export default async function createDummyUsers(req: Request, res: Response) {
    try {
        const series = await prisma.series_log.findMany({
            where: {
                investmentDuration: 0
            },
            orderBy: {
                createdAt: "desc"
            },
            include: {
                series: {
                    include: {
                        periods: {
                            orderBy: {
                                period: "desc"
                            }
                        }
                    }
                }
            }
        })
        const investments = await prisma.investment_log.findMany({
            where: {
                investmentDuration: 0
            },
            orderBy: {
                createdAt: "desc"
            },
            include: {
                series: {
                    include: {
                        periods: {
                            orderBy: {
                                period: "desc"
                            }
                        }
                    }
                }
            }
        })

        for (const s of series) {
            await prisma.series_log.update({
                where: {
                    id: s.id
                },
                data: {
                    investmentDuration: s.series.periods.length > 0 ? s.series.periods[0].period : 1,
                    updatedAt: new Date(),
                }
            })
        }
        for (const inv of investments) {
            await prisma.investment_log.update({
                where: {
                    id: inv.id
                },
                data: {
                    investmentDuration: inv.series.periods.length > 0 ? inv.series.periods[0].period : 1,
                    updatedAt: new Date(),
                }
            })
        }

        return res.status(200).json({ message: "investment duration updated successfully" });
    } catch (error) {
        console.error("Error creating dummy users: ", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}