import { Router } from 'express';
import { tradingController } from '../controllers/trading.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createTradeSchema, depositWithdrawSchema, openPositionSchema, closePositionSchema } from '../validators/validators.js';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(createTradeSchema), tradingController.createTrade);
router.get('/', tradingController.getTrades);
router.get('/stats', tradingController.getStats);
router.get('/open', tradingController.getOpenPositions);
router.post('/open', validate(openPositionSchema), tradingController.openPosition);
router.put('/:id/close', validate(closePositionSchema), tradingController.closePosition);
router.post('/withdraw', validate(depositWithdrawSchema), tradingController.withdraw);
router.post('/deposit', validate(depositWithdrawSchema), tradingController.deposit);

export default router;

