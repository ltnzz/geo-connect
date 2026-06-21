import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';

import { db } from '../config/firebase';
import { COLLECTIONS, SUBCOLLECTIONS } from '../constants/firestore';
import { firestoreService } from '../services/firestoreService';
import { useAuthStore } from '../stores/authStore';
import { useEventStore } from '../stores/eventStore';

export function useEventResponse(eventId) {
  const user = useAuthStore((s) => s.user);
  const updateEventStore = useEventStore((s) => s.updateEvent);
  const events = useEventStore((s) => s.events);
  
  const [isGoing, setIsGoing] = useState(false);
  const [isInterested, setIsInterested] = useState(false);

  useEffect(() => {
    if (!user || !eventId) {
      setIsGoing(false);
      setIsInterested(false);
      return;
    }

    const participantRef = doc(db, COLLECTIONS.events, eventId, SUBCOLLECTIONS.participants, user.uid);
    const registrationRef = doc(db, COLLECTIONS.events, eventId, SUBCOLLECTIONS.registrations, user.uid);

    const unsubParticipants = onSnapshot(participantRef, (docSnap) => {
      setIsGoing(docSnap.exists());
    });

    const unsubRegistrations = onSnapshot(registrationRef, (docSnap) => {
      setIsInterested(docSnap.exists());
    });

    return () => {
      unsubParticipants();
      unsubRegistrations();
    };
  }, [eventId, user]);

  const toggleGoing = async () => {
    if (!user || !eventId) return;
    const newGoingState = !isGoing;
    
    try {
      // Mutually exclusive: if turning ON going, turn OFF interested
      if (newGoingState && isInterested) {
        await firestoreService.setEventInterest(eventId, user.uid, false);
        const event = events.find((e) => e.id === eventId);
        if (event) {
          updateEventStore(eventId, { registrationCount: Math.max(0, (event.registrationCount || 0) - 1) });
        }
      }
      
      await firestoreService.setEventParticipation(eventId, user.uid, newGoingState);
      
      // Optimistic count update
      const event = events.find((e) => e.id === eventId);
      if (event) {
        const diff = newGoingState ? 1 : -1;
        updateEventStore(eventId, { participantCount: Math.max(0, (event.participantCount || 0) + diff) });
      }
    } catch (error) {
      console.error('Failed to toggle going state:', error);
    }
  };

  const toggleInterested = async () => {
    if (!user || !eventId) return;
    const newInterestState = !isInterested;

    try {
      // Mutually exclusive: if turning ON interested, turn OFF going
      if (newInterestState && isGoing) {
        await firestoreService.setEventParticipation(eventId, user.uid, false);
        const event = events.find((e) => e.id === eventId);
        if (event) {
          updateEventStore(eventId, { participantCount: Math.max(0, (event.participantCount || 0) - 1) });
        }
      }

      await firestoreService.setEventInterest(eventId, user.uid, newInterestState);
      
      // Optimistic count update
      const event = events.find((e) => e.id === eventId);
      if (event) {
        const diff = newInterestState ? 1 : -1;
        updateEventStore(eventId, { registrationCount: Math.max(0, (event.registrationCount || 0) + diff) });
      }
    } catch (error) {
      console.error('Failed to toggle interested state:', error);
    }
  };

  const response = isGoing ? 'going' : isInterested ? 'interested' : null;

  return { response, toggleGoing, toggleInterested };
}
