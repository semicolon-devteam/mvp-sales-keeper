import Tesseract from 'tesseract.js';

export interface ParsedReceipt {
    merchant_name: string;
    date: string;
    amount: number;
    category: string;
}

export const parseExpenseReceipt = async (file: File | Blob): Promise<ParsedReceipt> => {
    console.log("Starting Expense OCR...");

    // 1. Recognize Text
    const { data: { text } } = await Tesseract.recognize(
        file as any,
        'kor+eng', // Korean + English
        {
            logger: m => console.log(m),
        }
    );

    console.log("OCR Text Result:", text);

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // 2. Extract Data using Heuristics

    // A. Date Extraction (YYYY-MM-DD or YYYY.MM.DD)
    let dateStr = new Date().toISOString().split('T')[0]; // Default today
    const dateRegex = /(\d{4})[-.\/](\d{2})[-.\/](\d{2})/;

    for (const line of lines) {
        const match = line.match(dateRegex);
        if (match) {
            dateStr = `${match[1]}-${match[2]}-${match[3]}`;
            break; // Stop after first date found (usually at top)
        }
    }

    // B. Amount Extraction
    // Look for lines with "합계", "총액", "결제금액" or simply the largest number near the bottom.
    let amount = 0;
    const priceRegex = /([\d,]+)(원)?$/; // Ends with digits/commas, optional '원'

    // Strategy 1: Look for explicit keywords
    for (const line of lines) {
        if (line.includes('합계') || line.includes('금액') || line.includes('Total')) {
            const match = line.match(/([\d,]+)/g); // Find all number groups
            if (match) {
                // Get the last number sequence in the line, assuming it's the value
                const lastNum = match[match.length - 1].replace(/,/g, '');
                const val = parseInt(lastNum, 10);
                if (val > amount) amount = val;
            }
        }
    }

    // Strategy 2: If no keyword match found, look for valid price formats in the bottom half of receipt
    if (amount === 0) {
        // Check only last 10 lines
        const recentLines = lines.slice(-10);
        for (const line of recentLines) {
            const match = line.match(priceRegex);
            if (match) {
                const val = parseInt(match[1].replace(/,/g, ''), 10);
                if (val > amount && val < 10000000) { // Sanity check < 10 million won
                    amount = val;
                }
            }
        }
    }

    // C. Merchant Name Extraction
    // Usually the first non-empty line, or the one with "점" "카페" "식당" etc.
    // Skip common headers
    let merchant_name = '';
    const skipKeywords = ['영수증', 'CREDIT', 'CARD', '매출전표', '고객용', 'POS', 'No.', 'Tel', '사업자'];

    for (const line of lines) {
        if (skipKeywords.some(k => line.toUpperCase().includes(k))) continue;
        if (line.length < 2) continue; // Too short

        // Assume first valid line is merchant
        merchant_name = line;
        break;
    }

    if (!merchant_name) merchant_name = '사용처 미확인';

    // D. Simple Category Guessing
    let category = '기타';
    const catMap: Record<string, string[]> = {
        '식비': ['식당', '밥', '키친', '푸드', '카페', '커피', '스타벅스', '맥도날드', '버거'],
        '간식': ['편의점', 'GS25', 'CU', '세븐일레븐', '마트', '슈퍼'],
        '교통/차량': ['주유', '오일', 'SK', 'GS칼텍스', 'S-OIL', '주차', '택시'],
        '쇼핑': ['다이소', '백화점', '아울렛', '몰', '쿠팡', '네이버'],
    };

    for (const [cat, keywords] of Object.entries(catMap)) {
        if (keywords.some(k => merchant_name.includes(k) || text.includes(k))) {
            category = cat;
            break;
        }
    }

    return {
        merchant_name,
        date: dateStr,
        amount,
        category
    };
};
