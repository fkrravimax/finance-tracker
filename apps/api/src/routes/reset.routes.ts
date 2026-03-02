import { Router, Request, Response } from 'express';
import { resetService } from '../services/reset.service.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { db } from '../db/index.js';
import { accounts } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { verifyPassword } from "better-auth/crypto";
import { auditService } from '../services/audit.service.js';

const router = Router();

// Reset All Data — requires password re-authentication for credential accounts
router.post('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = res.locals.user.id;
        const { password } = req.body;

        // Check if user has a credential (email/password) account
        const [credentialAccount] = await db.select({ password: accounts.password })
            .from(accounts)
            .where(and(eq(accounts.userId, userId), eq(accounts.providerId, 'credential')))
            .limit(1);

        if (credentialAccount) {
            // User has email/password account — require password re-auth
            if (!password) {
                return res.status(400).json({
                    error: 'Password is required to reset data',
                    requiresPassword: true
                });
            }

            if (!credentialAccount.password) {
                return res.status(500).json({ error: 'Account password hash not found' });
            }

            // Verify password using Better Auth's hash verifier
            const isValid = await verifyPassword({
                hash: credentialAccount.password,
                password: password
            });

            if (!isValid) {
                return res.status(401).json({ error: 'Incorrect password' });
            }
        }
        // Google-only users: no password check needed — session auth + UI confirmation is sufficient

        const result = await resetService.resetUserData(userId);

        // Audit log
        auditService.log({
            userId,
            action: 'DATA_RESET',
            targetId: userId,
            targetType: 'user',
            ipAddress: req.ip,
        });

        res.json(result);
    } catch (error) {
        console.error("Reset error", error);
        res.status(500).json({ error: 'Failed to reset data' });
    }
});

export const resetRoutes = router;
