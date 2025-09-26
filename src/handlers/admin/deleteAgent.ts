import { Request, Response } from "express";
import { prisma } from "../../utils/prisma"

interface DeleteAgentPayload {
    ids: string[];
}

export default async function deleteAgent(req: Request, res: Response) {
    const { ids } = req.body as DeleteAgentPayload;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "잘못된 ID입니다." });
    }

    try {
        await prisma.agents.deleteMany({
            where: {
                id: {
                    in: ids
                }
            }
        });
        return res.status(200).json({ message: "에이전트가 성공적으로 삭제되었습니다." });
    } catch (error) {
        console.error("Error deleting agent: ", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}