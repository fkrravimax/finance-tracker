
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set in environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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
