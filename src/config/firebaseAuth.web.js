import { browserLocalPersistence, getAuth, initializeAuth } from 'firebase/auth';

import { firebaseApp } from './firebase';

let auth;

try {
  auth = initializeAuth(firebaseApp, {
    persistence: browserLocalPersistence,
  });
} catch (error) {
  if (error.code !== 'auth/already-initialized') {
    throw error;
  }

  auth = getAuth(firebaseApp);
}

export { auth };
