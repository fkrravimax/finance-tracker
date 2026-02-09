import React, { createContext, useContext, useState, type ReactNode, useCallback } from 'react';

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
    id: string;
    message: string;
    type: NotificationType;
}

interface NotificationContextType {
    showNotification: (message: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

interface NotificationProviderProps {
    children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const showNotification = useCallback((message: string, type: NotificationType = 'success') => {
        const id = Math.random().toString(36).substr(2, 9);
        setNotifications(prev => [...prev, { id, message, type }]);

        // Auto remove after 3 seconds
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 3000);
    }, []);

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            {/* Notification Container */}
            <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
                {notifications.map(notification => (
                    <div
                        key={notification.id}
                        className={`
                            pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl animate-slide-in-right max-w-sm
                            ${notification.type === 'success' ? 'bg-green-500 text-white' : ''}
                            ${notification.type === 'error' ? 'bg-red-500 text-white' : ''}
                            ${notification.type === 'warning' ? 'bg-yellow-500 text-black' : ''}
                            ${notification.type === 'info' ? 'bg-slate-900 dark:bg-slate-700 text-white' : ''}
                        `}
                    >
                        <div className="p-1 rounded-full bg-white/20">
                            <span className="material-symbols-outlined text-sm font-bold">
                                {notification.type === 'success' ? 'check' :
                                    notification.type === 'error' ? 'error' :
                                        notification.type === 'warning' ? 'warning' : 'info'}
                            </span>
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-sm leading-tight">{notification.message}</p>
                        </div>
                        <button
                            onClick={() => removeNotification(notification.id)}
                            className="text-white/60 hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
};
