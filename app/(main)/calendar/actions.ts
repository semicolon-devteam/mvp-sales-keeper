'use server';

import { getMonthlySales } from '../sales/_repositories/sales-repository';
import { getMonthlyExpenses } from '../expenses/_repositories/expenses-repository';

export async function getMonthlyData(date: Date, storeId?: string) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    const [sales, expenses] = await Promise.all([
        getMonthlySales(year, month, storeId),
        getMonthlyExpenses(year, month, storeId)
    ]);

    // Group by date
    const dataMap = new Map<string, { sales: number; expense: number }>();

    sales.forEach(s => {
        const date = s.date;
        const current = dataMap.get(date) || { sales: 0, expense: 0 };
        current.sales += s.amount;
        dataMap.set(date, current);
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
