import { Platform } from 'react-native';

const googleClientIds = Object.freeze({
  web: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
});

const currentPlatformClientId = Platform.select({
  android: googleClientIds.android,
  ios: googleClientIds.ios,
  default: googleClientIds.web,
});

export const googleAuthConfig = Object.freeze({
  webClientId: googleClientIds.web || 'missing-google-web-client-id',
  androidClientId: googleClientIds.android || 'missing-google-android-client-id',
  iosClientId: googleClientIds.ios || 'missing-google-ios-client-id',
});

export const isGoogleAuthConfigured = Boolean(currentPlatformClientId);
