import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";

// ----------- QUEUES ---------- //
import { distributeInvestmentProfitQueue } from "../services/distributeInvestmentProfit";

export const bullMqExpressAdapter = new ExpressAdapter();

bullMqExpressAdapter.setBasePath("/workers");

createBullBoard({
    queues: [
        new BullMQAdapter(distributeInvestmentProfitQueue)
    ],
    serverAdapter: bullMqExpressAdapter
})