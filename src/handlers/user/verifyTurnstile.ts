import { Request, Response } from "express";
import axios from "axios";
import { getEnvirontmentVariable } from "../../utils";

interface VerifyTurnstilePayload {
    token: string
}

export default async function verifyTurnstile(req: Request, res: Response) {
    const { token } = req.body as VerifyTurnstilePayload;
    console.log("token: ", token)
    if (!token) {
        return res.status(400).json({ message: "Missing token" });
    }

    const secretKey = getEnvirontmentVariable("CLOUDFLARE_SECRET_KEY");

    try {
        const { data } = await axios.post(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            new URLSearchParams({
                secret: secretKey,
                response: token,
            }).toString(),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }
        )

        if (data.success) {
            return res.status(200).json({ message: "Verification successful" });
        } else {
            return res.status(400).json({ message: "Verification failed" });
        }
    } catch (error) {
        console.log("Error on verifyTurnstile: ", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}