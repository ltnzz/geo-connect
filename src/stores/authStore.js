import { create } from 'zustand';

import { authService } from '../services/authService';
import { firestoreService } from '../services/firestoreService';
import { notificationService } from '../services/notificationService';

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
  updateCurrentUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : state.user,
    })),

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
      const currentUser = useAuthStore.getState().user;

      
      set({ user: null });

      if (currentUser?.uid) {
        await Promise.race([
          notificationService.unregisterDevice(currentUser.uid),
          new Promise((resolve) => setTimeout(resolve, 1500)),
        ]).catch(() => {});
        await firestoreService
          .clearSharedLocation(currentUser.uid)
          .catch(() => {});
      }
      await authService.logout();

      const { useFeedStore } = require('./feedstore');
      const { useEventStore } = require('./eventStore');

      useFeedStore.setState({ posts: [], lastDoc: null, hasMore: true, loopPage: 0, deletedPostIds: [], isOffline: false, error: null });
      useEventStore.setState({ events: [], lastDoc: null, hasMore: true, isOffline: false, error: null });

      set({ isLoading: false });
      return true;
    } catch {
      set({ error: 'Unable to log out. Please try again.', isLoading: false });
      return false;
    }
  },
}));
