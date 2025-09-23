import { Response, Request } from "express";
import { prisma } from "../../utils/prisma";
import transporter from "../../utils/nodemailer";
import { generateRandomString, getEnvirontmentVariable } from "../../utils";
import { maskEmail } from "../../utils";

interface SendOTPPayload {
    phoneNumber: string;
}

export default async function sendOTP(req: Request, res: Response) {
    const { phoneNumber } = req.body as SendOTPPayload

    if (
        !phoneNumber || phoneNumber.trim() === ""
    ) {
        return res.status(400).json({ message: "전화번호는 필수입니다." });
    }

    try {

        const user = await prisma.users.findFirst({
            where: {
                phoneNumber
            }
        })
        if (!user) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." })
        }

        const otp = generateRandomString(7)

        await prisma.otp.upsert({
            where: {
                userId: user.id
            },
            update: {
                otp,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000), //expires in 10 mins
                updatedAt: new Date(),
            },
            create: {
                id: generateRandomString(7),
                userId: user.id,
                otp,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000), //expires in 10 mins
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        })

        await transporter.sendMail({
            from: getEnvirontmentVariable("NODEMAILER_USER"),
            to: "",
            subject: "Password Reset",
            text: `Your OTP is ${otp}`,
            html: `
                <h1>OTP Verification</h1>
                <p>Your OTP code is: <b>${otp}</b></p>
                <p>This code will expire in 10 minutes.</p>
            `,
        })

        const maskedEmail = maskEmail("");

        return res.status(200).json({ message: `OTP sent to ${maskedEmail}` });
    } catch (error) {
        console.error("Error sending OTP: ", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}