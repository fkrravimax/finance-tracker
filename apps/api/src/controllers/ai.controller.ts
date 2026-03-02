
import { Request, Response } from 'express';
import { categorizeTransaction, parseReceiptImage } from '../services/gemini.service.js';

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

export const parseReceipt = async (req: Request, res: Response) => {
    try {
        const { image, mimeType } = req.body;

        if (!image) {
            res.status(400).json({ error: 'Image data is required' });
            return;
        }

        // Strip data URL prefix if present (e.g., "data:image/jpeg;base64,...")
        const base64Data = image.includes(',') ? image.split(',')[1] : image;
        const resolvedMimeType = mimeType || 'image/jpeg';

        const result = await parseReceiptImage(base64Data, resolvedMimeType);
        res.json(result);

    } catch (error: any) {
        console.error('Error in parseReceipt controller:', error);
        res.status(500).json({ error: error.message || 'Failed to parse receipt' });
    }
};
