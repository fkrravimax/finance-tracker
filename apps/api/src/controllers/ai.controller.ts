
import { Request, Response } from 'express';
import { categorizeTransaction } from '../services/gemini.service.js';

export const categorize = async (req: Request, res: Response) => {
    try {
        const { merchant, description } = req.body;

        if (!merchant) {
            res.status(400).json({ error: 'Merchant name is required' });
            return;
        }

        const category = await categorizeTransaction(merchant, description);
        console.log(`[API v2.0] Categorized '${merchant}' as '${category}'`); // Log for server side debugging
        // Append version for debugging
        res.json({ category: `${category} (v2.0)` });

    } catch (error) {
        console.error('Error in categorize controller:', error);
        res.status(500).json({ error: 'Failed to categorize transaction' });
    }
};
