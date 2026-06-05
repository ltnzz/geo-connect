import * as Location from 'expo-location';

export async function requestForegroundLocation() {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (permission.status !== 'granted') {
    return null;
  }

  return Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
}

export function isLocationSharingEnabled(user) {
  return Boolean(user?.locationSharing) && !user?.invisibleMode;
}
