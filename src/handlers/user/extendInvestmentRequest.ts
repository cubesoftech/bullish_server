import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { generateRandomString } from "../../utils";
import { notifyAdmin } from "../core/socketConnection";

interface ExtendInvestmentRequestPayload {
    investmentLogId: string;
    newInvestmentDuration: number;
}

export default async function extendInvestmentRequest(req: Request, res: Response) {
    const { investmentLogId, newInvestmentDuration } = req.body as ExtendInvestmentRequestPayload;

    if (!investmentLogId || investmentLogId.trim() === "") {
        return res.status(400).json({ message: "잘못된 투자 로그 ID입니다." });
    }
    if (!newInvestmentDuration || newInvestmentDuration <= 0 || newInvestmentDuration > 36) {
        return res.status(400).json({ message: "잘못된 기간입니다." });
    }

    try {
        const investment = await prisma.investment_log.findUnique({
            where: {
                id: investmentLogId,
            }
        });
        if (!investment) {
            return res.status(404).json({ message: "투자 로그를 찾을 수 없습니다." });
        }
        if (newInvestmentDuration <= investment.investmentDuration) {
            return res.status(400).json({ message: "새로운 투자 기간은 현재 기간보다 길어야 합니다." });
        }

        const hasExistingRequest = await prisma.extend_investment_duration_log.findFirst({
            where: {
                investmentLogId: investment.id,
                status: "PENDING",
            }
        });
        if (hasExistingRequest) {
            return res.status(400).json({ message: "이 투자에 대해 이미 대기 중인 연장 요청이 있습니다." });
        }

        await prisma.extend_investment_duration_log.create({
            data: {
                id: generateRandomString(7),
                userId: investment.userId,
                investmentLogId: investment.id,
                newDuration: newInvestmentDuration,
                status: "PENDING",
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        })

        await notifyAdmin();
        return res.status(200).json({ message: "투자 기간 연장 요청이 성공적으로 제출되었습니다." });
    } catch (error) {
        console.log("Error in extendInvestmentRequest:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}