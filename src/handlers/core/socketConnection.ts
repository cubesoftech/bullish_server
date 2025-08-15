import { DefaultEventsMap, Socket } from "socket.io";
import { io } from "../..";

const onlineUsers = new Map<string, string>();

export default function socketConnection(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
    socket.on("login", (userId: string) => {
        onlineUsers.set(userId, socket.id);
    });

    socket.on("disconnect", () => {
        for (const [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);
            }
        }
    });
}

export const notifyOnlineUsers = (userId: string) => {
    const socketId = onlineUsers.get(userId);
    if (socketId) {
        io.to(socketId).emit("new_message");
        console.log(`Message Notification sent to user ${userId} with socket ID: ${socketId}`);
    }
}