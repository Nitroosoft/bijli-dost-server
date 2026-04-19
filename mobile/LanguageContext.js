// =============================================================================
// LanguageContext.js
// Global Language State — shared across all screens
// =============================================================================

import React, { createContext, useContext, useState } from 'react';
import { translations } from './translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');

  const toggleLanguage = () => {
    setLanguage(prev => {
        if (prev === 'en') return 'ur';
        if (prev === 'ur') return 'ps';
        return 'en';
        });
    };

  const t = translations[language] || translations['en'];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}