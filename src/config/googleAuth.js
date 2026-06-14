import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

const googleClientIds = Object.freeze({
  web: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
});
const firebaseProjectNumber =
  process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const getClientProjectNumber = (clientId) => clientId?.split('-')[0];

const currentPlatformClientId = Platform.select({
  android: googleClientIds.android,
  ios: googleClientIds.ios,
  default: googleClientIds.web,
});

export const googleAuthConfig = Object.freeze({
  webClientId: googleClientIds.web,
  androidClientId: googleClientIds.android,
  iosClientId: googleClientIds.ios,
});

export const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
export const hasGoogleProjectMismatch = Boolean(
  firebaseProjectNumber &&
    [googleClientIds.web, currentPlatformClientId]
      .filter(Boolean)
      .some(
        (clientId) =>
          getClientProjectNumber(clientId) !== firebaseProjectNumber,
      ),
);
export const isGoogleAuthConfigured = Boolean(
  googleClientIds.web && currentPlatformClientId && !hasGoogleProjectMismatch,
);
