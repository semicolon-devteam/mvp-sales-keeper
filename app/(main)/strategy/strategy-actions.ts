'use server';

import { revalidatePath } from 'next/cache';
import { getMenuAnalysis, updateMenuCost } from './_repositories/strategy-repository';

export async function fetchStrategyData(storeId: string) {
    try {
        const data = await getMenuAnalysis(storeId);
        return { success: true, data };
    } catch (e: any) {
        console.error("Strategy Data Error Details:", JSON.stringify(e, null, 2));
        console.error("Strategy Data Error Message:", e.message);
        console.error("Strategy Data Error Hint:", e.hint);
        return { success: false, error: e.message || 'Unknown error' };
    }
}

export async function saveItemCost(storeId: string, name: string, cost: number, price: number) {
    try {
        await updateMenuCost(storeId, name, cost, price);
        revalidatePath('/strategy');
        return { success: true };
    } catch (e: any) {
        console.error("Save Cost Error:", e);
        return { success: false, error: e.message };
    }
}
