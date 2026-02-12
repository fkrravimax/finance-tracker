
import { Router } from 'express';
import { budgetController } from '../controllers/budget.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { setBudgetSchema } from '../validators/validators.js';

const router = Router();

router.get('/', budgetController.get);
router.post('/', validate(setBudgetSchema), budgetController.set);

export default router;
