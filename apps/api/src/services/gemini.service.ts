
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set in environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const categorizeTransaction = async (merchant: string, description?: string): Promise<string> => {
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is missing.");
    }



    const prompt = `
    You are a financial classifier. Analyze the merchant name and description to categorize the transaction.
    
    Target Categories (Return exactly one of these strings):
    - Food
    - Transport
    - Fun
    - Health
    - Bills
    - Shopping

    Input:
    Merchant: "${merchant}"
    Description: "${description || ""}"

    Context & Rules:
    1. Detect language (supports Indonesian/English).
    2. "Makan", "Warung", "Resto", "Cafe", "Starbucks", "KFC", "Sate", "Nasi" -> Food
    3. "Gojek", "Grab", "Bensin", "Pertamina", "Uber", "Train", "Bus", "Parkir", "Isi Bensin", "SPBU" -> Transport
    4. "Bioskop", "Netflix", "Spotify", "Game", "Hobby", "Steam" -> Fun
    5. "Doctor", "Apotek", "Obat", "Hospital", "Gym" -> Health
    6. "PLN", "Listrik", "Air", "Wifi", "Pulsa", "Telkomsel", "Topup Emoney", "E-money", "Topup", "Internet" -> Bills
    7. "Tokopedia", "Shopee", "Amazon", "Indomaret", "Alfamart", "Mall", "Clothes", "Belanja" -> Shopping

    Return ONLY the Category string.
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return text.trim();
    } catch (error) {
        console.error("Error categorizing transaction with Gemini:", error);
        return "Others"; // Fallback
    }
};
