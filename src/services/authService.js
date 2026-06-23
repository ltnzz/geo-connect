import {
  createUserWithEmailAndPassword,
  deleteUser,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { assertFirebaseConfigured, db } from '../config/firebase';
import { auth } from '../config/firebaseAuth';
import { COLLECTIONS, LOCATION_SHARING } from '../constants/firestore';

const normalizeEmail = (email) => email.trim().toLowerCase();
const normalizeUsername = (username) => username.trim().toLowerCase();

const createGoogleUsername = (firebaseUser) => {
  const emailPrefix = firebaseUser.email?.split('@')[0] || 'aroundu';
  const base = emailPrefix.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase() || 'aroundu';
  return `${base.slice(0, 13)}_${firebaseUser.uid.slice(0, 6)}`;
};

const authErrorMessages = {
  'auth/email-already-in-use': 'Email is already registered.',
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/weak-password': 'Password must be at least 6 characters.',
};

const toPublicUser = (firebaseUser, profile = {}) => ({
  id: firebaseUser.uid,
  uid: firebaseUser.uid,
  email: firebaseUser.email,
  username: profile.username || '',
  avatarUrl: profile.avatarUrl || firebaseUser.photoURL || '',
  bio: profile.bio || '',
  city: profile.city || '',
  profileLocation: profile.profileLocation || null,
  isPublic: profile.isPublic ?? true,
  invisibleMode: profile.invisibleMode ?? false,
  locationSharing: profile.locationSharing || LOCATION_SHARING.hidden,
  followersCount: profile.followersCount ?? 0,
  followingCount: profile.followingCount ?? 0,
  postsCount: profile.postsCount ?? 0,
});

const getUserProfile = async (firebaseUser) => {
  if (!firebaseUser) {
    return null;
  }

  const snapshot = await getDoc(doc(db, COLLECTIONS.users, firebaseUser.uid));
  return toPublicUser(firebaseUser, snapshot.exists() ? snapshot.data() : {});
};

const withFriendlyAuthError = (error) => {
  return new Error(authErrorMessages[error.code] || error.message || 'Authentication failed.');
};

const withFriendlyGoogleAuthError = (error) => {
  if (error.code === 'auth/invalid-credential') {
    return new Error(
      'Google credential ditolak Firebase. Pastikan Google Client ID berasal dari project Firebase yang sama.',
    );
  }

  return withFriendlyAuthError(error);
};

const ensureGoogleUserProfile = async (firebaseUser) => {
  const userRef = doc(db, COLLECTIONS.users, firebaseUser.uid);
  const userSnapshot = await getDoc(userRef);

  if (userSnapshot.exists()) {
    return toPublicUser(firebaseUser, userSnapshot.data());
  }

  const username = createGoogleUsername(firebaseUser);
  await setDoc(userRef, {
    uid: firebaseUser.uid,
    username,
    email: firebaseUser.email || '',
    avatarUrl: firebaseUser.photoURL || '',
    bio: '',
    isPublic: true,
    invisibleMode: true,
    locationSharing: LOCATION_SHARING.hidden,
    city: '',
    followersCount: 0,
    followingCount: 0,
    postsCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return getUserProfile(firebaseUser);
};

export const authService = {
  async getSession() {
    assertFirebaseConfigured();

    const firebaseUser = await new Promise((resolve, reject) => {
      let unsubscribe = () => {};
      unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          unsubscribe();
          resolve(user);
        },
        reject,
      );
    });

    return getUserProfile(firebaseUser);
  },

  async register({ username, email, password }) {
    assertFirebaseConfigured();

    const normalizedEmail = normalizeEmail(email);
    const normalizedUsername = normalizeUsername(username);
    let credential;

    try {
      credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);

      const userRef = doc(db, COLLECTIONS.users, credential.user.uid);
      await setDoc(userRef, {
        uid: credential.user.uid,
        username: normalizedUsername,
        email: normalizedEmail,
        avatarUrl: '',
        bio: '',
        isPublic: true,
        invisibleMode: true,
        locationSharing: LOCATION_SHARING.hidden,
        city: '',
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return getUserProfile(credential.user);
    } catch (error) {
      if (credential?.user) {
        await deleteUser(credential.user).catch(() => {});
      }

      throw withFriendlyAuthError(error);
    }
  },

  async login({ email, password }) {
    assertFirebaseConfigured();

    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        normalizeEmail(email),
        password,
      );
      return await getUserProfile(credential.user);
    } catch (error) {
      throw withFriendlyAuthError(error);
    }
  },

  async loginWithGoogle({ idToken, accessToken = null }) {
    assertFirebaseConfigured();

    if (!idToken) {
      throw new Error('Google did not return an ID token.');
    }

    try {
      const credential = GoogleAuthProvider.credential(idToken, accessToken);
      const result = await signInWithCredential(auth, credential);
      return await ensureGoogleUserProfile(result.user);
    } catch (error) {
      throw withFriendlyGoogleAuthError(error);
    }
  },

  async logout() {
    assertFirebaseConfigured();
    await signOut(auth);
  },
};
