import { create } from 'zustand';

import { authService } from '../services/authService';

export const useAuthStore = create((set) => ({
  user: null,
  isInitialized: false,
  isLoading: false,
  error: null,

  initialize: async () => {
    try {
      const user = await authService.getSession();
      set({ user, isInitialized: true });
    } catch {
      set({
        error: 'Unable to restore your session.',
        isInitialized: true,
      });
    }
  },

  clearError: () => set({ error: null }),

  login: async (credentials) => {
    set({ isLoading: true, error: null });

    try {
      const user = await authService.login(credentials);
      set({ user, isLoading: false });
      return true;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  register: async (profile) => {
    set({ isLoading: true, error: null });

    try {
      const user = await authService.register(profile);
      set({ user, isLoading: false });
      return true;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  loginWithGoogle: async (tokens) => {
    set({ isLoading: true, error: null });

    try {
      const user = await authService.loginWithGoogle(tokens);
      set({ user, isLoading: false });
      return true;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });

    try {
      await authService.logout();
      set({ user: null, isLoading: false });
    } catch {
      set({ error: 'Unable to log out. Please try again.', isLoading: false });
    }
  },
}));
