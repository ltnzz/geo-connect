import { create } from 'zustand';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

import { db } from '../config/firebase';
import { COLLECTIONS } from '../constants/firestore';

export const useNotificationStore = create((set, get) => ({
  unreadCount: 0,
  unsubscribe: null,

  startListening: (userId) => {
    const currentUnsubscribe = get().unsubscribe;
    if (currentUnsubscribe) {
      currentUnsubscribe();
    }

    if (!userId) {
      set({ unreadCount: 0, unsubscribe: null });
      return;
    }

    const q = query(
      collection(db, COLLECTIONS.notifications),
      where('recipientId', '==', userId),
      where('isRead', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      set({ unreadCount: snapshot.docs.length });
    }, (error) => {
      console.warn('Failed to listen to unread notifications:', error);
    });

    set({ unsubscribe });
  },

  stopListening: () => {
    const { unsubscribe } = get();
    if (unsubscribe) {
      unsubscribe();
      set({ unsubscribe: null, unreadCount: 0 });
    }
  }
}));
