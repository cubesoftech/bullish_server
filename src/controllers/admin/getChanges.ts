import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";

export default async function getChanges(req: Request, res: Response, next: NextFunction) {
    try {
        const [depositCount, withdrawalCount, inquiryCount, depositInquiryCount] = await Promise.all([
            prisma.transaction.count({
                where: {
                    type: "deposit",
                    status: "pending"
                }
            }),
            prisma.transaction.count({
                where: {
                    type: "withdrawal",
                    status: "pending"
                }
            }),
            prisma.inquiries.count({
                where: {
                    alreadyAnswered: false
                }
            }),
            prisma.inquiries.count({
                where: {
                    alreadyAnswered: false,
                    title: "입금계좌문의"
                }
            })
        ])

        return res.status(200).json({ depositCount, withdrawalCount, inquiryCount, depositInquiryCount })
    } catch (error) {
        console.log("Error admin | getChanges: ", error)
        return next()
    }
}