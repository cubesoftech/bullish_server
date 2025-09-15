import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { findUser } from "../../utils";

export default async function getDirectInquiryMessages(req: Request, res: Response) {
    const { user } = req
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const { limit, page } = req.query;

    const processedLimit = parseInt(limit as string) || 25
    const processedPage = parseInt(page as string) || 1


    try {
        const userInfo = await findUser(user.id);
        if (!userInfo) {
            return res.status(404).json({ message: "User not found" });
        }

        const where: any = {
            OR: [
                {
                    senderId: userInfo.id
                },
                {
                    receiverId: userInfo.id
                }
            ]
        }

        const directInquiry = await prisma.direct_inquiry_messages.findMany({
            where,
            skip: (processedPage - 1) * processedLimit,
            take: processedLimit,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                directInquiry: {
                    include: {
                        user: true
                    }
                }
            }
        });
        const totalDirectInquiry = await prisma.direct_inquiry_messages.count({ where });

        const processedDirectInquiries = directInquiry.map(inquiry => ({
            ...inquiry,
            isFromUser: inquiry.senderId === userInfo.id,
            directInquiry: {
                ...inquiry.directInquiry,
                user: {
                    ...inquiry.directInquiry.user,
                    referrerPoints: Number(inquiry.directInquiry.user.referrerPoints)
                }
            }
        }))

        processedDirectInquiries.reverse();

        return res.status(200).json({ data: processedDirectInquiries, total: totalDirectInquiry });
    } catch (error) {
        console.error("Error fetching direct inquiry: ", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}