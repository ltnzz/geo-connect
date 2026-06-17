import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  limit,
  orderBy,
  startAfter,
} from 'firebase/firestore';

import { assertFirebaseConfigured, db } from '../config/firebase';
import {
  COLLECTIONS,
  LOCATION_SHARING,
  POST_LOCATION_VISIBILITY,
  SUBCOLLECTIONS,
  createBlockId,
  createFollowId,
} from '../constants/firestore';
import { blurCoordinate, createGeoPointData } from '../utils/geo';
import { getNearbyDocuments } from './geoFirestoreService';

const createLocation = ({ latitude, longitude, ...metadata }) => ({
  ...createGeoPointData(latitude, longitude),
  ...metadata,
});

const createDocument = async (collectionName, data) => {
  assertFirebaseConfigured();
  const reference = doc(collection(db, collectionName));
  await setDoc(reference, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return reference.id;
};

export const firestoreService = {
  async getUser(userId) {
    assertFirebaseConfigured();
    const snapshot = await getDoc(doc(db, COLLECTIONS.users, userId));
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
  },

  async updateUser(userId, updates) {
    assertFirebaseConfigured();
    const allowedFields = [
      'username',
      'avatarUrl',
      'bio',
      'isPublic',
      'invisibleMode',
      'locationSharing',
      'city',
    ];
    const safeUpdates = Object.fromEntries(
      Object.entries(updates).filter(([key]) => allowedFields.includes(key)),
    );

    await updateDoc(doc(db, COLLECTIONS.users, userId), {
      ...safeUpdates,
      updatedAt: serverTimestamp(),
    });
  },

  async updatePrivateLocation(userId, { latitude, longitude }) {
    assertFirebaseConfigured();
    await setDoc(
      doc(db, COLLECTIONS.userLocations, userId),
      {
        userId,
        ...createGeoPointData(latitude, longitude),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  },

  async clearPrivateLocation(userId) {
    assertFirebaseConfigured();
    await deleteDoc(doc(db, COLLECTIONS.userLocations, userId));
  },

  async syncSharedLocation(user, { latitude, longitude }) {
    assertFirebaseConfigured();

    if (
      !user?.uid ||
      user.invisibleMode ||
      ![
        LOCATION_SHARING.exact,
        LOCATION_SHARING.neighborhood,
      ].includes(user.locationSharing)
    ) {
      if (user?.uid) {
        await deleteDoc(
          doc(db, COLLECTIONS.sharedLocations, user.uid),
        ).catch(() => {});
      }
      return;
    }

    const coordinate =
      user.locationSharing === LOCATION_SHARING.neighborhood
        ? blurCoordinate({ latitude, longitude }, 500)
        : { latitude, longitude };

    await setDoc(
      doc(db, COLLECTIONS.sharedLocations, user.uid),
      {
        userId: user.uid,
        ...createGeoPointData(coordinate.latitude, coordinate.longitude),
        precision: user.locationSharing,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  },

  async clearSharedLocation(userId) {
    assertFirebaseConfigured();
    await deleteDoc(doc(db, COLLECTIONS.sharedLocations, userId));
  },

  async createPost({
    authorId,
    caption,
    imageUrl = '',
    categoryId = null,
    placeId = null,
    location = null,
  }) {
    assertFirebaseConfigured();
    const postRef = doc(collection(db, COLLECTIONS.posts));
    const userRef = doc(db, COLLECTIONS.users, authorId);
    let postLocation = null;

    if (location?.visibility === POST_LOCATION_VISIBILITY.exact) {
      postLocation = createLocation(location);
    } else if (location?.visibility === POST_LOCATION_VISIBILITY.blurred) {
      postLocation = createLocation({
        ...location,
        ...blurCoordinate(location, 500),
      });
    } else if (location?.visibility === POST_LOCATION_VISIBILITY.city) {
      postLocation = {
        address: location.address || location.city || '',
        city: location.city || '',
        visibility: POST_LOCATION_VISIBILITY.city,
      };
    } else if (location) {
      postLocation = {
        address: location.address || '',
        visibility: POST_LOCATION_VISIBILITY.hidden,
      };
    }

    await runTransaction(db, async (transaction) => {
      transaction.set(postRef, {
        authorId,
        caption: caption.trim(),
        imageUrl,
        categoryId,
        placeId,
        location: postLocation,
        likesCount: 0,
        commentsCount: 0,
        checkinsCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      transaction.update(userRef, {
        postsCount: increment(1),
        updatedAt: serverTimestamp(),
      });
    });

    return postRef.id;
  },

  async addComment(postId, { userId, content, parentId = null }) {
    const commentRef = doc(
      collection(db, COLLECTIONS.posts, postId, SUBCOLLECTIONS.comments),
    );
    const postRef = doc(db, COLLECTIONS.posts, postId);

    await runTransaction(db, async (transaction) => {
      transaction.set(commentRef, {
        userId,
        content: content.trim(),
        parentId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      transaction.update(postRef, {
        commentsCount: increment(1),
        updatedAt: serverTimestamp(),
      });
    });

    return commentRef.id;
  },

  async setPostLiked(postId, userId, shouldLike) {
    const postRef = doc(db, COLLECTIONS.posts, postId);
    const likeRef = doc(
      db,
      COLLECTIONS.posts,
      postId,
      SUBCOLLECTIONS.likes,
      userId,
    );

    await runTransaction(db, async (transaction) => {
      const likeSnapshot = await transaction.get(likeRef);

      if (shouldLike && !likeSnapshot.exists()) {
        transaction.set(likeRef, { userId, createdAt: serverTimestamp() });
        transaction.update(postRef, {
          likesCount: increment(1),
          updatedAt: serverTimestamp(),
        });
      } else if (!shouldLike && likeSnapshot.exists()) {
        transaction.delete(likeRef);
        transaction.update(postRef, {
          likesCount: increment(-1),
          updatedAt: serverTimestamp(),
        });
      }
    });
  },

  async setBookmarked(userId, postId, shouldBookmark) {
    const bookmarkRef = doc(
      db,
      COLLECTIONS.users,
      userId,
      SUBCOLLECTIONS.bookmarks,
      postId,
    );

    if (shouldBookmark) {
      await setDoc(bookmarkRef, { postId, createdAt: serverTimestamp() });
    } else {
      await deleteDoc(bookmarkRef);
    }
  },

  async getBookmarkedPosts(userId) {
    assertFirebaseConfigured();

    const bookmarksSnapshot = await getDocs(
      collection(
        db,
        COLLECTIONS.users,
        userId,
        SUBCOLLECTIONS.bookmarks,
      ),
    );
    const bookmarkedPosts = await Promise.all(
      bookmarksSnapshot.docs.map(async (bookmarkDocument) => {
        const postId = bookmarkDocument.data().postId || bookmarkDocument.id;
        const postSnapshot = await getDoc(doc(db, COLLECTIONS.posts, postId));

        return postSnapshot.exists()
          ? { id: postSnapshot.id, ...postSnapshot.data() }
          : null;
      }),
    );

    return bookmarkedPosts.filter(Boolean);
  },

  async setFollowing(followerId, followingId, shouldFollow) {
    if (followerId === followingId) {
      throw new Error('You cannot follow yourself.');
    }

    const followRef = doc(
      db,
      COLLECTIONS.follows,
      createFollowId(followerId, followingId),
    );
    const followerRef = doc(db, COLLECTIONS.users, followerId);
    const followingRef = doc(db, COLLECTIONS.users, followingId);

    await runTransaction(db, async (transaction) => {
      const followSnapshot = await transaction.get(followRef);

      if (shouldFollow && !followSnapshot.exists()) {
        transaction.set(followRef, {
          followerId,
          followingId,
          createdAt: serverTimestamp(),
        });
        transaction.update(followerRef, {
          followingCount: increment(1),
          updatedAt: serverTimestamp(),
        });
        transaction.update(followingRef, {
          followersCount: increment(1),
          updatedAt: serverTimestamp(),
        });
      } else if (!shouldFollow && followSnapshot.exists()) {
        transaction.delete(followRef);
        transaction.update(followerRef, {
          followingCount: increment(-1),
          updatedAt: serverTimestamp(),
        });
        transaction.update(followingRef, {
          followersCount: increment(-1),
          updatedAt: serverTimestamp(),
        });
      }
    });
  },

  async getConnections(userId, type) {
    assertFirebaseConfigured();

    const isFollowers = type === 'followers';
    const followsSnapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.follows),
        where(isFollowers ? 'followingId' : 'followerId', '==', userId),
      ),
    );
    const userIds = followsSnapshot.docs.map((followDocument) => {
      const follow = followDocument.data();
      return isFollowers ? follow.followerId : follow.followingId;
    });
    const profiles = await Promise.all(
      userIds.map(async (connectedUserId) => {
        const userSnapshot = await getDoc(
          doc(db, COLLECTIONS.users, connectedUserId),
        );

        return userSnapshot.exists()
          ? { id: userSnapshot.id, ...userSnapshot.data() }
          : null;
      }),
    );

    return profiles.filter(Boolean);
  },

  async getMutualConnectionLocations(userId) {
    assertFirebaseConfigured();

    if (!userId) {
      return [];
    }

    const [followersSnapshot, followingSnapshot] = await Promise.all([
      getDocs(
        query(
          collection(db, COLLECTIONS.follows),
          where('followingId', '==', userId),
        ),
      ),
      getDocs(
        query(
          collection(db, COLLECTIONS.follows),
          where('followerId', '==', userId),
        ),
      ),
    ]);
    const followerIds = new Set(
      followersSnapshot.docs.map(
        (followDocument) => followDocument.data().followerId,
      ),
    );
    const mutualIds = followingSnapshot.docs
      .map((followDocument) => followDocument.data().followingId)
      .filter((connectedUserId) => followerIds.has(connectedUserId));
    const connections = await Promise.all(
      mutualIds.map(async (connectedUserId) => {
        const [userSnapshot, locationSnapshot] = await Promise.all([
          getDoc(doc(db, COLLECTIONS.users, connectedUserId)),
          getDoc(doc(db, COLLECTIONS.sharedLocations, connectedUserId)),
        ]);

        if (!userSnapshot.exists() || !locationSnapshot.exists()) {
          return null;
        }

        const profile = userSnapshot.data();
        const location = locationSnapshot.data();

        if (
          profile.invisibleMode ||
          ![
            LOCATION_SHARING.exact,
            LOCATION_SHARING.neighborhood,
          ].includes(profile.locationSharing) ||
          !Number.isFinite(location.latitude) ||
          !Number.isFinite(location.longitude)
        ) {
          return null;
        }

        return {
          id: connectedUserId,
          username: profile.username || 'aroundu',
          displayName:
            profile.displayName ||
            profile.fullName ||
            profile.username ||
            'AroundU user',
          city: profile.city || '',
          avatarUrl: profile.avatarUrl || '',
          location,
        };
      }),
    );

    return connections.filter(Boolean);
  },

  async createPlace(data) {
    return createDocument(COLLECTIONS.places, {
      name: data.name.trim(),
      category: data.category,
      address: data.address,
      city: data.city,
      photoUrl: data.photoUrl || '',
      location: createLocation(data.location),
      checkinsCount: 0,
      postsCount: 0,
      eventsCount: 0,
      rating: data.rating || 0,
    });
  },

  async checkIn({ userId, placeId, postId = null, location }) {
    const checkinRef = doc(collection(db, COLLECTIONS.checkins));
    const placeRef = doc(db, COLLECTIONS.places, placeId);

    await runTransaction(db, async (transaction) => {
      transaction.set(checkinRef, {
        userId,
        placeId,
        postId,
        location: createLocation(location),
        createdAt: serverTimestamp(),
      });
      transaction.update(placeRef, {
        checkinsCount: increment(1),
        updatedAt: serverTimestamp(),
      });
    });

    return checkinRef.id;
  },

  async createEvent(data) {
    return createDocument(COLLECTIONS.events, {
      creatorId: data.creatorId,
      title: data.title.trim(),
      description: data.description.trim(),
      bannerUrl: data.bannerUrl || '',
      categoryId: data.categoryId || null,
      placeId: data.placeId || null,
      location: createLocation(data.location),
      radiusMeters: data.radiusMeters,
      startTime: data.startTime,
      endTime: data.endTime,
      registrationCount: 0,
      participantCount: 0,
      status: data.status,
    });
  },

  async setEventRegistered(eventId, userId, shouldRegister) {
    const eventRef = doc(db, COLLECTIONS.events, eventId);
    const registrationRef = doc(
      db,
      COLLECTIONS.events,
      eventId,
      SUBCOLLECTIONS.registrations,
      userId,
    );

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(registrationRef);

      if (shouldRegister && !snapshot.exists()) {
        transaction.set(registrationRef, {
          userId,
          eventId,
          createdAt: serverTimestamp(),
        });
        transaction.update(eventRef, {
          registrationCount: increment(1),
          updatedAt: serverTimestamp(),
        });
      } else if (!shouldRegister && snapshot.exists()) {
        transaction.delete(registrationRef);
        transaction.update(eventRef, {
          registrationCount: increment(-1),
          updatedAt: serverTimestamp(),
        });
      }
    });
  },

  async joinEvent(eventId, userId, joinMethod = 'manual') {
    const eventRef = doc(db, COLLECTIONS.events, eventId);
    const participantRef = doc(
      db,
      COLLECTIONS.events,
      eventId,
      SUBCOLLECTIONS.participants,
      userId,
    );

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(participantRef);

      if (!snapshot.exists()) {
        transaction.set(participantRef, {
          userId,
          eventId,
          joinMethod,
          joinedAt: serverTimestamp(),
        });
        transaction.update(eventRef, {
          participantCount: increment(1),
          updatedAt: serverTimestamp(),
        });
      }
    });
  },

  async createEventPromptLog(data) {
    return createDocument(COLLECTIONS.eventPromptLogs, {
      userId: data.userId,
      eventId: data.eventId,
      shownAt: serverTimestamp(),
      dismissedAt: null,
      actionTaken: data.actionTaken || 'ignored',
    });
  },

  async createReport(data) {
    return createDocument(COLLECTIONS.reports, {
      reporterId: data.reporterId,
      targetType: data.targetType,
      targetId: data.targetId,
      reason: data.reason.trim(),
      status: 'pending',
    });
  },

  async setBlocked(blockerId, blockedId, shouldBlock) {
    const blockRef = doc(
      db,
      COLLECTIONS.blocks,
      createBlockId(blockerId, blockedId),
    );

    if (shouldBlock) {
      await setDoc(blockRef, {
        blockerId,
        blockedId,
        createdAt: serverTimestamp(),
      });
    } else {
      await deleteDoc(blockRef);
    }
  },

  getNearbyPosts(center, radiusMeters, maxResults = 50) {
    return getNearbyDocuments({
      collectionName: COLLECTIONS.posts,
      center,
      radiusMeters,
      maxResults,
    });
  },

  getNearbyPlaces(center, radiusMeters, maxResults = 50) {
    return getNearbyDocuments({
      collectionName: COLLECTIONS.places,
      center,
      radiusMeters,
      maxResults,
    });
  },

  getNearbyEvents(center, radiusMeters, maxResults = 50) {
    return getNearbyDocuments({
      collectionName: COLLECTIONS.events,
      center,
      radiusMeters,
      maxResults,
    });
  },
  async getFeedPosts({ pageSize = 10, cursor = null } = {}) {
  assertFirebaseConfigured();
  const constraints = [orderBy('createdAt', 'desc'), limit(pageSize)];
  if (cursor) constraints.push(startAfter(cursor));
  const snapshot = await getDocs(query(collection(db, COLLECTIONS.posts), ...constraints));
  const posts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  const lastDoc = snapshot.docs[snapshot.docs.length - 1] ?? null;
  return { posts, lastDoc };
},

async getLikedPostIds(postIds, userId) {
  assertFirebaseConfigured();
  if (!postIds.length) return new Set();
  const snapshots = await Promise.all(
    postIds.map((postId) =>
      getDoc(doc(db, COLLECTIONS.posts, postId, SUBCOLLECTIONS.likes, userId)),
    ),
  );
  const liked = new Set();
  snapshots.forEach((snap, i) => { if (snap.exists()) liked.add(postIds[i]); });
  return liked;
},
};
