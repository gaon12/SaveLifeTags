// context/ThemeContext.js
import React, { createContext, useState, useEffect } from 'react';
import { getThemeColor, isDarkMode } from './theme';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeColor, setThemeColor] = useState('#00bcd4');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    async function fetchTheme() {
      const color = await getThemeColor();
      const dark = await isDarkMode();
      setThemeColor(color);
      setDarkMode(dark);
    }
    fetchTheme();
  }, []);

  return (
    <ThemeContext.Provider value={{ themeColor, darkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
