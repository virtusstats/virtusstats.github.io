import React, { createContext, useContext, useState } from 'react';
import { translations } from '../utils/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState('tr'); // Default to TR as requested implies huge Turkish focus

    const t = translations[language];

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'en' ? 'tr' : 'en');
    };

    return (
        <LanguageContext.Provider value={{ language, t, toggleLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => useContext(LanguageContext);
