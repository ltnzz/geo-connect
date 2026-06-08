# AroundU - Product Requirements Document (PRD)

## 1. Product Overview

### Product Name

AroundU

### Tagline

Discover What's Happening Around You

### Description

AroundU adalah aplikasi social media berbasis lokasi yang memungkinkan pengguna menemukan aktivitas, event, venue, dan konten di sekitar mereka.

Berbeda dengan media sosial tradisional yang berfokus pada hubungan antar pengguna, AroundU memanfaatkan geolokasi sebagai fitur utama untuk membantu pengguna mengeksplorasi aktivitas berdasarkan lokasi dan radius tertentu.

Aplikasi ini dikembangkan sebagai implementasi konsep GeoConnect dengan fokus pada Location-Based Discovery dan Geosocial Features.

---

## 2. Problem Statement

Informasi mengenai aktivitas, event, komunitas, dan tempat menarik sering tersebar di berbagai platform sehingga sulit ditemukan oleh pengguna yang berada di lokasi yang relevan.

Selain itu, media sosial umumnya tidak memberikan pengalaman eksplorasi berbasis lokasi secara langsung sehingga pengguna kesulitan mengetahui apa yang sedang terjadi di sekitar mereka.

AroundU hadir untuk membantu pengguna menemukan aktivitas dan informasi berdasarkan lokasi secara lebih terpusat dan mudah diakses.

---

## 3. Product Goals

### Business Goals

* Membangun platform social discovery berbasis lokasi.
* Meningkatkan interaksi pengguna terhadap aktivitas lokal.
* Mempermudah penyebaran informasi event dan aktivitas berbasis lokasi.

### User Goals

* Menemukan aktivitas yang terjadi di sekitar lokasi pengguna.
* Menemukan venue populer berdasarkan lokasi.
* Menemukan event dalam radius tertentu.
* Membagikan aktivitas dengan lokasi.
* Mengontrol privasi lokasi sesuai kebutuhan.

---

## 4. Target Users

### Primary Users

* Mahasiswa
* Komunitas kampus
* Pengguna yang aktif mengikuti event
* Pengguna yang suka mengeksplorasi lokasi baru

### Secondary Users

* Penyelenggara event
* Komunitas lokal
* Pemilik venue
* Pengunjung tempat umum

---

## 5. Technical Stack

### Framework

* React Native
* Expo
* React Navigation

### State Management

* Zustand

### Backend

* Firebase Authentication
* Firebase Firestore
* Firebase Storage

### Geolocation

* expo-location
* react-native-maps
* GeoHash / GeoFirestore

### UI

* React Native Reanimated 2
* React Native Gesture Handler
* expo-image

---

## 6. Functional Requirements

### Authentication

* Sistem harus menyediakan fitur registrasi pengguna.
* Sistem harus menyediakan fitur login menggunakan email dan password.
* Sistem harus menyediakan Google Sign-In.
* Sistem harus menyediakan fitur logout.
* Sistem harus menyediakan pengelolaan profil pengguna.

### Feed

* Sistem harus menampilkan feed postingan menggunakan infinite scroll.
* Sistem harus memungkinkan pengguna membuat postingan.
* Sistem harus mendukung upload gambar.
* Sistem harus mendukung caption postingan.
* Sistem harus mendukung fitur like.
* Sistem harus mendukung fitur comment.
* Sistem harus mendukung follow dan unfollow pengguna.

### Location-Based Discovery

* Sistem harus menampilkan peta interaktif.
* Sistem harus memungkinkan pengguna menambahkan lokasi pada postingan.
* Sistem harus menampilkan postingan berdasarkan lokasi.
* Sistem harus menyediakan filter radius 1 km, 5 km, 10 km, dan seluruh kota.
* Sistem harus mendukung marker clustering pada peta.

### Venue Check-in & Place Discovery

* Sistem harus memungkinkan pengguna melakukan check-in pada venue.
* Sistem harus menampilkan profil venue.
* Sistem harus menampilkan daftar venue populer berdasarkan jumlah check-in.

### Event System

* Sistem harus memungkinkan pengguna membuat event.
* Sistem harus menampilkan event berdasarkan lokasi.
* Sistem harus menyediakan fitur RSVP event.
* Sistem harus menampilkan daftar event dalam radius tertentu.

### Search & Discovery

* Sistem harus menyediakan pencarian pengguna.
* Sistem harus menyediakan pencarian konten.

### Notifications

* Sistem harus menyediakan local notification.
* Sistem harus menyediakan push notification menggunakan Firebase Cloud Messaging.

### Offline Mode

* Sistem harus menampilkan data cache ketika perangkat tidak memiliki koneksi internet.
* Sistem harus menampilkan indikator offline.

### Privacy & Location Controls

* Exact Location: lokasi ditampilkan secara akurat sesuai posisi pengguna.
* Approximate Location: lokasi hanya ditampilkan secara umum (misalnya area atau kecamatan), bukan titik koordinat yang tepat.
* Hidden Location: lokasi tidak ditampilkan kepada pengguna lain.
* Invisible Mode: pengguna dapat menggunakan aplikasi tanpa membagikan lokasi mereka kepada pengguna lain.
* Secara default, fitur berbagi lokasi berada dalam keadaan OFF dan hanya aktif setelah pengguna memberikan izin.

### Theme

* Sistem harus mendukung Dark Mode.
* Sistem harus mendukung Light Mode.

---

## 7. MVP Scope (Version 1)

### Must Have

#### Core Social Features

* Register
* Login
* Google Sign-In
* Logout
* Profile Management
* Feed
* Create Post
* Upload Image
* Like
* Comment
* Follow / Unfollow
* Search
* Notification
* Offline Mode
* Dark / Light Mode

#### GeoConnect Features

* Explore Map
* Post Tag Location
* Nearby Posts
* Radius Filter
* Marker Clustering
* Venue Check-in
* Venue Profile
* Trending Places
* Create Event
* Event Discovery
* RSVP Event
* Location Privacy Controls

### Nice To Have

* Nearby People
* Venue Leaderboard
* Event Story
* Location History
* Blurred Location

---

## 8. Privacy Requirements

* Lokasi pengguna tidak dibagikan secara otomatis.
* Lokasi hanya digunakan setelah pengguna memberikan izin.
* Pengguna dapat memilih tingkat presisi lokasi yang dibagikan.
* Pengguna dapat menyembunyikan lokasi dari pengguna lain.
* Pengguna dapat mengaktifkan Invisible Mode.
* Seluruh fitur lokasi menerapkan prinsip Privacy by Design.

---

## 9. Technical Constraints

* Wajib menggunakan react-native-maps untuk fitur peta.
* Wajib menggunakan expo-location untuk layanan lokasi.
* Query lokasi harus menggunakan GeoHash atau GeoFirestore.
* Permission flow lokasi harus dijelaskan kepada pengguna.
* Fitur lokasi harus mempertimbangkan efisiensi penggunaan baterai.
* Semua fitur lokasi harus OFF secara default.

---

## 10. Success Criteria

### Functional Success

* Pengguna dapat membuat akun dan login.
* Pengguna dapat membuat postingan dengan lokasi.
* Pengguna dapat melihat postingan di sekitar mereka.
* Pengguna dapat memfilter postingan berdasarkan radius.
* Pengguna dapat melakukan check-in venue.
* Pengguna dapat membuat dan menemukan event.
* Pengguna dapat mengatur privasi lokasi.

### Technical Success

* Aplikasi berjalan pada Android menggunakan Expo.
* Peta menampilkan marker lokasi dengan benar.
* Query radius berjalan dengan baik menggunakan GeoHash atau GeoFirestore.
* Data cache tetap dapat ditampilkan saat offline.
* Dark Mode dan Light Mode berjalan dengan baik.
