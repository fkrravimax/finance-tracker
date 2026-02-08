import React, { createContext, useContext, useState } from 'react';

interface MultiAccountContextType {
    isAddingAccount: boolean;
    startAddAccount: () => void;
    cancelAddAccount: () => void;
}

const MultiAccountContext = createContext<MultiAccountContextType | undefined>(undefined);

export const MultiAccountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAddingAccount, setIsAddingAccount] = useState(false);

    const startAddAccount = () => setIsAddingAccount(true);
    const cancelAddAccount = () => setIsAddingAccount(false);

    return (
        <MultiAccountContext.Provider value={{ isAddingAccount, startAddAccount, cancelAddAccount }}>
            {children}
        </MultiAccountContext.Provider>
    );
};

export const useMultiAccount = () => {
    const context = useContext(MultiAccountContext);
    if (!context) {
        throw new Error('useMultiAccount must be used within a MultiAccountProvider');
    }
    return context;
};
