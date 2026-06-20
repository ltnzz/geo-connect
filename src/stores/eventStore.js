import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { firestoreService } from '../services/firestoreService';

const PAGE_SIZE = 10;
const EVENTS_CACHE_KEY = '@aroundu:events-cache';

const readCachedEvents = async () => {
  const cached = await AsyncStorage.getItem(EVENTS_CACHE_KEY);
  return cached ? JSON.parse(cached) : [];
};

const cacheEvents = async (events) => {
  await AsyncStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(events)).catch(() => {});
};

export const useEventStore = create((set, get) => ({
  events: [],
  lastDoc: null,
  isLoading: false,
  isRefreshing: false,
  isLoadingMore: false,
  hasMore: true,
  isOffline: false,
  error: null,

  fetchEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const { events, lastDoc } = await firestoreService.getUpcomingEvents({ pageSize: PAGE_SIZE });
      await cacheEvents(events);

      set({
        events,
        lastDoc,
        hasMore: events.length === PAGE_SIZE,
        isOffline: false,
        isLoading: false,
      });
    } catch (err) {
      const cachedEvents = await readCachedEvents().catch(() => []);
      set({
        error: cachedEvents.length ? null : err.message || 'Failed to load events.',
        events: cachedEvents,
        isOffline: cachedEvents.length > 0,
        isLoading: false,
      });
    }
  },

  refreshEvents: async () => {
    set({ isRefreshing: true, error: null });
    try {
      const { events, lastDoc } = await firestoreService.getUpcomingEvents({ pageSize: PAGE_SIZE });
      await cacheEvents(events);

      set({
        events,
        lastDoc,
        hasMore: events.length === PAGE_SIZE,
        isOffline: false,
        isRefreshing: false,
      });
    } catch (err) {
      const cachedEvents = await readCachedEvents().catch(() => []);
      set({
        error: cachedEvents.length ? null : err.message || 'Failed to refresh events.',
        events: cachedEvents.length ? cachedEvents : get().events,
        isOffline: cachedEvents.length > 0,
        isRefreshing: false,
      });
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

      set((s) => {
        const mergedEvents = [...s.events, ...newEvents];
        cacheEvents(mergedEvents);

        return {
          events: mergedEvents,
          lastDoc: nextLastDoc,
          hasMore: newEvents.length === PAGE_SIZE,
          isOffline: false,
          isLoadingMore: false,
        };
      });
    } catch (err) {
      set({ error: err.message || 'Failed to load more events.', isLoadingMore: false });
    }
  },

  prependEvent: (event) =>
    set((s) => ({ events: [event, ...s.events] })),

  removeEvent: (eventId) => {
    set((s) => {
      const newEvents = s.events.filter((e) => e.id !== eventId);
      cacheEvents(newEvents);
      return { events: newEvents };
    });
  },

  updateEvent: (eventId, updatedData) => {
    set((s) => {
      const newEvents = s.events.map((e) =>
        e.id === eventId ? { ...e, ...updatedData } : e
      );
      cacheEvents(newEvents);
      return { events: newEvents };
    });
  },

  clearError: () => set({ error: null }),
}));
