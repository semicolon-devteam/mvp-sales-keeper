import * as XLSX from 'xlsx';

export interface ParsedSaleItem {
    name: string;
    quantity: number;
    price: number;
}

export interface ParsedSaleData {
    date: string; // YYYY-MM-DD
    amount: number;
    platform: 'baemin' | 'yogiyo' | 'coupang' | 'excel' | 'unknown';
    items: ParsedSaleItem[];
}

export const parseExcel = (file: File): Promise<ParsedSaleData[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (rows.length < 2) {
                    reject(new Error('데이터가 없는 엑셀 파일입니다.'));
                    return;
                }

                const headers = rows[0] as string[];
                const platform = detectPlatform(headers);

                if (platform === 'unknown') {
                    // Default to generic excel if unknown, don't strict block for MVP flexibility
                    // reject(new Error('...'));
                }

                const dateIdx = headers.findIndex(h => h.includes('주문일') || h.includes('결제일') || h.includes('일자'));
                const amountIdx = headers.findIndex(h => h.includes('정산금액') || h.includes('입금예정금액') || h.includes('결제금액') || h.includes('매출금액'));

                // Item Parsing (Heuristics)
                const nameIdx = headers.findIndex(h => h.includes('메뉴명') || h.includes('상품명') || h.includes('품목'));
                const qtyIdx = headers.findIndex(h => h.includes('수량') || h.includes('개수'));
                // Price per item might not exist, sometimes only total. we can infer.

                if (dateIdx === -1 || amountIdx === -1) {
                    reject(new Error('필수 컬럼(주문일/금액)을 찾을 수 없습니다.'));
                    return;
                }

                const rawData: ParsedSaleData[] = [];

                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    if (!row[dateIdx]) continue; // Skip empty rows

                    let dateStr = '';
                    try {
                        const cellVal = row[dateIdx];
                        if (typeof cellVal === 'number') {
                            const dateObj = XLSX.SSF.parse_date_code(cellVal);
                            const y = dateObj.y;
                            const m = String(dateObj.m).padStart(2, '0');
                            const d = String(dateObj.d).padStart(2, '0');
                            dateStr = `${y}-${m}-${d}`;
                        } else {
                            dateStr = String(cellVal).split(' ')[0].trim();
                        }
                    } catch (e) { continue; }

                    let amount = 0;
                    try {
                        const amountVal = row[amountIdx];
                        amount = typeof amountVal === 'number' ? amountVal : parseInt(String(amountVal).replace(/,/g, ''), 10);
                    } catch (e) { continue; }

                    // Extract Item
                    let item: ParsedSaleItem | null = null;
                    if (nameIdx !== -1 && row[nameIdx]) {
                        const name = String(row[nameIdx]).trim();
                        const qty = qtyIdx !== -1 ? Number(row[qtyIdx]) || 1 : 1;
                        // If we have total amount for this row, unit price = amount / qty
                        // If the row represents an ORDER with multiple items, this heuristic works differently.
                        // But usually excel exports are either 1 row per order (with summarized text) or 1 row per item.
                        // We assume 1 row per item for Strategy Analysis.
                        const price = amount > 0 ? amount / qty : 0;

                        item = { name, quantity: qty, price };
                    }

                    if (dateStr && amount >= 0) { // Allow 0 sales
                        rawData.push({
                            date: dateStr,
                            amount: amount,
                            platform: platform === 'unknown' ? 'excel' : platform,
                            items: item ? [item] : []
                        });
                    }
                }

                // Aggregate by Date
                const aggregated = rawData.reduce((acc, curr) => {
                    const existing = acc.find(item => item.date === curr.date && item.platform === curr.platform);
                    if (existing) {
                        existing.amount += curr.amount;
                        // Merge items
                        curr.items.forEach(newItem => {
                            // Optional: Aggregate same items within the day here?
                            // Yes, for Strategy it's better to show "Kimchi Stew x 10" rather than 10 entries.
                            const existingItem = existing.items.find(i => i.name === newItem.name);
                            if (existingItem) {
                                existingItem.quantity += newItem.quantity;
                                existingItem.price = (existingItem.price * existingItem.quantity + newItem.price * newItem.quantity) / (existingItem.quantity + newItem.quantity); // Weighted avg price (roughly) or just keep last.
                                // Actually weighted avg is Complex. Let's just sum Quantity and assume Price is const or keep avg.
                                // Simplify: Unit price isn't essential for BCG X/Y if we have Total Quantity and Margin.
                                // But we need total sales for that item. 
                            } else {
                                existing.items.push(newItem);
                            }
                        });
                    } else {
                        acc.push({ ...curr });
                    }
                    return acc;
                }, [] as ParsedSaleData[]);

                resolve(aggregated.sort((a, b) => a.date.localeCompare(b.date)));

            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => reject(error);
        reader.readAsBinaryString(file);
    });
};

const detectPlatform = (headers: string[]): ParsedSaleData['platform'] => {
    const headerString = headers.join(', ');
    if (headerString.includes('배달의민족') || headerString.includes('배민') || headerString.includes('주문번호')) return 'baemin';
    if (headerString.includes('요기요') || headerString.includes('입금예정금액')) return 'yogiyo';
    if (headerString.includes('쿠팡')) return 'coupang';
    return 'unknown';
};
