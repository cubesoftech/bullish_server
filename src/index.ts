import express from 'express';
import { createServer } from 'node:http';
import cors from 'cors';
import { Server } from "socket.io";

import UserRoute from './routes/user';
import AdminRoute from './routes/admin';

const port = process.env.PORT ?? 8010;
const app = express();
const server = createServer(app);

app.use(cors());
app.use(express.json());

const onlineUsers = new Map<string, string>();

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

export const notifyOnlineUsers = (userId: string) => {
    const socketId = onlineUsers.get(userId);
    console.log("user: ", userId)
    if (socketId) {
        io.to(socketId).emit("new_message", {
            message: "You have a new message",
        });
        console.log(`Message Notification sent to user ${userId} with socket ID: ${socketId}`);
    }
}

io.on("connection", (socket) => {
    socket.on("login", (userId: string) => {
        onlineUsers.set(userId, socket.id);
        console.log(`User logged in: ${userId} with socket ID: ${socket.id}`);
    });

    socket.on("disconnect", () => {
        for (const [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);
                console.log(`User ${userId} disconnected`);
            }
        }
    });
});

app.get('/', (req, res) => {
    res.send('Running...');
});

app.use('/user', UserRoute);
app.use('/admin', AdminRoute);

server.listen(port, () => {
    console.log(`Time started: ${new Date().toISOString()}`);
    console.log(`Server running on http://localhost:${port}`);
})