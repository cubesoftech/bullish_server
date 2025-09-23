import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

interface DeleteProfitPayload {
    profitId: string;
}

export default async function deleteProfit(req: Request, res: Response) {
    const { profitId } = req.body as DeleteProfitPayload;

    if (!profitId || profitId.trim() === "") {
        return res.status(400).json({ message: "정보가 부족합니다." });
    }

    try {
        const profit = await prisma.profit_log.findUnique({
            where: {
                id: profitId
            }
        })
        if (!profit) {
            return res.status(404).json({ message: "수익 기록을 찾을 수 없습니다." });
        }

        await prisma.profit_log.delete({
            where: {
                id: profitId
            }
        })

        return res.status(200).json({ message: "수익 기록이 성공적으로 삭제되었습니다." });
    } catch (error) {
        console.error("Error on deleteProfit: ", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
