import { Request, Response } from 'express';
import { cryptoService } from '../services/market.service.js';

export const cryptoController = {
    getListings: async (req: Request, res: Response) => {
        try {
            const limit = parseInt(req.query.limit as string) || 50;
            const convert = (req.query.convert as string) || 'USD';
            const data = await cryptoService.getListings(Math.min(limit, 100), convert);
            res.json(data);
        } catch (error: any) {
            console.error('Failed to fetch crypto listings:', error.message);
            res.status(500).json({ error: 'Failed to fetch crypto listings' });
        }
    },

    getGlobalMetrics: async (req: Request, res: Response) => {
        try {
            const convert = (req.query.convert as string) || 'USD';
            const data = await cryptoService.getGlobalMetrics(convert);
            res.json(data);
        } catch (error: any) {
            console.error('Failed to fetch global metrics:', error.message);
            res.status(500).json({ error: 'Failed to fetch global metrics' });
        }
    },

    getQuotes: async (req: Request, res: Response) => {
        try {
            const symbols = req.query.symbols as string;
            if (!symbols) {
                return res.status(400).json({ error: 'symbols parameter is required' });
            }
            const convert = (req.query.convert as string) || 'USD';
            const data = await cryptoService.getQuotes(symbols, convert);
            res.json(data);
        } catch (error: any) {
            console.error('Failed to fetch crypto quotes:', error.message);
            res.status(500).json({ error: 'Failed to fetch crypto quotes' });
        }
    },

    getInfo: async (req: Request, res: Response) => {
        try {
            const symbols = req.query.symbols as string;
            if (!symbols) {
                return res.status(400).json({ error: 'symbols parameter is required' });
            }
            const data = await cryptoService.getInfo(symbols);
            res.json(data);
        } catch (error: any) {
            console.error('Failed to fetch crypto info:', error.message);
            res.status(500).json({ error: 'Failed to fetch crypto info' });
        }
    },

    convertPrice: async (req: Request, res: Response) => {
        try {
            const amount = parseFloat(req.query.amount as string);
            const symbol = req.query.symbol as string;
            const convert = (req.query.convert as string) || 'IDR';

            if (!amount || !symbol) {
                return res.status(400).json({ error: 'amount and symbol parameters are required' });
            }

            const data = await cryptoService.convertPrice(amount, symbol, convert);
            res.json(data);
        } catch (error: any) {
            console.error('Failed to convert price:', error.message);
            res.status(500).json({ error: 'Failed to convert price' });
        }
    },

    getMap: async (req: Request, res: Response) => {
        try {
            const limit = parseInt(req.query.limit as string) || 200;
            const data = await cryptoService.getMap(Math.min(limit, 500));
            res.json(data);
        } catch (error: any) {
            console.error('Failed to fetch crypto map:', error.message);
            res.status(500).json({ error: 'Failed to fetch crypto map' });
        }
    },
    async getFearGreedIndex(req: Request, res: Response) {
        try {
            const data = await cryptoService.getFearGreedIndex();
            res.json(data);
        } catch (error: any) {
            console.error('Failed to fetch Fear & Greed Index:', error.message);
            res.status(500).json({ error: 'Failed to fetch Fear & Greed Index' });
        }
    },
};
