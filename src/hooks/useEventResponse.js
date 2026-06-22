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
  const [isNotGoing, setIsNotGoing] = useState(false);

  useEffect(() => {
    if (!user || !eventId) {
      setIsGoing(false);
      setIsInterested(false);
      return;
    }

    const participantRef = doc(db, COLLECTIONS.events, eventId, SUBCOLLECTIONS.participants, user.uid);
    const registrationRef = doc(db, COLLECTIONS.events, eventId, SUBCOLLECTIONS.registrations, user.uid);
    const declineRef = doc(db, COLLECTIONS.events, eventId, SUBCOLLECTIONS.declines, user.uid);

    const unsubParticipants = onSnapshot(
      participantRef,
      (docSnap) => {
        setIsGoing(docSnap.exists());
      },
      (error) => {
        console.warn('Error fetching event participant status:', error.message);
      }
    );

    const unsubRegistrations = onSnapshot(
      registrationRef,
      (docSnap) => {
        setIsInterested(docSnap.exists());
      },
      (error) => {
        console.warn('Error fetching event registration status:', error.message);
      }
    );

    const unsubDeclines = onSnapshot(
      declineRef,
      (docSnap) => {
        setIsNotGoing(docSnap.exists());
      },
      (error) => {
        console.warn('Error fetching event decline status:', error.message);
      }
    );

    return () => {
      unsubParticipants();
      unsubRegistrations();
      unsubDeclines();
    };
  }, [eventId, user]);

  const toggleGoing = async () => {
    if (!user || !eventId) return;
    const newGoingState = !isGoing;
    
    try {
      if (newGoingState && isInterested) {
        await firestoreService.setEventInterest(eventId, user.uid, false);
        const event = events.find((e) => e.id === eventId);
        if (event) {
          updateEventStore(eventId, { registrationCount: Math.max(0, (event.registrationCount || 0) - 1) });
        }
      }
      
      if (newGoingState && isNotGoing) {
        await firestoreService.setEventDecline(eventId, user.uid, false);
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
      if (newInterestState && isGoing) {
        await firestoreService.setEventParticipation(eventId, user.uid, false);
        const event = events.find((e) => e.id === eventId);
        if (event) {
          updateEventStore(eventId, { participantCount: Math.max(0, (event.participantCount || 0) - 1) });
        }
      }

      if (newInterestState && isNotGoing) {
        await firestoreService.setEventDecline(eventId, user.uid, false);
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

  const toggleNotGoing = async () => {
    if (!user || !eventId) return;
    const newNotGoingState = !isNotGoing;

    try {
      if (newNotGoingState && isGoing) {
        await firestoreService.setEventParticipation(eventId, user.uid, false);
        const event = events.find((e) => e.id === eventId);
        if (event) {
          updateEventStore(eventId, { participantCount: Math.max(0, (event.participantCount || 0) - 1) });
        }
      }

      if (newNotGoingState && isInterested) {
        await firestoreService.setEventInterest(eventId, user.uid, false);
        const event = events.find((e) => e.id === eventId);
        if (event) {
          updateEventStore(eventId, { registrationCount: Math.max(0, (event.registrationCount || 0) - 1) });
        }
      }

      await firestoreService.setEventDecline(eventId, user.uid, newNotGoingState);
    } catch (error) {
      console.error('Failed to toggle not going state:', error);
    }
  };

  const response = isNotGoing ? 'not_going' : isGoing ? 'going' : isInterested ? 'interested' : null;

  return { response, toggleGoing, toggleInterested, toggleNotGoing };
}
