'use server';

import { createClient } from '@/app/_shared/utils/supabase/server';
import dayjs from 'dayjs';

export type FinancialSnapshot = {
    revenue: number;
    laborCost: number;
    expenseCost: number;
    fixedCostDaily: number;
    netProfit: number;
    profitMargin: number;
    rph: number; // Revenue Per Labor Hour
    totalLaborHours: number;
    expenseBreakdown: Record<string, number>; // e.g. { 'Food': 1000, 'Rent': 500 }
};

export async function getFinancialSnapshot(storeId: string, customDate?: string): Promise<FinancialSnapshot> {
    const supabase = await createClient();
    const date = customDate || dayjs().format('YYYY-MM-DD');
    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;

    // 1. Fetch Sales (Revenue)
    // Note: ensure_financial_store_ids.sql must be run for store_id to be valid.
    // If store_id is null in DB (legacy), we might miss data. 
    // We assume migration was run OR we fallback to user_id check if store_id is missing (safe fallback).

    // For MVP safety, let's just use existing table logic. 
    // Ideally we filter by store_id, but if column is new/empty, it breaks.
    // Let's assume the migration script worked.

    const { data: sales, error: salesError } = await supabase
        .from('mvp_sales')
        .select('amount')
        .eq('store_id', storeId)
        .gte('date', date)
        .lte('date', date);

    const revenue = sales?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

    // 2. Fetch Expenses (COGS & Others)
    const { data: expenses } = await supabase
        .from('expenses')
        .select('amount, category')
        .eq('store_id', storeId)
        .gte('date', date)
        .lte('date', date);

    const expenseCost = expenses?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
    const expenseBreakdown = expenses?.reduce((acc, item) => {
        const cat = item.category || 'Uncategorized';
        acc[cat] = (acc[cat] || 0) + Number(item.amount);
        return acc;
    }, {} as Record<string, number>) || {};

    // 3. Fetch Labor (Work Logs)
    // We need logs that generally "happened" today.
    // A log checking in yesterday 11PM and out today 2AM -> Counts for which day?
    // Standard: Split by midnight? MVP: Just count logs that START today.
    const { data: logs } = await supabase
        .from('work_logs')
        .select('clock_in, clock_out, wage_snapshot')
        .eq('store_id', storeId)
        .gte('clock_in', `${date}T00:00:00`)
        .lte('clock_in', `${date}T23:59:59`)
        .not('clock_out', 'is', null);

    let laborCost = 0;
    let totalLaborHours = 0;

    logs?.forEach(log => {
        if (log.clock_out) {
            const start = new Date(log.clock_in).getTime();
            const end = new Date(log.clock_out).getTime();
            const hours = (end - start) / (1000 * 60 * 60);
            totalLaborHours += hours;
            laborCost += Math.round(hours * log.wage_snapshot);
        }
    });

    // 4. Fixed Costs (Daily Estimate)
    const { data: fixed } = await supabase
        .from('fixed_costs')
        .select('amount')
        .eq('store_id', storeId);

    const monthlyFixed = fixed?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
    const fixedCostDaily = Math.round(monthlyFixed / 30);

    // 5. Synthesis
    const totalCost = laborCost + expenseCost + fixedCostDaily;
    const netProfit = revenue - totalCost;
    const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    // RPH (Revenue Per Labor Hour)
    // Avoid division by zero
    const rph = totalLaborHours > 0 ? Math.round(revenue / totalLaborHours) : 0;

    return {
        revenue,
        laborCost,
        expenseCost,
        fixedCostDaily,
        netProfit,
        profitMargin,
        rph,
        totalLaborHours,
        expenseBreakdown
    };
}
