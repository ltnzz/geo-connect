import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { firestoreService } from '../services/firestoreService';

export function useHostName(creatorId) {
  const user = useAuthStore((s) => s.user);
  const [hostName, setHostName] = useState('Loading...');

  useEffect(() => {
    if (!creatorId) {
      setHostName('Unknown');
      return;
    }

    if (user && creatorId === user.uid) {
      setHostName('You');
      return;
    }

    firestoreService.getUser(creatorId).then((creator) => {
      if (creator && creator.username) {
        setHostName(creator.username);
      } else {
        setHostName('User');
      }
    }).catch(() => setHostName('User'));
  }, [creatorId, user]);

  return hostName;
}
