
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

        // Match Backend Logic EXACTLY:
        // 1. Try Hex (32 bytes = 64 chars)
        if (/^[0-9a-fA-F]+$/.test(ENCRYPTION_KEY) && ENCRYPTION_KEY.length === 64) {
            keyWords = CryptoJS.enc.Hex.parse(ENCRYPTION_KEY);
        }
        // 2. Try Raw (32 chars)
        else if (ENCRYPTION_KEY.length === 32) {
            keyWords = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY);
        }
        // 3. Fallback: Pad or Truncate to 32 bytes (Zero Padding)
        else {
            const tempKey = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY);

            // Create a 32-byte (8-word) zero-filled WordArray
            const paddedKey = CryptoJS.lib.WordArray.create(new Array(8).fill(0), 32); // 8 words * 4 bytes = 32 bytes

            // Copy bytes from tempKey to paddedKey
            // WordArray logic is a bit manual, identifying effective bytes.
            // Easier approach: Use manual padding helper if needed, or simple clamping.

            // Actually, simpler approach to match `Buffer.alloc(32).write(str)`:
            // If we have "abc", Buffer is [61, 62, 63, 00, 00...]

            // Let's implement manual padding on the words array.
            for (let i = 0; i < 8; i++) { // 32 bytes = 8 words
                if (i < tempKey.words.length) {
                    paddedKey.words[i] = tempKey.words[i];
                } else {
                    paddedKey.words[i] = 0;
                }
            }

            // Handle sigBytes mismatch (utf8 parse might set sigBytes to e.g. 13)
            // But we want STRICTLY 32 bytes.
            // If original string was short, sigBytes is small.
            // We want to FORCE it to 32.
            // However, we must ensure the 'undefined' words are 0.

            // Wait, simply assigning words might copy garbage if `tempKey` has fewer words.
            // tempKey.words elements beyond length are undefined.

            // Refined Loop:
            for (let i = 0; i < 8; i++) {
                paddedKey.words[i] = (tempKey.words[i] || 0);
            }

            // If the string was LONGER than 32 bytes?
            // `Buffer.write` truncates.
            // `tempKey.words` will have more than 8 words.
            // Our loop only takes first 8. That matches truncation.

            keyWords = paddedKey;
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

    decrypt: (text: string): string | null => {
        if (!text || !text.includes(':')) return text;
        if (!ENCRYPTION_KEY) return null;

        try {
            const parts = text.split(':');
            if (parts.length !== 2) return null; // Invalid format
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
                const tempKey = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY);
                const paddedKey = CryptoJS.lib.WordArray.create(new Array(8).fill(0), 32);
                for (let i = 0; i < 8; i++) {
                    paddedKey.words[i] = (tempKey.words[i] || 0);
                }
                keyWords = paddedKey;
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

            // This throws if malformed
            return decrypted.toString(CryptoJS.enc.Utf8);
        } catch (e) {
            console.error("Decryption failed", e);
            return null; // Signal failure
        }
    },

    decryptToNumber: (text: string | null | undefined): number => {
        if (text === null || text === undefined) return 0;
        const dec = encryptionService.decrypt(text);
        if (dec === null) return 0; // Decryption failed -> 0 (Reset corrupted data)
        const num = parseFloat(dec);
        return isNaN(num) ? 0 : num;
    }
};
