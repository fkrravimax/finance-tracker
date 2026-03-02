
import { Router } from 'express';
import { categorize, parseReceipt } from '../controllers/ai.controller.js';

const router = Router();

router.post('/categorize', categorize);
router.post('/parse-receipt', parseReceipt);

export default router;
