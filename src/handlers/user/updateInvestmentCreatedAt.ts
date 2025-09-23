import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { addMonths } from "date-fns";

interface UpdateInvestmentCreatedAtPayload {
    investmentId: string;
    newCreatedAt: string;
}

export default async function updateInvestmentCreatedAt(req: Request, res: Response) {
    const { investmentId, newCreatedAt } = req.body as UpdateInvestmentCreatedAtPayload;

    if (!investmentId || investmentId.trim() === "") {
        return res.status(400).json({ message: "잘못된 투자 ID입니다." })
    }

    if (!newCreatedAt || newCreatedAt.trim() === "") {
        return res.status(400).json({ message: "잘못된 새로운 투자 날짜입니다." })
    }

    const processedNewCreatedAt = new Date(newCreatedAt)

    try {
        const investment = await prisma.investment_log.findUnique({
            where: {
                id: investmentId
            }
        })
        if (!investment) {
            return res.status(404).json({ message: "투자를 찾을 수 없습니다." })
        }

        if (investment.status !== "PENDING") {
            return res.status(400).json({ message: "투자가 대기 상태가 아닙니다." })
        }

        await prisma.investment_log.update({
            where: {
                id: investment.id
            },
            data: {
                createdAt: processedNewCreatedAt,
                maturityDate: addMonths(processedNewCreatedAt, investment.investmentDuration),
                updatedAt: new Date()
            }
        })

        return res.status(200).json({ message: "투자가 성공적으로 업데이트되었습니다." })
    } catch (error) {
        console.log("Error on updateInvestmentCreatedAt: ", error)
        return res.status(500).json({ message: "내부 서버 오류." })
    }
}