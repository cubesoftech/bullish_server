import { prisma } from "./prisma";

export default async function findUser(userId: string) {
    return await prisma.users.findFirst({
        where: { id: userId }
    });
}