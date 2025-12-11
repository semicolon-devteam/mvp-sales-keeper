import * as XLSX from 'xlsx';

export interface ParsedSaleData {
    date: string; // YYYY-MM-DD
    amount: number;
    platform: 'baemin' | 'yogiyo' | 'coupang' | 'unknown';
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

                // Convert to JSON (array of arrays)
                const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (rows.length < 2) {
                    reject(new Error('데이터가 없는 엑셀 파일입니다.'));
                    return;
                }

                const headers = rows[0] as string[];
                const platform = detectPlatform(headers);

                if (platform === 'unknown') {
                    reject(new Error('지원하지 않는 엑셀 형식입니다. (배민/요기요 정산 내역만 가능)'));
                    return;
                }

                const parsedData: ParsedSaleData[] = [];
                // Find column indices
                const dateIdx = headers.findIndex(h => h.includes('주문일') || h.includes('결제일'));
                const amountIdx = headers.findIndex(h => h.includes('정산금액') || h.includes('입금예정금액') || h.includes('결제금액'));

                if (dateIdx === -1 || amountIdx === -1) {
                    reject(new Error('필수 컬럼(주문일/금액)을 찾을 수 없습니다.'));
                    return;
                }

                // Parse Rows
                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    if (!row[dateIdx] || !row[amountIdx]) continue;

                    let dateStr = '';
                    try {
                        // Date Parsing Logic (Handle various excel formats)
                        const cellVal = row[dateIdx];
                        if (typeof cellVal === 'number') {
                            // Excel Date Serial
                            const dateObj = XLSX.SSF.parse_date_code(cellVal);
                            const y = dateObj.y;
                            const m = String(dateObj.m).padStart(2, '0');
                            const d = String(dateObj.d).padStart(2, '0');
                            dateStr = `${y}-${m}-${d}`;
                        } else {
                            // String '2023-01-01 ...'
                            dateStr = String(cellVal).split(' ')[0].trim();
                        }
                    } catch (e) {
                        continue;
                    }

                    let amount = 0;
                    try {
                        const amountVal = row[amountIdx];
                        if (typeof amountVal === 'number') {
                            amount = amountVal;
                        } else {
                            amount = parseInt(String(amountVal).replace(/,/g, ''), 10);
                        }
                    } catch (e) {
                        continue;
                    }

                    if (dateStr && amount > 0) {
                        parsedData.push({
                            date: dateStr,
                            amount: amount,
                            platform: platform
                        });
                    }
                }

                // Aggregate by Date
                const aggregated = parsedData.reduce((acc, curr) => {
                    const existing = acc.find(item => item.date === curr.date);
                    if (existing) {
                        existing.amount += curr.amount;
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

    if (headerString.includes('배달의민족') || headerString.includes('배민')) return 'baemin';
    // Logic for Baemin usually '주문일시', '고객결제금액', '정산대상금액' etc.
    if (headerString.includes('정산금액') && headerString.includes('주문번호')) return 'baemin';

    if (headerString.includes('요기요') || headerString.includes('입금예정금액')) return 'yogiyo';

    return 'unknown';
};
