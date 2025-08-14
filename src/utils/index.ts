import crypto from 'crypto';

export function generateRandomString(length: number): string {
    return crypto.randomUUID().slice(0, length);
}