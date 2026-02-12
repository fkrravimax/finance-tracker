import { Router } from 'express';
import { savingsGoalController } from '../controllers/savings-goal.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createSavingsGoalSchema, updateSavingsAmountSchema } from '../validators/validators.js';

const router = Router();

router.use(authMiddleware);

router.get('/', savingsGoalController.getAll);
router.post('/', validate(createSavingsGoalSchema), savingsGoalController.create);
router.patch('/:id/amount', validate(updateSavingsAmountSchema), savingsGoalController.updateAmount);
router.delete('/:id', savingsGoalController.delete);

export default router;
