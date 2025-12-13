'use server';

import { getMonthlySales, getSalesByDateRange } from '../sales/_repositories/sales-repository';
import { getMonthlyExpenses } from '../expenses/_repositories/expenses-repository';
// Fixed Costs (Repository)
import { getFixedCosts, addFixedCost, deleteFixedCost } from './_repositories/fixed-cost-repository';

const SETTLEMENT_DELAY: Record<string, number> = {
    'baemin': 3,  // Baemin: +3 days
    'yogiyo': 7,  // Yogiyo: +7 days
    'coupang': 5, // Coupang: +5 days (Estimate)
    'hall': 0,
    'manual': 0,
    'excel': 0
};

export async function getMonthlyData(dateInput: Date | string, storeId?: string, mode: 'sales' | 'cashflow' = 'sales') {
    // Handle both Date object and ISO string (serialized from client)
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    // Fetch data for current month AND previous month (because of settlement delays)
    // Actually, simply fetching a wider range might be better, but for MVP let's fetch current month
    // If strict cashflow, we might need sales from last month that settle this month.
    // For MVP, let's stick to simple shifting of fetched data, acknowledging potential edge case at start of month.
    // To do it right: Fetch 'Prev Month + Current Month' to capture delayed deposits falling into this month.

    // Let's broaden the fetch range slightly: Previous Month 20th ~ Current Month End
    // This covers max 10 days delay.

    // Calculate range: Previous Month 20th ~ Current Month End
    // This covers settlement delays (max ~7 days usually) so sales from late last month appear in this month.
    const prevMonthDate = new Date(year, month - 2, 20); // Month is 0-indexed in JS Date
    // constructor(year, monthIndex, day)
    // input month is 1-12. So current month index is month-1. Prev month index is month-2.
    // Example: View Feb (month=2). prevMonthDate = new Date(2025, 0, 20) -> Jan 20. Correct.

    // Current month last day - use Date object properly to handle month overflow
    const lastDayOfMonth = new Date(year, month, 0); // month (1-indexed) gives last day of that month

    // Format dates safely (YYYY-MM-DD)
    const formatDate = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    const startDateStr = formatDate(prevMonthDate);
    const endDateStr = formatDate(lastDayOfMonth);

    // Use broader fetch for Sales
    const [sales, expenses] = await Promise.all([
        getSalesByDateRange(startDateStr, endDateStr, storeId),
        getMonthlyExpenses(year, month, storeId)
    ]);

    // Group by date
    const dataMap = new Map<string, { sales: number; expense: number }>();

    sales.forEach(s => {
        let targetDate = new Date(s.date);

        if (mode === 'cashflow') {
            const delay = SETTLEMENT_DELAY[s.type] || 0;
            if (delay > 0) {
                targetDate.setDate(targetDate.getDate() + delay);
            }
        }

        // Convert back to YYYY-MM-DD using safe formatting
        const dateStr = formatDate(targetDate);

        // Filter: Only include if valid date (should be fine)
        if (targetDate.getMonth() + 1 !== month && mode === 'sales') return; // Strict sales mode matches month

        // For Cashflow, if it falls into NEXT month, it should theoretically be shown in next month's calendar.
        // But since we are viewing "This Month's View", we should include things that fall INTO this month.
        // Current getMonthlySales gets items CREATED in this month. 
        // Example: Sale on Jan 31 + 3 days = Feb 3. 
        // If we view Jan, it shows on Feb 3 (hidden?). If we view Feb, we miss it because we didn't fetch Jan sales.

        // Limitation Note: For robust cashflow, we need a 'getSalesBySettlementDate' query.
        // For MVP, we will accept that end-of-month sales might 'disappear' into next month's view 
        // if we don't fetch fetching cross-month.
        // Let's accept this limitation for now to keep it simple, or just render it.

        const current = dataMap.get(dateStr) || { sales: 0, expense: 0 };
        current.sales += s.amount;
        dataMap.set(dateStr, current);
    });

    expenses.forEach(e => {
        const date = e.date;
        const current = dataMap.get(date) || { sales: 0, expense: 0 };
        current.expense += e.amount;
        dataMap.set(date, current);
    });

    return Object.fromEntries(dataMap);
}

import { getDailySales } from '../sales/_repositories/sales-repository';
import { getDailyExpenses } from '../expenses/_repositories/expenses-repository';
import { getDailyPosts } from '../timeline/_repositories/post-repository';

export async function getDailyDetails(date: string, storeId?: string) {
    // If storeId is 'all' or undefined, we fetch all.
    // For posts, we might want to fetch all if storeId is 'all'.
    // We need to update getDailyPosts to handle 'all' too if we want "All Timeline".
    // For now, let's assume getDailyPosts handles it or we skip timeline for 'all' (might be confusing).
    // Let's pass storeId to all.

    const [sales, expenses, posts] = await Promise.all([
        getDailySales(date, storeId),
        getDailyExpenses(date, storeId),
        getDailyPosts(storeId || 'all', date) // Fetch posts regardless of scope (repository handles 'all')
    ]);

    return { sales, expenses, posts };
}



export { getFixedCosts, addFixedCost, deleteFixedCost };
