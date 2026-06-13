# AroundU Firestore Schema

Firestore is the primary database. Cloudinary stores image bytes; Firestore stores only
the returned HTTPS URLs.

## Collections

### `users/{userId}`

```txt
uid, username, email, fullName, avatarUrl, bio
isPublic, invisibleMode, locationSharing, city
followersCount, followingCount, postsCount
createdAt, updatedAt
```

Exact live location is intentionally not stored in this public profile document.

### `userLocations/{userId}` (private)

```txt
userId, latitude, longitude, geohash, updatedAt
```

Only the owner can read or write this document. This separation is required because
Firestore Security Rules protect documents, not individual fields.

### `usernames/{normalizedUsername}` (internal uniqueness index)

```txt
uid, createdAt
```

Registration reserves this document in the same transaction that creates the user
profile.

### `posts/{postId}`

```txt
authorId, caption, imageUrl, categoryId, placeId
location: { latitude, longitude, geohash, address, visibility }
likesCount, commentsCount, checkinsCount
createdAt, updatedAt
```

For `location.visibility == "hidden"`, coordinates and geohash are omitted. For
`"blurred"` or `"city"`, only publish coordinates that have already been generalized;
never write the user's exact private position.

Subcollections:

```txt
posts/{postId}/comments/{commentId}
posts/{postId}/likes/{userId}
```

### `users/{userId}/bookmarks/{postId}`

```txt
postId, createdAt
```

### `follows/{followerId_followingId}`

```txt
followerId, followingId, createdAt
```

### `categories/{categoryId}`

```txt
name, slug, icon, type, createdAt
```

Categories are read-only from the mobile client. Seed them from the Firebase Console
or a trusted admin script.

### `places/{placeId}`

```txt
name, category, address, city, photoUrl
location: { latitude, longitude, geohash }
checkinsCount, postsCount, eventsCount, rating
createdAt, updatedAt
```

### `checkins/{checkinId}`

```txt
userId, placeId, postId
location: { latitude, longitude, geohash }
createdAt
```

### `events/{eventId}`

```txt
creatorId, title, description, bannerUrl, categoryId, placeId
location: { latitude, longitude, geohash, address }
radiusMeters, startTime, endTime
registrationCount, participantCount, status
createdAt, updatedAt
```

Subcollections:

```txt
events/{eventId}/registrations/{userId}
events/{eventId}/participants/{userId}
```

### Other collections

```txt
eventPromptLogs/{logId}
notifications/{notificationId}
reports/{reportId}
blocks/{blockerId_blockedId}
```

See `src/constants/firestore.js` for canonical collection names and enum values.

## Geo Queries

`src/services/geoFirestoreService.js` follows Firebase's recommended geohash flow:

1. Compute query bounds with `geofire-common`.
2. Run one Firestore query for every bound.
3. Merge duplicate documents.
4. Remove geohash false positives using exact distance.

Use:

```js
const posts = await firestoreService.getNearbyPosts(
  { latitude: -6.2, longitude: 106.8 },
  5000,
);
```

Location features must stay off until the user grants foreground permission.
