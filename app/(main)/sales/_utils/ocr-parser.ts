import { ParsedSaleData, ParsedSaleItem } from './excel-parser';

// Tesseract.js v6 API - 로컬 파일 사용
export const parseReceipt = async (file: File | string, onProgress?: (status: string) => void): Promise<ParsedSaleData> => {
    if (onProgress) onProgress('AI OCR 엔진 로드 중...');

    // Dynamic import for Tesseract.js v6
    const { createWorker } = await import('tesseract.js');

    if (onProgress) onProgress('OCR Worker 생성 중...');

    let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
    let text = '';

    try {
        // CDN 기본값 사용 (로컬 파일 설정 제거)
        // Tesseract.js v6은 자동으로 CDN에서 필요한 파일을 로드함
        console.log('[OCR] Creating worker with default CDN paths...');

        worker = await createWorker('kor', 1, {
            logger: (m: any) => {
                console.log('[Tesseract]', m);
                if (onProgress && m.status) {
                    const pct = m.progress ? Math.round(m.progress * 100) : 0;
                    const statusMap: Record<string, string> = {
                        'loading tesseract core': 'OCR 엔진 로드 중...',
                        'initializing tesseract': '엔진 초기화 중...',
                        'loading language traineddata': '한글 인식 데이터 로드 중...',
                        'loaded language traineddata': '한글 데이터 로드 완료!',
                        'initializing api': 'API 초기화 중...',
                        'recognizing text': '글자 인식 중...',
                    };
                    const msg = statusMap[m.status] || m.status;
                    onProgress(pct > 0 ? `${msg} (${pct}%)` : msg);
                }
            }
        });

        console.log('[OCR] Worker created successfully!');
        if (onProgress) onProgress('이미지에서 글자 인식 중...');

        const result = await worker.recognize(file);
        text = result.data.text;

        console.log('[OCR] Recognition complete!');
    } catch (error) {
        console.error('[OCR] Error:', error);
        throw new Error(`OCR 처리 중 오류: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
        if (worker) {
            await worker.terminate();
        }
    }

    console.log("OCR Result:", text);

    // 2. Parse Text into Data
    // Heuristic: Look for the 'Totals' and 'Date'.
    // Then look for line items.

    const lines = text.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
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
        platform: 'unknown',
        items: items
    };
};

// Alias for expense parsing (same logic as receipt)
export const parseExpenseFromOCR = parseReceipt;

