import { prisma } from "./prisma";

export default async function findAdmin(adminId: string) {
    return await prisma.admin.findFirst({
        where: { id: adminId }
    });
}