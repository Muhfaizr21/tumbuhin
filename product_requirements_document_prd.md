# Product Requirements Document (PRD)
**Nama Produk:** SigapGizi (Smart Posyandu & Stunting Early-Warning System)  
**Kompetisi:** SEVENT X – Software Development (Kategori Website)  
**Tema SDGs:** SDG 3 – *Good Health and Well-Being*  
**Target Rilis MVP:** 28 November 2026 (Batas Submission: 30 November 2026)  

---

## 1. Latar Belakang & Urgensi Masalah
Penanganan *stunting* dan malnutrisi balita di tingkat desa masih menghadapi tiga hambatan operasional utama:
1. **Keterlambatan Deteksi Dini (*Growth Faltering*):** Pencatatan manual di Kartu Menuju Sehat (KMS) membuat tren pelambatan pertumbuhan anak sering terlambat disadari sebelum anak benar-benar jatuh ke status *stunted* atau *wasted*.
2. **Kesenjangan Edukasi Gizi Kontekstual:** Orang tua di desa kerap kesulitan menerjemahkan status gizi anak menjadi menu Makanan Pendamping ASI (MPASI) yang sesuai standar gizi, berbahan pangan lokal, dan sesuai kemampuan ekonomi harian.
3. **Keterbatasan Pemetaan Spasial & Konektivitas:** Bidan desa kesulitan memetakan klaster RT/RW rawan gizi secara *real-time*, sementara kader Posyandu sering bertugas di wilayah dengan sinyal internet tidak stabil.

## 2. Tujuan & Metrik Keberhasilan MVP
* **Akurasi Klinis:** Perhitungan Z-Score WHO ($BB/U$, $TB/U$, $BB/TB$) 100% sesuai standar Permenkes No. 2 Tahun 2020.
* **Deteksi Dini Berbasis AI:** Sistem mampu memprediksi tren *growth faltering* berdasarkan riwayat minimal 3 bulan penimbangan.
* **Rekomendasi Tervalidasi (RAG):** Rekomendasi menu MPASI merujuk langsung pada pedoman Kemenkes RI dengan estimasi biaya sesuai anggaran keluarga.
* **Aksesibilitas & Offline-First:** Web App progresif (PWA) tetap dapat digunakan mencatat timbangan saat *offline* dan menyediakan fitur aksesibilitas (*Text-to-Speech* & kontras tinggi).

---

## 3. Persona & Role Pengguna (RBAC)
1. **Kader Posyandu (`kader`):** Kader kesehatan tingkat RW/Dusun yang melakukan penimbangan bulanan, pemindaian KMS lama, serta memberikan edukasi resep MPASI ke orang tua.
2. **Bidan Desa / Tenaga Gizi Puskesmas (`bidan`):** Tenaga medis yang memantau epidemiologi desa, menganalisis peta klaster risiko *stunting*, dan melakukan kunjungan rumah (*home visit*) pada kasus prioritas.
3. **Super Admin Desa (`admin`):** Pengelola master data wilayah, akun kader/bidan, harga pangan lokal desa, dan dokumen pedoman gizi pada *knowledge base* AI.
4. **Orang Tua Balita (Public Magic Link — Tanpa Login):** Ibu/ayah balita yang menerima tautan khusus via WhatsApp untuk melihat kurva pertumbuhan anak dan panduan resep MPASI harian beserta fitur pembaca suara (*Text-to-Speech*).

---

## 4. Spesifikasi Fitur Fungsional (MVP Scope)

### Modul A: Autentikasi & Manajemen Akses (RBAC)
* **FR-01:** Login berbasis email/username dan kata sandi dengan JWT (*JSON Web Token*) dan pembatasan cakupan data (*row-level scoping* per Posyandu untuk Kader, per Desa untuk Bidan).
* **FR-02:** Generator *Magic Link* unik terenkripsi (token read-only) agar orang tua dapat membuka kartu gizi anak tanpa perlu registrasi akun.

### Modul B: Manajemen Data Balita & Smart KMS OCR (Vision AI)
* **FR-03:** CRUD data profil balita (NIK ter-hash demi privasi, nama, tanggal lahir, jenis kelamin, RT/RW, koordinat rumah, alergi, nomor WhatsApp orang tua).
* **FR-04:** **Smart KMS OCR:** Kader dapat mengunggah foto halaman tabel/grafik buku KIA fisik; Multimodal Vision AI mengekstrak riwayat berat dan tinggi badan bulan-bulan sebelumnya menjadi data terstruktur siap simpan.

### Modul C: Kalkulator Antropometri WHO & Predictive Early Warning
* **FR-05:** Input pengukuran bulanan (Berat Badan dalam kg, Tinggi/Panjang Badan dalam cm, Lingkar Kepala dalam cm, posisi ukur terlentang/berdiri).
* **FR-06:** Kalkulasi deterministik Z-Score WHO menggunakan metode LMS ($L, M, S$) untuk menghasilkan klasifikasi status:
  * $BB/U$ (*Weight-for-Age*): Berat Badan Sangat Kurang, Kurang, Normal, Risiko Lebih.
  * $TB/U$ (*Height-for-Age*): Sangat Pendek (*Severely Stunted*), Pendek (*Stunted*), Normal, Tinggi.
  * $BB/TB$ (*Weight-for-Height*): Gizi Buruk (*Severely Wasted*), Gizi Kurang (*Wasted*), Gizi Baik, Berisiko Gizi Lebih.
* **FR-07:** **Predictive Growth Trajectory (ML):** Analisis regresi pada riwayat 3–6 pengukuran terakhir untuk menghitung kemiringan (*slope*) pertumbuhan dan mengeluarkan skor risiko *growth faltering* (Rendah, Sedang, Tinggi) beserta peringatan dini.

### Modul D: AI Nutri-Chef (RAG Kemenkes & Integrasi WhatsApp)
* **FR-08:** Form generator resep MPASI dengan parameter otomatis (usia anak dalam bulan, status gizi, alergi) dan parameter input kader (bahan lokal tersedia di rumah/desa, batas anggaran harian dalam Rupiah).
* **FR-09:** *Retrieval-Augmented Generation* (RAG) mengambil potongan aturan gizi dari dokumen resmi Kemenkes di `pgvector` sebelum LLM menyusun output JSON terstruktur (nama menu, rincian bahan & harga, langkah masak sesuai tekstur usia, kandungan kalori & protein hewani, serta sitasi aturan Kemenkes).
* **FR-10:** Tombol *One-Click Share to WhatsApp* untuk mengirim ringkasan hasil timbang dan *Magic Link* resep MPASI ke nomor WhatsApp orang tua.

### Modul E: Dashboard Epidemiologi, GIS Heatmap & Intervensi (Bidan)
* **FR-11:** Dashboard agregasi status gizi desa, grafik tren bulanan, dan tingkat partisipasi penimbangan antar-Posyandu.
* **FR-12:** Peta interaktif (Leaflet/OpenStreetMap) yang menampilkan titik/klaster RT/RW dengan indikator warna tingkat risiko *stunting*.
* **FR-13:** Tabel **Daftar Prioritas Intervensi** yang menampilkan balita berstatus *Stunted/Wasted* maupun balita *Normal* dengan skor prediksi *growth faltering* tinggi, dilengkapi fitur pencatatan jadwal & hasil *home visit*.
* **FR-14:** Ekspor laporan bulanan gizi desa ke format PDF dan Excel (`.xlsx`).

### Modul F: Offline-First PWA & Aksesibilitas (Kriteria UI/UX 10%)
* **FR-15:** Dukungan *Service Worker* & `IndexedDB` untuk menyimpan antrean input timbang saat perangkat *offline* dan melakukan sinkronisasi otomatis saat kembali *online*.
* **FR-16:** Fitur aksesibilitas bawaan: tombol *Text-to-Speech* (Web Speech API Bahasa Indonesia) untuk membacakan hasil ukur dan langkah resep MPASI, serta *toggle* Mode Kontras Tinggi & ukuran font besar.

---

## 5. Kebutuhan Non-Fungsional
* **Keamanan & Privasi Data:** Data NIK balita disimpan menggunakan *one-way cryptographic hash* (SHA-256 + salt) agar tidak mengekspos identitas kependudukan secara mentah.
* **Performa:** Waktu respons kalkulasi Z-Score < 200ms; waktu generasi resep RAG AI < 5 detik dengan indikator *loading skeleton*.
* **Responsivitas:** Antarmuka *mobile-first* yang optimal di layar smartphone Android kader (lebar 360px–412px) maupun layar laptop/desktop bidan.