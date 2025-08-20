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


interface InvestmentWIthAdditionalDataProps {
    amount: number;
    createdAt: Date;
    series: Series
}
interface Series {
    periods: series_periods[];
    rate: series_rate | null;
}

export interface EstimatedValues {
    duration: string;
    value: number;
    afterTax: number;

}

// before editing this helper function keep in mind that this is being used in the ff:
// src/handlers/admin/getSeriesLog.ts
// src/handlers/admin/updateSeriesStatus.ts

export function getInvestmentAdditionalData(investment: InvestmentWIthAdditionalDataProps) {
    const { periods, rate } = investment.series

    let isOnPeakSeason: boolean = true;

    const minRate = (rate?.minRate || 0) / 100; // convert minRate to decimal
    let settlementRate = minRate * (isOnPeakSeason ? 1.2 : 0.8);
    let peakSettlementRate = minRate * 1.2;
    let leanSettlementRate = minRate * 0.8;
    if (investment.amount >= 100_000_000 && investment.amount < 300_000_000) {
        settlementRate = 2.5 / 100; // 2.5% for investments above 100 million
        peakSettlementRate = 2.5 / 100; // 2.5% for investments above 100 million
        leanSettlementRate = 2.5 / 100; // 2.5% for investments above 100 million
    } else if (investment.amount >= 300_000_000 && investment.amount < 500_000_000) {
        settlementRate = 3 / 100; // 3% for investments above 300 million
        peakSettlementRate = 3 / 100; // 3% for investments above 300 million
        leanSettlementRate = 3 / 100; // 3% for investments above 300 million
    } else if (investment.amount >= 500_000_000) {
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