import express from 'express';
import { cronController } from '../controllers/cron.controller.js';

const router = express.Router();

// GET /api/cron?job=<job_name>
// Protected by Authorization: Bearer <CRON_SECRET> (handled in controller)
router.get('/', cronController.handleCron);

export default router;
