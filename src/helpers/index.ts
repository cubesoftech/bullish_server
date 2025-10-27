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