import express from 'express';
import { createServer } from 'node:http';
import cors from 'cors';
import { Server } from "socket.io"

import userRoute from "./routes/user"
import adminRoute from "./routes/admin"

import { getEnvirontmentVariable } from './helpers';
import initializeExecuteTradeJob from './jobs/executeTrade';
import socketConnection from './controllers/core/socketConnection';
import error from './middlewares/error';
import generateTradingData from './controllers/core/generateTradingData';
import initializeNasdaqSchedules from './jobs/nasdaqSchedules';


const port = getEnvirontmentVariable('PORT') || 4000;
const app = express();
const server = createServer(app);

app.use(cors());
app.use(express.json());

export const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})

app.get('/', (req, res) => {
    res.send('Running...');
})
app.get('/generateTradingData', generateTradingData)

app.use("/user", userRoute)
app.use("/admin", adminRoute)

// custom error middleware
app.use(error)

server.listen(port, () => {
    const NODE_ENV = getEnvirontmentVariable('NODE_ENV');

    if (NODE_ENV === "development") {
        console.log(`Server is running on http://localhost:${port}`);
    }
});

// Initialize background jobs
initializeExecuteTradeJob();
socketConnection();
initializeNasdaqSchedules();