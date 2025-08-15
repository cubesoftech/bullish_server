import express from 'express';
import { createServer } from 'node:http';
import cors from 'cors';
import { Server } from "socket.io";

import socketConnection from './handlers/core/socketConnection';
import UserRoute from './routes/user';
import AdminRoute from './routes/admin';

const port = process.env.PORT ?? 8010;
const app = express();
const server = createServer(app);

app.use(cors());
app.use(express.json());

export const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

io.on("connection", socketConnection);

app.get('/', (req, res) => {
    res.send('Running...');
});

app.use('/user', UserRoute);
app.use('/admin', AdminRoute);

server.listen(port, () => {
    console.log(`Time started: ${new Date().toISOString()}`);
    console.log(`Server running on http://localhost:${port}`);
})