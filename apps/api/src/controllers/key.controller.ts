
import { Request, Response } from 'express';

export const keyController = {
    getKey: async (req: Request, res: Response) => {
        try {
            // Ensure strictly authenticated (already handled by middleware, but good to double check context)
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // Return the key. 
            // In a real production app with per-user keys, we would fetch the user's specific key.
            // Here we return the global key, which allows the client to perform the encryption.
            // This is sensitive! Ensure HTTPS is used.
            const key = process.env.ENCRYPTION_KEY;

            console.log("Requesting encryption key. Key exists:", !!key, "User:", userId);

            if (!key) {
                console.error("CRITICAL: ENCRYPTION_KEY is not defined in environment variables");
                return res.status(500).json({ error: 'Encryption key configuration missing' });
            }

            res.json({ key });
        } catch (error) {
            console.error("Error in getKey:", error);
            res.status(500).json({ error: 'Failed to retrieve encryption key' });
        }
    }
};
