# D5-2: Dokumen Privasi (Privacy Document)
**Proyek:** AroundU - Aplikasi Penemuan Sosial Berbasis Lokasi (Location-Based Social Discovery)
**Tipe Dokumen:** Hasil Serahan Akademis (Privasi & Tata Kelola Data)

---

## 1. Pendahuluan
Dokumen ini menguraikan kerangka privasi dan kebijakan tata kelola data untuk "AroundU", sebuah aplikasi seluler penemuan sosial berbasis lokasi yang dibangun dengan React Native, Firebase, dan React Native Maps. Sebagai aplikasi yang sangat bergantung pada data geospasial, melindungi privasi pengguna dan menetapkan praktik pengumpulan data yang transparan adalah prioritas utama.

## 2. Tujuan Pengumpulan Data
Data dikumpulkan secara ketat untuk memfasilitasi fungsionalitas inti dari aplikasi. Tujuan utamanya meliputi:
*   Membuktikan keaslian (autentikasi) pengguna dan mengamankan akun.
*   Memungkinkan penemuan geospasial untuk pos, tempat (venue), dan acara terdekat.
*   Memungkinkan pengguna membagikan pengalaman mereka (media, teks) yang terikat pada lokasi tertentu.
*   Memfasilitasi interaksi sosial (RSVP untuk acara, *check-in*).

## 3. Jenis Data yang Dikumpulkan

### 3.1. Informasi Akun
| Titik Data | Sumber | Penyimpanan | Kebutuhan |
| :--- | :--- | :--- | :--- |
| Alamat Email | Formulir Pendaftaran / Google OAuth | Firebase Auth & Firestore | Diperlukan untuk pembuatan akun, masuk (login), dan komunikasi. |
| Hash Kata Sandi | Formulir Pendaftaran | Firebase Auth | Diperlukan untuk autentikasi yang aman (Pengguna Email/Kata Sandi). |
| Google UID | Google Sign-In | Firebase Auth & Firestore | Diperlukan untuk pemetaan autentikasi OAuth. |

### 3.2. Informasi Profil
| Titik Data | Sumber | Penyimpanan | Kebutuhan |
| :--- | :--- | :--- | :--- |
| Nama Tampilan | Input Pengguna | Firestore `users` | Diperlukan untuk mengidentifikasi pengguna di dalam aplikasi. |
| Biografi/Bio | Input Pengguna | Firestore `users` | Personalisasi opsional. |
| Avatar/Foto Profil | Akun Google Saat Mendaftar | Firestore | Identifikasi visual (Saat ini foto profil tidak dapat diganti secara manual melalui aplikasi). |

### 3.3. Informasi Lokasi
| Titik Data | Sumber | Penyimpanan | Kebutuhan |
| :--- | :--- | :--- | :--- |
| Koordinat GPS (Lat/Long) | API Sensor Perangkat | Firestore `posts`, `users`, `events` | Fitur inti: menentukan jarak dan menampilkan peta. |
| String Geohash | Dihitung di Sisi Klien | Firestore | Diperlukan untuk pencarian geospasial yang dioptimalkan. |
| Konteks Tempat (Venue) | Foursquare API | Firestore | Diperlukan untuk mengaitkan koordinat dengan tempat di dunia nyata. |

### 3.4. Informasi Acara & Pos
| Titik Data | Sumber | Penyimpanan | Kebutuhan |
| :--- | :--- | :--- | :--- |
| Kapsion & Media Pos | Input Pengguna | Firestore `posts`, Storage | Konten yang dibuat oleh pengguna. |
| Detail Acara (Waktu, Nama) | Input Pengguna | Firestore `events` | Fungsionalitas inti pembuatan acara. |
| Status RSVP | Tindakan Pengguna | Firestore `attendees` | Mengelola partisipasi acara. |

## 4. Bagaimana Data Digunakan
*   **Data Lokasi:** Digunakan secara dinamis untuk menyaring "Umpan Terdekat" (menghitung jarak Haversine di sisi klien) dan menempatkan penanda khusus di Peta Eksplorasi. Data lokasi latar belakang (*background location*) digunakan *hanya* untuk terus memperbarui kehadiran pengguna guna penemuan acara terdekat.
*   **Data Media:** Gambar diunggah dan disimpan secara khusus menggunakan layanan **Cloudinary** untuk menghasilkan tautan URL gambar yang dioptimalkan kepada pengguna lain.

## 5. Arsitektur Penyimpanan Data
Aplikasi ini menggunakan arsitektur data tanpa server (*serverless*):
*   **Firebase Authentication:** Mengelola kredensial, sesi, dan token OAuth secara aman.
*   **Cloud Firestore:** Bertindak sebagai basis data NoSQL utama, menyimpan dokumen serupa JSON yang tidak terstruktur (Pengguna, Pos, Acara) beserta nilai `geohash` yang dihitung.
*   **Cloudinary:** Menyimpan seluruh file media gambar (*image hosting*), menghasilkan tautan CDN publik yang kemudian direferensikan dalam bentuk URL teks di dalam Cloud Firestore. Aplikasi ini sama sekali tidak menggunakan Firebase Storage untuk penyimpanan media.

## 6. Kebijakan Retensi Data
Data hanya disimpan selama akun pengguna tetap aktif.
*   **Akun Aktif:** Semua konten yang dibuat pengguna (pos, acara, *check-in*) tetap dapat diakses kecuali dihapus secara manual oleh pembuatnya.
*   **Jejak Lokasi:** Pembaruan koordinat sementara (misal, sinkronisasi lokasi latar belakang) akan menimpa data koordinat sebelumnya, meminimalkan pelacakan riwayat lokasi masa lalu.

## 7. Hak Pengguna
Pengguna memegang kendali mutlak atas data mereka:
*   **Hak untuk Mengakses:** Pengguna dapat melihat semua konten yang mereka buat melalui Layar Profil.
*   **Hak untuk Memperbaiki:** Pengguna dapat memperbarui bio dan nama tampilan mereka kapan saja melalui panel Pengaturan. Namun, foto profil (*avatar*) tidak dapat diubah secara manual di dalam aplikasi karena langsung disinkronkan dari akun Google pengguna.
*   **Hak atas Anonimitas ("Mode Tak Terlihat"):** Pengguna dapat mengubah visibilitas *default* mereka, mencegah koordinat mereka disiarkan ke pengguna terdekat.

## 8. Prosedur Penghapusan Akun
Saat ini, aplikasi belum menyediakan tombol otomatis untuk menghapus akun di dalam menu Pengaturan. 
Untuk menghapus akun beserta seluruh data yang terkait:
1.  Pengguna harus mengajukan permintaan penghapusan akun langsung ke tim administrator (misalnya melalui email dukungan pelanggan).
2.  Administrator akan secara manual mengeksekusi penghapusan berantai (*cascade delete*): menghapus dokumen pengguna dari koleksi `users`, menghapus `posts` dan `events` yang mereka buat, dan membersihkan media mereka dari penyimpanan Cloudinary.
3.  Catatan Firebase Auth kemudian akan dihancurkan secara permanen oleh sistem.

## 9. Langkah-langkah Keamanan
*   **Transport Layer:** Semua data yang dikirimkan antara klien Expo dan Firebase/API Pihak Ketiga dienkripsi melalui TLS/HTTPS.
*   **Aturan Keamanan Basis Data:** Firestore dilindungi oleh Aturan Keamanan yang ketat (`firestore.rules`). Pengguna hanya dapat menulis ke dokumen profil mereka sendiri. Pos dan Acara dapat dibaca secara publik tetapi hanya dapat dimodifikasi/dihapus oleh penulis asli (`request.auth.uid == resource.data.creatorId`).

## 10. Layanan Pihak Ketiga
| Layanan | Tujuan | Data yang Dibagikan |
| :--- | :--- | :--- |
| **Foursquare API** | Penemuan Tempat & Check-In | Koordinat *bounding box* (untuk mengambil tempat lokal). Tidak ada PII pengguna yang dikirim. |
| **Cloudinary** | Optimasi Gambar | File gambar biner. |
| **Google Cloud** | Hosting Firebase & Database | Penyimpanan *state* aplikasi terenkripsi. |

## 11. Risiko Privasi dan Mitigasinya
| Risiko | Strategi Mitigasi |
| :--- | :--- |
| **Penguntitan / Eksposur Lokasi Tepat** | Menerapkan "Pemilih Privasi Lokasi" yang memungkinkan pengguna untuk memburamkan (*blur*) lokasi mereka (mis., "Hanya Tingkat Kota") daripada membagikan koordinat jalan yang tepat. |
| **Penyalahgunaan Lokasi Latar Belakang** | Menambahkan "Privasi by Design" - akun diatur secara *default* ke `invisibleMode: true` saat pendaftaran. Pembaruan latar belakang bergantung pada izin OS yang ketat (Indikator Layanan Latar Depan terlihat oleh pengguna). |

## 12. Kesimpulan
AroundU menyeimbangkan utilitas penemuan sosial berbasis lokasi dengan kontrol privasi yang ketat. Dengan mengandalkan Aturan Keamanan Firebase yang kuat, menawarkan alternatif lokasi yang diburamkan, dan menghindari penyimpanan jejak riwayat lokasi, platform ini menghormati otonomi pengguna dan mematuhi standar perlindungan data modern.
