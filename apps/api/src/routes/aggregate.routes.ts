
import { Router } from 'express';
import { aggregateController } from '../controllers/aggregate.controller.js';

const router = Router();

router.get('/monthly', aggregateController.getMonthly);
router.get('/daily', aggregateController.getDaily);
router.get('/categories', aggregateController.getCategories);

export default router;
