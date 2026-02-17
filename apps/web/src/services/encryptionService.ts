
import api from './api';
import CryptoJS from 'crypto-js';

let ENCRYPTION_KEY: string | null = null;

export const encryptionService = {
    // Initialize by fetching the key from the backend
    init: async () => {
        if (ENCRYPTION_KEY) return;
        try {
            const { data } = await api.get('/keys');
            // Backend sends raw key. We need to parse it if it's hex, 
            // but the backend sends process.env.ENCRYPTION_KEY which might be raw string or hex.
            // Our backend `encryption.service.ts` handles both.
            // Let's assume the key returned is the RAW string or Hex string that can be used.
            // To match Node's crypto with 'aes-256-cbc', we need to be careful with key derivation.
            // However, if we use the backend to encrypt/decrypt, we need to match it EXACTLY.

            // Node: crypto.createCipheriv('aes-256-cbc', Buffer.from(KEY, 'hex'), iv)
            // Crypto-JS equivalent needed.

            ENCRYPTION_KEY = data.key; // Keep raw, do not trim yet (needed for legacy fallback)
            if (ENCRYPTION_KEY) {
                console.log("[Encryption] Key loaded. Length:", ENCRYPTION_KEY.length);
            }
        } catch (error) {
            console.error('Failed to initialize encryption service:', error);
            throw new Error("Failed to load encryption keys");
        }
    },

    ensureInitialized: async () => {
        if (!ENCRYPTION_KEY) await encryptionService.init();
    },

    // format: iv_hex:ciphertext_hex
    encrypt: (text: string | number): string => {
        if (!ENCRYPTION_KEY) {
            console.error("Encryption key not initialized!");
            throw new Error("Encryption key not initialized");
        }

        const stringText = String(text);
        const iv = CryptoJS.lib.WordArray.random(16);

        // Parse Key: Match Backend's "Fallback" Logic (Ascii -> Truncate/Pad)
        // We suspect Backend falls into 'else' block due to whitespace, 
        // effectively using the Raw String bytes (truncated to 32).

        const tempKey = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY);
        const paddedKey = CryptoJS.lib.WordArray.create(new Array(8).fill(0), 32);

        // Copy first 32 bytes (truncate if longer, pad if shorter)
        for (let i = 0; i < 8; i++) {
            paddedKey.words[i] = (tempKey.words[i] || 0);
        }

        const keyWords = paddedKey;

        const encrypted = CryptoJS.AES.encrypt(stringText, keyWords, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });

        return iv.toString(CryptoJS.enc.Hex) + ':' + encrypted.ciphertext.toString(CryptoJS.enc.Hex);
    },

    decrypt: (text: string): string | null => {
        if (!text || !text.includes(':')) return text;
        if (!ENCRYPTION_KEY) return null;

        try {
            const parts = text.split(':');
            if (parts.length !== 2) return null;
            const ivHex = parts[0];
            const encryptedHex = parts[1];

            const iv = CryptoJS.enc.Hex.parse(ivHex);
            const ciphertext = CryptoJS.enc.Hex.parse(encryptedHex);

            // Strategy 1: Try Backend "Fallback" Logic (Ascii -> Truncate/Pad)
            // This is our Primary Strategy now.
            const tempKey = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY);
            const paddedKey = CryptoJS.lib.WordArray.create(new Array(8).fill(0), 32);
            for (let i = 0; i < 8; i++) {
                paddedKey.words[i] = (tempKey.words[i] || 0);
            }
            const keyWords = paddedKey;

            try {
                const decrypted = CryptoJS.AES.decrypt(
                    { ciphertext: ciphertext } as CryptoJS.lib.CipherParams,
                    keyWords,
                    {
                        iv: iv,
                        mode: CryptoJS.mode.CBC,
                        padding: CryptoJS.pad.Pkcs7
                    }
                );
                const str = decrypted.toString(CryptoJS.enc.Utf8);
                if (str) return str;
            } catch (ignore) { }

            // Strategy 2: Try Hex Key (Trimmed)
            // Just in case Backend somehow succeeds with Hex sometimes, or for migration.
            const cleanKey = ENCRYPTION_KEY.trim();
            if (/^[0-9a-fA-F]+$/.test(cleanKey) && cleanKey.length === 64) {
                const hexKey = CryptoJS.enc.Hex.parse(cleanKey);
                try {
                    const decrypted = CryptoJS.AES.decrypt(
                        { ciphertext: ciphertext } as CryptoJS.lib.CipherParams,
                        hexKey,
                        {
                            iv: iv,
                            mode: CryptoJS.mode.CBC,
                            padding: CryptoJS.pad.Pkcs7
                        }
                    );
                    const str = decrypted.toString(CryptoJS.enc.Utf8);
                    if (str) return str;
                } catch (ignore) { }
            }

            return null;

        } catch (e) {
            console.error("Decryption failed", e);
            return null;
        }
    },

    decryptToNumber: (text: string | null | undefined): number => {
        if (text === null || text === undefined) return 0;
        const dec = encryptionService.decrypt(text);
        if (dec === null) return 0;
        const num = parseFloat(dec);
        return isNaN(num) ? 0 : num;
    }
};
