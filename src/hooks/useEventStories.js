import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

import { db } from '../config/firebase';
import { COLLECTIONS, SUBCOLLECTIONS } from '../constants/firestore';

export function useEventStories(eventId) {
  const [stories, setStories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!eventId) {
      setStories([]);
      setIsLoading(false);
      return;
    }

    const storiesRef = collection(db, COLLECTIONS.events, eventId, SUBCOLLECTIONS.stories);
    const q = query(storiesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStories(data);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching event stories:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [eventId]);

  return { stories, isLoading };
}
