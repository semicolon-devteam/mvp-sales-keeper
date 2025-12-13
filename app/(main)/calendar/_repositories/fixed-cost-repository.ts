import { createClient } from "@/app/_shared/utils/supabase/server";

export interface FixedCost {
    id: string;
    store_id: string;
    name: string;
    amount: number;
    day_of_month: number;
    category: string;
}

export async function getFixedCosts(storeId?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Debug: Global check
    const { count } = await supabase.from('fixed_costs').select('*', { count: 'exact', head: true }).eq('user_id', user.id);

    // Apply filter
    let query = supabase.from('fixed_costs').select('*').eq('user_id', user.id);
    if (storeId && storeId !== 'all') {
        query = query.eq('store_id', storeId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching fixed costs:', error);
        throw new Error(`DB Error: ${error.message}`);
    }

    // If empty but global count > 0, suspicious
    if ((!data || data.length === 0) && count && count > 0) {
        console.warn(`[Repo] Warning: User has ${count} costs but 0 for store ${storeId}`);
        // throw new Error(`Debug: User has ${count} costs total, but none for this store (${storeId}). Check Store ID.`);
    }

    return data || [];
}

export async function addFixedCost(cost: Omit<FixedCost, 'id'>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { error } = await supabase.from('fixed_costs').insert({
        ...cost,
        user_id: user.id
    });

    if (error) {
        console.error('[Repo] Insert Error:', error);
        throw new Error(`Insert failed: ${error.message} (Code: ${error.code}, Details: ${error.details})`);
    }
}

export async function deleteFixedCost(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('fixed_costs').delete().eq('id', id);
    if (error) throw error;
}
