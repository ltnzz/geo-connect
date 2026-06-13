# Firebase and Cloudinary Setup

## 1. Firebase

1. Create a Firebase project.
2. Add a **Web app** in Firebase Console > Project settings.
3. Enable Authentication > Sign-in method > Email/Password.
4. Create a Firestore database.
5. Copy `.env.example` to `.env` and fill every `EXPO_PUBLIC_FIREBASE_*` value.
6. Install Firebase CLI and log in:

```bash
npm install --global firebase-tools
firebase login
firebase use --add
```

7. Deploy rules and indexes:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

The Firebase web API key is an app identifier and may be bundled into the client.
Database access is protected by Firebase Authentication and `firestore.rules`.

## 2. Cloudinary

1. Create or open a Cloudinary product environment.
2. Copy the cloud name into `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME`.
3. In Settings > Upload, create an **unsigned upload preset**.
4. Restrict the preset to images, allowed formats, maximum size, and the `aroundu`
   folder.
5. Put the preset name in `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.

Never place `CLOUDINARY_API_SECRET` or a signed-upload secret in Expo environment
variables. `EXPO_PUBLIC_*` values are visible in the application bundle.

Example:

```js
import { cloudinaryService } from '../services/cloudinaryService';
import { imagePickerService } from '../services/imagePickerService';

const asset = await imagePickerService.fromLibrary({ aspect: [1, 1] });

if (asset) {
  const upload = await cloudinaryService.uploadImage(asset, {
    folder: 'avatars',
    tags: ['avatar', userId],
  });

  await firestoreService.updateUser(userId, {
    avatarUrl: upload.secureUrl,
  });
}
```

Recommended folders:

```txt
aroundu/avatars
aroundu/posts
aroundu/places
aroundu/events
```

## 3. Run

Restart Expo after changing `.env`:

```bash
npm start -- --clear
```
