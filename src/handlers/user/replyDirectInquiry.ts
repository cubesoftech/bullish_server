import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { findUser } from "../../utils";
import { generateRandomString } from "../../utils";
import { notifyOnlineUsers } from "../core/socketConnection";
import { notifyAdmin } from "../core/socketConnection";

interface ReplyDirectInquiry {
    content: string;
}

export default async function replyDirectInquiry(req: Request, res: Response) {
    const { user } = req
    if (!user) {
        return res.status(401).json({ message: "인증되지 않았습니다." });
    }

    const { content } = req.body as ReplyDirectInquiry

    if (!content || content.trim() === "") {
        return res.status(400).json({ message: "내용은 필수입니다." });
    }

    try {
        const userInfo = await findUser(user.id);
        if (!userInfo) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }

        const directInquiry = await prisma.direct_inquiry.findUnique({
            where: {
                userId: userInfo.id
            }
        })

        if (!directInquiry) {
            await prisma.direct_inquiry.create({
                data: {
                    id: generateRandomString(7),
                    userId: userInfo.id,
                    isUserReplied: true,
                    isAdminReplied: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    directInquiryMessages: {
                        create: {
                            id: generateRandomString(7),
                            senderId: userInfo.id,
                            content,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        }
                    }
                }
            })
            await notifyAdmin();
            return res.status(200).json({ message: "문의가 전송되었습니다." });
        }

        await prisma.$transaction(async (tx: any) => {
            await tx.direct_inquiry_messages.create({
                data: {
                    id: generateRandomString(7),
                    directInquiryId: directInquiry.id,
                    senderId: userInfo.id,
                    content,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            });
            await tx.direct_inquiry.update({
                where: {
                    id: directInquiry.id
                },
                data: {
                    isUserReplied: true,
                    isAdminReplied: false,
                    updatedAt: new Date(),
                }
            });
        });

        // send notification to admin
        const admins = await prisma.admin.findMany()
        for (const admin of admins) {
            notifyOnlineUsers(admin.id)
        }

        await notifyAdmin();

        return res.status(200).json({ message: "귀하의 문의가 전송되었습니다." });
    } catch (error) {
        console.error("Error fetching inquiries: ", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}