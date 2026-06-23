import {
  addDoc,
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
  writeBatch,
  limit,
  orderBy,
  startAfter,
  Timestamp,
} from 'firebase/firestore';

import { assertFirebaseConfigured, db } from '../config/firebase';
import {
  COLLECTIONS,
  EVENT_RSVP,
  LOCATION_SHARING,
  POST_LOCATION_VISIBILITY,
  SUBCOLLECTIONS,
  createBlockId,
  createFollowId,
} from '../constants/firestore';
import { blurCoordinate, createGeoPointData } from '../utils/geo';
import { getNearbyDocuments } from './geoFirestoreService';
import { foursquareService } from './foursquareService';

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

const getMillis = (value) => {
  if (!value) {
    return 0;
  }

  if (typeof value.toMillis === 'function') {
    return value.toMillis();
  }

  if (typeof value.toDate === 'function') {
    return value.toDate().getTime();
  }

  return new Date(value).getTime() || 0;
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
      'profileLocation',
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
        ).catch(() => { });
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

  async getLocationHistory(userId) {
    assertFirebaseConfigured();

    const [privateSnapshot, sharedSnapshot, checkinsSnapshot] = await Promise.all([
      getDoc(doc(db, COLLECTIONS.userLocations, userId)),
      getDoc(doc(db, COLLECTIONS.sharedLocations, userId)),
      getDocs(
        query(
          collection(db, COLLECTIONS.checkins),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(20),
        ),
      ).catch(() =>
        getDocs(
          query(
            collection(db, COLLECTIONS.checkins),
            where('userId', '==', userId),
            limit(20),
          ),
        ),
      ),
    ]);

    const entries = [];

    if (privateSnapshot.exists()) {
      entries.push({
        id: 'private-location',
        type: 'private',
        title: 'Private location',
        subtitle: 'Saved precise location used only by your account',
        ...privateSnapshot.data(),
      });
    }

    if (sharedSnapshot.exists()) {
      entries.push({
        id: 'shared-location',
        type: 'shared',
        title: 'Shared nearby location',
        subtitle: 'Visible only based on your privacy settings',
        ...sharedSnapshot.data(),
      });
    }

    checkinsSnapshot.docs.forEach((checkinDocument) => {
      const checkin = checkinDocument.data();
      entries.push({
        id: checkinDocument.id,
        type: 'checkin',
        title: 'Venue check-in',
        subtitle: checkin.placeName || checkin.placeId || 'Saved check-in',
        ...checkin,
      });
    });

    return entries;
  },

  async clearLocationHistory(userId) {
    assertFirebaseConfigured();

    const checkinsSnapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.checkins),
        where('userId', '==', userId),
        limit(50),
      ),
    );
    const batch = writeBatch(db);

    batch.delete(doc(db, COLLECTIONS.userLocations, userId));
    batch.delete(doc(db, COLLECTIONS.sharedLocations, userId));
    checkinsSnapshot.docs.forEach((checkinDocument) => {
      batch.delete(checkinDocument.ref);
    });

    await batch.commit();
  },

  async deleteAccountData(userId) {
    assertFirebaseConfigured();
    await this.clearLocationHistory(userId);
    await deleteDoc(doc(db, COLLECTIONS.users, userId));
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

  async deletePost(postId, authorId) {
    assertFirebaseConfigured();
    const postRef = doc(db, COLLECTIONS.posts, postId);
    const userRef = doc(db, COLLECTIONS.users, authorId);

    await runTransaction(db, async (transaction) => {
      const postSnap = await transaction.get(postRef);
      if (!postSnap.exists()) {
        throw new Error('Post does not exist.');
      }
      transaction.delete(postRef);
      transaction.update(userRef, {
        postsCount: increment(-1),
        updatedAt: serverTimestamp(),
      });
    });
  },

  async addComment(postId, { userId, content, parentId = null, replyToAuthorName = '' }) {
    const commentRef = doc(
      collection(db, COLLECTIONS.posts, postId, SUBCOLLECTIONS.comments),
    );
    const postRef = doc(db, COLLECTIONS.posts, postId);

    await runTransaction(db, async (transaction) => {
      transaction.set(commentRef, {
        userId,
        content: content.trim(),
        parentId,
        replyToAuthorName,
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

  async getComments(postId) {
    assertFirebaseConfigured();

    const commentsSnapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.posts, postId, SUBCOLLECTIONS.comments),
        orderBy('createdAt', 'asc'),
      ),
    );

    const comments = await Promise.all(
      commentsSnapshot.docs.map(async (commentDocument) => {
        const comment = commentDocument.data();
        const profile = comment.userId
          ? await this.getUser(comment.userId).catch(() => null)
          : null;

        return {
          id: commentDocument.id,
          ...comment,
          authorName: profile?.username || 'AroundU user',
          authorAvatar: profile?.avatarUrl || '',
        };
      }),
    );

    return comments;
  },

  async deleteComment(postId, commentId) {
    const commentRef = doc(
      db,
      COLLECTIONS.posts,
      postId,
      SUBCOLLECTIONS.comments,
      commentId,
    );
    const postRef = doc(db, COLLECTIONS.posts, postId);

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(commentRef);

      if (!snapshot.exists()) {
        return;
      }

      transaction.delete(commentRef);
      transaction.update(postRef, {
        commentsCount: increment(-1),
        updatedAt: serverTimestamp(),
      });
    });
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

  async createNotification(data) {
    if (!data.recipientId || data.recipientId === data.actorId) {
      return null;
    }

    return createDocument(COLLECTIONS.notifications, {
      recipientId: data.recipientId,
      actorId: data.actorId,
      actorUsername: data.actorUsername || 'aroundu',
      postId: data.postId || null,
      type: data.type,
      read: false,
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

        if (!postSnapshot.exists()) {
          return null;
        }

        const postData = postSnapshot.data();
        const authorProfile = postData.authorId
          ? await this.getUser(postData.authorId).catch(() => null)
          : null;

        return {
          id: postSnapshot.id,
          ...postData,
          authorName: authorProfile?.username || 'Anonymous',
          authorAvatar: authorProfile?.avatarUrl || null,
        };
      }),
    );

    return bookmarkedPosts.filter(Boolean);
  },

  async getBookmarkedPostIds(userId) {
    assertFirebaseConfigured();
    if (!userId) return new Set();

    const bookmarksSnapshot = await getDocs(
      collection(
        db,
        COLLECTIONS.users,
        userId,
        SUBCOLLECTIONS.bookmarks,
      ),
    ).catch(() => null);

    const bookmarked = new Set();
    if (bookmarksSnapshot) {
      bookmarksSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const postId = data.postId || doc.id;
        bookmarked.add(postId);
      });
    }
    return bookmarked;
  },

  async getUserPosts(userId) {
    assertFirebaseConfigured();

    const postsSnapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.posts),
        where('authorId', '==', userId),
      ),
    );

    const userProfile = await this.getUser(userId).catch(() => null);
    const authorName = userProfile?.username || 'Anonymous';
    const authorAvatar = userProfile?.avatarUrl || null;

    return postsSnapshot.docs
      .map((postDocument) => ({
        id: postDocument.id,
        ...postDocument.data(),
        authorName,
        authorAvatar,
      }))
      .sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt));
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

  async isFollowing(followerId, followingId) {
    if (!followerId || !followingId || followerId === followingId) {
      return false;
    }

    const followSnapshot = await getDoc(
      doc(db, COLLECTIONS.follows, createFollowId(followerId, followingId)),
    );

    return followSnapshot.exists();
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
        try {
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
            city: profile.city || '',
            avatarUrl: profile.avatarUrl || '',
            location,
          };
        } catch (error) {
          console.warn(`Skipping connection location for ${connectedUserId}:`, error.message);
          return null;
        }
      }),
    );

    return connections.filter(Boolean);
  },

  async createPlace(data) {
    return createDocument(COLLECTIONS.places, {
      name: data.name.trim(),
      category: data.category || 'Community place',
      address: data.address || '',
      city: data.city || '',
      createdBy: data.createdBy || null,
      photoUrl: data.photoUrl || '',
      location: createLocation(data.location),
      checkinsCount: 0,
      postsCount: 0,
      eventsCount: 0,
      rating: data.rating || 0,
      source: data.source || 'community',
      status: 'active',
    });
  },

  async checkIn({ userId, placeId, postId = null, location }) {
    const checkinRef = doc(collection(db, COLLECTIONS.checkins));
    const placeRef = doc(db, COLLECTIONS.places, placeId);
    const placeSnapshot = await getDoc(placeRef);
    const place = placeSnapshot.exists() ? placeSnapshot.data() : null;

    await runTransaction(db, async (transaction) => {
      transaction.set(checkinRef, {
        userId,
        placeId,
        postId,
        placeName: place?.name || '',
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

  async getPlace(placeId) {
    assertFirebaseConfigured();
    const placeSnapshot = await getDoc(doc(db, COLLECTIONS.places, placeId));
    return placeSnapshot.exists()
      ? { id: placeSnapshot.id, ...placeSnapshot.data() }
      : null;
  },

  async getPlacePosts(placeId, maxResults = 30) {
    assertFirebaseConfigured();
    const postsSnapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.posts),
        where('placeId', '==', placeId),
        limit(maxResults),
      ),
    );

    const posts = await Promise.all(
      postsSnapshot.docs.map(async (postDocument) => {
        const post = postDocument.data();
        const authorProfile = post.authorId
          ? await this.getUser(post.authorId).catch(() => null)
          : null;

        return {
          id: postDocument.id,
          ...post,
          authorName: authorProfile?.username || 'Anonymous',
          authorAvatar: authorProfile?.avatarUrl || null,
        };
      })
    );

    return posts.sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt));
  },

  async getPlaceLeaderboard(placeId, maxResults = 5) {
    assertFirebaseConfigured();
    const checkinsSnapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.checkins),
        where('placeId', '==', placeId),
        limit(100),
      ),
    );
    const counts = new Map();

    checkinsSnapshot.docs.forEach((checkinDocument) => {
      const checkin = checkinDocument.data();
      counts.set(checkin.userId, (counts.get(checkin.userId) || 0) + 1);
    });

    const ranked = [...counts.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, maxResults);
    const users = await Promise.all(
      ranked.map(([userId]) => this.getUser(userId).catch(() => null)),
    );

    return ranked.map(([userId, count], index) => ({
      count,
      id: userId,
      username: users[index]?.username || 'aroundu',
    }));
  },

  async getTrendingPlacesToday(maxResults = 10) {
    assertFirebaseConfigured();
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const checkinsSnapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.checkins),
        where('createdAt', '>=', since),
        limit(100),
      ),
    ).catch(() =>
      getDocs(query(collection(db, COLLECTIONS.checkins), limit(100))),
    );
    const counts = new Map();

    checkinsSnapshot.docs.forEach((checkinDocument) => {
      const checkin = checkinDocument.data();
      if (!checkin.placeId) {
        return;
      }
      counts.set(checkin.placeId, (counts.get(checkin.placeId) || 0) + 1);
    });

    const ranked = [...counts.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, maxResults);
    const places = await Promise.all(
      ranked.map(([placeId]) => this.getPlace(placeId).catch(() => null)),
    );

    return ranked
      .map(([placeId, checkinsToday], index) =>
        places[index]
          ? {
            ...places[index],
            id: placeId,
            checkinsToday,
          }
          : null,
      )
      .filter(Boolean);
  },

  async createEvent(data) {
    return createDocument(COLLECTIONS.events, {
      creatorId: data.creatorId,
      title: data.title.trim(),
      description: data.description.trim(),
      bannerUrl: data.bannerUrl || '',
      categoryId: data.categoryId || null,
      category: data.category || null,
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

  async deleteEvent(eventId) {
    assertFirebaseConfigured();
    const eventRef = doc(db, COLLECTIONS.events, eventId);
    await deleteDoc(eventRef);
  },

  async updateEvent(eventId, data) {
    assertFirebaseConfigured();
    const eventRef = doc(db, COLLECTIONS.events, eventId);

    const updates = {};
    if (data.title !== undefined) updates.title = data.title.trim();
    if (data.description !== undefined) updates.description = data.description.trim();
    if (data.bannerUrl !== undefined) updates.bannerUrl = data.bannerUrl;
    if (data.categoryId !== undefined) updates.categoryId = data.categoryId;
    if (data.category !== undefined) updates.category = data.category;
    if (data.placeId !== undefined) updates.placeId = data.placeId;
    if (data.location !== undefined) updates.location = createLocation(data.location);
    if (data.radiusMeters !== undefined) updates.radiusMeters = data.radiusMeters;
    if (data.startTime !== undefined) updates.startTime = data.startTime;
    if (data.endTime !== undefined) updates.endTime = data.endTime;
    if (data.status !== undefined) updates.status = data.status;

    updates.updatedAt = serverTimestamp();

    await updateDoc(eventRef, updates);
  },

  async setEventInterest(eventId, userId, shouldRegister) {
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

  async setEventRegistered(eventId, userId, shouldRegister) {
    return this.setEventRsvp(
      eventId,
      userId,
      shouldRegister ? EVENT_RSVP.going : EVENT_RSVP.notGoing,
    );
  },

  async getEventRsvp(eventId, userId) {
    if (!eventId || !userId) {
      return EVENT_RSVP.notGoing;
    }

    const registrationSnapshot = await getDoc(
      doc(db, COLLECTIONS.events, eventId, SUBCOLLECTIONS.registrations, userId),
    );

    return registrationSnapshot.exists()
      ? registrationSnapshot.data().status || EVENT_RSVP.going
      : EVENT_RSVP.notGoing;
  },

  async setEventRsvp(eventId, userId, status) {
    const eventRef = doc(db, COLLECTIONS.events, eventId);
    const registrationRef = doc(
      db,
      COLLECTIONS.events,
      eventId,
      SUBCOLLECTIONS.registrations,
      userId,
    );
    const nextStatus =
      status === EVENT_RSVP.going || status === EVENT_RSVP.interested
        ? status
        : EVENT_RSVP.notGoing;

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(registrationRef);
      const currentStatus = snapshot.exists()
        ? snapshot.data().status || EVENT_RSVP.going
        : EVENT_RSVP.notGoing;
      const wasGoing = currentStatus === EVENT_RSVP.going;
      const wasInterested = currentStatus === EVENT_RSVP.interested;
      const willGoing = nextStatus === EVENT_RSVP.going;
      const willInterested = nextStatus === EVENT_RSVP.interested;

      if (nextStatus === EVENT_RSVP.notGoing) {
        if (snapshot.exists()) {
          transaction.delete(registrationRef);
        }
      } else if (!snapshot.exists()) {
        transaction.set(registrationRef, {
          userId,
          eventId,
          status: nextStatus,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        transaction.update(registrationRef, {
          status: nextStatus,
          updatedAt: serverTimestamp(),
        });
      }

      const participantDelta = Number(willGoing) - Number(wasGoing);
      const registrationDelta =
        Number(willGoing || willInterested) - Number(wasGoing || wasInterested);

      if (participantDelta || registrationDelta) {
        transaction.update(eventRef, {
          participantCount: increment(participantDelta),
          registrationCount: increment(registrationDelta),
          updatedAt: serverTimestamp(),
        });
      }
    });

    return nextStatus;
  },

  async setEventParticipation(eventId, userId, shouldJoin, joinMethod = 'manual') {
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

      if (shouldJoin && !snapshot.exists()) {
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
      } else if (!shouldJoin && snapshot.exists()) {
        transaction.delete(participantRef);
        transaction.update(eventRef, {
          participantCount: increment(-1),
          updatedAt: serverTimestamp(),
        });
      }
    });
  },

  async setEventDecline(eventId, userId, shouldDecline) {
    const declineRef = doc(
      db,
      COLLECTIONS.events,
      eventId,
      SUBCOLLECTIONS.declines,
      userId,
    );
    if (shouldDecline) {
      await setDoc(declineRef, {
        userId,
        declinedAt: serverTimestamp(),
      });
    } else {
      await deleteDoc(declineRef);
    }
  },

  async checkInToEvent(eventId, userId) {
    const checkinRef = doc(
      db,
      COLLECTIONS.events,
      eventId,
      SUBCOLLECTIONS.checkins,
      userId,
    );
    await setDoc(checkinRef, {
      userId,
      checkedInAt: serverTimestamp(),
    });
  },

  async addEventStory(eventId, userId, imageUrl) {
    const storiesRef = collection(
      db,
      COLLECTIONS.events,
      eventId,
      SUBCOLLECTIONS.stories,
    );
    await addDoc(storiesRef, {
      userId,
      imageUrl,
      createdAt: serverTimestamp(),
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

  async getNearbyPosts(center, radiusMeters, maxResults = 50) {
    const posts = await getNearbyDocuments({
      collectionName: COLLECTIONS.posts,
      center,
      radiusMeters,
      maxResults,
    });
    
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return posts.filter(post => {
      if (!post.createdAt) return true;
      const createdAtMs = post.createdAt.toDate ? post.createdAt.toDate().getTime() : new Date(post.createdAt).getTime();
      return createdAtMs >= oneDayAgo;
    });
  },

  async getNearbyPlaces(center, radiusMeters, maxResults = 50) {
    await this._fetchAndSyncFoursquare(center, radiusMeters);
    return getNearbyDocuments({
      collectionName: COLLECTIONS.places,
      center,
      radiusMeters,
      maxResults,
    });
  },

  async _fetchAndSyncFoursquare(center, radiusMeters, query = '') {
    try {
      const places = await foursquareService.getNearbyPlaces(center, radiusMeters, query);
      if (!places || places.length === 0) return;

      const batch = writeBatch(db);
      let count = 0;
      
      for (const p of places) {
        if (count >= 400) break;
        const placeId = p.fsq_id || p.id || p.foursquare_id;
        if (!placeId) continue;

        const name = p.name || 'Unknown Venue';
        const category = p.categories?.[0]?.name || p.category || 'Venue';
        const address = p.location?.address || p.location?.formatted_address || p.address || '';
        const city = p.location?.locality || p.city || '';
        const lat = p.geocodes?.main?.latitude ?? p.location?.latitude;
        const lng = p.geocodes?.main?.longitude ?? p.location?.longitude;

        if (lat === undefined || lng === undefined) continue;

        const docRef = doc(db, COLLECTIONS.places, placeId.toString());
        batch.set(docRef, {
          name: name.trim(),
          category,
          address,
          city,
          location: createLocation({ latitude: lat, longitude: lng }),
          source: 'foursquare',
          status: 'active',
        }, { merge: true });
        count++;
      }

      if (count > 0) {
        await batch.commit();
      }
    } catch (err) {
      console.warn('Failed to sync Foursquare places:', err);
    }
  },

  async getNearbyEvents(center, radiusMeters, maxResults = 50) {
    const events = await getNearbyDocuments({
      collectionName: COLLECTIONS.events,
      center,
      radiusMeters,
      maxResults,
    });
    const now = Date.now();
    return events.filter((e) => {
      if (!e.endTime) return true;
      const endD = e.endTime.toDate ? e.endTime.toDate().getTime() : new Date(e.endTime).getTime();
      return endD >= now;
    });
  },

  async createStory(data) {
    assertFirebaseConfigured();
    const storyRef = doc(collection(db, COLLECTIONS.stories));
    await setDoc(storyRef, {
      userId: data.userId,
      username: data.username || 'aroundu',
      userAvatar: data.userAvatar || '',
      mediaUrl: data.mediaUrl,
      eventId: data.eventId || null,
      eventTitle: data.eventTitle || '',
      placeId: data.placeId || null,
      placeName: data.placeName || '',
      createdAt: serverTimestamp(),
    });
    return storyRef.id;
  },

  async getEventStories(eventId) {
    assertFirebaseConfigured();
    const snapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.stories),
        where('eventId', '==', eventId),
      )
    );

    const since = Date.now() - 24 * 60 * 60 * 1000;
    return snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((story) => getMillis(story.createdAt) >= since)
      .sort((a, b) => getMillis(a.createdAt) - getMillis(b.createdAt));
  },

  async getAllActiveStories() {
    assertFirebaseConfigured();
    const since = Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);
    const snapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.stories),
        where('createdAt', '>=', since),
        orderBy('createdAt', 'asc'),
        limit(100),
      ),
    );
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async getVenueStories(placeId) {
    assertFirebaseConfigured();
    const since = Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);
    const snapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.stories),
        where('placeId', '==', placeId),
        where('createdAt', '>=', since),
        orderBy('createdAt', 'asc'),
        limit(50),
      ),
    );
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
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

  async getPost(postId) {
    assertFirebaseConfigured();
    const snapshot = await getDoc(doc(db, COLLECTIONS.posts, postId));
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
  },

  async searchPosts(searchText, maxResults = 25) {
    assertFirebaseConfigured();
    const normalizedSearch = searchText.trim().toLowerCase();

    if (!normalizedSearch) {
      return [];
    }

    const snapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.posts),
        orderBy('createdAt', 'desc'),
        limit(maxResults),
      ),
    );

    const filteredPosts = snapshot.docs
      .map((documentSnapshot) => ({ id: documentSnapshot.id, ...documentSnapshot.data() }))
      .filter((post) =>
        [
          post.caption,
          post.location?.address,
          post.location?.city,
        ].some((value) => value?.toLowerCase().includes(normalizedSearch)),
      );

    return await Promise.all(
      filteredPosts.map(async (post) => {
        const authorProfile = post.authorId
          ? await this.getUser(post.authorId).catch(() => null)
          : null;

        return {
          ...post,
          authorName: authorProfile?.username || 'Anonymous',
          authorAvatar: authorProfile?.avatarUrl || null,
        };
      })
    );
  },

  async searchEvents(searchText, maxResults = 25) {
    assertFirebaseConfigured();
    const normalizedSearch = searchText.trim().toLowerCase();

    if (!normalizedSearch) {
      return [];
    }

    const snapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.events),
        orderBy('startTime', 'asc'),
        limit(maxResults),
      ),
    );

    return snapshot.docs
      .map((documentSnapshot) => ({ id: documentSnapshot.id, ...documentSnapshot.data() }))
      .filter((event) =>
        [
          event.title,
          event.description,
          event.location?.address,
          event.location?.city,
        ].some((value) => value?.toLowerCase().includes(normalizedSearch)),
      );
  },

  async searchPlaces(searchText, location = null, maxResults = 25) {
    assertFirebaseConfigured();
    const normalizedSearch = searchText.trim().toLowerCase();

    if (!normalizedSearch) {
      return [];
    }

    if (location) {
      await this._fetchAndSyncFoursquare(location, 50000, searchText);
    }

    const snapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.places),
        limit(maxResults),
      ),
    );

    return snapshot.docs
      .map((documentSnapshot) => ({ id: documentSnapshot.id, ...documentSnapshot.data() }))
      .filter((place) =>
        [
          place.name,
          place.category,
          place.address,
          place.city,
        ].some((value) => value?.toLowerCase().includes(normalizedSearch)),
      );
  },

  async getAllPlaces(maxResults = 25) {
    assertFirebaseConfigured();
    const snapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.places),
        limit(maxResults),
      ),
    );
    return snapshot.docs.map((documentSnapshot) => ({
      id: documentSnapshot.id,
      ...documentSnapshot.data(),
    }));
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

  async getUpcomingEvents({ pageSize = 10, cursor = null } = {}) {
    assertFirebaseConfigured();
    const now = Timestamp.now();
    const constraints = [
      where('endTime', '>=', now),
      orderBy('endTime', 'asc'),
      limit(pageSize),
    ];
    if (cursor) constraints.push(startAfter(cursor));
    const snapshot = await getDocs(query(collection(db, COLLECTIONS.events), ...constraints));
    const events = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    const lastDoc = snapshot.docs[snapshot.docs.length - 1] ?? null;
    return { events, lastDoc };
  },

  async getEventsByCreator(userId) {
    assertFirebaseConfigured();
    const snapshot = await getDocs(
      query(collection(db, COLLECTIONS.events), where('creatorId', '==', userId))
    );
    const events = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    return events.sort((a, b) => {
      const timeA = a.startTime?.toMillis?.() || 0;
      const timeB = b.startTime?.toMillis?.() || 0;
      return timeB - timeA;
    });
  },
};