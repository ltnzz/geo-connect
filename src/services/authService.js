import {
  createUserWithEmailAndPassword,
  deleteUser,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';

import { assertFirebaseConfigured, db } from '../config/firebase';
import { auth } from '../config/firebaseAuth';

const COLLECTIONS = Object.freeze({ users: 'users', usernames: 'usernames' });
const LOCATION_SHARING = Object.freeze({ hidden: 'hidden' });

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
  displayName: profile.fullName || firebaseUser.displayName || '',
  fullName: profile.fullName || firebaseUser.displayName || '',
  username: profile.username || '',
  avatarUrl: profile.avatarUrl || firebaseUser.photoURL || '',
  bio: profile.bio || '',
  city: profile.city || '',
  isPublic: profile.isPublic ?? true,
  invisibleMode: profile.invisibleMode ?? false,
  locationSharing: profile.locationSharing || LOCATION_SHARING.hidden,
});

const getUserProfile = async (firebaseUser) => {
  if (!firebaseUser) {
    return null;
  }

  const snapshot = await getDoc(doc(db, COLLECTIONS.users, firebaseUser.uid));
  return toPublicUser(firebaseUser, snapshot.exists() ? snapshot.data() : {});
};

const withFriendlyAuthError = (error) => {
  if (error.message === 'Username is already taken.') {
    return error;
  }

  return new Error(authErrorMessages[error.code] || error.message || 'Authentication failed.');
};

const ensureGoogleUserProfile = async (firebaseUser) => {
  const userRef = doc(db, COLLECTIONS.users, firebaseUser.uid);
  const userSnapshot = await getDoc(userRef);

  if (userSnapshot.exists()) {
    return toPublicUser(firebaseUser, userSnapshot.data());
  }

  const username = createGoogleUsername(firebaseUser);
  const usernameRef = doc(db, COLLECTIONS.usernames, username);

  await runTransaction(db, async (transaction) => {
    const currentUserSnapshot = await transaction.get(userRef);

    if (currentUserSnapshot.exists()) {
      return;
    }

    const usernameSnapshot = await transaction.get(usernameRef);
    if (usernameSnapshot.exists() && usernameSnapshot.data().uid !== firebaseUser.uid) {
      throw new Error('Unable to reserve a username for this Google account.');
    }

    transaction.set(usernameRef, {
      uid: firebaseUser.uid,
      createdAt: serverTimestamp(),
    });
    transaction.set(userRef, {
      uid: firebaseUser.uid,
      username,
      email: firebaseUser.email || '',
      fullName: firebaseUser.displayName || '',
      avatarUrl: firebaseUser.photoURL || '',
      bio: '',
      isPublic: true,
      invisibleMode: false,
      locationSharing: LOCATION_SHARING.hidden,
      city: '',
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
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

  async register({ displayName, username, email, password }) {
    assertFirebaseConfigured();

    const fullName = displayName.trim();
    const normalizedEmail = normalizeEmail(email);
    const normalizedUsername = normalizeUsername(username);
    let credential;

    try {
      credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      await updateProfile(credential.user, { displayName: fullName });

      const userRef = doc(db, COLLECTIONS.users, credential.user.uid);
      const usernameRef = doc(db, COLLECTIONS.usernames, normalizedUsername);

      await runTransaction(db, async (transaction) => {
        const usernameSnapshot = await transaction.get(usernameRef);

        if (usernameSnapshot.exists()) {
          throw new Error('Username is already taken.');
        }

        transaction.set(usernameRef, {
          uid: credential.user.uid,
          createdAt: serverTimestamp(),
        });
        transaction.set(userRef, {
          uid: credential.user.uid,
          username: normalizedUsername,
          email: normalizedEmail,
          fullName,
          avatarUrl: '',
          bio: '',
          isPublic: true,
          invisibleMode: false,
          locationSharing: LOCATION_SHARING.hidden,
          city: '',
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
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
      throw withFriendlyAuthError(error);
    }
  },

  async logout() {
    assertFirebaseConfigured();
    await signOut(auth);
  },
};
