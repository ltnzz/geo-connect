# Kebijakan Privasi dan Tata Kelola Data

Dokumen ini menguraikan kerangka kebijakan privasi dan tata kelola data untuk aplikasi AroundU. Sebagai platform penemuan sosial berbasis lokasi, perlindungan privasi pengguna dan transparansi pengumpulan data merupakan prioritas utama.

## 1. Tujuan Pengumpulan Data
Pengumpulan data dilakukan secara terbatas untuk mendukung fungsionalitas inti aplikasi, yang meliputi:
- **Autentikasi:** Memverifikasi identitas pengguna dan mengamankan akses akun.
- **Eksplorasi Geospasial:** Memungkinkan fitur penemuan lokasi untuk pengguna, tempat (venue), dan acara di sekitar.
- **Interaksi Sosial:** Memfasilitasi reservasi acara (RSVP), penandaan lokasi (check-in), dan berbagi konten media.

## 2. Jenis Data yang Dikumpulkan

### 2.1. Informasi Akun dan Profil
| Data | Sumber | Tujuan Penggunaan |
| --- | --- | --- |
| **Alamat Email** | Pendaftaran / Google OAuth | Diperlukan untuk pembuatan akun dan komunikasi. |
| **Google UID** | Google Sign-In | Diperlukan untuk pemetaan autentikasi pengguna secara aman. |
| **Nama Tampilan** | Input Pengguna | Diperlukan sebagai identitas publik di dalam aplikasi. |
| **Foto Profil** | Akun Google | Digunakan sebagai identifikasi visual. |

### 2.2. Informasi Lokasi
| Data | Sumber | Tujuan Penggunaan |
| --- | --- | --- |
| **Koordinat GPS** | Sensor Perangkat | Menentukan jarak dan menempatkan titik pada Peta Eksplorasi. |
| **Geohash** | Dihitung oleh Sistem | Mempercepat proses pencarian geospasial pada basis data. |
| **Data Tempat (Venue)** | Foursquare API | Mengaitkan koordinat pengguna dengan lokasi di dunia nyata saat melakukan check-in. |

### 2.3. Konten Pengguna
- **Media dan Teks:** Kapsion dan foto yang diunggah pengguna disimpan di layanan Cloudinary dan direferensikan dalam bentuk URL.
- **Status RSVP:** Aktivitas partisipasi acara disimpan untuk mengelola daftar kehadiran.

## 3. Penyimpanan dan Retensi Data
AroundU menggunakan arsitektur tanpa server (serverless):
- **Firebase Authentication & Cloud Firestore:** Menyimpan kredensial sesi, profil teks, koordinat, dan metadata acara.
- **Cloudinary:** Secara khusus menyimpan seluruh berkas media gambar untuk mengoptimalkan kinerja basis data utama.

**Kebijakan Retensi:** Data pengguna hanya disimpan selama akun berstatus aktif. Pembaruan lokasi secara sementara akan selalu menimpa koordinat sebelumnya untuk mencegah terbentuknya jejak riwayat perjalanan.

## 4. Hak dan Kendali Pengguna
Sistem kami dirancang agar pengguna memiliki kendali penuh atas data mereka:
1. **Mode Tak Terlihat (Invisible Mode):** Pengguna dapat menyembunyikan lokasi presisi mereka dari pengguna lain kapan saja melalui pengaturan aplikasi.
2. **Pengelolaan Konten:** Pengguna memiliki akses untuk melihat, mengubah, dan menghapus postingan atau acara yang mereka buat.
3. **Penghapusan Akun:** Pengguna dapat mengajukan penghapusan akun permanen, yang akan memicu proses penghapusan seluruh data terkait dari server.

## 5. Keamanan
Semua lalu lintas data antara perangkat pengguna dan server dilindungi menggunakan enkripsi standar industri (TLS/HTTPS). Basis data Firestore dilengkapi dengan Aturan Keamanan (Security Rules) yang ketat, memastikan bahwa data profil hanya dapat dimodifikasi oleh pemilik akun yang bersangkutan.
