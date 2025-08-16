import crypto from 'crypto';
import { prisma } from "./prisma";

export function generateRandomString(length: number): string {
    return crypto.randomUUID().slice(0, length);
}

export function maskEmail(email: string) {
    const [name, domain] = email.split("@");
    if (name.length <= 3) {
        return name[0] + "***@" + domain
    } else {
        return name.substring(0, 3) + "***@" + domain
    }
}

export async function findUser(userId: string) {
    return await prisma.users.findUnique({
        where: { id: userId }
    });
}

export async function findAdmin(adminId: string) {
    return await prisma.admin.findUnique({
        where: { id: adminId }
    });
}