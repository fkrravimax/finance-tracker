import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface Transaction {
    id: string;
    merchant: string;
    category: string;
    amount: string | number;
    type: 'income' | 'expense';
    date: string;
    notes?: string;
    source?: string;
}

interface UIContextType {
    isQuickAddOpen: boolean;
    editingTransaction: Transaction | null;
    openQuickAdd: (transaction?: Transaction) => void;
    closeQuickAdd: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

    const openQuickAdd = (transaction?: Transaction) => {
        if (transaction) {
            setEditingTransaction(transaction);
        } else {
            setEditingTransaction(null);
        }
        setIsQuickAddOpen(true);
    };

    const closeQuickAdd = () => {
        setIsQuickAddOpen(false);
        setTimeout(() => setEditingTransaction(null), 300); // Clear after animation
    };

    return (
        <UIContext.Provider value={{ isQuickAddOpen, editingTransaction, openQuickAdd, closeQuickAdd }}>
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
