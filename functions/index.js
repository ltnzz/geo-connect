const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');
const { logger } = require('firebase-functions');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');

initializeApp();

const db = getFirestore();
const REGION = 'asia-east2';
const INVALID_TOKEN_CODES = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
]);

const getUsername = async (userId) => {
  const snapshot = await db.doc(`users/${userId}`).get();
  return snapshot.data()?.username || 'someone';
};

const getRecipientTokens = async (recipientId) => {
  const snapshot = await db
    .collection(`users/${recipientId}/pushTokens`)
    .get();

  return snapshot.docs
    .map((tokenDocument) => ({
      reference: tokenDocument.ref,
      token: tokenDocument.data().token,
    }))
    .filter(({ token }) => Boolean(token));
};

const createAndSendNotification = async ({
  eventId,
  recipientId,
  actorId,
  type,
  postId = null,
  body,
}) => {
  if (!recipientId || !actorId || recipientId === actorId) {
    return;
  }

  const actorUsername = await getUsername(actorId);
  const notificationReference = db.doc(`notifications/${eventId}`);

  try {
    await notificationReference.create({
      recipientId,
      actorId,
      actorUsername,
      type,
      postId,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    if (error.code === 6 || error.code === 'already-exists') {
      return;
    }
    throw error;
  }

  const tokenEntries = await getRecipientTokens(recipientId);
  if (!tokenEntries.length) {
    return;
  }

  const response = await getMessaging().sendEachForMulticast({
    tokens: tokenEntries.map(({ token }) => token),
    notification: {
      title: 'AroundU',
      body: `@${actorUsername} ${body}`,
    },
    data: {
      type,
      actorId,
      postId: postId || '',
      notificationId: eventId,
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'social',
      },
    },
  });

  const cleanup = db.batch();
  let hasInvalidTokens = false;

  response.responses.forEach((result, index) => {
    if (!result.success && INVALID_TOKEN_CODES.has(result.error?.code)) {
      cleanup.delete(tokenEntries[index].reference);
      hasInvalidTokens = true;
    }
  });

  if (hasInvalidTokens) {
    await cleanup.commit();
  }
};

exports.notifyPostComment = onDocumentCreated(
  {
    document: 'posts/{postId}/comments/{commentId}',
    region: REGION,
  },
  async (event) => {
    const comment = event.data?.data();
    const postId = event.params.postId;
    const post = await db.doc(`posts/${postId}`).get();

    if (!comment || !post.exists) {
      return;
    }

    await createAndSendNotification({
      eventId: event.id,
      recipientId: post.data().authorId,
      actorId: comment.userId,
      type: 'comment',
      postId,
      body: 'commented on your post',
    });
  },
);

exports.notifyPostLike = onDocumentCreated(
  {
    document: 'posts/{postId}/likes/{userId}',
    region: REGION,
  },
  async (event) => {
    const postId = event.params.postId;
    const post = await db.doc(`posts/${postId}`).get();

    if (!post.exists) {
      return;
    }

    await createAndSendNotification({
      eventId: event.id,
      recipientId: post.data().authorId,
      actorId: event.params.userId,
      type: 'like',
      postId,
      body: 'liked your post',
    });
  },
);

exports.notifyNewFollower = onDocumentCreated(
  {
    document: 'follows/{followId}',
    region: REGION,
  },
  async (event) => {
    const follow = event.data?.data();

    if (!follow) {
      return;
    }

    await createAndSendNotification({
      eventId: event.id,
      recipientId: follow.followingId,
      actorId: follow.followerId,
      type: 'follow',
      body: 'started following you',
    });
  },
);

logger.info('AroundU notification functions loaded.');
