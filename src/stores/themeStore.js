import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const THEME_KEY = '@aroundu:theme-mode';

export const useThemeStore = create((set) => ({
  mode: 'light',
  isInitialized: false,

  initializeTheme: async () => {
    const savedMode = await AsyncStorage.getItem(THEME_KEY).catch(() => null);
    set({
      mode: savedMode === 'dark' ? 'dark' : 'light',
      isInitialized: true,
    });
  },

  setThemeMode: async (mode) => {
    const nextMode = mode === 'dark' ? 'dark' : 'light';
    await AsyncStorage.setItem(THEME_KEY, nextMode).catch(() => {});
    set({ mode: nextMode });
  },
}));
