import jwt from "jsonwebtoken"
import ms from "ms"
import { AuthPayload } from "./interface"
import { getEnvirontmentVariable } from ".";

const Access_TTL = ms("1d") / 1000; //convert to seconds;

export function signAccessToken(payload: { id: AuthPayload["id"] }) {
    const accessSecret = getEnvirontmentVariable("JWT_ACCESS_SECRET");
    if (!accessSecret) {
        throw new Error("JWT_ACCESS_SECRET is not defined in environment variables.");
    }

    return jwt.sign(
        payload,
        accessSecret,
        { expiresIn: Access_TTL, algorithm: "HS256" }
    )
}