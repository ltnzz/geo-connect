# Penjelasan Logika & Kode Program AroundU

Dokumen ini menjelaskan maksud, logika bisnis, dan mekanisme di balik kode program aplikasi **AroundU** (GeoConnect). Penjelasan ini dirancang untuk mempermudah pemahaman arsitektur aplikasi saat presentasi tugas besar atau UAS.

---

## 1. Arsitektur & Aliran Data (Data Flow)

Aplikasi ini menggunakan pola pemisahan tanggung jawab (*Separation of Concerns*) yang bersih dengan alur data sebagai berikut:

$$\text{UI Screen / Component} \longrightarrow \text{Zustand Store} \longrightarrow \text{Service Layer} \longrightarrow \text{Firebase / Cloudinary / GPS}$$

*   **UI Screen / Component (`src/screens`, `src/components`):** Hanya fokus pada rendering UI dan menangkap interaksi pengguna.
*   **Zustand Store (`src/stores`):** Mengelola *global state* aplikasi (data user login, daftar postingan feed, dsb.) agar data sinkron antar layar tanpa *prop drilling*.
*   **Service Layer (`src/services`):** Modul berisi fungsi-fungsi murni yang berinteraksi langsung dengan Firebase SDK, Cloudinary REST API, atau API perangkat (seperti GPS).

---

## 2. Fitur Unggulan Berbasis Lokasi (GeoConnect)

### A. Location-Based Query (Pencarian Radius)
File Utama: [geoFirestoreService.js](file:///c:/Latanza/UPNVJ/smt4/pemograman-mobile-lanjut/UAS/aroundu/src/services/geoFirestoreService.js)

Karena Firestore tidak mendukung query geografis dua dimensi secara bawaan (misal mencari dokumen di dalam radius lingkaran), AroundU menggunakan algoritma **Geohash**:

1.  **Geohash Pembagi Wilayah:** Geohash membagi bumi menjadi grid-grid persegi panjang yang direpresentasikan sebagai string teks. Karakter string yang semakin panjang menunjukkan area yang semakin presisi.
2.  **Perhitungan Bounds (`getGeoQueryBounds`):** Fungsi ini menghitung batas minimum dan maksimum string geohash untuk area berbentuk kotak yang melingkupi radius pencarian (misal 5 km) dari koordinat pusat.
3.  **Query Firestore:**
    ```javascript
    query(collection(db, collectionName), orderBy('location.geohash'), startAt(start), endAt(end))
    ```
    Query string ini mencari seluruh dokumen yang memiliki geohash dalam rentang area tersebut.
4.  **Penyaringan Client-Side (`getNearbyDocuments`):** Hasil query Firestore berbentuk kotak (*bounding box*) sehingga masih mengandung titik di luar radius lingkaran (*false positives*). Kode di client kemudian menghitung jarak matematis menggunakan rumus Haversine (`getDistanceMeters`) untuk membuang titik yang melebihi radius dan mengurutkannya dari yang terdekat.

### B. Algoritma Marker Clustering
File Utama: [mapCluster.js](file:///c:/Latanza/UPNVJ/smt4/pemograman-mobile-lanjut/UAS/aroundu/src/utils/mapCluster.js)

Ketika banyak postingan atau user berada di lokasi yang sangat dekat, peta akan dipenuhi oleh marker yang menumpuk. Untuk mengatasinya, aplikasi menerapkan **Grid-Based Clustering**:

1.  **Pembagian Grid Layar:** Fungsi `clusterMapItems` membagi layar peta menjadi grid berukuran piksel tertentu (default $64\text{px}$) berdasarkan tingkat zoom saat ini (`latitudeDelta`/`longitudeDelta`).
2.  **Pengelompokan Koordinat:** Setiap item dipetakan ke dalam sel grid tempat koordinatnya berada.
3.  **Visualisasi Cluster:**
    *   Jika satu sel grid hanya berisi **1 item**, ia dirender sebagai marker biasa (misal icon tempat atau foto user).
    *   Jika sel grid berisi **lebih dari 1 item**, koordinat rata-rata dari seluruh item dihitung, dan dirender sebagai pin gelap dengan **Badge Angka** (badge count) yang menunjukkan jumlah item di dalamnya.
4.  **Tap Ekspansi:** Saat cluster di-tap di [MapScreen.native.js](file:///c:/Latanza/UPNVJ/smt4/pemograman-mobile-lanjut/UAS/aroundu/src/screens/map/MapScreen.native.js), peta akan memicu bottom sheet/panel detail untuk menampilkan daftar isi cluster tersebut.

### C. Sistem Venue Check-in & Leaderboard
File Utama: [VenueDetailScreen.js](file:///c:/Latanza/UPNVJ/smt4/pemograman-mobile-lanjut/UAS/aroundu/src/screens/venue/VenueDetailScreen.js) & [firestoreService.js](file:///c:/Latanza/UPNVJ/smt4/pemograman-mobile-lanjut/UAS/aroundu/src/services/firestoreService.js)

*   **Mekanisme Check-in:** Saat pengguna menekan "Check in" di detail tempat, fungsi `checkIn` menulis dokumen baru ke koleksi `checkins` berisi `userId`, `placeId`, koordinat, dan stempel waktu. Secara bersamaan, jumlah check-in tempat (`checkinsCount`) dinaikkan secara aman menggunakan transaksi database Firestore (`runTransaction`).
*   **Leaderboard Venue (`getPlaceLeaderboard`):**
    Mengambil 100 riwayat check-in terakhir di venue tersebut, lalu menggunakan `Map` di JavaScript untuk menghitung frekuensi check-in per user ID:
    ```javascript
    counts.set(checkin.userId, (counts.get(checkin.userId) || 0) + 1);
    ```
    Data diurutkan dari frekuensi tertinggi ke terendah dan memetakan profil username untuk menampilkan 5 peringkat teratas.
*   **Trending Places (`getTrendingPlacesToday`):**
    Mengambil semua dokumen check-in sejak tengah malam hari ini (`createdAt >= 00:00:00`), menghitung jumlah check-in terbanyak per tempat, lalu mengembalikan profil tempat yang paling populer di kota tersebut secara dinamis.

### D. RSVP Acara (Event RSVP) dengan Optimistic Update
File Utama: [EventDetailScreen.js](file:///c:/Latanza/UPNVJ/smt4/pemograman-mobile-lanjut/UAS/aroundu/src/screens/event/EventDetailScreen.js) & [firestoreService.js](file:///c:/Latanza/UPNVJ/smt4/pemograman-mobile-lanjut/UAS/aroundu/src/services/firestoreService.js)

Sistem RSVP mendukung status **Going**, **Interested**, dan **Not Going** dengan pembaruan instan:

1.  **Optimistic Updates di UI:** Ketika tombol RSVP ditekan, UI langsung mengubah status tombol dan menaikkan/menurunkan jumlah partisipan secara visual sebelum transaksi Firestore selesai. Ini memberikan pengalaman aplikasi yang terasa instan dan responsif.
2.  **Transaksi Firestore (`setEventRsvp`):** 
    Menjalankan `runTransaction` untuk membaca status RSVP lama pengguna di sub-koleksi `registrations`. Transaksi ini menghitung selisih partisipan (`participantDelta`) dan pendaftar (`registrationDelta`), lalu melakukan pembaruan ke dokumen utama acara. Jika jaringan terputus atau gagal, UI secara otomatis melakukan *rollback* ke angka dan status sebelumnya untuk mencegah ketidaksinkronan data.

---

## 3. Logika Privasi Lokasi (Location Privacy Controls)

Seluruh fitur lokasi menerapkan prinsip **Privacy by Design** (seluruh koordinat mati secara default dan memerlukan izin eksplisit pengguna).

### A. Pengaburan Koordinat (Blurred Coordinate)
File Utama: [geo.js](file:///c:/Latanza/UPNVJ/smt4/pemograman-mobile-lanjut/UAS/aroundu/src/utils/geo.js)

Untuk pilihan privasi tingkat kecamatan/lingkungan (**Neighborhood**), koordinat asli disamarkan sebelum dibagikan:

*   **Metode `blurCoordinate`:**
    Fungsi ini menggeser koordinat latitude dan longitude asli secara acak di dalam radius maksimum $\approx 500\text{m}$. Pergeseran dihitung menggunakan trigonometri bumi untuk menjamin koordinat baru berada dalam jarak acak aman tetapi tidak terlalu jauh dari lokasi asli:
    $$Latitude_{new} = Latitude_{old} + \frac{dy}{111111}$$
    $$Longitude_{new} = Longitude_{old} + \frac{dx}{111111 \times \cos(Latitude_{old})}$$
    Di mana $dx$ dan $dy$ adalah pergeseran acak dalam meter.

### B. Sinkronisasi Lokasi Publik (`syncSharedLocation`)
File Utama: [firestoreService.js](file:///c:/Latanza/UPNVJ/smt4/pemograman-mobile-lanjut/UAS/aroundu/src/services/firestoreService.js#L112)

Ketika perangkat memperbarui lokasi GPS pengguna di latar depan:
1.  Sistem membaca setelan pengguna. Jika pengguna mengaktifkan **Invisible Mode**, atau menyetel pembagian lokasi ke **Hidden**, dokumen lokasi mereka di koleksi publik `sharedLocations` akan **langsung dihapus**.
2.  Jika setelan adalah **Exact**, koordinat asli dikirim ke `sharedLocations`.
3.  Jika setelan adalah **Neighborhood**, fungsi `blurCoordinate` dipanggil terlebih dahulu untuk menghasilkan koordinat samar sebelum dikirim ke `sharedLocations`.

---

## 4. Manajemen State Aplikasi (Zustand Stores)

Aplikasi menggunakan **Zustand** karena lebih ringan dan memiliki kode boilerplate yang jauh lebih sedikit dibanding Redux:

### A. `authStore.js` (Autentikasi & Sesi)
Mengelola status login pengguna. Saat aplikasi pertama kali dibuka (`App.js`), store memanggil `initialize()` yang mendengarkan perubahan sesi Firebase Auth (`onAuthStateChanged`). Store ini juga menyimpan metadata profil pengguna lokal yang diambil dari dokumen Firestore `/users/{uid}`.

### B. `feedstore.js` (Optimasi Kinerja Feed)
Mengelola penayangan postingan sosial dengan FlatList teroptimasi:
*   **Pagination / Infinite Scroll:** Menyimpan pointer dokumen terakhir (`lastDoc`). Saat pengguna mendekati bagian bawah daftar (`onEndReached`), store memanggil `fetchMorePosts` untuk meminta 10 dokumen berikutnya dimulai dari posisi `lastDoc` (`startAfter(cursor)`).
*   **Offline Mode Integration:** Jika koneksi terputus, store menangkap error dan mengaktifkan flag `isOffline: true`, lalu menampilkan data cache lokal yang terakhir dimuat sehingga aplikasi tidak kosong.

### C. `eventStore.js` (Manajemen Event)
Mengelola daftar event yang dibuat oleh komunitas serta status pemuatan event terdekat pada tab pencarian atau daftar beranda.

---

## 5. Layanan Pendukung (Services & Utils)

*   **`cloudinaryService.js`:** Digunakan untuk mengompresi gambar dan mengirimkannya via multipart form-data ke API Cloudinary. Mengembalikan URL CDN Cloudinary untuk disimpan di dokumen Firestore (menghemat ruang penyimpanan Firebase).
*   **`notificationService.js`:** Bertanggung jawab mendapatkan izin push notification, mendaftarkan Firebase Cloud Messaging token perangkat ke dokumen user, dan menangani notifikasi lokal di latar depan (*foreground*).
*   **`locationService.js`:** Meminta izin akses lokasi ke sistem Android/iOS (`Location.requestForegroundPermissionsAsync()`) dan memantau koordinat latitude/longitude terkini perangkat secara real-time.
