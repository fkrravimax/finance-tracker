import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface UIContextType {
    isQuickAddOpen: boolean;
    openQuickAdd: () => void;
    closeQuickAdd: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

    const openQuickAdd = () => setIsQuickAddOpen(true);
    const closeQuickAdd = () => setIsQuickAddOpen(false);

    return (
        <UIContext.Provider value={{ isQuickAddOpen, openQuickAdd, closeQuickAdd }}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};
