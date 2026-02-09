
import { Router } from 'express';
import { categorize } from '../controllers/ai.controller.js';

const router = Router();

router.post('/categorize', categorize);

export default router;
