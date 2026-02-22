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

class SplitBillService {
    /**
     * Light preprocessing: grayscale + gentle contrast boost.
     * NO binarization — Tesseract handles that internally much better.
     * Returns a data URL for display preview.
     */
    async preprocessImage(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');

                    if (!ctx) {
                        reject(new Error("Failed to get canvas context"));
                        return;
                    }

                    ctx.drawImage(img, 0, 0);

                    // Light enhancement: grayscale + gentle contrast
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;

                    for (let i = 0; i < data.length; i += 4) {
                        // Weighted grayscale (human perceptual luminance)
                        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                        // Gentle contrast boost (1.3x)
                        const val = Math.max(0, Math.min(255, (gray - 128) * 1.3 + 128));
                        data[i] = val;
                        data[i + 1] = val;
                        data[i + 2] = val;
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
     * Uses both Indonesian and English language models.
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
     * Parses the raw OCR text into a structured receipt.
     *
     * Strategy:
     * 1. Detect "zones" using separator lines (----, ====, ****) if they exist.
     *    Everything before the first separator is HEADER → skip.
     * 2. Aggressively filter garbage metadata lines (restaurant name, address, etc.)
     * 3. Multi-line buffer: item names often appear on line N, prices on line N+1.
     * 4. Supports "2x", "x2", "2 x @55.000" quantity formats.
     */
    parseReceiptText(text: string): ParsedReceipt {
        const rawLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        const items: ReceiptItem[] = [];
        let subtotal = 0;
        let tax = 0;
        let serviceCharge = 0;
        let discount = 0;
        let grandTotal = 0;

        // --- HELPERS ---

        const parsePrice = (priceStr: string): number => {
            if (!priceStr) return 0;
            let clean = priceStr.replace(/(Rp|IDR|\s)/gi, '');
            // European/ID style: 40.000,00 → remove dots, replace comma with dot
            if (/,(\d{2})$/.test(clean)) {
                clean = clean.replace(/\./g, '').replace(',', '.');
            } else {
                // Remove all dots and commas as thousand separators
                clean = clean.replace(/[.,]/g, '');
            }
            return parseFloat(clean) || 0;
        };

        const isSeparatorLine = (line: string): boolean => {
            const stripped = line.replace(/\s/g, '');
            if (stripped.length < 3) return false;
            return /^[-=*.~_]{3,}$/.test(stripped);
        };

        // Comprehensive garbage line detection
        const isGarbageLine = (line: string): boolean => {
            const lower = line.toLowerCase();
            const keywords = [
                // Address & location
                'jl.', 'jl ', 'jalan', 'telp', 'phone', 'fax', 'tower', 'lantai', 'lt.',
                'kav.', 'kav ', 'jakarta', 'bandung', 'surabaya', 'medan', 'semarang',
                'yogyakarta', 'selatan', 'utara', 'barat', 'timur', 'pusat',
                'kuningan', 'kelapa gading', 'tangerang', 'depok', 'bekasi', 'bogor',
                // Business names / types
                'resto', 'restaurant', 'cafe', 'warung', 'kedai', 'rumah makan',
                'kitchen', 'bakery', 'catering', 'lorong', 'kopi',
                // Receipt metadata
                'kasir', 'cashier', 'tanggal', 'date:', 'waktu', 'time:',
                'meja', 'table', 'guest', 'pax', 'npwp', 'kode struk', 'kode:',
                'no.', 'pelanggan', 'customer', 'member', 'info :', 'info:',
                'mode :', 'mode:', 'dine in', 'take away', 'takeaway', 'delivery',
                'jam masuk', 'quick service',
                // Academic/address titles
                'prof.', 'dr.',
                // Receipt identifiers
                'invoice', 'order', 'bill no', 'nota', 'receipt',
                // Footer
                'terima kasih', 'thank you', 'thanks', 'silakan',
                'wifi', 'password', 'ig:', 'instagram', 'www.', 'http', '@',
            ];
            return keywords.some(kw => lower.includes(kw));
        };

        // Extract prices with thousand separators (most reliable)
        const extractPricesWithSep = (line: string): string[] => {
            const regex = /\b\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?\b/g;
            return [...line.matchAll(regex)].map(m => m[0]);
        };

        // Extract bare large numbers (>= 1000) with context validation
        const extractBarePrices = (line: string): string[] => {
            const regex = /\b(\d{4,})\b/g;
            const results: string[] = [];
            let match;
            while ((match = regex.exec(line)) !== null) {
                const num = parseInt(match[1], 10);
                // Reject years
                if (num >= 2000 && num <= 2099) continue;
                // Reject very long numbers (IDs, barcodes)
                if (match[1].length > 7) continue;
                results.push(match[0]);
            }
            return results;
        };

        // Extract quantity: "2x", "x2", "2 x", "x 2", "2X", etc.
        const extractQty = (line: string): { qty: number; qtyStr: string } => {
            let m;
            // "2x", "3X", "2 x" - digit before x
            m = line.match(/\b(\d+)\s*[xX×]/);
            if (m && parseInt(m[1]) < 100) return { qty: parseInt(m[1], 10), qtyStr: m[0] };

            // "x2", "X3", "x 2" - x before digit
            m = line.match(/[xX×]\s*(\d+)\b/);
            if (m && parseInt(m[1]) < 100) return { qty: parseInt(m[1], 10), qtyStr: m[0] };

            // "@" format: "2 @ 55.000"
            m = line.match(/\b(\d+)\s*@/);
            if (m && parseInt(m[1]) < 100) return { qty: parseInt(m[1], 10), qtyStr: m[0] };

            return { qty: 1, qtyStr: '' };
        };

        // --- ZONE DETECTION ---
        const separatorIndices: number[] = [];
        for (let i = 0; i < rawLines.length; i++) {
            if (isSeparatorLine(rawLines[i])) {
                separatorIndices.push(i);
            }
        }
        const hasSeparators = separatorIndices.length > 0;

        // --- MAIN PARSING ---
        let inHeaderZone = hasSeparators; // If separators exist, everything before first is header
        let foundTotalSection = false;
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

            // Skip header zone lines
            if (inHeaderZone) continue;

            // Skip garbage metadata lines
            if (isGarbageLine(line)) continue;

            // Skip pure numeric lines (postal codes, phone numbers, IDs)
            const lineNoSpaces = line.replace(/\s/g, '');
            if (/^[\d.:\-/]+$/.test(lineNoSpaces)) continue;

            // Skip lines that are just a single short number (< 4 digits)
            if (/^\d{1,3}$/.test(line.trim())) continue;

            // Detect total section keywords
            if (!foundTotalSection) {
                if (lowerLine.includes('subtotal') || lowerLine.includes('sub total') ||
                    (lowerLine.includes('total') && !lowerLine.includes('grand total') && items.length > 0) ||
                    lowerLine.includes('amount due') || lowerLine.includes('tunai') ||
                    lowerLine.includes('cash') || lowerLine.includes('kembali') ||
                    /^\d+\s*item/.test(lowerLine)) {
                    foundTotalSection = true;
                }
            }

            // Also detect grand total specifically
            if (lowerLine.includes('grand total')) {
                foundTotalSection = true;
            }

            // Extract prices from line
            let prices = extractPricesWithSep(line);
            if (prices.length === 0) {
                prices = extractBarePrices(line);
            }

            if (prices.length > 0) {
                const lastPrice = prices[prices.length - 1];
                const amount = parsePrice(lastPrice);

                if (foundTotalSection) {
                    // --- TOTALS SECTION ---
                    if (lowerLine.includes('tax') || lowerLine.includes('ppn') || lowerLine.includes('vat') || lowerLine.includes('pajak')) {
                        tax = amount;
                    } else if (lowerLine.includes('service') || lowerLine.includes('svc') || lowerLine.includes('layanan')) {
                        serviceCharge = amount;
                    } else if (lowerLine.includes('disc') || lowerLine.includes('diskon') || lowerLine.includes('potongan')) {
                        discount = amount;
                    } else if (lowerLine.includes('subtotal') || lowerLine.includes('sub total')) {
                        subtotal = amount;
                    } else if (lowerLine.includes('total') || lowerLine.includes('grand') ||
                        lowerLine.includes('bayar') || lowerLine.includes('pay') ||
                        lowerLine.includes('qr') || lowerLine.includes('debit') ||
                        lowerLine.includes('kredit') || lowerLine.includes('bri') ||
                        lowerLine.includes('bca') || lowerLine.includes('mandiri') ||
                        lowerLine.includes('gopay') || lowerLine.includes('ovo') ||
                        lowerLine.includes('dana')) {
                        if (amount > grandTotal) grandTotal = amount;
                    }
                    pendingNameBuffer = [];
                } else {
                    // --- ITEMS SECTION ---
                    if (amount > 0) {
                        const { qty, qtyStr } = extractQty(line);

                        // Determine unit price
                        let unitPrice = amount;
                        if (prices.length > 1) {
                            // Multiple prices on line: first is likely unit price, last is total
                            // e.g. "2x @55.000   110.000"
                            unitPrice = parsePrice(prices[0]);
                        } else if (qty > 1 && amount > 0) {
                            unitPrice = Math.round(amount / qty);
                        }

                        // Clean item name from current line
                        let nameOnLine = line;
                        // Remove all price matches
                        for (const p of prices) {
                            nameOnLine = nameOnLine.replace(p, '');
                        }
                        // Remove qty string
                        if (qtyStr) {
                            nameOnLine = nameOnLine.replace(qtyStr, '');
                        }
                        // Remove @ and other symbols, keep letters/numbers/spaces/dashes/parens
                        nameOnLine = nameOnLine.replace(/@/g, '').replace(/[^a-zA-Z0-9\s\-()]/g, '').replace(/\s+/g, ' ').trim();

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
                            name: finalName.substring(0, 60),
                            qty,
                            unitPrice,
                            total: amount
                        });

                        pendingNameBuffer = [];
                    }
                }
            } else {
                // --- NO PRICE ON THIS LINE ---
                if (!foundTotalSection && /[a-zA-Z]/.test(line) && line.replace(/[^a-zA-Z]/g, '').length > 1) {
                    const cleanText = line.trim();

                    // Handle modifiers: "* Tidak pedas", "* less sugar less ice"
                    if (cleanText.startsWith('*') || (cleanText.startsWith('-') && cleanText.length > 3 && /[a-zA-Z]/.test(cleanText))) {
                        const modText = cleanText.substring(1).trim();
                        if (items.length > 0 && pendingNameBuffer.length === 0) {
                            // Attach to last item
                            items[items.length - 1].name += ` (${modText})`;
                        } else {
                            pendingNameBuffer.push(`(${modText})`);
                        }
                    } else {
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

        const isTaxInclusive = Math.abs(calculatedSubtotal - grandTotal) < 100 && (tax === 0 && serviceCharge === 0);

        // Filter junk
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
     * Calculates the final split based on pro-rata logic
     */
    calculateSplit(receipt: ParsedReceipt, assignments: ParticipantAssignment[]): SplitResult {
        const results: SplitResultParticipant[] = [];
        let assignedTotal = 0;

        assignments.forEach(participant => {
            const participantItems: { id: string; name: string; amount: number; }[] = [];
            let participantSubtotal = 0;

            participant.items.forEach(assignment => {
                const item = receipt.items.find(i => i.id === assignment.itemId);
                if (item) {
                    const itemShareAmount = item.total * assignment.share;
                    participantItems.push({
                        id: item.id,
                        name: item.name,
                        amount: itemShareAmount
                    });
                    participantSubtotal += itemShareAmount;
                    assignedTotal += itemShareAmount;
                }
            });

            const subtotalRatio = receipt.subtotal > 0 ? (participantSubtotal / receipt.subtotal) : 0;
            const taxShare = receipt.taxInclusive ? 0 : receipt.tax * subtotalRatio;
            const serviceShare = receipt.serviceCharge * subtotalRatio;
            const discountShare = receipt.discount * subtotalRatio;
            const finalTotal = participantSubtotal + taxShare + serviceShare - discountShare;

            results.push({
                id: participant.participantId,
                name: participant.participantName,
                items: participantItems,
                subtotal: participantSubtotal,
                taxShare,
                serviceShare,
                discountShare,
                total: finalTotal
            });
        });

        return {
            participants: results,
            unassignedTotal: Math.max(0, receipt.subtotal - assignedTotal)
        };
    }
}

export const splitBillService = new SplitBillService();
