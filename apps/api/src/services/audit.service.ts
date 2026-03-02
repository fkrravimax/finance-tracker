import { db } from '../db/index.js';
import { auditLogs } from '../db/schema.js';

export type AuditAction =
    | 'USER_DELETE'
    | 'USER_UPGRADE'
    | 'DATA_RESET'
    | 'DATA_EXPORT'
    | 'BROADCAST_SENT'
    | 'PASSWORD_CHANGE';

interface AuditEntry {
    userId: string;
    action: AuditAction;
    targetId?: string;
    targetType?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
}

export const auditService = {
    /**
     * Fire-and-forget audit log entry.
     * Never throws — failures are silently logged to console.
     */
    log(entry: AuditEntry) {
        db.insert(auditLogs)
            .values({
                userId: entry.userId,
                action: entry.action,
                targetId: entry.targetId || null,
                targetType: entry.targetType || null,
                metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
                ipAddress: entry.ipAddress || null,
            })
            .catch((err) => console.error('[AuditLog] Failed to write:', err));
    },
};
