import { DefaultEventsMap, Socket } from "socket.io";
import { io } from "../..";
import redis from "../../utils/redis";
import { prisma } from "../../utils/prisma";

type SocketType = Socket<
    DefaultEventsMap,
    DefaultEventsMap,
    DefaultEventsMap,
    any
>;

export default function socketConnection(socket: SocketType) {
    socket.on("login", async (userId: string) => {
        await redis.set(`user:${userId}:socket`, socket.id);
        await redis.set(`socket:${socket.id}:user`, userId);
        console.log(`User ${userId} connected with socket ID: ${socket.id}`);
    });
    socket.on("logout", async (userId: string) => {
        const storedSocketId = await redis.get(`user:${userId}:socket`)
        if (storedSocketId && storedSocketId === socket.id) {
            await redis.del(`user:${userId}:socket`);
            await redis.del(`socket:${socket.id}:user`);
            console.log(`User ${userId} logged out.`)
        }
    })

    socket.on("disconnect", async () => {
        const userId = await redis.get(`socket:${socket.id}:user`);
        if (userId) {
            await redis.del(`user:${userId}:socket`);
            await redis.del(`socket:${socket.id}:user`);
            console.log(`User ${userId} disconnected and removed socket ID: ${socket.id}`);
            return;
        }
    });
}

export const notifyOnlineUsers = async (userId: string) => {
    const socketId = await redis.get(`user:${userId}:socket`);
    if (socketId) {
        io.to(socketId).emit("new_message");
        console.log(`Message Notification sent to user ${userId} with socket ID: ${socketId}`);
    }
}
export const notifyAdmin = async () => {
    const admins = await prisma.admin.findMany()

    for (const admin of admins) {
        const socketId = await redis.get(`user:${admin.id}:socket`);
        if (socketId) {
            io.to(socketId).emit("admin_notification");
            console.log(`Admin Notification sent to admin ${admin.id} with socket ID: ${socketId}`);
        }
    }
}