# 🛡️ Kebijakan Privasi Data (Privacy Policy)

Selamat datang di **AroundU**! Karena aplikasi ini sangat bergantung pada fitur lokasi (untuk mencari teman, tempat, atau acara di sekitarmu), kami sangat peduli dengan privasi datamu. 

Dokumen ini menjelaskan secara transparan data apa saja yang kami ambil, untuk apa, dan bagaimana kami melindunginya.

---

## 🎯 Mengapa Kami Mengumpulkan Data?
Singkatnya, kami hanya mengambil data yang **benar-benar dibutuhkan** agar fitur aplikasi bisa berjalan:
- 🔐 **Autentikasi:** Supaya kamu bisa login dan akunmu aman.
- 📍 **Eksplorasi Geospasial:** Supaya kamu bisa melihat post, event, atau tempat nongkrong terdekat dari lokasimu.
- 💬 **Interaksi Sosial:** Supaya kamu bisa RSVP event, *check-in* tempat, dan membagikan momenmu.

---

## 🗂️ Data Apa Saja yang Kami Ambil?

### 1. 👤 Informasi Akun & Profil
- **Email & Google UID:** Digunakan untuk *login* dan mengamankan akunmu. Disimpan aman di Firebase Authentication.
- **Nama & Bio:** Identitasmu di dalam aplikasi yang bisa dilihat pengguna lain.
- **Foto Profil (Avatar):** Diambil otomatis dari Google saat kamu mendaftar. (Saat ini foto profil belum bisa diganti manual ya!).

### 2. 🗺️ Informasi Lokasi
- **Koordinat GPS:** Hanya digunakan untuk menghitung jarak dan menampilkan *marker* di peta.
- **Geohash:** Versi "teks" dari lokasimu yang membantu *database* mencari hal-hal di sekitarmu dengan super cepat.
- **Data Tempat (Foursquare):** Kalau kamu *check-in*, kami menyambungkan koordinatmu dengan nama tempat asli di dunia nyata.

### 3. 📸 Postingan & Acara (Event)
- **Foto & Teks:** Media yang kamu bagikan di aplikasi akan diunggah ke layanan *cloud* kami (Cloudinary).
- **Status RSVP:** Data yang mencatat event mana saja yang akan kamu datangi.

---

## 🏗️ Di Mana Kami Menyimpan Datamu?
Kami menggunakan arsitektur modern tanpa server (*serverless*), yang artinya:
- ☁️ **Cloud Firestore (Firebase):** Tempat kami menaruh semua data teks seperti Profil, Kapsion Postingan, dan Koordinat Lokasi.
- 🖼️ **Cloudinary:** Tempat khusus untuk menyimpan file gambarmu agar bisa dimuat dengan cepat di aplikasi tanpa membebani *database* utama.

---

## 🕹️ Hak & Kendali Penuh di Tanganmu
Kamu adalah bos dari datamu sendiri:
1. **Atur Visibilitas:** Merasa privasimu terganggu? Kamu bisa mengaktifkan **Mode Tak Terlihat (Invisible Mode)** di pengaturan supaya lokasimu tidak muncul di radar pengguna lain.
2. **Hapus Kapan Saja:** Kamu bisa menghapus postingan atau event yang sudah kamu buat, dan datanya akan lenyap.
3. **Hapus Akun:** Jika kamu ingin berhenti menggunakan AroundU dan menghapus *semua* datamu (akun, foto, postingan), kamu bisa menghubungi tim *support* kami untuk dilakukan penghapusan permanen dari server.

---

## 🔒 Sistem Keamanan Kami
- **Koneksi Terenkripsi:** Semua lalu lintas data dari HP-mu ke server dilindungi dengan enkripsi standar industri (HTTPS/TLS).
- **Aturan Database Ketat:** Orang lain hanya bisa membaca profil publikmu, tapi **tidak ada yang bisa mengubah atau menghapus** postinganmu selain kamu sendiri.

💡 *Intinya: Kami merancang AroundU agar kamu bisa bebas berekspresi dan menjelajah dunia sekitarmu dengan rasa aman!*
