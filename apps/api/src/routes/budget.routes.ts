
import { Router } from 'express';
import { budgetController } from '../controllers/budget.controller.js';

const router = Router();

router.get('/', budgetController.get);
router.post('/', budgetController.set);

export default router;
