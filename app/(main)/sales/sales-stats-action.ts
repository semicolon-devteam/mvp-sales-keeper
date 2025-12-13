'use server';

import { createClient } from '@/app/_shared/utils/supabase/server';
import dayjs from 'dayjs';

export type SalesStats = {
    average: number;
    maxRecord: number;
    lastWeekSameDay: number;
};

export async function getSalesStats(storeId: string, dateStr: string): Promise<SalesStats> {
    const supabase = await createClient();
    const date = dayjs(dateStr);
    const dayOfWeek = date.day(); // 0 (Sun) - 6 (Sat)

    // 1. Fetch sales for the same day of week (Last 4 weeks)
    // We need to construct a query that filters by day of week.
    // Supabase/Postgres doesn't have a simple "where day_of_week = X" without SQL functions or RPC.
    // For MVP, easier to just fetch last 30 days and filter in JS, or hardcode the 4 specific dates.

    // Let's pick 4 specific dates: -7, -14, -21, -28 days.
    const datesToCheck = Array.from({ length: 4 }).map((_, i) =>
        date.subtract(i + 1, 'week').format('YYYY-MM-DD')
    );

    const { data: history } = await supabase
        .from('mvp_sales')
        .select('amount, date')
        .eq('store_id', storeId)
        .in('date', datesToCheck);

    const amounts = history?.map(h => Number(h.amount)) || [];
    const average = amounts.length > 0
        ? Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length)
        : 0;

    const lastWeekSameDay = history?.find(h => h.date === datesToCheck[0])?.amount || 0;

    // 2. Fetch Max Record (Simple Query)
    // To find true max, we query all time. Expensive? Maybe limit to 1 year or just top 1.
    const { data: maxData } = await supabase
        .from('mvp_sales')
        .select('amount')
        .eq('store_id', storeId)
        .order('amount', { ascending: false })
        .limit(1)
        .single();

    const maxRecord = Number(maxData?.amount || 0);

    return {
        average,
        maxRecord,
        lastWeekSameDay: Number(lastWeekSameDay)
    };
}
