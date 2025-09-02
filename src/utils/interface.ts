export interface AuthPayload {
    id: string;
}
export interface TransactionPayload {
    amount: number
}

export interface MonthlyDeposit {
    month: number;
    year: number;
    totalAmount: number;
    totalCount: number;
}
export interface YearlyDeposit {
    year: number;
    months: MonthlyDeposit[];
}