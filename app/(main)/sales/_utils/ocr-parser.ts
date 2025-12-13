import { ParsedSaleData, ParsedSaleItem } from './excel-parser';

// Tesseract is loaded globally in layout.tsx via <Script>
export const parseReceipt = async (file: File | string, onProgress?: (status: string) => void): Promise<ParsedSaleData> => {
    // 1. Recognize Text
    if (onProgress) onProgress('AI 엔진 초기화 준비 중... (글로벌 엔진 확인)');

    // Timeout Promise
    const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("AI 엔진 다운로드가 너무 오래 걸립니다. 인터넷 연결을 확인하거나 잠시 후 다시 시도해주세요.")), 30000)
    );

    // Ensure Tesseract is available
    const Tesseract = (window as any).Tesseract;
    if (!Tesseract) {
        throw new Error("AI 엔진(Tesseract)이 로드되지 않았습니다. 새로고침 후 다시 시도해주세요.");
    }

    // Explicitly using connection-local files to avoid CDN timeouts
    // Files copied to public/static/tesseract/ from node_modules and downloaded manually
    const workerPromise = Tesseract.createWorker('kor', 1, {
        workerPath: window.location.origin + '/static/tesseract/worker.min.js',
        // Use the large Core file as proven by diagnostic page
        corePath: window.location.origin + '/static/tesseract/tesseract-core.wasm.js',
        langPath: window.location.origin + '/static/tesseract/',
        gzip: true,
        logger: (m: any) => {
            console.log(m);
            if (onProgress) {
                const pct = m.progress ? Math.round(m.progress * 100) : 0;
                const statusMap: Record<string, string> = {
                    'loading tesseract core': 'Tesseract 엔진(Core) 다운로드 중...',
                    'initializing tesseract': '엔진 시동 거는 중...',
                    'loading language traineddata': '한글 데이터(20MB) 다운로드 중...',
                    'initializing api': 'API 초기화 중...',
                    'recognizing text': '글자 인식 중...',
                };
                const msg = statusMap[m.status] || m.status;
                onProgress(`${msg} ${pct > 0 ? `(${pct}%)` : ''}`);
            }
        }
    });

    // Race between worker creation and timeout
    const worker: any = await Promise.race([workerPromise, timeout]);

    if (onProgress) onProgress('글자 인식을 시작합니다...');
    const { data: { text } }: { data: { text: string } } = await worker.recognize(file as any);
    await worker.terminate();

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

