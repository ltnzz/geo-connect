import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';

import { db } from '../config/firebase';
import { COLLECTIONS, SUBCOLLECTIONS } from '../constants/firestore';
import { useAuthStore } from '../stores/authStore';

export function useEventCheckin(eventId) {
  const user = useAuthStore((s) => s.user);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !eventId) {
      setHasCheckedIn(false);
      setIsLoading(false);
      return;
    }

    const checkinRef = doc(db, COLLECTIONS.events, eventId, SUBCOLLECTIONS.checkins, user.uid);
    
    const unsubscribe = onSnapshot(checkinRef, (docSnap) => {
      setHasCheckedIn(docSnap.exists());
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching check-in status:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [eventId, user]);

  return { hasCheckedIn, isLoading };
}
