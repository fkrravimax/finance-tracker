import { Router } from 'express';
import { transactionController } from '../controllers/transaction.controller.js';

const router = Router();

router.get('/', transactionController.getAll);
router.post('/', transactionController.create);
router.put('/:id', transactionController.update);
router.delete('/:id', transactionController.delete);

export default router;
