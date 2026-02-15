import React, { useEffect, useState } from 'react';
import { sessionService, type Session } from '../../services/sessionService';
import { useNotification } from '../../contexts/NotificationContext';
import ConfirmationModal from '../ConfirmationModal';

const SessionList: React.FC = () => {
    const { showNotification } = useNotification();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [confirmation, setConfirmation] = useState<{
        isOpen: boolean;
        sessionId: string | null;
        isLoading: boolean;
    }>({
        isOpen: false,
        sessionId: null,
        isLoading: false
    });

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const data = await sessionService.getSessions();
            setSessions(data);
        } catch (error) {
            console.error(error);
            showNotification('Failed to load login history', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const handleRevokeClick = (id: string) => {
        setConfirmation({
            isOpen: true,
            sessionId: id,
            isLoading: false
        });
    };

    const handleConfirmRevoke = async () => {
        if (!confirmation.sessionId) return;

        setConfirmation(prev => ({ ...prev, isLoading: true }));
        try {
            await sessionService.revokeSession(confirmation.sessionId);
            setSessions(prev => prev.filter(s => s.id !== confirmation.sessionId));
            showNotification('Session revoked successfully');
        } catch (error: any) {
            console.error(error);
            showNotification(error.message || 'Failed to revoke session', 'error');
        } finally {
            setConfirmation({ isOpen: false, sessionId: null, isLoading: false });
        }
    };

    const getDeviceIcon = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'mobile':
                return 'smartphone';
            case 'tablet':
                return 'tablet_mac';
            default:
                return 'laptop_mac';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <ConfirmationModal
                isOpen={confirmation.isOpen}
                onClose={() => setConfirmation({ ...confirmation, isOpen: false })}
                onConfirm={handleConfirmRevoke}
                title="Revoke Session?"
                message="Are you sure you want to log out this device? They will need to sign in again."
                variant="danger"
                confirmText="Revoke Access"
                isLoading={confirmation.isLoading}
            />

            {sessions.map((session) => (
                <div
                    key={session.id}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${session.isCurrent
                        ? 'bg-primary/5 border-primary/20 dark:bg-primary/10 dark:border-primary/20'
                        : 'bg-white dark:bg-[#2b2616] border-slate-100 dark:border-[#493f22] hover:border-slate-300 dark:hover:border-[#493f22]/80'
                        }`}
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${session.isCurrent
                            ? 'bg-primary text-white'
                            : 'bg-slate-100 dark:bg-[#1a160b] text-slate-500 dark:text-[#cbbc90]'
                            }`}>
                            <span className="material-symbols-outlined text-2xl">
                                {getDeviceIcon(session.device.type)}
                            </span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="font-bold text-slate-900 dark:text-white">
                                    {session.os.name || 'Unknown OS'} {session.os.version}
                                    {session.browser.name && ` • ${session.browser.name}`}
                                </h4>
                                {session.isCurrent && (
                                    <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold uppercase tracking-wider">
                                        Active Now
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-slate-500 dark:text-[#cbbc90] flex items-center gap-2 mt-0.5">
                                <span className="material-symbols-outlined text-[14px]">public</span>
                                {session.ipAddress}
                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                <span className="material-symbols-outlined text-[14px]">schedule</span>
                                {new Date(session.lastActive).toLocaleDateString()} {new Date(session.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>

                    {!session.isCurrent && (
                        <button
                            onClick={() => handleRevokeClick(session.id)}
                            className="p-2 text-slate-400 hover:text-red-500 dark:text-[#cbbc90] dark:hover:text-red-400 transition-colors"
                            title="Revoke access"
                        >
                            <span className="material-symbols-outlined">delete</span>
                        </button>
                    )}
                </div>
            ))}

            {sessions.length === 0 && (
                <div className="text-center p-8 text-slate-500 dark:text-[#cbbc90]">
                    No active sessions found.
                </div>
            )}
        </div>
    );
};

export default SessionList;
