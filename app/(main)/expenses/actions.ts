'use server';

import { revalidatePath } from 'next/cache';
import { addExpense, getExpenses } from './_repositories/expenses-repository';
import { createClient } from '@/app/_shared/utils/supabase/server';

export async function analyzeReceipt(formData: FormData) {
    // This is a Mock OCR implementation
    // In a real app, we would send the image to Google Cloud Vision API

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Validating image presence
    const file = formData.get('image') as File;
    if (!file) return { error: 'No image provided' };

    // --- Mock Logic: Return random realistic data ---
    const mockData = [
        { merchant: '신세계백화점 강남점', category: '쇼핑', amount: 125000 },
        { merchant: '스타벅스 역삼대로점', category: '식비', amount: 8200 },
        { merchant: 'GS25 편의점', category: '간식', amount: 4500 },
        { merchant: '쿠팡 로켓배송', category: '온라인쇼핑', amount: 19800 },
        { merchant: '배달의민족', category: '식비', amount: 24000 },
        { merchant: 'SK주유소', category: '교통/차량', amount: 50000 },
    ];

    // Pick based on random index (simulate AI detection variablity)
    const randomPick = mockData[Math.floor(Math.random() * mockData.length)];

    return {
        success: true,
        data: {
            merchant_name: randomPick.merchant,
            amount: randomPick.amount,
            date: new Date().toISOString().split('T')[0],
            category: randomPick.category // Auto-assigned category
        }
    };
}

// --- Manual Entry Action ---
export async function submitManualExpense(formData: FormData) {
    const amount = Number(formData.get('amount'));
    const merchant_name = formData.get('merchant_name') as string;
    const date = formData.get('date') as string;
    const category = formData.get('category') as string;

    if (!amount || !merchant_name || !date) {
        return { error: '필수 정보가 누락되었습니다.' };
    }

    try {
        await addExpense({
            amount,
            merchant_name,
            date,
            category: category || '기타',
            image_url: '' // No image for manual entry
        });

        revalidatePath('/expenses');
        revalidatePath('/dashboard');
        return { success: true };
    } catch (e: any) {
        console.error(e);
        return { error: `지출 저장 실패: ${e.message}` };
    }
}

export async function uploadReceiptAndSave(formData: FormData) {
    const amount = Number(formData.get('amount'));
    const merchant_name = formData.get('merchant_name') as string;
    const date = formData.get('date') as string;
    const category = formData.get('category') as string;
    const file = formData.get('image') as File;

    if (!amount || !merchant_name || !date) {
        return { error: '필수 정보가 누락되었습니다.' };
    }

    try {
        let image_url = '';

        // Try uploading to 'receipts' bucket if it exists
        // Note: User must create this bucket in Supabase Dashboard
        if (file && file.size > 0) {
            const supabase = await createClient();
            const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
            const { data, error } = await supabase.storage
                .from('receipts')
                .upload(`${filename}`, file);

            if (!error && data) {
                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('receipts')
                    .getPublicUrl(data.path);
                image_url = publicUrl;
            } else {
                console.warn('Image upload failed (Bucket might be missing):', error);
                // Proceed without image URL to avoid blocking the user flow
            }
        }

        await addExpense({
            amount,
            merchant_name,
            date,
            category: category || '기타',
            image_url
        });

        revalidatePath('/expenses');
        revalidatePath('/dashboard');
        return { success: true };

    } catch (e: any) {
        console.error(e);
        return { error: `지출 저장 실패: ${e.message}` };
    }
}

export async function getExpenseList(storeId?: string) {
    return await getExpenses(storeId);
}

