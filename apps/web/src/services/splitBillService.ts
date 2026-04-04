import Tesseract from 'tesseract.js';

export interface ReceiptItem {
    id: string;
    name: string;
    qty: number;
    unitPrice: number;
    total: number;
}

export interface ParsedReceipt {
    items: ReceiptItem[];
    subtotal: number;
    tax: number;
    serviceCharge: number;
    discount: number;
    grandTotal: number;
    taxInclusive: boolean;
}

export interface ParticipantAssignment {
    participantId: string;
    participantName: string;
    items: {
        itemId: string;
        share: number;
        qtyAssigned: number;
    }[];
}

export interface SplitResultParticipant {
    id: string;
    name: string;
    items: {
        id: string;
        name: string;
        amount: number;
    }[];
    subtotal: number;
    taxShare: number;
    serviceShare: number;
    discountShare: number;
    total: number;
}

export interface SplitResult {
    participants: SplitResultParticipant[];
    unassignedTotal: number;
}

// ────────────────────────────────────────────
// HELPERS — exported for unit testing
// ────────────────────────────────────────────

/**
 * Fix common OCR misreads in numeric strings.
 * O→0, o→0, l→1, I→1 (only when surrounded by digits), S→5, B→8
 */
export function fixOCRDigits(s: string): string {
    // Replace letters that look like digits when they appear inside a numeric context.
    // Loop until stable because consecutive confused chars (e.g. OOO) need multiple passes.
    let prev = '';
    let result = s;
    while (result !== prev) {
        prev = result;
        result = result
            .replace(/(?<=[\d.,])[Oo](?=[\d.,OolISsB])/g, '0')
            .replace(/(?<=[\d.,OolISsB])[Oo](?=[\d.,])/g, '0')
            .replace(/(?<=[\d.,])[lI](?=[\d.,])/g, '1')
            .replace(/(?<=[\d.,])[Ss](?=[\d.,])/g, '5')
            .replace(/(?<=[\d.,])[B](?=[\d.,])/g, '8');
    }
    // Handle leading/trailing
    result = result
        .replace(/^[Oo](?=\d{2,})/g, '0')
        .replace(/(?<=\d{2,})[Oo]$/g, '0');
    return result;
}

/**
 * Parse a price string that may contain currency symbols and various thousand/decimal formats.
 * Supports: Rp, IDR, $, USD, £, ¥, EUR
 * Handles: 15.000 (ID), 15,000 (US), 15.000,50 (ID decimal), 15,000.50 (US decimal), 15000 (bare)
 * Handles negative: -2.000, (2.000)
 */
export function parsePrice(priceStr: string): number {
    if (!priceStr) return 0;

    // Detect negative
    let negative = false;
    if (priceStr.includes('-') || /^\(.*\)$/.test(priceStr.trim())) {
        negative = true;
    }

    // Remove currency symbols and whitespace
    let clean = priceStr.replace(/(?:Rp\.?|IDR|USD|\$|£|¥|EUR|€)\s*/gi, '');
    clean = clean.replace(/[()\\-]/g, '').trim();

    // Fix OCR digit confusion
    clean = fixOCRDigits(clean);

    if (!clean) return 0;

    let value: number;

    // Pattern: 15.000,50 or 1.500.000,00 → Indonesian/European (dots=thousands, comma=decimal)
    if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(clean)) {
        value = parseFloat(clean.replace(/\./g, '').replace(',', '.'));
    }
    // Pattern: 15,000.50 or 1,500,000.00 → US/English (commas=thousands, dot=decimal)
    else if (/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(clean)) {
        value = parseFloat(clean.replace(/,/g, ''));
    }
    // Pattern: 15.000 or 1.500.000 → Indonesian thousands (no decimal)
    else if (/^\d{1,3}(\.\d{3})+$/.test(clean)) {
        value = parseFloat(clean.replace(/\./g, ''));
    }
    // Pattern: 15,000 or 1,500,000 → US thousands (no decimal)
    else if (/^\d{1,3}(,\d{3})+$/.test(clean)) {
        value = parseFloat(clean.replace(/,/g, ''));
    }
    // Pattern: 15.50 → small decimal
    else if (/^\d+\.\d{1,2}$/.test(clean)) {
        value = parseFloat(clean);
    }
    // Pattern: 15,50 → European decimal (comma as decimal)
    else if (/^\d+,\d{1,2}$/.test(clean)) {
        value = parseFloat(clean.replace(',', '.'));
    }
    // Bare number: 15000
    else {
        value = parseFloat(clean.replace(/[^0-9.]/g, ''));
    }

    if (isNaN(value)) return 0;
    return negative ? -Math.abs(value) : value;
}

/** Check if a line is a visual separator (-----, =====, etc.) */
export function isSeparatorLine(line: string): boolean {
    const stripped = line.replace(/\s/g, '');
    if (stripped.length < 3) return false;
    return /^[-=*.~_:]{3,}$/.test(stripped);
}

/** Detect lines that are metadata/header/footer — not item lines */
export function isGarbageLine(line: string): boolean {
    const lower = line.toLowerCase();

    // Skip lines that are probably numbered items (e.g. "1. Amoxicillin 500mg")
    if (/^\d+\.\s+[a-zA-Z]/.test(line.trim())) return false;

    // Detect column header lines (ITEM DESCRIPTION, MENU QTY HARGA, dll.)
    if (/^(item|menu|description|amount|harga|qty|quantity|nama|nm)\b/i.test(line.trim())) {
        // If line is ONLY column headers (no prices), it's garbage
        const headerWords = line.replace(/[^a-zA-Z\s]/g, '').trim().toLowerCase();
        const colHeaders = ['item', 'menu', 'description', 'amount', 'harga', 'qty', 'quantity', 'total', 'jumlah', 'nama', 'barang', 'brg', 'produk', 'product'];
        const words = headerWords.split(/\s+/);
        if (words.every(w => colHeaders.includes(w) || w.length <= 2)) return true;
    }

    const keywords = [
        // Address & location
        'jl.', 'jl ', 'jalan', 'telp', 'phone', 'fax', 'tower', 'lantai', 'lt.',
        'kav.', 'kav ', 'jakarta', 'bandung', 'surabaya', 'medan', 'semarang',
        'yogyakarta', 'selatan', 'utara', 'barat', 'timur', 'pusat',
        'kuningan', 'kelapa gading', 'tangerang', 'depok', 'bekasi', 'bogor',
        'malang', 'makassar', 'palembang', 'balikpapan',
        // International address indicators
        'avenue', 'street', 'blvd', 'road', 'lane', 'drive',
        'los angeles', 'new york', 'chicago', 'singapore',
        // Business types
        'resto', 'restaurant', 'cafe', 'warung', 'warteg', 'kedai', 'rumah makan',
        'kitchen', 'bakery', 'catering', 'lorong',
        'apotek', 'apoteker', 'pharmacy',
        'spbu', 'pertamina', 'shell',
        'mcdonald', 'starbucks', 'kfc', 'burger king', 'pizza hut',
        // Receipt metadata — with flexible spacing
        'kasir', 'cashier', 'tanggal', 'waktu', 'time:',
        'meja', 'table:', 'table ', 'guest', 'pax', 'npwp', 'kode struk', 'kode:',
        'pelanggan', 'customer', 'member', 'info :', 'info:',
        'mode :', 'mode:', 'dine in', 'take away', 'takeaway', 'delivery',
        'jam masuk', 'quick service',
        'no. referensi', 'no. transaksi', 'ref:', 'trx:',
        'no.', 'no :', 'order #', 'order:', 'order id', 'order :',
        'receipt#', 'receipt #', 'receipt:',
        // Identity info
        'prof.', 'apt.', 's.farm', 'pasien', 'dokter',
        'alamat', 'plat :', 'no. pelanggan', 'dari rek', 'ke rek', 'ke bank',
        // Receipt identifiers
        'invoice', 'bill no', 'nota', 'rx no',
        // Footer
        'terima kasih', 'thank you', 'thanks', 'silakan', 'selamat',
        'wifi', 'password', 'ig:', 'instagram', 'www.', 'http',
        'pin benar', 'transaksi berhasil',
        // Status tags
        'lunas', 'marketplace',
        // Receipt type headers (standalone names)
        'alfamart', 'indomaret', 'alfamidi',
        'tokopedia', 'shopee', 'bukalapak', 'lazada', 'blibli',
        'kimia farma',
        'pln', 'bukti pembayaran', 'bukti transaksi',
        'parkir elektronik',
        // ATM / Bank (only in garbage context)
        'jenis', 'saldo akhir',
        // Misc
        'nomor pompa', 'lokasi:',
        'durasi:',
    ];

    // Exact match for very short garbage
    if (['lunas', 'dine in', 'take away'].includes(lower.trim())) return true;

    // Date line detection (flexible spacing: "Date : ...", "Date: ...", "Tanggal : ...")
    if (/^date\s*:/i.test(line.trim())) return true;

    // Check if line starts with or contains known garbage
    return keywords.some(kw => lower.includes(kw));
}

/** Detect if a line signals entry into the totals/summary section */
export function isTotalSectionKeyword(line: string): boolean {
    const lower = line.toLowerCase();

    // Ignore if it's clearly a column header line
    if (lower.includes('nama barang') || lower.includes('item description')) return false;

    const keywords = [
        'subtotal', 'sub total', 'sub-total',
        'amount due', 'jumlah',
    ];
    return keywords.some(kw => lower.includes(kw));
}

/** Detect if a line is a total/grand-total line */
export function isGrandTotalLine(line: string): boolean {
    const lower = line.toLowerCase();

    // Ignore if it's clearly a column header line (e.g. "NAMA BARANG TOTAL")
    if (lower.includes('nama barang') || lower.includes('item description')) return false;

    return /\b(grand\s*total|total\s*(bayar|pembayaran|akhir|debet|belanja|tagihan)?)\b/i.test(lower) ||
        lower.includes('amount due');
}

/** Detect if a line is a tax/ppn line */
export function isTaxLine(line: string): boolean {
    const lower = line.toLowerCase();
    return /\b(tax|ppn|pb1|ppnbm|vat|pajak)\b/.test(lower);
}

/** Detect if a line is a service charge line */
export function isServiceChargeLine(line: string): boolean {
    const lower = line.toLowerCase();
    return /\b(service\s*(charge)?|svc|srv\.?\s*ch?g?|layanan)\b/.test(lower);
}

/** Detect if a line is a discount/voucher/cashback line */
export function isDiscountLine(line: string): boolean {
    const lower = line.toLowerCase();
    return /\b(discount|disc\.?|diskon|potongan|voucher|cashback|promo)\b/.test(lower);
}

/** Detect if a line is a payment method / cash / change line */
export function isPaymentOrChangeLine(line: string): boolean {
    const lower = line.toLowerCase();
    return /\b(tunai|cash|kembalian|kembali|change|gopay|ovo|dana|qris|debit|kredit|credit|pembayaran|dibayar|bayar\s*via)\b/.test(lower) ||
        /\b(bca|bri|bni|mandiri|cimb|permata|mega|linkaja|shopeepay)\b/.test(lower);
}

/** Detect if a line is a footer / end of useful data */
export function isFooterLine(line: string): boolean {
    const lower = line.toLowerCase();
    return /\b(terima\s*kasih|thank\s*you|thanks|silakan|selamat\s*datang)\b/.test(lower) ||
        /\b(wifi|password|instagram|ig:|www\.|http|pin benar|transaksi berhasil)\b/.test(lower);
}

/** Extract all price-like strings with thousand separators from a line */
export function extractPricesWithSep(line: string): string[] {
    // Match: 1.500.000, 15.000, 1,500,000, 15,000, 15.000,50, 15,000.50
    const regex = /\b\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?\b/g;
    return [...line.matchAll(regex)].map(m => m[0]);
}

/** Extract bare large numbers (>= 1000) that could be prices */
export function extractBarePrices(line: string): string[] {
    const regex = /\b(\d{4,})\b/g;
    const results: string[] = [];
    let match;
    while ((match = regex.exec(line)) !== null) {
        const num = parseInt(match[1], 10);
        // Reject years (2000-2099)
        if (num >= 2000 && num <= 2099) continue;
        // Reject very long numbers (IDs, barcodes, phone numbers)
        if (match[1].length > 8) continue;
        results.push(match[0]);
    }
    return results;
}

/** Extract small decimal prices like $12.99, £9.50, ¥1500 */
export function extractDecimalPrices(line: string): string[] {
    const regex = /\b(\d{1,6}\.\d{2})\b/g;
    return [...line.matchAll(regex)].map(m => m[0]);
}

/**
 * Extract quantity from a line.
 * Supports: 2x, x2, 2 x, X 2, ×2, 2 pcs, Qty: 2, 2 @, standalone digit before currency
 */
export function extractQty(line: string): { qty: number; qtyStr: string } {
    let m: RegExpMatchArray | null;

    // "2x", "3X", "2 x", "2×" — digit before x
    m = line.match(/\b(\d+)\s*[xX×]/);
    if (m && parseInt(m[1]) < 100 && parseInt(m[1]) > 0) return { qty: parseInt(m[1], 10), qtyStr: m[0] };

    // "x2", "X3", "x 2" — x before digit
    m = line.match(/[xX×]\s*(\d+)\b/);
    if (m && parseInt(m[1]) < 100 && parseInt(m[1]) > 0) return { qty: parseInt(m[1], 10), qtyStr: m[0] };

    // "@" format: "2 @ 55.000" or "2@55.000" or "1 @ $7.99"
    m = line.match(/\b(\d+)\s*@/);
    if (m && parseInt(m[1]) < 100 && parseInt(m[1]) > 0) return { qty: parseInt(m[1], 10), qtyStr: m[0] };

    // "Qty: 2" or "Qty 2"
    m = line.match(/qty\s*:?\s*(\d+)/i);
    if (m && parseInt(m[1]) < 100 && parseInt(m[1]) > 0) return { qty: parseInt(m[1], 10), qtyStr: m[0] };

    // "2 pcs"
    m = line.match(/\b(\d+)\s*pcs\b/i);
    if (m && parseInt(m[1]) < 100 && parseInt(m[1]) > 0) return { qty: parseInt(m[1], 10), qtyStr: m[0] };

    // Standalone digit before currency: "Ayam Goreng 3 Rp 18.000" or "Item 2 $4.99"
    // Only match if the digit is preceded by a letter (part of item name context)
    m = line.match(/[a-zA-Z]\s+(\d{1,2})\s+(?:Rp\.?\s|IDR\s|\$|USD\s|EUR\s|£|¥)/i);
    if (m && parseInt(m[1]) > 0 && parseInt(m[1]) < 100) return { qty: parseInt(m[1], 10), qtyStr: m[1] };

    return { qty: 1, qtyStr: '' };
}

/**
 * Extract all price values from a line, trying formatted first, then decimal, then bare.
 */
export function extractAllPrices(line: string): string[] {
    let prices = extractPricesWithSep(line);
    if (prices.length > 0) return prices;

    // Try decimal prices (for $ / £ / ¥ style: 12.99)
    prices = extractDecimalPrices(line);
    if (prices.length > 0) return prices;

    // Bare large numbers
    return extractBarePrices(line);
}

/**
 * Clean a raw line to extract just the item name portion.
 * Removes prices, qty markers, currency symbols, and cleans up.
 */
export function cleanItemName(line: string, prices: string[], qtyStr: string): string {
    let name = line;

    // Remove all price matches
    for (const p of prices) {
        name = name.replace(p, '');
    }

    // Remove qty string
    if (qtyStr) {
        name = name.replace(qtyStr, '');
    }

    // Remove currency symbols
    name = name.replace(/(?:Rp\.?|IDR|USD|\$|£|¥|EUR|€)/gi, '');
    // Remove @ and other non-name symbols, keep letters/numbers/spaces/dashes/parens/dots
    name = name.replace(/@/g, '').replace(/[^a-zA-Z0-9\s\-().+/]/g, '').replace(/\s+/g, ' ').trim();

    return name;
}


// ────────────────────────────────────────────
// MAIN SERVICE CLASS
// ────────────────────────────────────────────

class SplitBillService {
    /**
     * Enhanced image preprocessing for OCR.
     *
     * 1. Downscale large images (cap width at 2000px)
     * 2. Convert to grayscale (perceptual luminance)
     * 3. Adaptive contrast enhancement (block-based)
     * 4. Slight sharpening via unsharp mask
     */
    async preprocessImage(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');

                    // Step 1: Downscale if too large
                    const MAX_WIDTH = 2000;
                    let w = img.width;
                    let h = img.height;
                    if (w > MAX_WIDTH) {
                        const ratio = MAX_WIDTH / w;
                        w = MAX_WIDTH;
                        h = Math.round(h * ratio);
                    }
                    canvas.width = w;
                    canvas.height = h;

                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error("Failed to get canvas context"));
                        return;
                    }

                    ctx.drawImage(img, 0, 0, w, h);

                    const imageData = ctx.getImageData(0, 0, w, h);
                    const data = imageData.data;

                    // Step 2: Convert to grayscale
                    for (let i = 0; i < data.length; i += 4) {
                        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                        data[i] = gray;
                        data[i + 1] = gray;
                        data[i + 2] = gray;
                    }

                    // Step 3: Fast Unsharp Masking (Sharpen text edges while removing noise)
                    // We apply a small Gaussian blur, then subtract it from the original to find edges.
                    // This performs much better on Tesseract than global or local binarization.
                    const blurredData = new Float32Array(data.length);
                    const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1]; // 3x3 Gaussian

                    for (let y = 0; y < h; y++) {
                        for (let x = 0; x < w; x++) {
                            const dstOff = (y * w + x) * 4;
                            let val = 0;
                            for (let cy = 0; cy < 3; cy++) {
                                for (let cx = 0; cx < 3; cx++) {
                                    // Mirror edges
                                    const scy = Math.max(0, Math.min(h - 1, y + cy - 1));
                                    const scx = Math.max(0, Math.min(w - 1, x + cx - 1));
                                    const srcOff = (scy * w + scx) * 4;
                                    val += data[srcOff] * kernel[cy * 3 + cx];
                                }
                            }
                            blurredData[dstOff] = val / 16;
                        }
                    }

                    const amount = 1.5; // Sharpening intensity
                    for (let i = 0; i < data.length; i += 4) {
                        const origGray = data[i];
                        const blurGray = blurredData[i];

                        // Unsharp mask formula
                        let sharpGray = origGray + (origGray - blurGray) * amount;
                        sharpGray = Math.max(0, Math.min(255, sharpGray));

                        // Push darker grays to black for better contrast
                        if (sharpGray < 128) sharpGray = Math.max(0, sharpGray * 0.85);

                        data[i] = sharpGray;
                        data[i + 1] = sharpGray;
                        data[i + 2] = sharpGray;
                    }

                    ctx.putImageData(imageData, 0, 0);
                    resolve(canvas.toDataURL('image/jpeg', 0.92));
                };
                img.onerror = () => reject(new Error("Failed to load image"));
                if (event.target?.result) {
                    img.src = event.target.result as string;
                }
            };
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Runs Tesseract.js OCR on the image.
     * Uses Indonesian + English language models.
     * Configured for receipt-style column text.
     */
    async runOCR(imageDataUrl: string, onProgress?: (progress: number) => void): Promise<string> {
        try {
            const worker = await Tesseract.createWorker('ind+eng', 1, {
                logger: m => {
                    if (m.status === 'recognizing text' && onProgress) {
                        onProgress(Math.round(m.progress * 100));
                    }
                }
            });

            // Configure for receipt layout
            await worker.setParameters({
                tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK, // PSM 6: uniform block
                preserve_interword_spaces: '1', // Keep column alignment
            });

            const { data: { text } } = await worker.recognize(imageDataUrl);
            await worker.terminate();
            console.log('[SplitBill OCR] Raw text output:\n', text);
            return text;
        } catch (error) {
            console.error("OCR Failed:", error);
            throw new Error("Failed to process image. Please try again or enter details manually.");
        }
    }

    /**
     * Parses a receipt image using Gemini AI Vision API (server-side).
     * Returns structured ParsedReceipt directly — no regex parsing needed.
     * Much more accurate than Tesseract.js for complex receipts.
     */
    async parseReceiptWithGemini(file: File): Promise<ParsedReceipt> {
        // Compress image to stay within Vercel's 4.5MB body limit
        const compressedDataUrl = await this.compressImageForUpload(file);

        // Dynamic import to avoid circular dependency
        const { default: api } = await import('./api');

        const response = await api.post('/ai/parse-receipt', {
            image: compressedDataUrl,
            mimeType: 'image/jpeg',
        });

        const data = response.data;

        // Convert to ParsedReceipt format (add IDs to items)
        const items: ReceiptItem[] = (data.items || []).map((item: any) => ({
            id: crypto.randomUUID(),
            name: String(item.name || 'Unknown Item'),
            qty: Math.max(1, Math.round(Number(item.qty) || 1)),
            unitPrice: Number(item.unitPrice) || 0,
            total: Number(item.total) || 0,
        }));

        return {
            items,
            subtotal: Number(data.subtotal) || 0,
            tax: Number(data.tax) || 0,
            serviceCharge: Number(data.serviceCharge) || 0,
            discount: Math.abs(Number(data.discount) || 0),
            grandTotal: Number(data.grandTotal) || 0,
            taxInclusive: Boolean(data.taxInclusive),
        };
    }

    /**
     * Compresses an image file for API upload.
     * Resizes to max 1600px width, converts to JPEG at 0.85 quality.
     * Keeps text readable while staying well under Vercel's 4.5MB body limit.
     */
    private async compressImageForUpload(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);

            img.onload = () => {
                URL.revokeObjectURL(url);

                const MAX_WIDTH = 1600;
                let { width, height } = img;

                if (width > MAX_WIDTH) {
                    height = Math.round((height * MAX_WIDTH) / width);
                    width = MAX_WIDTH;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d')!;
                ctx.drawImage(img, 0, 0, width, height);

                // JPEG at 85% quality — good balance of size vs text clarity
                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                resolve(dataUrl);
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load image for compression'));
            };

            img.src = url;
        });
    }

    /**
     * Parses raw OCR text into a structured receipt.
     *
     * Strategy:
     * 1. Detect "zones" using separator lines and header heuristics.
     * 2. Aggressively filter garbage/metadata lines.
     * 3. Multi-line buffer: item names on line N, prices on line N+1.
     * 4. Supports diverse quantity formats (2x, x2, 2 @, Qty: 2, 2 pcs).
     * 5. Smart total section parsing with multi-layer tax/discount.
     * 6. Handles edge cases: mixed languages, OCR digit confusion, wrapped names.
     */
    parseReceiptText(text: string): ParsedReceipt {
        const rawLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        const items: ReceiptItem[] = [];
        let subtotal = 0;
        let tax = 0;
        let serviceCharge = 0;
        let discount = 0;
        let grandTotal = 0;

        // --- ZONE DETECTION ---
        const separatorIndices: number[] = [];
        for (let i = 0; i < rawLines.length; i++) {
            if (isSeparatorLine(rawLines[i])) {
                separatorIndices.push(i);
            }
        }
        const hasSeparators = separatorIndices.length > 0;

        // --- MAIN PARSING ---
        let inHeaderZone = hasSeparators; // If separators exist, skip until first separator
        let foundTotalSection = false;
        let reachedFooter = false;
        let pendingNameBuffer: string[] = [];
        let separatorsSeen = 0;

        for (let i = 0; i < rawLines.length; i++) {
            const line = rawLines[i];
            const lowerLine = line.toLowerCase();

            // Handle separator lines
            if (isSeparatorLine(line)) {
                separatorsSeen++;
                if (separatorsSeen === 1) {
                    inHeaderZone = false; // After first separator: items zone
                }
                pendingNameBuffer = [];
                continue;
            }

            // Smart header zone exit: if we see a line with FORMATTED prices (not bare
            // numbers like zip codes) AND text, exit header zone even without separator.
            if (inHeaderZone) {
                const formattedPrices = extractPricesWithSep(line);
                const decimalPrices = extractDecimalPrices(line);
                const hasFormattedPrice = formattedPrices.length > 0 || decimalPrices.length > 0;
                if (hasFormattedPrice && /[a-zA-Z]{2,}/.test(line) && !isGarbageLine(line)) {
                    inHeaderZone = false;
                    // Don't continue — process this line as an item below
                } else {
                    continue;
                }
            }

            // Stop at footer
            if (isFooterLine(line)) {
                reachedFooter = true;
            }
            if (reachedFooter) continue;

            // Skip garbage metadata lines — but NOT if it also looks like a total/tax/discount line
            if (isGarbageLine(line) &&
                !isTotalSectionKeyword(lowerLine) &&
                !isGrandTotalLine(lowerLine) &&
                !isTaxLine(lowerLine) &&
                !isServiceChargeLine(lowerLine) &&
                !isDiscountLine(lowerLine) &&
                !isPaymentOrChangeLine(lowerLine)) {
                continue;
            }

            // Skip pure numeric lines (postal codes, phone numbers, IDs)
            // UNLESS they contain a nicely formatted price or we are in the total section (where pure numbers are often tax/totals)
            const lineNoSpaces = line.replace(/\s/g, '');
            if (/^[\d.:\-/]+$/.test(lineNoSpaces)) {
                const hasFormattedPrice = extractPricesWithSep(line).length > 0 || extractDecimalPrices(line).length > 0;
                if (!hasFormattedPrice && !foundTotalSection) {
                    continue;
                }
            }

            // Skip lines that are just a single short number (< 4 digits) or QR-like markers
            if (/^\d{1,3}$/.test(line.trim())) continue;
            if (/^\*[0-9*]+\*$/.test(line.trim())) continue; // barcode text like *1234567890*

            // ── Detect total section ──
            if (!foundTotalSection) {
                if (isTotalSectionKeyword(lowerLine)) {
                    foundTotalSection = true;
                }
                // If "total" appears and we already have items, we're in the total section
                if (lowerLine.includes('total') && items.length > 0) {
                    foundTotalSection = true;
                }
                // "N item" line (e.g., "3 item" or "3 items")
                if (/^\d+\s*items?\b/.test(lowerLine) && items.length > 0) {
                    foundTotalSection = true;
                }
            }

            // Also detect grand total specifically (even if we didn't find subtotal first)
            if (isGrandTotalLine(lowerLine) && items.length > 0) {
                foundTotalSection = true;
            }

            // ── Extract prices from line ──
            const prices = extractAllPrices(line);

            if (prices.length > 0) {
                const lastPrice = prices[prices.length - 1];
                const amount = parsePrice(lastPrice);

                const contextText = (pendingNameBuffer.join(' ') + ' ' + lowerLine).toLowerCase();

                if (foundTotalSection || isTotalSectionKeyword(lowerLine) || isGrandTotalLine(lowerLine) || isTotalSectionKeyword(contextText) || isGrandTotalLine(contextText)) {
                    // ── TOTALS SECTION ──
                    foundTotalSection = true;
                    // Check grand total FIRST so "Grand Total (Termasuk PPN)" doesn't get classified as tax
                    if (isGrandTotalLine(contextText) && !contextText.includes('subtotal')) {
                        if (Math.abs(amount) > grandTotal) grandTotal = Math.abs(amount);
                    } else if (contextText.includes('subtotal') || contextText.includes('sub total') || contextText.includes('sub-total')) {
                        subtotal = Math.abs(amount);
                    } else if (isDiscountLine(contextText)) {
                        discount += Math.abs(amount);
                    } else if (isServiceChargeLine(contextText)) {
                        serviceCharge += Math.abs(amount);
                    } else if (isTaxLine(contextText)) {
                        tax += Math.abs(amount);
                    } else if (isPaymentOrChangeLine(contextText)) {
                        // Payment method / change line — skip for item purposes
                        // But if it's the "total bayar" it may be grandTotal
                        if (contextText.includes('bayar') || contextText.includes('total')) {
                            if (Math.abs(amount) > grandTotal) grandTotal = Math.abs(amount);
                        }
                    } else if (contextText.includes('ongkir') || contextText.includes('ongkos kirim') || contextText.includes('shipping')) {
                        // Shipping is an extra charge — treat as service
                        serviceCharge += Math.abs(amount);
                    } else {
                        // Unknown total-section line with a price
                    }
                    pendingNameBuffer = [];
                } else {
                    // ── ITEMS SECTION ──
                    if (amount > 0) {
                        const { qty, qtyStr } = extractQty(line);

                        // Determine unit price
                        let unitPrice = amount;
                        let totalPrice = amount;
                        if (prices.length > 1) {
                            // Multiple prices on line: first is typically unit price, last is line total
                            // e.g., "2x @55.000   110.000" or "Ayam Goreng  1x   25.000   25.000"
                            let firstPrice = parsePrice(prices[0]);
                            const lastPriceVal = parsePrice(prices[prices.length - 1]);

                            // Handle OCR error where '@' is misread as '8' (e.g., "@39.000" -> "839000")
                            if (qty > 0) {
                                const expectedUnit = Math.round(lastPriceVal / qty);
                                if (firstPrice !== expectedUnit &&
                                    String(firstPrice).length === String(expectedUnit).length + 1 &&
                                    String(firstPrice).endsWith(String(expectedUnit))) {
                                    firstPrice = expectedUnit;
                                }
                            }

                            // If we have qty × firstPrice ≈ lastPrice, that's the pattern
                            if (prices.length >= 2 && qty > 1 && Math.abs(qty * firstPrice - lastPriceVal) < 2) {
                                unitPrice = firstPrice;
                                totalPrice = lastPriceVal;
                            } else if (prices.length >= 2) {
                                // First price is unit, last is total
                                unitPrice = firstPrice;
                                totalPrice = lastPriceVal;
                            }
                        } else if (qty > 1 && amount > 0) {
                            unitPrice = Math.round(amount / qty);
                        }

                        // Clean item name from current line
                        const nameOnLine = cleanItemName(line, prices, qtyStr);

                        // Resolve final name from buffer + current line
                        let finalName = '';
                        if (pendingNameBuffer.length > 0) {
                            finalName = pendingNameBuffer.join(' ');
                            if (nameOnLine.length > 2 && /[a-zA-Z]/.test(nameOnLine)) {
                                finalName += ` ${nameOnLine}`;
                            }
                        } else if (nameOnLine.length > 1 && /[a-zA-Z]/.test(nameOnLine)) {
                            finalName = nameOnLine;
                        } else {
                            finalName = 'Unknown Item';
                        }

                        finalName = finalName.replace(/\s+/g, ' ').trim();

                        items.push({
                            id: crypto.randomUUID(),
                            name: finalName.substring(0, 80),
                            qty,
                            unitPrice,
                            total: totalPrice
                        });

                        pendingNameBuffer = [];
                    }
                }
            } else {
                // ── NO PRICE ON THIS LINE ──
                if (/[a-zA-Z]/.test(line) && line.replace(/[^a-zA-Z]/g, '').length > 1) {
                    const cleanText = line.trim();

                    // Handle modifiers: "- Less Sweet", "* Tidak pedas", "+ Extra cheese"
                    if (/^[*\-+]\s/.test(cleanText) && cleanText.length > 3) {
                        const modText = cleanText.substring(1).trim();
                        if (items.length > 0 && pendingNameBuffer.length === 0) {
                            // Attach to last item
                            items[items.length - 1].name += ` (${modText})`;
                        } else {
                            pendingNameBuffer.push(`(${modText})`);
                        }
                    }
                    // Handle indented modifiers (lines that look like dosage instructions)
                    else if (/^\d+[xX]\d+/.test(cleanText) && items.length > 0) {
                        // "3x1 (sesudah makan)" — dosage modifier
                        items[items.length - 1].name += ` [${cleanText}]`;
                    }
                    else {
                        // Buffer as upcoming item name
                        pendingNameBuffer.push(cleanText);
                    }
                }
            }
        }

        // --- FALLBACKS ---
        const calculatedSubtotal = items.reduce((sum, item) => sum + item.total, 0);
        if (subtotal === 0) subtotal = calculatedSubtotal;
        if (grandTotal === 0) grandTotal = subtotal + tax + serviceCharge - discount;

        // Detect if taxes are already included in item prices
        const isTaxInclusive = Math.abs(calculatedSubtotal - grandTotal) < 100 && (tax === 0 && serviceCharge === 0);

        // Filter junk items (zero-total)
        const validItems = items.filter(item => item.total > 0);

        return {
            items: validItems,
            subtotal,
            tax,
            serviceCharge,
            discount,
            grandTotal,
            taxInclusive: isTaxInclusive
        };
    }

    /**
     * Calculates the final split based on qty-aware pro-rata logic.
     * 
     * Security validations:
     * - Total qtyAssigned per item cannot exceed item.qty
     * - All numeric values guarded against NaN/Infinity
     * - Share ratios clamped to [0, 1]
     * - Input objects are never mutated
     */
    calculateSplit(receipt: ParsedReceipt, assignments: ParticipantAssignment[]): SplitResult {
        const results: SplitResultParticipant[] = [];
        let assignedTotal = 0;

        // Security: Pre-validate total assigned qty per item doesn't exceed item qty
        const qtyPerItem: Record<string, number> = {};
        assignments.forEach(participant => {
            participant.items.forEach(assignment => {
                const qty = Math.max(0, Math.floor(assignment.qtyAssigned || 0));
                qtyPerItem[assignment.itemId] = (qtyPerItem[assignment.itemId] || 0) + qty;
            });
        });

        // Build a clamped qty map — if over-assigned, proportionally scale down
        const itemQtyLimits: Record<string, number> = {};
        receipt.items.forEach(item => {
            itemQtyLimits[item.id] = item.qty;
        });

        assignments.forEach(participant => {
            const participantItems: { id: string; name: string; amount: number; qtyAssigned: number; }[] = [];
            let participantSubtotal = 0;

            participant.items.forEach(assignment => {
                const item = receipt.items.find(i => i.id === assignment.itemId);
                if (item) {
                    // Security: Clamp qty to valid range
                    let qty = Math.max(0, Math.floor(assignment.qtyAssigned || 0));
                    const totalAssignedForItem = qtyPerItem[item.id] || 0;
                    
                    // If over-assigned, proportionally scale down
                    if (totalAssignedForItem > item.qty && totalAssignedForItem > 0) {
                        qty = Math.round((qty / totalAssignedForItem) * item.qty);
                    }

                    // Calculate share based on qty ratio
                    const share = item.qty > 0 ? Math.min(1, qty / item.qty) : 0;
                    const itemShareAmount = item.total * share;

                    // Security: Guard against NaN/Infinity
                    const safeAmount = isFinite(itemShareAmount) ? itemShareAmount : 0;

                    participantItems.push({
                        id: item.id,
                        name: item.name,
                        amount: safeAmount,
                        qtyAssigned: qty
                    });
                    participantSubtotal += safeAmount;
                    assignedTotal += safeAmount;
                }
            });

            const subtotalRatio = receipt.subtotal > 0 ? (participantSubtotal / receipt.subtotal) : 0;
            const safeRatio = isFinite(subtotalRatio) ? Math.min(1, Math.max(0, subtotalRatio)) : 0;
            const taxShare = receipt.tax * safeRatio;
            const serviceShare = receipt.serviceCharge * safeRatio;
            const discountShare = receipt.discount * safeRatio;
            const finalTotal = participantSubtotal + taxShare + serviceShare - discountShare;

            results.push({
                id: participant.participantId,
                name: participant.participantName,
                items: participantItems,
                subtotal: participantSubtotal,
                taxShare,
                serviceShare,
                discountShare,
                total: isFinite(finalTotal) ? Math.max(0, finalTotal) : 0
            });
        });

        return {
            participants: results,
            unassignedTotal: Math.max(0, receipt.subtotal - assignedTotal)
        };
    }
}

export const splitBillService = new SplitBillService();
