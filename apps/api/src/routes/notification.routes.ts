import express from 'express';
import { notificationController } from '../controllers/notification.controller.js';

const router = express.Router();

// GET /api/notifications/vapid-key — Public VAPID key for frontend subscription
router.get('/vapid-key', notificationController.getVapidKey);

// POST /api/notifications/subscribe — Save push subscription
router.post('/subscribe', notificationController.subscribe);

// DELETE /api/notifications/unsubscribe — Remove push subscription
router.delete('/unsubscribe', notificationController.unsubscribe);

export default router;
