import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";

import { executeTradesV2Queue } from "../jobs/executeTradesV2";

export const bullMqExpressAdapter = new ExpressAdapter();

bullMqExpressAdapter.setBasePath("/workers")

createBullBoard({
    queues: [
        new BullMQAdapter(executeTradesV2Queue)
    ],
    serverAdapter: bullMqExpressAdapter
})