import React, { createContext, useContext } from 'react';

interface ThemeContextType {
  theme: 'light';
  dir: 'rtl';
  lang: 'ar';
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  dir: 'rtl',
  lang: 'ar',
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeContext.Provider value={{ theme: 'light', dir: 'rtl', lang: 'ar' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
