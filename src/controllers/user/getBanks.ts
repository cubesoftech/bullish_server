import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";

export default async function getBanks(req: Request, res: Response, next: NextFunction) {
    try {
        const banks = await prisma.bank.findMany()
        const totalBanks = await prisma.bank.count()

        return res.status(200).json({
            total: totalBanks,
            data: banks
        })
    } catch (error) {
        console.log("Error user | getBanks:", error);
        return next()
    }
}