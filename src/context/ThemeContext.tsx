import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ThemeContextType = {
  darkMode: boolean;
  toggleDarkMode: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  // Default to dark mode
  const [darkMode, setDarkMode] = useState(true);

  // On mount, check if there's a saved preference in localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    // If there's a saved theme, use it. Otherwise, use the default (dark)
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
    } else {
      // First time visit, set dark mode as default
      localStorage.setItem('theme', 'dark');
    }
  }, []);

  // Apply theme class to html element whenever darkMode changes
  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    // Save preference to localStorage
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}; 