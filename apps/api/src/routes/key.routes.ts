
import { Router } from 'express';
import { keyController } from '../controllers/key.controller.js';

const router = Router();

router.get('/', keyController.getKey);

export default router;
