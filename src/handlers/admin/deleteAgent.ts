import { Request, Response } from "express";
import { prisma } from "../../utils/prisma"

interface DeleteAgentPayload {
    ids: string[];
}

export default async function deleteAgent(req: Request, res: Response) {
    const { ids } = req.body as DeleteAgentPayload;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "Invalid ids." });
    }

    try {
        await prisma.agents.deleteMany({
            where: {
                id: {
                    in: ids
                }
            }
        });
        return res.status(200).json({ message: "Agent deleted successfully." });
    } catch (error) {
        console.error("Error deleting agent: ", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}