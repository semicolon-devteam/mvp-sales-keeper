'use server';

import { revalidatePath } from 'next/cache';
import { addExpense, getExpenses } from './_repositories/expenses-repository';
import { createClient } from '@/app/_shared/utils/supabase/server';

export async function analyzeReceipt(formData: FormData) {
    // Validating image presence
    const file = formData.get('image') as File;
    if (!file) return { error: 'No image provided' };

    try {
        // Dynamic import to avoid server-side bundling issues with canvas/tesseract if tricky
        // But usually standard import works if Tesseract is set up right? 
        // Let's rely on the utility we just made. 
        // Note: Tesseract.js in Server Actions might be slow or require node canvas.
        // It's often better to run Tesseract on Client, but User asked for "API style".
        // Let's try running it here. If node environment issues arise, we move it to client.

        // Actually best practice for basic Tesseract is Client Side to save server CPU.
        // But let's stick to the current action structure.

        // Wait... Tesseract.js node support is good.

        // We cannot pass File object directly to some node utils easily without arraybuffer conversion.
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Import the utility
        const { parseExpenseReceipt } = await import('./_utils/receipt-ocr');
        const data = await parseExpenseReceipt(new Blob([buffer]));

        return {
            success: true,
            data
        };

    } catch (e: any) {
        console.error("OCR Error:", e);
        return { error: '영수증 인식 실패: ' + e.message };
    }
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

