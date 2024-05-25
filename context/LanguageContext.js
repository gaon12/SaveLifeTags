// context/LanguageContext.js
import React, { createContext, useState, useEffect } from 'react';
import { getTranslation, setI18nConfig } from './i18n';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [locale, setLocale] = useState('en');

  useEffect(() => {
    async function fetchLocale() {
      const lang = await setI18nConfig();
      setLocale(lang);
    }
    fetchLocale();
  }, []);

  return (
    <LanguageContext.Provider value={{ locale, getTranslation }}>
      {children}
    </LanguageContext.Provider>
  );
};
