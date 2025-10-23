import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { generateRandomString } from "../../utils";
import { findUser } from "../../utils";
import { notifyAdmin } from "../core/socketConnection";

interface CreateInquiryPayload {
    name: string;
    phoneNumber: string;
    content: string;
}

export default async function createInquiry(req: Request, res: Response) {
    const { user } = req
    const { name, content, phoneNumber } = req.body as CreateInquiryPayload;

    // the name and phoneNumber are required only for unauthenticated users
    if (!user && (!name || name.trim() === "" || !phoneNumber || phoneNumber.trim() === "")) {
        return res.status(400).json({ message: "이름과 연락처는 필수 입력 사항입니다." });
    }

    if (!content || content.trim() === "") {
        return res.status(400).json({ message: "잘못된 문의 필드입니다." });
    }

    try {

        let processedName = "";
        let processedPhoneNumber = "";

        // if authenticated, use the user info
        if (user) {
            const userInfo = await prisma.users.findUnique({
                where: {
                    id: user.id
                }
            })
            if (!userInfo) {
                return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
            }

            processedName = userInfo.name;
            processedPhoneNumber = userInfo.phoneNumber;
        } else {
            // if not authenticated, use the phone number to find if a user exists
            const userInfo = await prisma.users.findFirst({
                where: {
                    phoneNumber: phoneNumber
                }
            })

            processedName = userInfo ? userInfo.name : name;
            processedPhoneNumber = userInfo ? userInfo.phoneNumber : phoneNumber;
        }

        // check if a user exist using either user id or phone number
        const isExistingUser = await prisma.users.findFirst({
            where: {
                OR: [
                    {
                        id: user?.id
                    },
                    {
                        phoneNumber: processedPhoneNumber
                    }
                ]
            }
        })

        await prisma.inquiry_log.create({
            data: {
                id: generateRandomString(7),
                reply: "",
                content: content,
                userId: isExistingUser ? isExistingUser.id : null,
                name: processedName,
                phoneNumber: processedPhoneNumber,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        });

        await notifyAdmin();

        return res.status(200).json({ message: "문의가 성공적으로 생성되었습니다." });
    } catch (error) {
        console.error("Error creating inquiry: ", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}