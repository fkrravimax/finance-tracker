
import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/stats', dashboardController.getStats);
router.get('/report', dashboardController.getReport);

export default router;
