import crypto from 'crypto';
import prisma from './prisma';
import { Prisma } from '@prisma/client';

export const getEnvirontmentVariable = (key: string) => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing environment variable: ${key}`);
    }
    return value;
}

export function generateRandomString(length: number): string {
    return crypto.randomUUID().slice(0, length);
}

export function generateRandomStringV2(length?: number) {
    const string = Math.floor(Math.random() * 1000000).toString()

    if (length) {
        return string.slice(0, length)
    } else {
        return string
    }
}

export function generateReferralCode() {
    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    const charactersLength = characters.length;
    for (let i = 0; i < 5; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

export async function getUserData({ userId, select }: { userId: string, select?: Prisma.membersSelect }) {
    if (select !== undefined) {
        return await prisma.members.findUnique({
            where: {
                id: userId,
            },
            select: select,
        })
    } else {
        return await prisma.members.findUnique({
            where: {
                id: userId,
            },
        })
    }
}