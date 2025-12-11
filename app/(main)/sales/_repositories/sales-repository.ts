import { createClient } from '@/app/_shared/utils/supabase/server';

export type Sale = {
    id: string;
    user_id: string;
    amount: number;
    date: string; // YYYY-MM-DD
    type: 'manual' | 'excel' | 'hall' | 'baemin' | 'yogiyo' | 'coupang';
    store_id?: string;
    created_at: string;
};

export async function getDailySales(date: string, storeId?: string) {
    const supabase = await createClient();
    let query = supabase
        .from('mvp_sales')
        .select('*')
        .eq('date', date);

    if (storeId && storeId !== 'all') {
        query = query.eq('store_id', storeId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Sale[];
}

export async function addSale(sale: Omit<Sale, 'id' | 'user_id' | 'created_at'>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const { data, error } = await supabase
        .from('mvp_sales')
        .insert({
            ...sale,
            user_id: user.id
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getMonthlySales(year: number, month: number, storeId?: string) {
    const supabase = await createClient();
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`; // Approx

    let query = supabase
        .from('mvp_sales')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);

    if (storeId && storeId !== 'all') {
        query = query.eq('store_id', storeId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as Sale[];
}

export async function deleteSale(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('mvp_sales')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

export async function getSalesRange(startDate: string, endDate: string, storeId?: string) {
    const supabase = await createClient();

    let query = supabase
        .from('mvp_sales')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

    if (storeId && storeId !== 'all') {
        query = query.eq('store_id', storeId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Sale[];
}
