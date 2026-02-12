import { Router } from 'express';
import { transactionController } from '../controllers/transaction.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { createTransactionSchema, updateTransactionSchema } from '../validators/validators.js';

const router = Router();

router.get('/', transactionController.getAll);
router.post('/', validate(createTransactionSchema), transactionController.create);
router.put('/:id', validate(updateTransactionSchema), transactionController.update);
router.delete('/:id', transactionController.delete);

export default router;
