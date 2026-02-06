import { Router } from 'express';
import { tradingController } from '../controllers/trading.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/', tradingController.createTrade);
router.get('/', tradingController.getTrades);
router.get('/stats', tradingController.getStats);
router.post('/withdraw', tradingController.withdraw);
router.post('/deposit', tradingController.deposit);

export default router;
