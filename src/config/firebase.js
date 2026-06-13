import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const requiredFirebaseConfig = {
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
};

const missingFirebaseKeys = Object.entries(requiredFirebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const isFirebaseConfigured = missingFirebaseKeys.length === 0;

if (!isFirebaseConfigured && __DEV__) {
  console.warn(
    `Firebase is not configured. Missing: ${missingFirebaseKeys.join(
      ', ',
    )}. Copy .env.example to .env and add your Firebase web app values.`,
  );
}

const fallbackConfig = {
  apiKey: 'missing-api-key',
  authDomain: 'missing.firebaseapp.com',
  projectId: 'missing-project-id',
  storageBucket: 'missing-project-id.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:missing',
};

export const firebaseApp = getApps().length
  ? getApp()
  : initializeApp(isFirebaseConfigured ? firebaseConfig : fallbackConfig);

export const db = getFirestore(firebaseApp);

export const assertFirebaseConfigured = () => {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase belum dikonfigurasi. Isi variabel EXPO_PUBLIC_FIREBASE_* di .env.');
  }
};
