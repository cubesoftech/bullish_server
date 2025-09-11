import { DefaultEventsMap, Socket } from "socket.io";
import { io } from "../..";
import redis, { redisOptions } from "../../utils/redis";
import { prisma } from "../../utils/prisma";

type SocketType = Socket<
    DefaultEventsMap,
    DefaultEventsMap,
    DefaultEventsMap,
    any
>;

export default function socketConnection(socket: SocketType) {
    socket.on("login", async (userId: string) => {
        const isMember = await redis.sismember(`user:${userId}:sockets`, socket.id);
        if (isMember) {
            console.log(`User ${userId} already has socket ID: ${socket.id}`);
            return;
        }
        await redis.sadd(`user:${userId}:sockets`, socket.id);
        await redis.set(`socket:${socket.id}:user`, userId);
        console.log(`User ${userId} connected with socket ID: ${socket.id}`);
    });
    socket.on("logout", async (userId: string) => {
        const isMember = await redis.sismember(`user:${userId}:sockets`, socket.id);
        if (isMember) {
            await redis.srem(`user:${userId}:sockets`, socket.id);
            await redis.del(`socket:${socket.id}:user`);
            console.log(`User ${userId} logged out and removed socket ID: ${socket.id}`);
            return;
        }
    })

    socket.on("disconnect", async () => {
        const userId = await redis.get(`socket:${socket.id}:user`);
        if (userId) {
            await redis.srem(`user:${userId}:sockets`, socket.id);
            await redis.del(`socket:${socket.id}:user`);
            console.log(`User ${userId} disconnected and removed socket ID: ${socket.id}`);
            return;
        }
    });
}

export const notifyOnlineUsers = async (userId: string) => {
    const socketIds = await redis.smembers(`user:${userId}:sockets`);
    for (const socketId of socketIds) {
        io.to(socketId).emit("new_message");
        console.log(`Message Notification sent to user ${userId} with socket ID: ${socketId}`);
    }
}
export const notifyAdmin = async () => {
    const admins = await prisma.admin.findMany()

    for (const admin of admins) {
        const socketIds = await redis.smembers(`user:${admin.id}:sockets`);
        for (const socketId of socketIds) {
            io.to(socketId).emit("admin_notification");
            console.log(`Admin Notification sent to admin ${admin.id} with socket ID: ${socketId}`);
        }
    }
}