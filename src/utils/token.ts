import jwt from "jsonwebtoken"
import ms from "ms"
import { AuthPayload } from "./interface"

const Access_TTL = ms("1d");

export function signAccessToken(payload: { id: AuthPayload["id"] }) {
    return jwt.sign(
        payload,
        process.env.JWT_ACCESS_SECRET!,
        { expiresIn: Access_TTL, algorithm: "HS256" }
    )
}