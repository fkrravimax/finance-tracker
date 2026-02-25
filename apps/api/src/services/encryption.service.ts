
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ── Security: ENCRYPTION_KEY is REQUIRED ────────────────────────────────────
const ENCRYPTION_KEY_RAW = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY_RAW) {
    throw new Error(
        '[FATAL] ENCRYPTION_KEY environment variable is not set. ' +
        'Cannot start server without encryption key. ' +
        'Generate one with: openssl rand -hex 32'
    );
}

const IV_LENGTH = 12; // GCM standard IV length (96 bits)
const AUTH_TAG_LENGTH = 16; // GCM auth tag length (128 bits)
const CBC_IV_LENGTH = 16; // Legacy CBC IV length

// Determine key buffer (must be exactly 32 bytes for AES-256)
let ENCRYPTION_KEY: Buffer;

try {
    if (Buffer.from(ENCRYPTION_KEY_RAW, 'hex').length === 32) {
        ENCRYPTION_KEY = Buffer.from(ENCRYPTION_KEY_RAW, 'hex');
    } else if (Buffer.byteLength(ENCRYPTION_KEY_RAW) === 32) {
        ENCRYPTION_KEY = Buffer.from(ENCRYPTION_KEY_RAW);
    } else {
        throw new Error(
            `[FATAL] ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters). ` +
            `Got ${ENCRYPTION_KEY_RAW.length} characters. ` +
            `Generate one with: openssl rand -hex 32`
        );
    }
} catch (e: any) {
    if (e.message.includes('[FATAL]')) throw e;
    throw new Error(
        `[FATAL] Invalid ENCRYPTION_KEY format. ` +
        `Generate one with: openssl rand -hex 32`
    );
}


export const cryptoService = {
    /**
     * Encrypt using AES-256-GCM (authenticated encryption).
     * Format: gcm:<iv_hex>:<ciphertext_hex>:<authTag_hex>
     */
    encrypt(text: string | number | null | undefined): string {
        try {
            if (text === null || text === undefined) return text as any;
            const stringText = String(text);

            const iv = crypto.randomBytes(IV_LENGTH);
            const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
            let encrypted = cipher.update(stringText, 'utf8');
            encrypted = Buffer.concat([encrypted, cipher.final()]);
            const authTag = cipher.getAuthTag();

            return `gcm:${iv.toString('hex')}:${encrypted.toString('hex')}:${authTag.toString('hex')}`;
        } catch (e) {
            console.error('Encryption error:', e);
            throw e;
        }
    },

    /**
     * Decrypt with automatic format detection.
     * Supports:
     *   - GCM format: gcm:<iv>:<ciphertext>:<authTag>
     *   - Legacy CBC format: <iv>:<ciphertext>
     */
    decrypt(text: string): string {
        try {
            if (!text) return text;

            // ── GCM format detection ─────────────────────────────────────
            if (text.startsWith('gcm:')) {
                const parts = text.split(':');
                if (parts.length !== 4) {
                    console.error('Decryption error: invalid GCM format');
                    throw new Error('Invalid GCM ciphertext format');
                }

                const iv = Buffer.from(parts[1], 'hex');
                const encryptedText = Buffer.from(parts[2], 'hex');
                const authTag = Buffer.from(parts[3], 'hex');

                const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
                decipher.setAuthTag(authTag);
                let decrypted = decipher.update(encryptedText);
                decrypted = Buffer.concat([decrypted, decipher.final()]);

                return decrypted.toString('utf8');
            }

            // ── Legacy CBC format (backward compatibility) ───────────────
            const textParts = text.split(':');
            if (textParts.length !== 2) return text; // Not encrypted data

            const iv = Buffer.from(textParts[0], 'hex');
            const encryptedText = Buffer.from(textParts[1], 'hex');

            const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
            let decrypted = decipher.update(encryptedText);
            decrypted = Buffer.concat([decrypted, decipher.final()]);

            return decrypted.toString();
        } catch (e) {
            console.error('Decryption error:', e);
            throw new Error('Failed to decrypt data. Possible key mismatch or data corruption.');
        }
    },

    decryptToNumber(text: string | null | undefined): number {
        if (text === null || text === undefined) return 0;
        const decrypted = this.decrypt(text);
        const result = parseFloat(decrypted);
        return isNaN(result) ? 0 : result;
    }
};
