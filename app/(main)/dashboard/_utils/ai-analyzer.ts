import { Expense } from '../../expenses/_repositories/expenses-repository';

export type Alert = {
    category: string;
    avgInterval: number;
    daysSinceLast: number;
    message: string;
    severity: 'warning' | 'critical';
};

export function analyzePatterns(expenses: Expense[]): Alert[] {
    if (!expenses || expenses.length < 5) return []; // Need some data to analyze

    // 1. Group by Category (or MerchantName for detailed analysis)
    // For MVP, let's look at 'Merchant Name' as it's more specific (e.g. "Wholesale Market")
    const grouped: Record<string, string[]> = {};

    expenses.forEach(exp => {
        if (!grouped[exp.merchant_name]) grouped[exp.merchant_name] = [];
        grouped[exp.merchant_name].push(exp.date);
    });

    const alerts: Alert[] = [];
    const today = new Date();

    Object.entries(grouped).forEach(([merchant, dates]) => {
        if (dates.length < 3) return; // Ignore if too few data points

        // Sort dates descending
        const sortedDates = dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

        // Calculate Intervals
        const intervals: number[] = [];
        for (let i = 0; i < sortedDates.length - 1; i++) {
            const diffTime = new Date(sortedDates[i]).getTime() - new Date(sortedDates[i + 1]).getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            intervals.push(diffDays);
        }

        // Calculate Average Interval
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

        // Calculate Days Since Last Purchase
        const lastDate = new Date(sortedDates[0]);
        const daysSinceLast = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        // Rule: If elapsed time > 1.8x average interval (margin for error), Trigger Alert
        if (daysSinceLast > avgInterval * 1.8 && daysSinceLast >= 2) {
            alerts.push({
                category: merchant,
                avgInterval: Math.round(avgInterval),
                daysSinceLast,
                message: `'${merchant}' 방문하신 지 ${daysSinceLast}일 지났어요! (보통 ${Math.round(avgInterval)}일마다 방문)`,
                severity: daysSinceLast > avgInterval * 2.5 ? 'critical' : 'warning'
            });
        }
    });

    return alerts;
}
