'use server';

import { revalidatePath } from 'next/cache';
import { addFixedCost, deleteFixedCost, getFixedCosts, getDailyFixedCostTotal } from './_repositories/fixed-cost-repository';
import { getDailySales } from '../sales/_repositories/sales-repository';
import { getDailyExpenses, getExpenses } from '../expenses/_repositories/expenses-repository';
import { analyzePatterns } from './_utils/ai-analyzer';

export async function submitFixedCost(formData: FormData) {
    const name = formData.get('name') as string;
    const amount = Number(formData.get('amount'));

    if (!name || !amount) {
        return { error: 'Invalid data' };
    }

    try {
        await addFixedCost({ name, amount });
        revalidatePath('/dashboard');
        return { success: true };
    } catch (e) {
        return { error: 'Failed to add fixed cost' };
    }
}

export async function removeFixedCost(id: string) {
    try {
        await deleteFixedCost(id);
        revalidatePath('/dashboard');
        return { success: true };
    } catch (e) {
        return { error: 'Failed to delete' };
    }
}

export async function getDashboardData(storeId: string = 'default') {
    // 1. Get Today's Date (KST)
    const today = new Date();
    const kstOffset = 9 * 60;
    const kstDate = new Date(today.getTime() + (kstOffset * 60 * 1000));
    const dateStr = kstDate.toISOString().split('T')[0];

    // 2. Define Date Range (Last 7 Days)
    const sevenDaysAgo = new Date(kstDate);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const startDateStr = sevenDaysAgo.toISOString().split('T')[0];

    // 3. Fetch Real Data
    // Parallel fetch for efficiency
    const [dailySales, weeklySales, weeklyExpenses] = await Promise.all([
        getDailySales(dateStr, storeId === 'ALL' ? undefined : storeId),
        import('../sales/_repositories/sales-repository').then(m => m.getSalesRange(startDateStr, dateStr, storeId === 'ALL' ? undefined : storeId)),
        import('../expenses/_repositories/expenses-repository').then(m => m.getExpensesRange(startDateStr, dateStr, storeId === 'ALL' ? undefined : storeId))
    ]);

    // 4. Calculate Today's Stats
    const totalSales = dailySales.reduce((sum, item) => sum + item.amount, 0);
    const totalVariableCost = 0; // Keeping mock for now or fetch today's expenses if needed, but 'getDailySales' was used. Let's filter weeklyExpenses for today.
    // Actually, let's just use the weeklyExpenses array to find today's expenses.
    const todayExpenses = weeklyExpenses.filter(e => e.date === dateStr).reduce((sum, item) => sum + item.amount, 0);

    const dailyFixedCost = 0; // TODO: Implement fixed cost logic based on FixedCostRepository if needed, for now 0.
    const estimatedNetIncome = totalSales - todayExpenses;

    // 5. Build Today's Breakdown
    const breakdownMap: Record<string, number> = {};
    dailySales.forEach(sale => {
        const type = sale.type || 'manual';
        breakdownMap[type] = (breakdownMap[type] || 0) + sale.amount;
    });

    // 6. Build Weekly Profit Trend (Sales - Expenses)
    const days = ['월', '화', '수', '목', '금', '토', '일'];
    const trendMap: Record<string, { sales: number; expenses: number; date: Date }> = {};

    // Initialize map
    for (let i = 0; i < 7; i++) {
        const d = new Date(sevenDaysAgo);
        d.setDate(d.getDate() + i);
        const dStr = d.toISOString().split('T')[0];
        trendMap[dStr] = { sales: 0, expenses: 0, date: d };
    }

    // Fill Data
    weeklySales.forEach(s => {
        if (trendMap[s.date]) trendMap[s.date].sales += s.amount;
    });
    weeklyExpenses.forEach(e => {
        if (trendMap[e.date]) trendMap[e.date].expenses += e.amount;
    });

    // Convert to Array
    const weeklyTrend = Object.values(trendMap).sort((a, b) => a.date.getTime() - b.date.getTime()).map(item => {
        const dayName = days[item.date.getDay() === 0 ? 6 : item.date.getDay() - 1]; // Mon=0 in array
        return {
            date: dayName,
            amount: item.sales - item.expenses, // Profit
            sales: item.sales,     // Optional: for tooltip
            expenses: item.expenses // Optional: for tooltip
        };
    });

    return {
        date: dateStr,
        sales: totalSales,
        variableCost: todayExpenses,
        netIncome: estimatedNetIncome,
        breakdown: breakdownMap, // New Field
        alerts: [], // Remove mock alerts
        weeklyTrend,
        isAggregated: storeId === 'ALL'
    };
}

export async function getFixedCostList() {
    return await getFixedCosts();
}
