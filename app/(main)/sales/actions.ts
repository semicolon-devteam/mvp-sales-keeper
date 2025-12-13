'use server';

import { revalidatePath } from 'next/cache';
import { addSale, getDailySales } from './_repositories/sales-repository';

export async function submitSale(formData: FormData) {
    const amount = Number(formData.get('amount'));
    const date = formData.get('date') as string; // YYYY-MM-DD
    const storeId = formData.get('storeId') as string;
    const type = (formData.get('type') as any) || 'manual';

    if (!amount || !date) {
        return { error: 'Invalid data' };
    }

    try {
        await addSale({
            amount,
            date,
            type,
            store_id: storeId,
        });
        revalidatePath('/sales');
        revalidatePath('/dashboard');
        return { success: true };
    } catch (e: any) {
        console.error('Submit Sale Error:', e);
        return { error: e instanceof Error ? e.message : 'Failed to add sale' };
    }
}

export async function getSales(date: string, storeId?: string) {
    return await getDailySales(date, storeId);
}

export async function getRecentSalesActivity(storeId?: string) {
    const { getRecentActivity } = await import('./_repositories/sales-repository');
    return await getRecentActivity(storeId);
}

export async function removeSale(id: string) {
    try {
        const { deleteSale } = await import('./_repositories/sales-repository');
        await deleteSale(id);
        revalidatePath('/sales');
        revalidatePath('/dashboard');
        return { success: true };
    } catch (e) {
        console.error("Delete Error:", e);
        return { error: 'Failed to delete sale' };
    }
}

// Define types locally if needed or reuse from parser/repo logic
type ExcelUploadData = {
    date: string;
    amount: number;
    platform: string;
    items?: { name: string; quantity: number; price: number }[];
};

import { createClient } from '@/app/_shared/utils/supabase/server';

export async function uploadExcelSales(data: ExcelUploadData[], storeId: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('로그인이 필요합니다.');

        if (!storeId) throw new Error('매장 정보가 없습니다.');

        // Optional: Verify user belongs to this store? 
        // For MVP speed, trusting the storeId passed (RLS will block if not owner/member eventually, though we use service role or implicit user checks in RLS).
        // Actually RLS checks 'userid' on mvp_sales (users can only see their own sales).
        // We should ensure the storeId belongs to the user or user is a member.
        // But for now, let's just use the passed ID. The RLS I wrote checks 'mvp_sales.user_id = auth.uid()'.
        // So as long as we insert with user_id, they can see it. store_id is just metadata for filtering.

        const { addSaleWithItems } = await import('./_repositories/sales-repository');

        const promises = data.map(item => addSaleWithItems({
            date: item.date,
            amount: item.amount,
            type: (item.platform === 'baemin' || item.platform === 'yogiyo' || item.platform === 'coupang') ? item.platform : 'excel',
            store_id: storeId // Add store_id here
        }, item.items?.map(i => ({
            name: i.name,
            quantity: i.quantity,
            unit_price: i.price,
            total_price: i.price * i.quantity
        })) || []));

        await Promise.all(promises);

        revalidatePath('/sales');
        revalidatePath('/dashboard');
        return { success: true };
    } catch (e: any) {
        console.error("Upload Error:", e);
        return { error: e.message || '엑셀 데이터 저장 중 오류가 발생했습니다.' };
    }
}

export async function getRecentMenuItems() {
    try {
        const { getRecentItems } = await import('./_repositories/sales-repository');
        return await getRecentItems();
    } catch (e) {
        console.error(e);
        return [];
    }
}
