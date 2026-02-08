import React, { createContext, useContext, useState, type ReactNode } from 'react';

// Import translations
import en from '../locales/en.json';
import id from '../locales/id.json';

type Language = 'en' | 'id';

type TranslationValue = string | { [key: string]: TranslationValue };

interface Translations {
    [key: string]: TranslationValue;
}

const translations: Record<Language, Translations> = { en, id };

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'rupiku_language';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>(() => {
        // Check localStorage first
        const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (saved === 'en' || saved === 'id') {
            return saved;
        }
        // Default to browser language or 'en'
        const browserLang = navigator.language.toLowerCase();
        return browserLang.startsWith('id') ? 'id' : 'en';
    });

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    };

    // Translation function - supports nested keys like "sidebar.overview"
    const t = (key: string): string => {
        const keys = key.split('.');
        let value: TranslationValue = translations[language];

        for (const k of keys) {
            if (typeof value === 'object' && value !== null && k in value) {
                value = value[k];
            } else {
                // Fallback to English if key not found
                let fallback: TranslationValue = translations['en'];
                for (const fk of keys) {
                    if (typeof fallback === 'object' && fallback !== null && fk in fallback) {
                        fallback = fallback[fk];
                    } else {
                        return key; // Return key if not found in fallback either
                    }
                }
                return typeof fallback === 'string' ? fallback : key;
            }
        }

        return typeof value === 'string' ? value : key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export default LanguageContext;
