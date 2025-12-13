import Tesseract from 'tesseract.js';
import { ParsedSaleData, ParsedSaleItem } from './excel-parser';

export const parseReceipt = async (file: File | string): Promise<ParsedSaleData> => {
    // 1. Recognize Text
    const { data: { text } } = await Tesseract.recognize(
        file as any,
        'kor+eng', // Dual language for best results
        {
            logger: m => console.log(m), // Optional logging
            // Improve accuracy for sparse text if needed?
        }
    );

    console.log("OCR Result:", text);

    // 2. Parse Text into Data
    // Heuristic: Look for the 'Totals' and 'Date'.
    // Then look for line items.

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const items: ParsedSaleItem[] = [];
    let grandTotal = 0;
    let dateStr = new Date().toISOString().split('T')[0]; // Default today

    // Regex Patterns
    // Date: YYYY-MM-DD or YYYY.MM.DD
    const dateRegex = /(\d{4})[-.](\d{2})[-.](\d{2})/;
    // Price at end of line: "15,000", "15000"
    const priceRegex = /([\d,]+)$/;
    // Qty usually comes before price. "Menu 1 15000"
    // But sometimes "Menu 15000".

    for (const line of lines) {
        // Try to find Date
        const dateMatch = line.match(dateRegex);
        if (dateMatch) {
            dateStr = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
        }

        // Try to find Item Line
        // Ex: "[High] Salad 6 219,180"
        // Ex: "Tiramisu 1 0"
        // Ex: "Total 77 1,561,500" -> Skip total line for item list

        if (line.includes('합계') || line.includes('Total')) {
            // Parse Total Amount
            const priceMatch = line.match(priceRegex);
            if (priceMatch) {
                grandTotal = parseInt(priceMatch[1].replace(/,/g, ''), 10);
            }
            continue;
        }

        // Skip header lines
        if (line.includes('대표자') || line.includes('전화번호') || line.includes('POS')) continue;

        // Item Logic
        // Strategy: 
        // 1. Get last token as TotalPrice.
        // 2. Get second last token as Qty (if number).
        // 3. Rest is Name.

        const tokens = line.split(/\s+/);
        if (tokens.length < 2) continue;

        const lastToken = tokens[tokens.length - 1];
        if (!/^\d{1,3}(,\d{3})*$/.test(lastToken) && !/^\d+$/.test(lastToken)) continue; // Must end in number

        const totalPrice = parseInt(lastToken.replace(/,/g, ''), 10);

        let qty = 1;
        let nameEndIdx = tokens.length - 1;

        const secondLast = tokens[tokens.length - 2];
        if (/^\d+$/.test(secondLast)) {
            qty = parseInt(secondLast, 10);
            nameEndIdx = tokens.length - 2;
        }

        const name = tokens.slice(0, nameEndIdx).join(' ');

        // Filter out obvious noise
        if (name.length < 2) continue;
        if (totalPrice === 0 && !name.includes('서비스')) {
            // Maybe it's a zero price item but let's allow it 
        }

        if (totalPrice > 0 || qty > 0) {
            items.push({
                name,
                quantity: qty,
                price: qty > 0 ? (totalPrice / qty) : 0
            });
        }
    }

    // Fallback: If no Total detected, sum items
    if (grandTotal === 0 && items.length > 0) {
        grandTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    return {
        date: dateStr,
        amount: grandTotal,
        platform: 'manual',
        items: items
    };
};

