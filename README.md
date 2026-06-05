# GeoConnect Mobile

Starter project for the GeoConnect Expo mobile app. This repo only contains the lead setup: app bootstrap, Firebase foundation, Auth starter, Firestore schema notes, location privacy guard, and geo utility helpers.

## Stack

- Expo SDK 56
- React Native 0.85
- React Navigation
- Zustand
- Firebase Auth, Firestore, and Storage
- expo-location, expo-image, react-native-maps
- Reanimated and Gesture Handler

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

## Prepared by Lead

- Expo app bootstrap with Gesture Handler and Reanimated config.
- Auth navigator with Login and Register placeholder screens.
- Firebase initialization for Auth, Firestore, and Storage.
- Auth service for email login, register, and logout.
- User service that creates privacy-safe default user documents.
- Location service that asks permission only when called by the user flow.
- Zustand stores for auth and location state.
- Geo helpers for distance checks and nearby filtering.
- Firestore collection and field constants in `src/types/schema.js`.

## Privacy Notes

Location sharing must stay off by default. Only request foreground location permission after the user turns on a nearby or map feature.

## Suggested Ownership

- Latanza: template, Firebase, schema, auth, geo query.
- Dika: feed, post, like, comment, follow.
- Zidan: map, marker, venue, check-in.
- Zanet: UI, theme, notification, testing, docs.
