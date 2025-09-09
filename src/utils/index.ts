import crypto from 'crypto';
import { prisma } from "./prisma";
import { series_periods, series_rate } from '@prisma/client';

export function generateRandomString(length: number): string {
    return crypto.randomUUID().slice(0, length);
}

export function maskEmail(email: string) {
    const [name, domain] = email.split("@");
    if (name.length <= 3) {
        return name[0] + "***@" + domain
    } else {
        return name.substring(0, 3) + "***@" + domain
    }
}

export async function findUser(userId: string) {
    return await prisma.users.findUnique({
        where: { id: userId }
    });
}

export async function findAdmin(adminId: string) {
    return await prisma.admin.findUnique({
        where: { id: adminId }
    });
}

export function getEnvirontmentVariable(key: string) {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Environment variable ${key} is not set.`);
    }
    return value;
}

interface Investment {
    amount: number;
    createdAt: Date;
    series: Series
}
interface Series {
    periods: series_periods[];
    rate: series_rate | null;
}
interface InvestmentWIthAdditionalDataProps extends Investment {
    userTotalInvestmentAmount: number;
}

export interface EstimatedValues {
    duration: string;
    value: number;
    afterTax: number;

}

// before editing this helper function keep in mind that this is being used in the ff:
// src/handlers/admin/updateSeriesStatus.ts
// src/handlers/admin/getUserDetails.ts
export function getInvestmentAdditionalData(investment: InvestmentWIthAdditionalDataProps) {
    const { periods, rate } = investment.series

    let isOnPeakSeason: boolean = true;

    const minRate = (rate?.minRate || 0) / 100; // convert minRate to decimal

    let settlementRate = minRate * (isOnPeakSeason ? 1.2 : 0.8);
    let peakSettlementRate = minRate * 1.2;
    let leanSettlementRate = minRate * 0.8;

    if (investment.userTotalInvestmentAmount >= 100_000_000 && investment.userTotalInvestmentAmount < 300_000_000) {
        settlementRate = 2.5 / 100; // 2.5% for investments above 100 million
        peakSettlementRate = 2.5 / 100; // 2.5% for investments above 100 million
        leanSettlementRate = 2.5 / 100; // 2.5% for investments above 100 million
    } else if (investment.userTotalInvestmentAmount >= 300_000_000 && investment.userTotalInvestmentAmount < 500_000_000) {
        settlementRate = 3 / 100; // 3% for investments above 300 million
        peakSettlementRate = 3 / 100; // 3% for investments above 300 million
        leanSettlementRate = 3 / 100; // 3% for investments above 300 million
    } else if (investment.userTotalInvestmentAmount >= 500_000_000) {
        settlementRate = 3.3 / 100; // 3.3% for investments above 500 million
        peakSettlementRate = 3.3 / 100; // 3.3% for investments above 500 million
        leanSettlementRate = 3.3 / 100; // 3.3% for investments above 500 million
    }

    const monthlyProfit = investment.amount * settlementRate

    const estimatedValues: EstimatedValues[]
        = periods.map(period => {
            const value = monthlyProfit * period.period
            return {
                duration: period.period + "개월",
                value,
                afterTax: value * (1 - 0.154),
            }
        });
    const lastPeriod = periods[0].period;
    // last month = maturity date?
    const maturityDate = new Date(
        new Date(investment.createdAt).setMonth(
            new Date(investment.createdAt).getMonth() + lastPeriod
        )
    );
    const totalEstimatedProfit = monthlyProfit * lastPeriod

    return {
        monthly: monthlyProfit,
        settlementRate,
        estimatedValues,
        peakSettlementRate,
        leanSettlementRate,
        maturityDate,
        totalEstimatedProfit
    }
}

// before editing this helper function keep in mind that this is being used in the ff:
// src/handlers/admin/getSeriesLog.ts
export function getInvestmentAdditionalData2(investment: Investment) {
    const { periods, rate } = investment.series

    const rateMinRate = rate?.minRate || 0
    const rateMaxRate = rate?.maxRate || 0

    const convertedMinRateValue = rateMinRate / 100; // convert minRate to decimal
    const convertedMaxRateValue = rateMaxRate / 100; // convert maxRate to decimal

    let isOnPeakSeason: boolean = true;

    const minRate = convertedMinRateValue; // convert minRate to decimal

    let settlementRate = minRate * (isOnPeakSeason ? 1.2 : 0.8);
    let peakSettlementRate = minRate * 1.2;
    let leanSettlementRate = minRate * 0.8;

    // adjust settlement rate
    if (settlementRate > convertedMaxRateValue) {
        settlementRate = convertedMaxRateValue
    }
    if (settlementRate < convertedMinRateValue) {
        settlementRate = convertedMinRateValue
    }

    // adjust peak settlement rate
    if (peakSettlementRate > convertedMaxRateValue) {
        peakSettlementRate = convertedMaxRateValue
    }

    // adjust lean settlement rate
    if (leanSettlementRate < convertedMinRateValue) {
        leanSettlementRate = convertedMinRateValue
    }

    const monthlyProfit = investment.amount * settlementRate
    const estimatedValues: EstimatedValues[]
        = periods.map(period => {
            const value = monthlyProfit * period.period
            return {
                duration: period.period + "개월",
                value,
                afterTax: value * (1 - 0.154),
            }
        });

    const lastPeriod = periods[0].period;
    const maturityDate = new Date(
        new Date(investment.createdAt).setMonth(
            new Date(investment.createdAt).getMonth() + lastPeriod
        )
    );
    const totalEstimatedProfit = (monthlyProfit * lastPeriod) * (1 - 0.154)

    return {
        monthly: monthlyProfit,
        settlementRate,
        estimatedValues,
        peakSettlementRate,
        leanSettlementRate,
        maturityDate,
        totalEstimatedProfit
    }
}