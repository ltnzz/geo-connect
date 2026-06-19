import { create } from 'zustand';

import { firestoreService } from '../services/firestoreService';

const PAGE_SIZE = 10;

export const useEventStore = create((set, get) => ({
  events: [],
  lastDoc: null,
  isLoading: false,
  isRefreshing: false,
  isLoadingMore: false,
  hasMore: true,
  error: null,

  fetchEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const { events, lastDoc } = await firestoreService.getUpcomingEvents({ pageSize: PAGE_SIZE });

      set({
        events,
        lastDoc,
        hasMore: events.length === PAGE_SIZE,
        isLoading: false,
      });
    } catch (err) {
      set({ error: err.message || 'Failed to load events.', isLoading: false });
    }
  },

  refreshEvents: async () => {
    set({ isRefreshing: true, error: null });
    try {
      const { events, lastDoc } = await firestoreService.getUpcomingEvents({ pageSize: PAGE_SIZE });

      set({
        events,
        lastDoc,
        hasMore: events.length === PAGE_SIZE,
        isRefreshing: false,
      });
    } catch (err) {
      set({ error: err.message || 'Failed to refresh events.', isRefreshing: false });
    }
  },

  fetchMoreEvents: async () => {
    const { lastDoc, hasMore, isLoadingMore } = get();
    if (!hasMore || isLoadingMore || !lastDoc) return;

    set({ isLoadingMore: true });
    try {
      const { events: newEvents, lastDoc: nextLastDoc } = await firestoreService.getUpcomingEvents({
        pageSize: PAGE_SIZE,
        cursor: lastDoc,
      });

      set((s) => ({
        events: [...s.events, ...newEvents],
        lastDoc: nextLastDoc,
        hasMore: newEvents.length === PAGE_SIZE,
        isLoadingMore: false,
      }));
    } catch (err) {
      set({ error: err.message || 'Failed to load more events.', isLoadingMore: false });
    }
  },

  prependEvent: (event) =>
    set((s) => ({ events: [event, ...s.events] })),

  clearError: () => set({ error: null }),
}));
