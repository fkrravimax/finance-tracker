
import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';

const router = Router();

router.get('/stats', dashboardController.getStats);
router.get('/report', dashboardController.getReport);

export default router;
