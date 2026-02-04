import { Router } from 'express';
import { savingsGoalController } from '../controllers/savings-goal.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', savingsGoalController.getAll);
router.post('/', savingsGoalController.create);
router.patch('/:id/amount', savingsGoalController.updateAmount);
router.delete('/:id', savingsGoalController.delete);

export default router;
