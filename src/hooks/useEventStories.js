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
      const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
      const data = snapshot.docs
        .map(doc => {
          const docData = doc.data();
          const createdAtMillis = docData.createdAt 
            ? (docData.createdAt.toMillis ? docData.createdAt.toMillis() : new Date(docData.createdAt).getTime()) 
            : Date.now();
          return {
            id: doc.id,
            ...docData,
            createdAtMillis
          };
        })
        .filter(story => story.createdAtMillis >= twentyFourHoursAgo);
      setStories(data);
      setIsLoading(false);
    }, (error) => {
      console.warn('Error fetching event stories:', error.message);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [eventId]);

  return { stories, isLoading };
}
