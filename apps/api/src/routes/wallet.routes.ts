
import express from 'express';
import { walletService } from '../services/wallet.service.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const userId = req.headers['user-id'] as string || 'user_2sO...'; // Middleware should handle this
        // actually use req.body.user.id from authMiddleware
        // @ts-ignore
        const user = req.user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const wallets = await walletService.getAll(user.id);
        res.json(wallets);
    } catch (error) {
        console.error("Get wallets error", error);
        res.status(500).json({ error: "Failed to fetch wallets" });
    }
});

router.post('/', async (req, res) => {
    try {
        // @ts-ignore
        const user = req.user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const { name, type } = req.body;
        if (!name || !type) return res.status(400).json({ error: "Name and type required" });

        const wallet = await walletService.create(user.id, name, type);
        res.json(wallet);
    } catch (error) {
        console.error("Create wallet error", error);
        res.status(500).json({ error: "Failed to create wallet" });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        // @ts-ignore
        const user = req.user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const { id } = req.params;
        await walletService.delete(id, user.id);
        res.json({ success: true });
    } catch (error) {
        console.error("Delete wallet error", error);
        res.status(500).json({ error: "Failed to delete wallet" });
    }
});

export default router;
