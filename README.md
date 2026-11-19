<div align="center">

# 🌱 Tumbuhin (SigapGizi)
### Smart Posyandu & AI-Powered Stunting Early-Warning Platform

[![SEVENT X Competition](https://img.shields.io/badge/Competition-SEVENT%20X%20Web%20Dev-blue?style=for-the-badge&logo=codeforces)](https://github.com/Muhfaizr21/tumbuhin)
[![SDG 3](https://img.shields.io/badge/SDG%203-Good%20Health%20%26%20Well--Being-00a35c?style=for-the-badge&logo=unitednations)](https://sdgs.un.org/goals/goal3)
[![React](https://img.shields.io/badge/React%2019-Vite%20PWA-61dafb?style=for-the-badge&logo=react)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com)
[![Golang](https://img.shields.io/badge/Golang-Clean%20Code%20MVC-00ADD8?style=for-the-badge&logo=go)](https://go.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-4169E1?style=for-the-badge&logo=postgresql)](https://github.com/pgvector/pgvector)
[![Gemini AI](https://img.shields.io/badge/Google%20GenAI-Gemini%202.5%20Flash-orange?style=for-the-badge&logo=google)](https://ai.google.dev)

<p align="center">
  <b>Solusi Digital Terpadu Pencegahan Stunting Dini Tingkat Desa: Integrasi Anthropometri WHO, Predictive ML, Knowledge-Grounded RAG, dan Multimodal Vision AI dalam Arsitektur Offline-First PWA.</b>
</p>

[Fitur Utama](#-fitur-utama--4-lapisan-kecerdasan) •
[Arsitektur Sistem](#-arsitektur-sistem) •
[Struktur Proyek](#-struktur-monorepo) •
[Spesifikasi API](#-spesifikasi-endpoint-api-utama) •
[Panduan Instalasi](#-panduan-instalasi--menjalankan-aplikasi)

---

</div>

## 📌 Latar Belakang & Urgensi

Penanganan *stunting* dan malnutrisi balita di tingkat akar rumput (Posyandu & Desa) kerap terhambat oleh 3 masalah fundamental:
1. **Keterlambatan Deteksi Dini (*Growth Faltering*):** Catatan manual fisik pada KMS (Kartu Menuju Sehat) sering membuat perlambatan pertumbuhan terlewat hingga balita terlanjur mengalami *stunted* atau *wasted*.
2. **Kesenjangan Edukasi Gizi Kontekstual:** Orang tua kesulitan menerjemahkan status antropometri menjadi menu Makanan Pendamping ASI (MPASI) yang seimbang, higienis, berbahan pangan lokal terjangkau, dan sesuai dengan daya beli harian keluarga.
3. **Keterbatasan Pemetaan Spasial & Konektivitas Lapangan:** Bidan desa kesulitan memetakan klaster RT/RW berisiko tinggi secara *real-time*, sementara kader posyandu kerap menghadapi kendala sinyal internet di pelosok desa.

**Tumbuhin (SigapGizi)** hadir sebagai platform web berbasis **SDG 3 (*Good Health and Well-Being*)** yang menjembatani kader posyandu, bidan desa, dan orang tua melalui kecerdasan buatan (*Hybrid AI*) yang valid secara medis, berkecepatan tinggi, dan dapat beroperasi dalam kondisi internet terbatas (*Offline-First*).

---

## 🧠 Fitur Utama & 4 Lapisan Kecerdasan (Hybrid AI)

Sistem mengadopsi pendekatan **Hybrid AI** berlapis yang memisahkan komputasi matematis medis deterministik dari model generatif:

```
+--------------------------------------------------------------------------+
|                  4 LAPISAN KECERDASAN HYBRID AI GOLANG                   |
+--------------------------------------------------------------------------+
|  Layer 1: Deterministic WHO LMS Anthropometry Engine (Permenkes 2/2020)  |
|  Layer 2: Predictive Growth Faltering Trajectory (gonum Weighted ML)     |
|  Layer 3: Knowledge-Grounded RAG AI Nutri-Chef (pgvector + Kemenkes)     |
|  Layer 4: Multimodal Vision AI OCR Buku KIA (Gemini Vision Extraction)   |
+--------------------------------------------------------------------------+
```

### 1. 📐 Lapisan 1: Deterministic Clinical Math (WHO Z-Score Engine)
* Menghitung nilai Z-Score ($BB/U$, $TB/U$, $BB/TB$) secara deterministik tanpa risiko halusinasi menggunakan standar **WHO Multicentre Growth Reference Study (MGRS)** dan **Permenkes No. 2 Tahun 2020**:
  
  $$\text{Z-Score} = \frac{\left(\frac{y}{M}\right)^L - 1}{L \times S}$$

  *Dimana $y$ adalah nilai aktual pengukuran anak, $M$ adalah median referensi, $L$ adalah koefisien Box-Cox power, dan $S$ adalah koefisien variasi.*

### 2. 📈 Lapisan 2: Predictive Growth Trajectory (Early-Warning ML)
* Menganalisis kurva riwayat timbang minimal 3–6 bulan terakhir menggunakan regresi linier terbobot (*Weighted Linear Regression* via `gonum.org/v1/gonum/stat`).
* Menghitung *weight velocity* (laju kenaikan berat bulanan) dan membandingkannya terhadap standar kenaikan berat minimal (*Minimum Weight Gain*).
* Menghasilkan **Skor Risiko Growth Faltering (0–100%)** serta rekomendasi pencegahan 2 bulan sebelum anak jatuh ke status *stunted*.

### 3. 🍲 Lapisan 3: Knowledge-Grounded RAG (AI Nutri-Chef)
* **Knowledge Base:** Dokumen pedoman gizi resmi Kemenkes RI (*Buku Resep Makanan Lokal Balita dan Ibu Hamil*) dipecah menjadi *chunks* dan diindeks ke PostgreSQL menggunakan ekstensi `pgvector` (`text-embedding-004`).
* **Algoritma Pencarian:** *Cosine similarity search* (`<=>`) mengambil aturan tekstur, mikronutrien esensial, dan protein hewani yang relevan dengan usia & status gizi balita.
* **Generasi Terstruktur:** Didukung `gemini-2.5-flash`, menghasilkan resep MPASI lokal terperinci sesuai ketersediaan bahan dapur dan batasan anggaran harian keluarga (misal: Rp15.000/hari) lengkap dengan sitasi pedoman Kemenkes.

### 4. 📷 Lapisan 4: Multimodal Vision AI (Smart KMS OCR)
* Memungkinkan kader memotret tabel/grafik KMS pada Buku KIA fisik lawas.
* Model Gemini Multimodal mengekstrak data historis `[bulan_ke, tanggal, berat_kg, tinggi_cm]` menjadi data JSON terstruktur untuk verifikasi cepat sebelum disimpan ke basis data.

### 5. 📶 Offline-First PWA & Inklusivitas Aksesibilitas
* **Offline Queue:** Menggunakan `IndexedDB` dan *Service Worker* sehingga kader tetap dapat memasukkan data penimbangan saat tidak ada sinyal internet, lalu tersinkronisasi otomatis saat *online*.
* **Aksesibilitas Terbuka:** Dukungan *Text-to-Speech* (Web Speech API Bahasa Indonesia) untuk membacakan resep dan status gizi anak kepada orang tua, serta *High Contrast Mode* & ukuran font dinamis.
* **Parent Magic Link:** Orang tua dapat mengakses grafik pertumbuhan anak via tautan unik tanpa login/instalasi aplikasi rumit.

---

## 🏛️ Arsitektur Sistem

```
+-------------------------------------------------------------------+
|               FRONTEND WEB CLIENT (React 19 + Vite PWA)           |
|  - Kader View (Mobile-First Web Penimbangan & OCR)                |
|  - Bidan GIS Heatmap Dashboard (Pemetaan Risiko & Intervensi RT)  |
|  - Admin Desa & Parent Magic Link View (Public Read-Only)         |
|  [IndexedDB Offline Queue] <---> [Service Worker Sync Engine]     |
+---------------------------------+---------------------------------+
                                  | HTTPS / REST API (JSON + JWT)
                                  v
+-------------------------------------------------------------------+
|               BACKEND API SERVICE (Golang Clean Code MVC)         |
|  +-----------------------+  +----------------------------------+  |
|  | Auth & RBAC Guard     |  | Anthropometry Engine (WHO LMS)   |  |
|  | (JWT + Bcrypt)        |  | (Deterministic Go Math)          |  |
|  +-----------------------+  +----------------------------------+  |
|  +-----------------------+  +----------------------------------+  |
|  | Predictive ML Service |  | Hybrid AI Orchestrator           |  |
|  | (gonum Regression)    |  | - RAG Retriever (pgvector-go)    |  |
|  +-----------------------+  | - Vision OCR (Buku KIA)          |  |
|                             | - Structured MPASI Generator     |  |
|                             +-----------------+----------------+  |
+-----------------------------------------------+-------------------+
                     |                          |
                     v                          v
+------------------------------------+  +---------------------------+
|      DATA LAYER (PostgreSQL 16)    |  |   EXTERNAL AI SERVICES    |
|  - Relational Tables (Users, Kids, |  |  - Google Gemini API      |
|    Measurements, Interventions)    |  |    (gemini-2.5-flash &    |
|  - WHO LMS Reference Standard      |  |     text-embedding-004)   |
|  - pgvector (Kemenkes Knowledge)   |  +---------------------------+
+------------------------------------+
```

---

## 👥 Persona Pengguna & Role-Based Access Control (RBAC)

| Role | Target Pengguna | Akses & Fungsionalitas Utama |
|---|---|---|
| **Kader** (`kader`) | Kader Posyandu RW/Dusun | Input timbang balita, pemindaian KMS fisik via OCR, generator resep MPASI lokal (AI Nutri-Chef), sinkronisasi antrean *offline*. |
| **Bidan** (`bidan`) | Bidan Desa / Tenaga Gizi Puskesmas | Dashboard epidemiologi wilayah, GIS *heatmap* sebaran stunting per RT/RW, penentuan daftar balita prioritas, rekap laporan Excel/PDF. |
| **Admin** (`admin`) | Super Admin Pemerintah Desa | Manajemen akun kader & bidan, pembaruan master data harga pangan lokal desa, pengelolaan *knowledge base* pedoman gizi. |
| **Public** (No Auth) | Orang Tua Balita | Akses grafik KMS dan menu MPASI personal melalui *Magic Link* unik token terenkripsi yang dikirim via WhatsApp. |

---

## 📁 Struktur Monorepo

```text
tumbuhin/
├── frontend/                     # Frontend Client Web (React + Vite PWA + Tailwind CSS)
│   ├── public/                   # Manifest PWA, service workers, & assets
│   ├── src/
│   │   ├── components/           # UI Atoms/Molecules, Charts, GIS Maps, AccessibilityBar
│   │   ├── context/              # AuthContext & OfflineSyncContext
│   │   ├── hooks/                # useOfflineQueue, useTTS
│   │   ├── pages/
│   │   │   ├── kader/            # InputUkuran, KMSCameraOCR, NutriChef, SyncQueue
│   │   │   ├── bidan/            # GISDashboard, PriorityIntervention, ReportExport
│   │   │   ├── admin/            # MasterWilayah, LocalFoodManager, RAGDocUploader
│   │   │   └── public/           # ParentMagicView (Grafik KMS & Audio Resep)
│   │   ├── services/             # Axios API Client & IndexedDB local database
│   │   ├── App.jsx               # Root Component
│   │   ├── index.css             # Tailwind CSS v4 Entrypoint
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js            # Konfigurasi Vite & Tailwind v4
│
├── backend/                      # Backend REST API Server (Golang Clean Code MVC)
│   ├── cmd/
│   │   └── api/
│   │       └── main.go           # Application Entrypoint, DI Container, Graceful Shutdown
│   ├── config/
│   │   └── config.go             # Environment Variables & Server Configuration
│   ├── controllers/              # [C] Controller: HTTP Request binding, validation, status response
│   │   ├── health_controller.go  # Server health, uptime, & diagnostics
│   │   └── user_controller.go    # CRUD User management
│   ├── models/                   # [M] Model: Domain Entities & Request DTOs
│   │   └── user.go
│   ├── views/                    # [V] View: Standardized JSON API Presenters (Success, Error, Meta)
│   │   └── response.go
│   ├── services/                 # Business Logic Layer: Logika domain independen dari HTTP
│   │   └── user_service.go
│   ├── repositories/             # Data Access Layer: Abstraksi query & database interface
│   │   └── user_repository.go    # In-memory implementation (siap ganti PostgreSQL)
│   ├── routes/                   # Routing: API grouping (/api/v1) & CORS setup
│   │   └── routes.go
│   ├── .env.example              # Template variabel konfigurasi backend
│   ├── Makefile                  # CLI shortcut build, run, test
│   ├── go.mod
│   └── go.sum
│
├── product_requirements_document_prd.md         # Dokumen PRD MVP Lengkap
├── system_architecture_technical_specification.md # Spesifikasi Teknis & Skema Database
├── .gitignore
└── README.md
```

---

## 📡 Spesifikasi Endpoint API Utama

Base URL: `http://localhost:8080/api/v1`

| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| `GET` | `/health` | Public | Status kesehatan server, versi, dan *uptime* |
| `POST` | `/auth/login` | Public | Autentikasi pengguna & pembuatan JWT token |
| `GET` | `/public/child/:token` | Public (Magic Link) | Data KMS & resep MPASI balita untuk orang tua tanpa login |
| `GET` | `/users` | Admin / Bidan | Mengambil seluruh daftar pengguna |
| `POST` | `/children` | Kader | Mendaftarkan profil balita baru & generate token orang tua |
| `POST` | `/ocr/kms` | Kader | Unggah foto halaman Buku KIA untuk ekstraksi data riwayat |
| `POST` | `/measurements` | Kader | Simpan hasil timbang, kalkulasi Z-Score WHO, & kalkulasi skor ML |
| `POST` | `/measurements/sync` | Kader | *Batch synchronization* data offline dari `IndexedDB` |
| `POST` | `/ai/mpasi-generate` | Kader | Pipeline RAG Kemenkes untuk generate resep MPASI ramah anggaran |
| `GET` | `/bidan/gis-clusters` | Bidan | Data geospasial agregasi risiko stunting RT/RW untuk peta Leaflet |
| `GET` | `/bidan/priority-list` | Bidan | Daftar balita prioritas tinggi untuk jadwal *home visit* |
| `GET` | `/bidan/export` | Bidan | Ekspor rekapitulasi data gizi bulanan ke format `.xlsx` / `.pdf` |

---

## 🚀 Panduan Instalasi & Menjalankan Aplikasi

### 📋 Prasyarat Sistem
- **Node.js**: `v20.x` atau lebih baru
- **Go**: `v1.22+` (atau `v1.27+`)
- **Git**
- *(Opsional)* PostgreSQL 16+ dengan ekstensi `pgvector`

---

### 1. Clone Repositori
```bash
git clone https://github.com/Muhfaizr21/tumbuhin.git
cd tumbuhin
```

---

### 2. Menjalankan Backend (Golang)
```bash
cd backend

# Salin konfigurasi environment
cp .env.example .env

# Jalankan server
go run cmd/api/main.go
# Atau menggunakan Makefile:
# make run
```
> Server API akan aktif di: `http://localhost:8080`  
> Cek status server: `curl http://localhost:8080/api/v1/health`

---

### 3. Menjalankan Frontend (React + Tailwind CSS)
Buka terminal baru di direktori utama `tumbuhin`:
```bash
cd frontend

# Pasang dependensi
npm install

# Jalankan server pengembangan Vite
npm run dev
```
> Aplikasi web akan aktif di: `http://localhost:5173`

---

## 📊 Standardisasi Medis & Kepatuhan Klinis

Sistem **Tumbuhin** mengacu langsung pada standar kesehatan nasional dan internasional:
- **Permenkes RI No. 2 Tahun 2020** tentang Standar Antropometri Anak.
- **WHO Multicentre Growth Reference Study (MGRS)** untuk baku deviasi LMS ($L, M, S$).
- **Buku Bagan Manajemen Terpadu Balita Sakit (MTBS) Kemenkes RI**.
- **Pedoman Pemberian Makanan Pendamping ASI (MPASI) Berbasis Bahan Pangan Lokal Kemenkes RI**.

---

## 🛡️ Keamanan & Privasi Data
- **Hashing NIK Balita:** Identitas kependudukan (NIK) disamarkan menggunakan algoritma *one-way cryptographic hash* (SHA-256) untuk mencegah kebocoran data sensitif.
- **Row-Level Scoping:** Data balita dan riwayat timbang diisolasi ketat sesuai yurisdiksi Posyandu kader dan Desa bidan.
- **Tokenized Public Magic Link:** Akses kurva gizi orang tua dilindungi token acak berbasis kriptografi yang bersifat *read-only* tanpa mengekspos akun internal.

---

## 🤝 Kontribusi & Lisensi

Proyek ini dikembangkan secara terbuka untuk kemajuan pemantauan gizi dan penurunan angka stunting di Indonesia.  
Dilisensikan di bawah **[MIT License](LICENSE)**.

<div align="center">
  <sub>Dibangun dengan sepenuh hati untuk generasi bebas stunting 🌱 — <b>Tumbuhin / SigapGizi Team</b></sub>
</div>
