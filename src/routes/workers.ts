import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";

// ----------- QUEUES ---------- //
import { distributeInvestmentProfitQueue } from "../services/distributeInvestmentProfit";
import { distributeMonthlyReferrerRewardQueue } from "../services/distributeMonthyReferrerReward";
import { distributeMonthlySettlementRateQueue } from "../services/distributeMonthlySettlementRate";

export const bullMqExpressAdapter = new ExpressAdapter();

bullMqExpressAdapter.setBasePath("/workers");

createBullBoard({
    queues: [
        new BullMQAdapter(distributeInvestmentProfitQueue),
        new BullMQAdapter(distributeMonthlyReferrerRewardQueue),
        new BullMQAdapter(distributeMonthlySettlementRateQueue),
    ],
    serverAdapter: bullMqExpressAdapter
})