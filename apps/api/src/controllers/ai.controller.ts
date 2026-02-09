
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
        console.log(`Categorized '${merchant}' as '${category}'`);
        res.json({ category });

    } catch (error) {
        console.error('Error in categorize controller:', error);
        res.status(500).json({ error: 'Failed to categorize transaction' });
    }
};
