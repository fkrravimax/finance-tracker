
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Try to load .env from current dir or parent
const envPath = fs.existsSync('.env') ? '.env' : path.join(process.cwd(), 'apps/api/.env');
dotenv.config({ path: envPath });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("❌ No GEMINI_API_KEY found. Make sure you are running this from the root or apps/api and .env exists.");
    process.exit(1);
}

console.log(`✅ Found API Key: ${apiKey.substring(0, 5)}...`);

async function checkModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    console.log(`Checking available models via direct API call...`);

    try {
        const response = await fetch(url);

        if (!response.ok) {
            console.error(`❌ API Request Failed: ${response.status} ${response.statusText}`);
            console.error(await response.text());
            return;
        }

        const data = await response.json();

        if (data.models) {
            console.log("\n✅ Available Models for content generation:");
            const genModels = data.models.filter((m: any) => m.supportedGenerationMethods.includes("generateContent"));
            genModels.forEach((m: any) => {
                console.log(`- ${m.name.replace('models/', '')}`); // remove prefix for cleaner output
            });

            if (genModels.length === 0) {
                console.warn("⚠️ No models found that support 'generateContent'. Check your API key type.");
            }
        } else {
            console.log("⚠️ No models returned. Raw response:", data);
        }

    } catch (error) {
        console.error("❌ Network or Parsing Error:", error);
    }
}

checkModels();
