
import { Router } from 'express';
import { exportController } from '../controllers/export.controller';

const router = Router();

router.get('/', exportController.exportData);

export default router;
