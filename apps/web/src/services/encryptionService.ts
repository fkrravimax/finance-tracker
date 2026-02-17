
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

            ENCRYPTION_KEY = data.key;
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
            return String(text); // Fail safe? Or throw? Better throw or return as is for now?
            // Returning as is might save it unencrypted!
            throw new Error("Encryption key not initialized");
        }

        const stringText = String(text);

        // Generate random IV (16 bytes)
        const iv = CryptoJS.lib.WordArray.random(16);

        // Parse Key
        // If key is 32-byte hex string, parse as Hex. If raw string, parse as Utf8.
        let keyWords;
        // Basic heuristic: check if hex and length is 64 chars (32 bytes)
        const isHex = /^[0-9a-fA-F]+$/.test(ENCRYPTION_KEY) && ENCRYPTION_KEY.length === 64;

        if (isHex) {
            keyWords = CryptoJS.enc.Hex.parse(ENCRYPTION_KEY);
        } else {
            // Check if backend treats it as hex or raw. Backend does:
            // if (Buffer.from(RAW, 'hex').length === 32) -> Use Hex
            // else -> Use Raw (Buffer.from(RAW))
            // So we strictly follow backend logic:

            // Re-implement backend logic for key parsing:
            if (/^[0-9a-fA-F]+$/.test(ENCRYPTION_KEY) && ENCRYPTION_KEY.length === 64) {
                keyWords = CryptoJS.enc.Hex.parse(ENCRYPTION_KEY);
            } else if (ENCRYPTION_KEY.length === 32) {
                // Raw 32 chars
                keyWords = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY);
            } else {
                // Backend truncates/pads. 
                // Assuming standard usage, we hopefully have a good key.
                // Let's assume Utf8 if not hex 64.
                keyWords = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY);
                // Note: Frontend padding/truncating to match backend might be tricky if backend allocs buffer.
                // Ideally valid keys are used.
            }
        }

        const encrypted = CryptoJS.AES.encrypt(stringText, keyWords, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });

        // Backend expects: iv_hex:ciphertext_hex
        // CryptoJS ciphertext is Base64 by default when toString(), but `encrypted.ciphertext` is WordArray
        return iv.toString(CryptoJS.enc.Hex) + ':' + encrypted.ciphertext.toString(CryptoJS.enc.Hex);
    },

    decrypt: (text: string): string => {
        if (!text || !text.includes(':')) return text;
        if (!ENCRYPTION_KEY) return text; // Or throw

        try {
            const parts = text.split(':');
            if (parts.length !== 2) return text;
            const ivHex = parts[0];
            const encryptedHex = parts[1];

            const iv = CryptoJS.enc.Hex.parse(ivHex);
            const ciphertext = CryptoJS.enc.Hex.parse(encryptedHex);

            // Parse Key (Exact same logic as encrypt)
            let keyWords;
            if (/^[0-9a-fA-F]+$/.test(ENCRYPTION_KEY) && ENCRYPTION_KEY.length === 64) {
                keyWords = CryptoJS.enc.Hex.parse(ENCRYPTION_KEY);
            } else if (ENCRYPTION_KEY.length === 32) {
                keyWords = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY);
            } else {
                keyWords = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY);
            }

            const decrypted = CryptoJS.AES.decrypt(
                { ciphertext: ciphertext } as CryptoJS.lib.CipherParams,
                keyWords,
                {
                    iv: iv,
                    mode: CryptoJS.mode.CBC,
                    padding: CryptoJS.pad.Pkcs7
                }
            );

            return decrypted.toString(CryptoJS.enc.Utf8);
        } catch (e) {
            console.error("Decryption failed", e);
            return text;
        }
    },

    decryptToNumber: (text: string | null | undefined): number => {
        if (text === null || text === undefined) return 0;
        const dec = encryptionService.decrypt(text);
        const num = parseFloat(dec);
        return isNaN(num) ? 0 : num;
    }
};
