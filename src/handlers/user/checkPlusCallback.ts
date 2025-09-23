import { Request, Response } from "express";

export default async function checkPlusCallback(req: Request, res: Response) {
    const source = req.method === "POST" ? req.body : req.query;

    const enc_data = source.enc_data;
    const integrity_value = source.integrity_value;

    if (!enc_data || !integrity_value) {
        return res.status(400).send("Missing NICE data");
    }

    return res.redirect(
        `https://www.trusseon.com/checkPlusCallback?enc_data=${encodeURIComponent(enc_data)}&integrity_value=${encodeURIComponent(integrity_value)}`
    )
}