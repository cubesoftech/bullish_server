import express from 'express';
import { createServer } from 'node:http';
import cors from 'cors';
import { Server } from "socket.io";
import redis from './utils/redis';

import socketConnection from './handlers/core/socketConnection';
import UserRoute from './routes/user';
import AdminRoute from './routes/admin';

import { bullMqExpressAdapter } from './routes/workers';
import { initDistributeInvestmentProfit } from './services/distributeInvestmentProfit';
import { initUpdateUserMonthlyProfit } from './services/updateUserMonthyProfit';

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

app.get('/', (req, res) => {
    res.send('Running...');
});

app.use('/user', UserRoute);
app.use('/admin', AdminRoute);
app.use("/workers", bullMqExpressAdapter.getRouter())

redis.on("connect", () => {
    initDistributeInvestmentProfit();
    // initUpdateUserMonthlyProfit();
    console.log("Redis: Connected!")
})
redis.on("error", (err) => {
    console.error("Redis: Error ", err);
})

io.on("connection", socketConnection);

server.listen(port, () => {
    console.log(`Time started: ${new Date().toISOString()}`);
    console.log(`Server running on http://localhost:${port}`);
})