import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";
import { membertrades_type, members_nasdaq_trade as trade_type } from "@prisma/client";

type StockLabel = "NASDAQ" | "GOLD" | "EURO" | "PALANTIR" | "TESLA" | "NVIDIA"

export default async function getDefaultStock(req: Request, res: Response, next: NextFunction) {
    try {
        const siteSettings = await prisma.sitesettings.findFirst()
        if (!siteSettings) {
            return next({
                status: 404,
                message: "Site settings not found"
            })
        }

        const { nasdaq, gold, eurusd, pltr, tsla, nvda } = siteSettings

        let defaultStock: {
            label: StockLabel,
            selected: membertrades_type,
        } = {
            label: "NASDAQ",
            selected: "nasdaq_1_min"
        }

        const stockMap: Record<trade_type, {
            label: StockLabel,
            selected: membertrades_type,
        }> = {
            nasdaq: {
                label: "NASDAQ",
                selected: "nasdaq_1_min"
            },
            gold: {
                label: "GOLD",
                selected: "gold_1_min"
            },
            eurusd: {
                label: "EURO",
                selected: "eurusd_1_min"
            },
            pltr: {
                label: "PALANTIR",
                selected: "pltr_1_min"
            },
            tsla: {
                label: "TESLA",
                selected: "tsla_1_min"
            },
            nvda: {
                label: "NVIDIA",
                selected: "nvda_1_min"
            }
        }

        if (nasdaq) {
            defaultStock = stockMap["nasdaq"]
        } else if (gold) {
            defaultStock = stockMap["gold"]
        } else if (eurusd) {
            defaultStock = stockMap["eurusd"]
        } else if (pltr) {
            defaultStock = stockMap["pltr"]
        } else if (tsla) {
            defaultStock = stockMap["tsla"]
        } else if (nvda) {
            defaultStock = stockMap["nvda"]
        } else {
            return res.status(400).json({ message: "No default stock is set. Please contact administrator." })
        }

        return res.status(200).json({
            data: {
                label: defaultStock.label,
                selected: defaultStock.selected,
            }
        })
    } catch (error) {
        console.log("Error user | getDefaultStock:", error);
        return next()
    }
}