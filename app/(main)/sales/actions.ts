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
        console.error('Submit Sale Error (Primary):', e);

        // Fallback: Try saving as 'manual' if the specific type failed (likely DB constraint)
        if (type !== 'manual') {
            try {
                await addSale({
                    amount,
                    date,
                    type: 'manual', // Fallback
                    store_id: storeId,
                });
                revalidatePath('/sales');
                revalidatePath('/dashboard');
                // Return success but with a warning flag for the UI
                return { success: true, warning: 'DB_CONSTRAINT_FALLBACK' };
            } catch (retryError) {
                console.error('Submit Sale Error (Fallback):', retryError);
                return { error: 'Failed to add sale (even as manual)' };
            }
        }

        return { error: e instanceof Error ? e.message : 'Failed to add sale' };
    }
}

export async function getSales(date: string, storeId?: string) {
    return await getDailySales(date, storeId);
}

export async function removeSale(id: string) {
    try {
        await import('./_repositories/sales-repository').then(mod => mod.deleteSale(id));
        revalidatePath('/sales');
        revalidatePath('/dashboard');
        return { success: true };
    } catch (e) {
        return { error: 'Failed to delete sale' };
    }
}

export async function uploadExcelSales(data: { date: string; amount: number; platform: string }[]) {
    try {
        const { addSale } = await import('./_repositories/sales-repository');
        // Loop insert for now (Supabase insert can do bulk, but keep logic simple for MVP)
        // Ideally, we should check for existing excel data on that date and merge/warn.
        // For MVP: We just insert as separate records marked 'excel'. 
        // User asked for 'Conflict Resolution' in #11, but for this step we enable basic upload first.

        const promises = data.map(item => addSale({
            date: item.date,
            amount: item.amount,
            type: 'excel' // Distinguish from manual
        }));

        await Promise.all(promises);

        revalidatePath('/sales');
        revalidatePath('/dashboard');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: '엑셀 데이터 저장 중 오류가 발생했습니다.' };
    }
}
