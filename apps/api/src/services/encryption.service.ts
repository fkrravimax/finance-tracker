
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const ENCRYPTION_KEY_RAW = process.env.ENCRYPTION_KEY || 'default_key_must_be_32_chars_long!';
const IV_LENGTH = 16;

// Determine key buffer
let ENCRYPTION_KEY: Buffer;

try {
    if (Buffer.from(ENCRYPTION_KEY_RAW, 'hex').length === 32) {
        ENCRYPTION_KEY = Buffer.from(ENCRYPTION_KEY_RAW, 'hex');
    } else if (Buffer.byteLength(ENCRYPTION_KEY_RAW) === 32) {
        ENCRYPTION_KEY = Buffer.from(ENCRYPTION_KEY_RAW);
    } else {
        // Fallback: Pad or truncate to 32 bytes
        const buf = Buffer.alloc(32);
        buf.write(ENCRYPTION_KEY_RAW);
        ENCRYPTION_KEY = buf;
        console.warn(`[CryptoService] precise key length not met. Adjusted to 32 bytes. Raw length: ${ENCRYPTION_KEY_RAW.length}`);
    }
} catch (e) {
    const buf = Buffer.alloc(32);
    buf.write(ENCRYPTION_KEY_RAW);
    ENCRYPTION_KEY = buf;
}


export const cryptoService = {
    encrypt(text: string | number | null | undefined): string {
        try {
            if (text === null || text === undefined) return text as any;
            const stringText = String(text);

            const iv = crypto.randomBytes(IV_LENGTH);
            const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
            let encrypted = cipher.update(stringText);
            encrypted = Buffer.concat([encrypted, cipher.final()]);

            return iv.toString('hex') + ':' + encrypted.toString('hex');
        } catch (e) {
            console.error('Encryption error:', e);
            throw e; // Rethrow to catch in migration script
        }
    },

    decrypt(text: string): string {
        try {
            if (!text) return text;
            const textParts = text.split(':');
            if (textParts.length !== 2) return text;

            const iv = Buffer.from(textParts[0], 'hex');
            const encryptedText = Buffer.from(textParts[1], 'hex');

            const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
            let decrypted = decipher.update(encryptedText);
            decrypted = Buffer.concat([decrypted, decipher.final()]);

            return decrypted.toString();
        } catch (e) {
            console.error('Decryption error:', e);
            return text;
        }
    },

    decryptToNumber(text: string | null | undefined): number {
        if (text === null || text === undefined) return 0;
        const decrypted = this.decrypt(text);
        const result = parseFloat(decrypted);
        return isNaN(result) ? 0 : result;
    }
};
