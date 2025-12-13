'use server';

import { revalidatePath } from 'next/cache';
import { addFixedCost, deleteFixedCost, getFixedCosts } from './_repositories/fixed-cost-repository';
import { getDailySales } from '../sales/_repositories/sales-repository';
import { getDailyExpenses } from '../expenses/_repositories/expenses-repository';

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
    try {
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
        const [dailySalesData, weeklySalesData, weeklyExpensesData] = await Promise.all([
            getDailySales(dateStr, storeId === 'ALL' ? undefined : storeId).catch(() => []),
            import('../sales/_repositories/sales-repository').then(m => m.getSalesRange(startDateStr, dateStr, storeId === 'ALL' ? undefined : storeId)).catch(() => []),
            import('../expenses/_repositories/expenses-repository').then(m => m.getExpensesRange(startDateStr, dateStr, storeId === 'ALL' ? undefined : storeId)).catch(() => [])
        ]);

        const dailySales = dailySalesData || [];
        const weeklySales = weeklySalesData || [];
        const weeklyExpenses = weeklyExpensesData || [];

        // 4. Calculate Today's Stats
        const totalSales = dailySales.reduce((sum: number, item: any) => sum + item.amount, 0);
        const todayExpenses = weeklyExpenses.filter((e: any) => e.date === dateStr).reduce((sum: number, item: any) => sum + item.amount, 0);

        const estimatedNetIncome = totalSales - todayExpenses;

        // 5. Build Today's Breakdown
        const breakdownMap: Record<string, number> = {};
        dailySales.forEach((sale: any) => {
            const type = sale.type || 'manual';
            breakdownMap[type] = (breakdownMap[type] || 0) + sale.amount;
        });

        // 6. Check Upcoming Fixed Costs
        const fixedCosts = await getFixedCosts(storeId === 'ALL' ? undefined : storeId);
        const alerts: { message: string, type: string }[] = [];

        const currentDay = kstDate.getDate();
        fixedCosts.forEach((wc: any) => {
            const diff = wc.day_of_month - currentDay;
            if (diff >= 0 && diff <= 3) { // Due within 3 days
                const dDay = diff === 0 ? '오늘' : `${diff}일 뒤`;
                alerts.push({
                    message: `${wc.name} ${Number(wc.amount).toLocaleString()}원 (${dDay}) 예정`,
                    type: 'cost'
                });
            }
        });

        // 7. Build Weekly Profit Trend (Sales - Expenses)
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
        weeklySales.forEach((s: any) => {
            if (trendMap[s.date]) trendMap[s.date].sales += s.amount;
        });
        weeklyExpenses.forEach((e: any) => {
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
            breakdown: breakdownMap,
            alerts: alerts,
            weeklyTrend,
            isAggregated: storeId === 'ALL'
        };
    } catch (e) {
        console.error("Dashboard Data Error:", e);
        // Default Fallback
        return {
            date: new Date().toISOString().split('T')[0],
            sales: 0,
            variableCost: 0,
            netIncome: 0,
            breakdown: {},
            alerts: [],
            weeklyTrend: [],
            isAggregated: false
        };
    }
}

export async function getFixedCostList() {
    return await getFixedCosts();
}
