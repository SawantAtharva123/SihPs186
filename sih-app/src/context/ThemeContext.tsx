import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { Colors, ThemeColors } from '@/constants/theme';
import { getDatabase } from '@/offline/database';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextProps {
  themeMode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');

  // Load saved preference from SQLite database
  useEffect(() => {
    async function loadTheme() {
      try {
        const db = await getDatabase();
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS app_settings (
            key TEXT PRIMARY KEY,
            value TEXT
          );
        `);
        const row = await db.getFirstAsync<{ value: string }>(
          'SELECT value FROM app_settings WHERE key = ?',
          ['theme_mode']
        );
        if (row?.value === 'light' || row?.value === 'dark' || row?.value === 'system') {
          setThemeModeState(row.value as ThemeMode);
        }
      } catch (err) {
        console.warn('Could not load theme setting:', err);
      }
    }
    loadTheme();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      const db = await getDatabase();
      await db.runAsync(
        'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
        ['theme_mode', mode]
      );
    } catch (err) {
      console.warn('Could not save theme setting:', err);
    }
  };

  const toggleTheme = () => {
    const nextMode: ThemeMode = isDark ? 'light' : 'dark';
    setThemeMode(nextMode);
  };

  const isDark =
    themeMode === 'dark' ||
    (themeMode === 'system' && systemColorScheme === 'dark');

  const colors: ThemeColors = isDark ? Colors.dark : Colors.light;

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        isDark,
        colors,
        toggleTheme,
        setThemeMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
