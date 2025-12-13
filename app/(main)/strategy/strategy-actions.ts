'use server';

import { createClient } from '@/app/_shared/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export type MenuNode = {
    name: string;
    quantity: number;
    avgPrice: number;
    cost: number;
    profit: number; // (avgPrice - cost) * quantity
    totalSales: number;
    type: 'star' | 'cashcow' | 'gem' | 'dog';
};

export type StrategyData = {
    nodes: MenuNode[];
    averages: {
        quantity: number;
        profit: number;
    };
};

export async function getMenuStrategyData(startDate?: string, endDate?: string): Promise<StrategyData> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    // Get store_id from membership (simplified for MVP, assumes 1 store or logic elsewhere)
    // For now we get sales filtered by user_id owner. 
    // In real multi-store, we should pass storeId. We will infer from sales access.

    // 1. Fetch Sale Items (date filtered)
    // We join with mvp_sales to filter by date
    let query = supabase
        .from('sale_items')
        .select(`
            name, quantity, total_price, unit_price,
            mvp_sales!inner (
                date, user_id
            )
        `)
        .eq('mvp_sales.user_id', user.id);

    if (startDate) query = query.gte('mvp_sales.date', startDate);
    if (endDate) query = query.lte('mvp_sales.date', endDate);

    const { data: salesData, error: salesError } = await query;
    if (salesError) throw salesError;

    // 2. Fetch Menu Items (Costs)
    // Link via store_members? Or just query 'menu_items' by store_id match if we had it.
    // For MVP, menu_items doesn't strictly have user_id, it has store_id. 
    // We need to resolve user -> store.
    // Let's assume we can fetch all menu_items this user has access to.
    // Simplifying: We query menu_items via the store_members check or just fetch all for this user's stores.
    // For V1 Speed: Fetch ALL menu items for stores this user owns.

    // Quick Fix: Fetch store_id first.
    const { data: member } = await supabase.from('store_members').select('store_id').eq('user_id', user.id).single();
    const storeId = member?.store_id;

    let costMap = new Map<string, number>();
    if (storeId) {
        const { data: menuData } = await supabase
            .from('menu_items')
            .select('name, cost')
            .eq('store_id', storeId);

        menuData?.forEach(m => costMap.set(m.name, m.cost || 0));
    }

    // 3. Aggregate
    const aggregation = new Map<string, { quantity: number; revenue: number }>();

    salesData?.forEach((item: any) => {
        const current = aggregation.get(item.name) || { quantity: 0, revenue: 0 };
        aggregation.set(item.name, {
            quantity: current.quantity + item.quantity,
            revenue: current.revenue + item.total_price
        });
    });

    const nodes: MenuNode[] = [];
    let grandTotalQty = 0;
    let grandTotalProfit = 0;

    for (const [name, stats] of aggregation.entries()) {
        const avgPrice = stats.revenue / stats.quantity;
        // Default Cost Logic: If mapped, use it. If not, 35% COGS.
        const cost = costMap.has(name) ? costMap.get(name)! : Math.round(avgPrice * 0.35);
        const profit = (avgPrice - cost) * stats.quantity;

        nodes.push({
            name,
            quantity: stats.quantity,
            avgPrice,
            cost,
            profit,
            totalSales: stats.revenue,
            type: 'dog' // Placeholder
        });

        grandTotalQty += stats.quantity;
        grandTotalProfit += profit;
    }

    // 4. Calculate Quadrants
    const count = nodes.length || 1;
    const avgQty = grandTotalQty / count;
    const avgProfit = grandTotalProfit / count;

    nodes.forEach(node => {
        if (node.quantity >= avgQty && node.profit >= avgProfit) node.type = 'star';
        else if (node.quantity >= avgQty && node.profit < avgProfit) node.type = 'cashcow';
        else if (node.quantity < avgQty && node.profit >= avgProfit) node.type = 'gem';
        else node.type = 'dog';
    });

    return {
        nodes,
        averages: { quantity: avgQty, profit: avgProfit }
    };
}

export async function updateMenuCost(name: string, cost: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { data: member } = await supabase.from('store_members').select('store_id').eq('user_id', user.id).single();
    if (!member) throw new Error('No Store Found');

    // Upsert by name + store_id
    // We first check if it exists to get ID, or we assume unique name per store
    const { data: existing } = await supabase
        .from('menu_items')
        .select('id')
        .eq('store_id', member.store_id)
        .eq('name', name)
        .single();

    if (existing) {
        await supabase.from('menu_items').update({ cost }).eq('id', existing.id);
    } else {
        await supabase.from('menu_items').insert({
            store_id: member.store_id,
            name,
            cost
        });
    }

    revalidatePath('/strategy');
    return { success: true };
}
