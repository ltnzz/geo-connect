import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { USER_DEFAULTS } from '../types/schema';
import { db } from './firebase';

export function getUserProfile(userId) {
  return getDoc(doc(db, 'users', userId));
}

export function createUserProfile(userId, profile) {
  return setDoc(doc(db, 'users', userId), {
    ...USER_DEFAULTS,
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
