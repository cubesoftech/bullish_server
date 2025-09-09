import nodemailer from "nodemailer"
import { getEnvirontmentVariable } from ".";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: getEnvirontmentVariable("NODEMAILER_USER"),
        pass: getEnvirontmentVariable("NODEMAILER_PASS"),
    },
});
export default transporter;