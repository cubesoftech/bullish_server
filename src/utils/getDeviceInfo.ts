import { Request } from "express";

export default function getDeviceInfo(req: Request) {
    let ipAddress = req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || "Unknown IP";
    const device = req.headers['user-agent']?.toString() || "Unknown Device";
    const rawReferrer = req.headers['referer'] || req.headers['referrer'] || null;

    if (ipAddress === "::1" || ipAddress === "127.0.0.1" || ipAddress === "::ffff:127.0.0.1") {
        ipAddress = "localhost"
    }

    const referrer = Array.isArray(rawReferrer) ? rawReferrer[0] : rawReferrer;

    return { ipAddress, device, referrer };
}