import * as TaskManager from 'expo-task-manager';
import { firestoreService } from './firestoreService';
import { auth } from '../config/firebaseAuth';

export const BACKGROUND_LOCATION_TASK = 'BACKGROUND_LOCATION_TASK';

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Background Location Error:', error);
    return;
  }
  if (data) {
    const { locations } = data;
    const user = auth.currentUser;
    if (user && locations && locations.length > 0) {
      const location = locations[0];
      try {
        await firestoreService.updateUserLocation(user.uid, {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (err) {
        console.error('Failed to update background location', err);
      }
    }
  }
});
