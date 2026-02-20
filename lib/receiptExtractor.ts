import { ocrEngine } from '@/lib/ocr/TesseractOCR';

export interface ReceiptData {
    merchant?: string;
    total?: number;
    date?: string;
    tax?: number;
    currency?: string;
    category?: string;
    items?: { description: string; amount: number }[];
    rawText: string;
}

export async function extractReceipt(imageUri: string): Promise<ReceiptData> {
    const ocrResult = await ocrEngine.recognizeText(imageUri, 'eng'); // Receipts often use English/Numbers
    return parseReceipt(ocrResult.text);
}

function parseReceipt(text: string): ReceiptData {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const data: ReceiptData = { rawText: text, currency: 'IDR' };

    // Regex Patterns
    // Matches IDR/Rp followed by numbers, handling . and , for thousands/decimals
    const PRICE_REGEX = /(?:IDR|Rp|Rp\.|RM|\$)\s?[\d,.]+/gi;
    const DATE_REGEX = /\d{1,2}[-./]\d{1,2}[-./]\d{2,4}/g;

    // 1. Extract Date
    const dateMatch = text.match(DATE_REGEX);
    if (dateMatch) {
        data.date = dateMatch[0];
    }

    // 2. Extract Amounts (Total, Tax)
    const amounts: number[] = [];
    const priceMatches = text.match(PRICE_REGEX);
    if (priceMatches) {
        priceMatches.forEach(match => {
            // Clean string to number
            const clean = match.replace(/[^\d]/g, ''); // Remove non-digit
            const val = parseInt(clean);
            if (!isNaN(val)) amounts.push(val);
        });
    }

    // Heuristic: Max amount is usually Total
    if (amounts.length > 0) {
        data.total = Math.max(...amounts);

        // Use set to find unique values
        const uniqueAmounts = [...new Set(amounts)].sort((a, b) => b - a);

        // Second largest often Subtotal or Tax? Hard to say without keywords.
        // Look for keywords
    }

    // Keyword Search for Tax
    lines.forEach(line => {
        const lower = line.toLowerCase();
        if ((lower.includes('tax') || lower.includes('pajak') || lower.includes('ppn')) && !lower.includes('total')) {
            // Try extract number from this line
            const match = line.match(/\d[\d,.]*/);
            if (match) {
                const val = parseInt(match[0].replace(/[^\d]/g, ''));
                if (!isNaN(val) && val < (data.total || Infinity)) {
                    data.tax = val;
                }
            }
        }
    });

    // 3. Extract Merchant (First line usually, or biggest text)
    if (lines.length > 0) {
        // Skip common header trash if any
        data.merchant = lines[0];
        // Improvement: Check against known merchant DB or exclude "Welcome" etc.
    }

    return data;
}
