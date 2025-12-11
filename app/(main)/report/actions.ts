'use server';

import { createClient } from '@/app/_shared/utils/supabase/server';
import { FixedCost, getFixedCosts } from '../dashboard/_repositories/fixed-cost-repository';

export type MonthlyReportData = {
    year: number;
    month: number;
    totalSales: number;
    totalExpenses: number;
    totalFixedCost: number;
    netIncome: number;
    expenseByCategory: Record<string, number>;
    dailysales: { date: string; amount: number }[];
};

export async function getMonthlyReport(year: number, month: number): Promise<MonthlyReportData> {
    const supabase = await createClient();

    // 1. Define Date Range
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    // Last day of month
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    // 2. Fetch Sales
    const { data: sales } = await supabase
        .from('mvp_sales')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);

    // 3. Fetch Expenses (Variable)
    const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);

    // 4. Fetch Fixed Costs
    // Assumption: Fixed costs apply fully to the month if they exist
    const fixedCosts = await getFixedCosts();

    // Aggregation
    const totalSales = sales?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
    const totalFixedCost = fixedCosts.reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpenses = expenses?.reduce((acc, curr) => acc + curr.amount, 0) || 0;

    const expenseByCategory: Record<string, number> = {};
    expenses?.forEach(exp => {
        const cat = exp.category || '기타';
        expenseByCategory[cat] = (expenseByCategory[cat] || 0) + exp.amount;
    });

    const dailySalesMap: Record<string, number> = {};
    sales?.forEach(sale => {
        dailySalesMap[sale.date] = (dailySalesMap[sale.date] || 0) + sale.amount;
    });

    // Fill all days
    const dailysales = [];
    for (let i = 1; i <= lastDay; i++) {
        const d = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        dailysales.push({
            date: d,
            amount: dailySalesMap[d] || 0
        });
    }

    return {
        year,
        month,
        totalSales,
        totalExpenses,
        totalFixedCost,
        netIncome: totalSales - totalFixedCost - totalExpenses,
        expenseByCategory,
        dailysales
    };
}
