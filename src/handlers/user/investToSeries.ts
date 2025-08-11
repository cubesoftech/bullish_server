import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { generateRandomString } from "../../utils";
import findUser from "../../utils/findUser";

interface InvestToSeriesPayload {
    amount: number;
    seriesId: number;
}

export default async function investToSeries(req: Request, res: Response) {
    const { user } = req;

    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const { amount, seriesId } = req.body as InvestToSeriesPayload;

    // Validate required fields
    const validateFields = !(
        isNaN(amount) || !Number.isFinite(amount) || amount <= 0 ||
        isNaN(seriesId) || !Number.isFinite(seriesId) ||
        // update this too when series got changed
        seriesId <= 0 || seriesId > 5
    )
    if (!validateFields) {
        return res.status(400).json({ message: "Invalid investment parameters" });
    }

    try {
        const userInfo = await findUser(user.id);
        if (!userInfo) {
            return res.status(400).json({ message: "Invalid phone number or password" });
        }
        if (amount > userInfo.balance) {
            return res.status(400).json({ message: "Insufficient balance for investment" });
        }

        const series = await prisma.series.findFirst({
            where: {
                seriesId
            }
        })
        if (!series) {
            return res.status(404).json({ message: "Series not found" });
        }

        if (amount < series.minAmount) {
            return res.status(400).json({ message: `Minimum investment amount is ${series.minAmount}` });
        }

        await prisma.$transaction(async (tx: any) => {
            await tx.series_log.create({
                data: {
                    id: generateRandomString(7),
                    userId: user.id,
                    seriesId: series.id,
                    amount,
                    status: "PENDING",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            });
            await tx.users.update({
                where: {
                    id: user.id
                },
                data: {
                    balance: {
                        decrement: amount
                    },
                    updatedAt: new Date(),
                }
            })
        })

        return res.status(200).json({ message: "Investment processed successfully" });
    } catch (e) {
        console.error("Error investing to series:", e);
        return res.status(500).json({ message: "Internal server error." });
    }
}