import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken"
import { AuthPayload } from "../utils/interface";
import { getEnvirontmentVariable } from "../utils";

export default function authenticate(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authorization 헤더가 누락되었습니다." });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ message: "잘못된 Authorization 헤더 형식입니다." });
    }

    const token = parts[1];

    const secret = getEnvirontmentVariable("JWT_ACCESS_SECRET");
    if (!secret) {
        return res.status(500).json({ message: "서버 구성 오류." });
    }

    try {
        const decoded = jwt.verify(token, secret) as AuthPayload;
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: "잘못되었거나 만료된 토큰입니다." });
    }
}