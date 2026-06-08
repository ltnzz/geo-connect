# GeoConnect Mobile

Starter project for the GeoConnect Expo mobile app. The `main` branch is intentionally kept minimal so each team member can build their feature from a clean base.

## Stack

- Expo SDK 54
- React Native 0.81
- React 19.1
- React Navigation
- Zustand
- Firebase Auth, Firestore, and Storage
- expo-location, expo-image, and react-native-maps
- Reanimated, Worklets, and Gesture Handler
- New Architecture disabled for broader Expo Go compatibility

## Setup

1. Copy `.env.example` to `.env`.
2. Fill the Firebase values from your Firebase project.
3. Install dependencies:

```bash
npm install
```

4. Start Expo:

```bash
npm start
```

## Folder Ownership

- `src/navigation`: app navigation setup.
- `src/screens`: feature screens.
- `src/screens/auth`: login and registration screens.
- `src/screens/home`: feed, post, and post detail screens.
- `src/screens/map`: map, venue, and event screens.
- `src/screens/profile`: profile and edit profile screens.
- `src/screens/search`: search screens.
- `src/screens/notification`: notification screens.
- `src/screens/settings`: privacy and settings screens.
- `src/components/common`: shared UI components.
- `src/components/post`: post and comment components.
- `src/components/map`: map marker components.
- `src/services`: Firebase, API, and platform services.
- `src/stores`: Zustand stores.
- `src/hooks`: reusable hooks.
- `src/utils`: helpers and constants.
- `src/types`: schema notes or shared model docs.

## Privacy Notes

Location sharing must stay off by default. Only request foreground location permission after the user turns on a nearby or map feature.

## Suggested Ownership

- Latanza: template, Firebase, schema, auth, geo query.
- Dika: feed, post, like, comment, follow.
- Zidan: UI, notification, check-in.
- Zanet: map, marker, venue.
