import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

export default async function getNotificationCount(req: Request, res: Response) {
    try {
        const extendInvestment = await prisma.extend_investment_duration_log.count({
            where: {
                status: "PENDING"
            }
        })
        const earlyWithdrawal = await prisma.investment_early_withdrawal_log.count({
            where: {
                status: "PENDING"
            }
        })
        const pendingUsers = await prisma.users.count({
            where: {
                status: false,
            }
        })
        const inquiries = await prisma.inquiry_log.count({
            where: {
                isReplied: false,
            }
        })
        const directInquiries = await prisma.direct_inquiry.count({
            where: {
                isAdminReplied: false,
            }
        })
        const deposits = await prisma.deposit_log.count({
            where: {
                status: "PENDING",
            }
        })
        const withdrawals = await prisma.withdrawal_log.count({
            where: {
                status: "PENDING",
            }
        })
        const pointConversions = await prisma.referrer_point_conversion_log.count({
            where: {
                status: "PENDING",
            }
        })
        const investments = await prisma.series_log.count({
            where: {
                status: "PENDING",
            }
        })
        const reviews = await prisma.review_log.count({
            where: {
                status: "PENDING",
            }
        })

        const data = {
            extendInvestment,
            earlyWithdrawal,
            pendingUsers,
            inquiries,
            directInquiries,
            deposits,
            withdrawals,
            pointConversions,
            investments,
            reviews,
        }
        return res.status(200).json({ data });
    } catch (error) {
        console.log("Error in admin getNotificationCount: ", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}