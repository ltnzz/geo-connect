import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { COLLECTIONS, LOCATION_PRIVACY_LEVELS } from '../types/schema';
import { db } from './firebase';

export function createLocationHistory(user, location) {
  if (!user?.locationSharing || user?.invisibleMode || !location) {
    return Promise.resolve(null);
  }

  return addDoc(collection(db, COLLECTIONS.locationHistories), {
    userId: user.id,
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy,
    privacyLevel: LOCATION_PRIVACY_LEVELS.approximate,
    createdAt: serverTimestamp(),
  });
}
