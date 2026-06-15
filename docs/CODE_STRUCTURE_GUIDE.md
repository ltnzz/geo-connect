# Panduan Struktur Kode AroundU

Dokumen ini menjelaskan letak file, hubungan antarbagian, dan urutan membaca
kode AroundU.

## 1. Gambaran Besar

Alur umum aplikasi:

```text
Screen / Component
        |
        v
Store atau Service
        |
        v
Firebase / Cloudinary / Foursquare / Perangkat
```

Struktur utama:

```text
aroundu/
|-- index.js
|-- App.js
|-- app.json
|-- app.config.js
|-- package.json
|-- assets/
|-- docs/
|-- functions/
|-- workers/
`-- src/
    |-- components/
    |-- config/
    |-- constants/
    |-- data/
    |-- navigation/
    |-- screens/
    |-- services/
    |-- stores/
    `-- utils/
```

## 2. File Root

### `index.js`

Pintu masuk aplikasi. File ini mendaftarkan `App` sebagai komponen utama Expo.

```text
index.js -> App.js
```

### `App.js`

Pengatur awal aplikasi:

- Memuat font.
- Memulihkan sesi login.
- Menampilkan splash screen.
- Menentukan apakah pengguna melihat login atau aplikasi utama.
- Mendaftarkan perangkat untuk push notification.

```text
App.js
|-- belum login -> AuthScreen
`-- sudah login -> AppNavigator
```

### `package.json`

Berisi:

- Daftar library.
- Versi Expo dan React Native.
- Perintah seperti `npm start`, `npm run android`, dan `npm run web`.

### `app.json` dan `app.config.js`

Konfigurasi aplikasi Expo:

- Nama dan package aplikasi.
- Icon.
- Permission lokasi, kamera, dan foto.
- Plugin Expo.
- Google Maps API key.

## 3. Folder `src/screens`

Folder ini berisi halaman penuh yang dapat ditampilkan melalui navigasi.

```text
screens/
|-- auth/
|   `-- AuthScreen.js
|-- create/
|   `-- CreatePostScreen.js
|-- event/
|   |-- EventScreen.js
|   `-- EventDetailScreen.js
|-- home/
|   `-- HomeScreen.js
|-- map/
|   |-- MapScreen.native.js
|   `-- MapScreen.web.js
|-- notification/
|   `-- NotificationScreen.js
|-- post/
|   `-- PostDetailScreen.js
|-- profile/
|   |-- ProfileScreen.js
|   `-- ConnectionsScreen.js
|-- settings/
|   `-- SettingsScreen.js
`-- splash/
    `-- SplashScreen.js
```

Gunakan `screens` jika komponen tersebut:

- Mengisi satu halaman.
- Terdaftar dalam navigator.
- Mewakili satu fitur besar.

File `.native.js` dipakai Android dan iOS. File `.web.js` dipakai browser.
React Native memilihnya secara otomatis.

## 4. Folder `src/components`

Folder ini berisi potongan UI yang dipakai oleh screen.

```text
components/
|-- common/
|   |-- BrandMark.js
|   |-- ScreenHeader.js
|   `-- TabPlaceholder.js
|-- home/
|   `-- HomeSkeleton.js
`-- post/
    `-- PostCard.js
```

Contoh hubungan:

```text
HomeScreen
|-- ScreenHeader
|-- PostCard
|-- PostCard
`-- PostCard
```

`HomeScreen` mengatur daftar data. `PostCard` bertugas menggambar satu post.

Gunakan `components` jika:

- Bukan halaman penuh.
- Merupakan bagian kecil dari screen.
- Dapat digunakan kembali.

## 5. Folder `src/navigation`

```text
navigation/
|-- AppNavigator.js
`-- MainTabNavigator.js
```

### `AppNavigator.js`

Mengatur perpindahan halaman utama:

```text
MainTabs
Connections
Notification
PostDetail
Settings
EventDetail
```

### `MainTabNavigator.js`

Mengatur menu bawah:

```text
Home | Events | Create | Maps | Profile
```

Navigator hanya menentukan hubungan antarhalaman. Isi halaman tetap diletakkan
di `screens`.

## 6. Folder `src/stores`

```text
stores/
`-- authStore.js
```

Store menyimpan state global yang digunakan banyak halaman.

`authStore` menyimpan:

```text
user
isInitialized
isLoading
error
```

Gunakan Zustand store jika data diperlukan oleh banyak screen. Gunakan
`useState` jika data hanya dibutuhkan oleh satu komponen.

Contoh:

```js
// State lokal: hanya dibutuhkan screen ini.
const [searchQuery, setSearchQuery] = useState('');

// State global: dipakai banyak screen.
const user = useAuthStore((state) => state.user);
```

## 7. Folder `src/services`

Service berisi operasi data, API, atau fitur perangkat.

```text
services/
|-- authService.js
|-- cloudinaryService.js
|-- firestoreService.js
|-- foursquareService.js
|-- geoFirestoreService.js
|-- imagePickerService.js
|-- locationService.js
`-- notificationService.js
```

Tanggung jawab masing-masing:

| File | Tugas |
| --- | --- |
| `authService.js` | Login, register, Google Sign-In, logout |
| `firestoreService.js` | Membaca dan menulis data Firestore |
| `geoFirestoreService.js` | Query dokumen berdasarkan radius |
| `cloudinaryService.js` | Upload gambar |
| `imagePickerService.js` | Memilih foto dari galeri atau kamera |
| `locationService.js` | Permission dan lokasi perangkat |
| `foursquareService.js` | Mencari tempat melalui Worker |
| `notificationService.js` | Token dan konfigurasi notifikasi |

Screen cukup meminta service melakukan pekerjaan:

```js
await firestoreService.updateUser(userId, updates);
```

Detail Firebase tetap berada di service, bukan di UI.

## 8. Folder `src/config`

```text
config/
|-- firebase.js
|-- firebaseAuth.native.js
|-- firebaseAuth.web.js
|-- googleAuth.js
`-- cloudinary.js
```

Perbedaannya:

```text
config  -> menyiapkan koneksi dan konfigurasi
service -> menggunakan koneksi tersebut
```

Contoh:

```text
firebase.js
    |
    v
firestoreService.js
    |
    v
SettingsScreen.js
```

## 9. Folder Pendukung

### `src/constants`

Nilai tetap yang dipakai di banyak tempat:

```js
COLLECTIONS.posts
LOCATION_SHARING.hidden
EVENT_STATUS.upcoming
```

### `src/utils`

Fungsi pembantu yang tidak menggambar UI dan tidak langsung mengakses backend:

```text
geo.js        -> geohash, jarak, dan blur koordinat
mapCluster.js -> mengelompokkan marker
theme.js      -> warna, spacing, radius, typography
```

### `src/data`

Data sementara untuk pengembangan:

```text
dummyPosts.js
dummyEvents.js
mapDiscoveryData.js
```

Data dalam folder ini bukan hasil langsung dari Firebase.

## 10. Backend

### `functions/index.js`

Berjalan di Firebase Cloud Functions, bukan di HP pengguna.

```text
Like, comment, atau follow dibuat
        |
        v
Cloud Function terpanggil
        |
        v
Dokumen notification dibuat
        |
        v
FCM dikirim ke perangkat
```

### `workers/foursquare-proxy`

Berjalan di Cloudflare Worker.

```text
Aplikasi
   |
   v
Cloudflare Worker
   |
   v
Foursquare API
```

Worker digunakan agar Foursquare API key tidak disimpan dalam aplikasi.

## 11. Cara Membaca Satu File

Jangan langsung membaca semua baris. Gunakan urutan berikut:

1. Baca `import`.
2. Cari `useState`.
3. Cari `useEffect`.
4. Cari fungsi handler seperti `handleSubmit`.
5. Baca bagian `return`.
6. Baca `StyleSheet` paling akhir.

Contoh pola screen:

```js
// 1. Dependency
import { useState } from 'react';

// 2. Komponen
export default function ExampleScreen() {
  // 3. State
  const [value, setValue] = useState('');

  // 4. Handler
  const handlePress = () => {
    setValue('berubah');
  };

  // 5. Tampilan
  return (
    <Pressable onPress={handlePress}>
      <Text>{value}</Text>
    </Pressable>
  );
}

// 6. Styling
const styles = StyleSheet.create({});
```

## 12. Alur Fitur Login

Baca file sesuai perjalanan data:

```text
AuthScreen.js
    |
    | login(credentials)
    v
authStore.js
    |
    | authService.login(credentials)
    v
authService.js
    |
    | signInWithEmailAndPassword()
    v
Firebase Authentication
```

Setelah berhasil:

```text
Firebase user
    |
    v
authStore.user
    |
    v
App.js melihat user tersedia
    |
    v
AppNavigator ditampilkan
```

## 13. Alur Fitur Map

```text
MapScreen.native.js
    |
    | meminta permission
    v
locationService.js
    |
    | mendapatkan posisi
    v
MapScreen.native.js
    |
    | meminta post, place, dan event
    v
firestoreService.js + foursquareService.js
    |
    v
geoFirestoreService.js / Cloudflare Worker
    |
    v
Data marker ditampilkan pada react-native-maps
```

## 14. Menentukan Lokasi File Baru

Gunakan pertanyaan berikut:

| Pertanyaan | Lokasi |
| --- | --- |
| Apakah ini halaman penuh? | `src/screens` |
| Apakah ini potongan UI? | `src/components` |
| Apakah ini mengatur perpindahan halaman? | `src/navigation` |
| Apakah datanya dibutuhkan banyak halaman? | `src/stores` |
| Apakah berkomunikasi dengan API, database, atau perangkat? | `src/services` |
| Apakah menyiapkan koneksi layanan? | `src/config` |
| Apakah hanya fungsi pembantu? | `src/utils` |
| Apakah nilainya tetap? | `src/constants` |
| Apakah datanya hanya contoh? | `src/data` |

Contoh penambahan fitur komentar:

```text
src/
|-- screens/post/
|   `-- PostDetailScreen.js
|-- components/post/
|   `-- CommentItem.js
|-- services/
|   `-- firestoreService.js
`-- constants/
    `-- firestore.js
```

## 15. Urutan Belajar Repo

Pelajari file dalam urutan berikut:

```text
1. index.js
2. App.js
3. src/navigation/AppNavigator.js
4. src/navigation/MainTabNavigator.js
5. src/screens/home/HomeScreen.js
6. src/components/post/PostCard.js
7. src/stores/authStore.js
8. src/services/authService.js
9. src/services/firestoreService.js
10. src/screens/map/MapScreen.native.js
```

Tidak perlu menghafal seluruh kode. Fokus memahami perjalanan data dari screen
menuju service, lalu melihat hasilnya kembali pada screen.
