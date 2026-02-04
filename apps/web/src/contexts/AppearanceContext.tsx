import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';
type PrivacyMode = 'none' | 'hidden' | 'extreme'; // hidden = soft hide (important only), extreme = hide all

interface AppearanceContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    privacyMode: PrivacyMode;
    setPrivacyMode: (mode: PrivacyMode) => void;
    currentTheme: 'light' | 'dark'; // The actual resolved theme
}

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

export const AppearanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Load from local storage or default
    const [theme, setThemeState] = useState<Theme>(() => {
        return (localStorage.getItem('theme') as Theme) || 'system';
    });

    const [privacyMode, setPrivacyModeState] = useState<PrivacyMode>(() => {
        return (localStorage.getItem('privacyMode') as PrivacyMode) || 'none';
    });

    const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    const setPrivacyMode = (newMode: PrivacyMode) => {
        setPrivacyModeState(newMode);
        localStorage.setItem('privacyMode', newMode);
    };

    // Apply Theme
    useEffect(() => {
        const applyTheme = () => {
            const root = window.document.documentElement;
            const systemRef = window.matchMedia('(prefers-color-scheme: dark)');

            let resolvedTheme: 'light' | 'dark' = 'light';

            if (theme === 'system') {
                resolvedTheme = systemRef.matches ? 'dark' : 'light';
            } else {
                resolvedTheme = theme;
            }

            setCurrentTheme(resolvedTheme);

            if (resolvedTheme === 'dark') {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        };

        applyTheme();

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => applyTheme();

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    return (
        <AppearanceContext.Provider value={{ theme, setTheme, privacyMode, setPrivacyMode, currentTheme }}>
            {children}
        </AppearanceContext.Provider>
    );
};

export const useAppearance = () => {
    const context = useContext(AppearanceContext);
    if (!context) {
        throw new Error("useAppearance must be used within an AppearanceProvider");
    }
    return context;
};
