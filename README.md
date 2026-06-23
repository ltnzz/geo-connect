# GeoConnect Mobile

Starter project for the GeoConnect Expo mobile app. The `main` branch is intentionally kept minimal so each team member can build their feature from a clean base.

## Stack

- Expo SDK 54
- React Native 0.81
- React 19.1
- React Navigation
- Zustand
- Firebase Auth and Firestore
- Firestore-backed community venues and check-ins
- Cloudinary image hosting
- expo-location, expo-image, and react-native-maps
- Reanimated, Worklets, and Gesture Handler
- New Architecture enabled for Reanimated 4 compatibility

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

Backend setup and data modeling are documented in:

- `docs/FIREBASE_CLOUDINARY_SETUP.md`
- `docs/FIRESTORE_SCHEMA.md`
- `docs/LOCATION_PRIVACY.md`
- `docs/CODE_STRUCTURE_GUIDE.md`

Google OAuth requires an Android development build; Expo Go cannot receive the
custom OAuth callback used by this app.

Google OAuth requires an Android development build; Expo Go cannot run the
native Google Sign-In module used by this app.

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

## Panduan Instalasi & Konfigurasi

1. **Kloning Repositori**
   Pastikan kamu sudah memiliki kode repositori ini di perangkat lokalmu.

2. **Instalasi Dependensi**
   Buka terminal di dalam folder proyek, lalu jalankan perintah berikut untuk menginstal semua *library* yang diperlukan:
   ```bash
   npm install
   ```

## Konfigurasi `.env`

Aplikasi ini membutuhkan beberapa kunci rahasia API (seperti Firebase, Google Cloud, dan Cloudinary) agar seluruh fiturnya menyala.
Salin file `.env.example` menjadi `.env` lalu isikan nilainya dengan *API key* kamu:

```env
# Konfigurasi Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=kunci_api_firebase_kamu
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=domain_auth_firebase_kamu
EXPO_PUBLIC_FIREBASE_PROJECT_ID=id_proyek_firebase
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=bucket_storage_firebase
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=sender_id_firebase
EXPO_PUBLIC_FIREBASE_APP_ID=app_id_firebase
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=measurement_id_firebase

# Konfigurasi Google Cloud (Untuk Auth & Maps)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=client_id_web_kamu
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=client_id_android_kamu
# Jika Google Maps API Key kosong, sistem akan menggunakan FIREBASE_API_KEY sebagai alternatif fallback.
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=kunci_api_google_maps_kamu

# Konfigurasi Cloudinary (Untuk unggah gambar)
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=nama_cloud_kamu
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=preset_upload_kamu
EXPO_PUBLIC_CLOUDINARY_UPLOAD_FOLDER=folder_upload_kamu
```

> **Penting**: File `.env` ini akan otomatis diabaikan oleh Git. Jika kamu ingin mem-*build* APK mandiri, jangan lupa unggah *environment variables* ini ke server EAS menggunakan perintah `eas secret:push --env-file .env`!

## Cara Menjalankan Aplikasi

Setelah proses instalasi dan `.env` beres, jalankan aplikasi melalui terminal dengan perintah:

**Menjalankan di server pengembangan lokal (Expo Go):**
```bash
npx expo start
```
*(Tekan `a` untuk membuka di Emulator Android, atau pindai QR Code-nya dengan aplikasi Expo Go di HP kamu).*

**Membuat Build Standalone (Aplikasi APK Android):**
```bash
eas build --platform android --profile preview
```

## Screenshot Fitur Utama

Berikut adalah pratinjau fungsionalitas dan antarmuka utama dari aplikasi GeoConnect:

### Layar Peta Utama (Maps)
Menampilkan lokasi kamu, event terdekat, serta pos/lokasi interaktif dari pengguna lain.
![Maps Screen](./image/maps-screen.jpeg)

### Daftar Acara (Event)
Menelusuri direktori komunitas untuk menemukan dan melihat sekumpulan acara di sekitarmu.
![Event Screen](./image/event-screen.jpeg)

### Detail Acara
Informasi spesifik terkait sebuah acara yang sedang berlangsung, mencakup waktu, lokasi, dan pengguna lain yang bergabung.
![Event Details](./image/event-details.jpeg)

### Membuat Acara Baru
Tampilan formulir pembuatan acara yang bisa langsung disematkan ke dalam peta.
![Create Event](./image/craete-event.jpeg)

### Pengaturan & Privasi
Halaman untuk mengonfigurasi profil pengguna, notifikasi, dan pengelolaan preferensi akun.
![Settings Screen](./image/settings-screen.jpeg)
