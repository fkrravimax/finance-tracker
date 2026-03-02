import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set in environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");
// Switching to 'gemini-flash-latest' for better rate limits/availability
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

// ── Vision model for receipt parsing (structured JSON output) ────────────────
const receiptSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        items: {
            type: SchemaType.ARRAY,
            description: "List of purchased items/products on the receipt",
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    name: { type: SchemaType.STRING, description: "Item name as written on receipt" },
                    qty: { type: SchemaType.INTEGER, description: "Quantity purchased, default 1" },
                    unitPrice: { type: SchemaType.NUMBER, description: "Price per unit (numeric, no currency symbol)" },
                    total: { type: SchemaType.NUMBER, description: "Line total = qty × unitPrice (numeric, no currency symbol)" },
                },
                required: ["name", "qty", "unitPrice", "total"],
            },
        },
        subtotal: { type: SchemaType.NUMBER, description: "Sum of all item totals before tax/service/discount. If not on receipt, sum the item totals." },
        tax: { type: SchemaType.NUMBER, description: "Tax amount (PPN, PB1, VAT, pajak). 0 if not found." },
        serviceCharge: { type: SchemaType.NUMBER, description: "Service charge amount. 0 if not found." },
        discount: { type: SchemaType.NUMBER, description: "Total discount/voucher/cashback amount (positive number). 0 if not found." },
        grandTotal: { type: SchemaType.NUMBER, description: "Final total to pay after tax, service, and discount." },
        taxInclusive: { type: SchemaType.BOOLEAN, description: "true if item prices already include tax (no separate tax line), false if tax is added separately." },
    },
    required: ["items", "subtotal", "tax", "serviceCharge", "discount", "grandTotal", "taxInclusive"],
};

const visionModel = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
        responseMimeType: "application/json",
        responseSchema: receiptSchema,
    },
});

// ── Receipt image parsing types ──────────────────────────────────────────────
export interface ParsedReceiptItem {
    name: string;
    qty: number;
    unitPrice: number;
    total: number;
}

export interface ParsedReceiptResult {
    items: ParsedReceiptItem[];
    subtotal: number;
    tax: number;
    serviceCharge: number;
    discount: number;
    grandTotal: number;
    taxInclusive: boolean;
}

// ── Receipt image parsing ────────────────────────────────────────────────────
const RECEIPT_PROMPT = `You are an expert receipt parser. Extract ALL information from this receipt image.

Rules:
- Extract every food/product item with its name, quantity, unit price, and line total
- Identify subtotal, tax (PPN/PB1/VAT/pajak), service charge, discount, and grand total
- If a quantity is not specified, assume 1
- All price values must be plain numbers WITHOUT currency symbols (e.g., 25000 not "Rp 25.000")
- For Indonesian receipts: "15.000" means 15000 (dot is thousands separator)
- If tax is already included in item prices and no separate tax line exists, set taxInclusive to true
- If subtotal is not explicitly on the receipt, calculate it as the sum of all item totals
- If grand total is not found, calculate it as subtotal + tax + serviceCharge - discount
- discount should always be a positive number
- Do NOT include payment method lines (cash, gopay, change, etc.) as items
- Do NOT include subtotal/tax/service/discount as items`;

export const parseReceiptImage = async (base64Image: string, mimeType: string): Promise<ParsedReceiptResult> => {
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is missing.");
    }

    try {
        const result = await visionModel.generateContent([
            RECEIPT_PROMPT,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: mimeType,
                },
            },
        ]);

        const response = await result.response;
        const text = response.text();
        console.log("[Gemini Receipt] Raw output:", text);

        const parsed: ParsedReceiptResult = JSON.parse(text);

        // Sanity checks & fixes
        if (!parsed.items || !Array.isArray(parsed.items)) {
            parsed.items = [];
        }

        // Ensure all numeric fields are actual numbers
        parsed.subtotal = Number(parsed.subtotal) || 0;
        parsed.tax = Number(parsed.tax) || 0;
        parsed.serviceCharge = Number(parsed.serviceCharge) || 0;
        parsed.discount = Math.abs(Number(parsed.discount) || 0);
        parsed.grandTotal = Number(parsed.grandTotal) || 0;
        parsed.taxInclusive = Boolean(parsed.taxInclusive);

        // Fix items
        parsed.items = parsed.items.map(item => ({
            name: String(item.name || "Unknown Item"),
            qty: Math.max(1, Math.round(Number(item.qty) || 1)),
            unitPrice: Number(item.unitPrice) || 0,
            total: Number(item.total) || 0,
        })).filter(item => item.total > 0);

        // Recalculate subtotal if it seems off
        const calculatedSubtotal = parsed.items.reduce((sum, item) => sum + item.total, 0);
        if (parsed.subtotal === 0 && calculatedSubtotal > 0) {
            parsed.subtotal = calculatedSubtotal;
        }

        // Recalculate grand total if missing
        if (parsed.grandTotal === 0 && parsed.subtotal > 0) {
            parsed.grandTotal = parsed.subtotal + parsed.tax + parsed.serviceCharge - parsed.discount;
        }

        return parsed;
    } catch (error: any) {
        console.error("[Gemini Receipt] Error parsing receipt:", error);
        throw new Error(`Failed to parse receipt: ${error.message || "Unknown error"}`);
    }
};

export const categorizeTransaction = async (merchant: string, description?: string): Promise<string> => {
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is missing.");
    }



    const prompt = `
    Role: Financial Transaction Classifier
    Task: Categorize the transaction into exactly ONE of the following categories.
    
    Allowed Categories:
    - Food
    - Transport
    - Fun
    - Health
    - Bills
    - Shopping

    Rules:
    - "Makan", "Warung", "Kopi", "Cafe", "Starbucks", "KFC", "Bread", "Sate" -> Food
    - "Gojek", "Grab", "Bensin", "Pertamina", "Isi Bensin", "SPBU", "Shell", "Parkir", "Tol" -> Transport
    - "Bioskop", "Cinema", "Netflix", "Spotify", "Steam", "Game" -> Fun
    - "Doctor", "Apotek", "Obat", "RS", "Hospital" -> Health
    - "PLN", "Listrik", "Token", "Air", "Pulsa", "Data", "Internet", "Wifi", "Topup" -> Bills
    - "Tokopedia", "Shopee", "Indomaret", "Alfamart", "Superindo", "Mall", "Belanja" -> Shopping
    
    If unsure, choose the closest match (e.g., "Jajan" -> Food, "Taxi" -> Transport).
    
    Input Merchant: "${merchant}"
    Input Description: "${description || ""}"

    Response: (Just the category name)
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log("Gemini Output:", text); // Debug log
        return text.trim();
    } catch (error: any) {
        console.error("Error categorizing transaction with Gemini:", error);
        // Return the actual error so we can see it in the frontend
        return `Error: ${error.message || "Unknown Error"}`;
    }
};
