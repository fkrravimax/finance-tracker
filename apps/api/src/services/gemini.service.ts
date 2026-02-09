
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
    You are a financial assistant. Categorize the transaction based on the merchant name and description.
    
    Categories:
    - Food & Drink
    - Transportation
    - Shopping
    - Entertainment
    - Health
    - Education
    - Bills & Utilities
    - housing
    - Salaries
    - Investments
    - Others

    Input:
    Merchant: "${merchant}"
    Description: "${description || ""}"

    Instructions:
    1. Detect the language automatically (supports Indonesian/English).
    2. Understand local context (e.g., "Warung", "Gojek", "Tokopedia").
    3. Return ONLY the category name from the list above. Do not act like a chatbot. Just return the string.
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
