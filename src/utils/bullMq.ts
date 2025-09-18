import { QueueBaseOptions, Queue, Worker, Job, WorkerOptions } from "bullmq"
import { redisOptions } from "./redis"

const oneDayInSeconds = 1000 * 60 * 60 * 24

export const workerNames = {
    distributeInvestmentProfit: "Distribute Investment Profit",
    distributeMonthlyReferrerReward: "Distribute Monthly Referrer Reward",
    distributeMonthlySettlementRate: "Distribute Monthly Settlement Rate",
}
export const bullMqConnectionOptions: QueueBaseOptions = {
    connection: redisOptions
}

// ---------- HELPERS ----------
export const createQueue = (name: string) => {
    return new Queue(name, bullMqConnectionOptions);
};
export const createWorker = (
    name: string,
    processor: (job: Job) => Promise<any>,
    options?: WorkerOptions
) => {
    return new Worker(
        name,
        processor,
        options
            ? {
                ...bullMqConnectionOptions,
                ...options
            }
            : {
                ...bullMqConnectionOptions,
                concurrency: 1,
                removeOnComplete: {
                    age: oneDayInSeconds, // 1 day,
                    count: 1000, // keep last 1000 completed jobs
                },
                removeOnFail: {
                    age: oneDayInSeconds, // 1 day,
                    count: 1000, // keep last 1000 failed jobs
                }
            }
    );
};