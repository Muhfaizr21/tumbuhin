# System Architecture & Technical Specification

**Proyek:** SigapGizi (Smart Posyandu & Stunting Early-Warning System)  
**Kategori Lomba:** SEVENT X – Software Development (**Kategori Website**)  
**Stack Utama:** React (Vite + TypeScript + Tailwind PWA) + **Golang (Gin / Fiber)** + PostgreSQL (`pgvector`) + Hybrid AI Engine

---

## 1. Diagram Arsitektur Sistem (High-Level Web Architecture)

```
+-------------------------------------------------------------------+
|               FRONTEND WEB CLIENT (React + Vite PWA)              |
|  - Kader View (Responsive Mobile-First Web)                       |
|  - Bidan GIS Dashboard (Desktop/Tablet Web)                       |
|  - Admin Panel & Parent Magic Link (Public Read-Only Web)         |
|  [IndexedDB Offline Queue] <---> [Service Worker Sync Engine]     |
+---------------------------------+---------------------------------+
                                  | HTTPS / REST API (JSON + JWT)
                                  v
+-------------------------------------------------------------------+
|                   BACKEND API SERVICE (Golang)                    |
|  +-----------------------+  +----------------------------------+  |
|  | Auth & RBAC Middleware|  | Anthropometry Engine (WHO LMS)   |  |
|  | (golang-jwt)          |  | (Pure Go Math Package)           |  |
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
|      DATA LAYER (PostgreSQL)       |  |   EXTERNAL AI SERVICES    |
|  - Relational Tables (Users, Kids, |  |  - Google Gemini API      |
|    Measurements, Visits, Food)     |  |    (gemini-2.5-flash &    |
|  - WHO LMS Reference Table         |  |     text-embedding-004)   |
|  - pgvector (Kemenkes RAG Chunks)  |  +---------------------------+
+------------------------------------+
```

---

## 2. Desain Alur Hybrid AI (4 Lapisan Kecerdasan di Golang)

### Lapisan 1: Deterministic Clinical Math (WHO Z-Score Engine)
Untuk menjamin akurasi medis tanpa halusinasi dan kecepatan eksekusi tinggi di Golang, perhitungan Z-Score menggunakan rumus standar WHO LMS berdasarkan jenis kelamin dan usia (0–60 bulan):

$$
Z = \frac{\left(\frac{y}{M}\right)^L - 1}{L \times S}
$$

*   $y$: Nilai pengukuran aktual anak (Berat Badan dalam $\text{kg}$ atau Tinggi Badan dalam $\text{cm}$).
*   $M$: Nilai median referensi WHO pada usia & jenis kelamin tersebut.
*   $L$: Koefisien kemencengan (*Box-Cox power*).
*   $S$: Koefisien variasi (*generalized coefficient of variation*).

### Lapisan 2: Predictive Growth Trajectory (Early-Warning ML di Golang)
*   **Input:** Vektor riwayat perubahan Z-Score ($\Delta Z_{t-3}, \Delta Z_{t-2}, \Delta Z_{t-1}, \Delta Z_t$) dan laju kenaikan berat badan bulanan (*weight velocity* dalam $\text{gram/bulan}$) dibandingkan standar kenaikan berat badan minimal WHO (*Minimum Weight Gain*).
*   **Algoritma:** Regresi linear terbobot (*Weighted Linear Regression* menggunakan library `gonum.org/v1/gonum/stat`) + skor penalti deviasi arah kurva (*Trajectory Slope Analysis*).
*   **Output:** Probabilitas risiko *growth faltering* ($0\% - 100\%$) dan proyeksi status gizi 2 bulan ke depan apabila tidak dilakukan intervensi.

### Lapisan 3: Knowledge-Grounded RAG (AI Nutri-Chef)
1.  **Indexing (Offline/Admin):** Dokumen PDF *Buku KIA Kemenkes* dan *Resep MPASI Pangan Lokal Kemenkes* dipecah menjadi potongan (*chunks* 500 token) dan diubah menjadi vektor menggunakan `text-embedding-004`, lalu disimpan di tabel `knowledge_chunks` menggunakan `pgvector-go`.
2.  **Retrieval:** Saat kader meminta resep untuk balita usia $X$ bulan dengan status gizi $Y$, backend Go melakukan *cosine similarity search* (`<=>`) pada `pgvector` untuk mengambil 3–5 aturan gizi paling relevan (tekstur makanan, kebutuhan kalori tambahan, larangan bahan).
3.  **Generation:** LLM (`gemini-2.5-flash` via Google GenAI Go SDK) menghasilkan respons JSON ketat (*Structured Outputs* yang langsung di-*unmarshal* ke `struct` Go) berisi menu MPASI lokal sesuai anggaran keluarga dan menyertakan sitasi aturan Kemenkes.

### Lapisan 4: Multimodal Vision AI (Smart KMS OCR)
*   **Alur:** Foto halaman catatan penimbangan Buku KIA dikirim dalam format `multipart/form-data` ke endpoint `POST /api/ocr/kms`.
*   **Ekstraksi:** Handler Go meneruskan gambar ke Gemini Multimodal dengan skema JSON terstruktur untuk mengekstrak array `(bulan_ke, tanggal_ukur, berat_kg, tinggi_cm)`, lalu mengembalikannya ke frontend web untuk dikonfirmasi kader.

---

## 3. Skema Database PostgreSQL + `pgvector`

```sql
-- Aktifkan ekstensi vektor untuk RAG
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabel Wilayah & Posyandu
CREATE TABLE posyandus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    village_name VARCHAR(100) NOT NULL,
    rw_code VARCHAR(10) NOT NULL,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Tabel Pengguna (RBAC: kader, bidan, admin)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) CHECK (role IN ('kader', 'bidan', 'admin')) NOT NULL,
    posyandu_id UUID REFERENCES posyandus(id) ON DELETE SET NULL,
    village_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Tabel Profil Balita
CREATE TABLE children (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nik_hash VARCHAR(64) UNIQUE NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    gender CHAR(1) CHECK (gender IN ('L', 'P')) NOT NULL,
    birth_date DATE NOT NULL,
    rt_code VARCHAR(10) NOT NULL,
    rw_code VARCHAR(10) NOT NULL,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    parent_name VARCHAR(120) NOT NULL,
    parent_phone VARCHAR(20) NOT NULL,
    allergies TEXT,
    magic_token VARCHAR(64) UNIQUE NOT NULL,
    posyandu_id UUID REFERENCES posyandus(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Tabel Referensi Standar Antropometri WHO (LMS)
CREATE TABLE who_lms_standards (
    id SERIAL PRIMARY KEY,
    indicator VARCHAR(10) CHECK (indicator IN ('WFA', 'HFA', 'WFH')) NOT NULL,
    gender CHAR(1) CHECK (gender IN ('L', 'P')) NOT NULL,
    age_months INT, -- NULL jika indikator WFH (menggunakan height_cm)
    height_cm DECIMAL(5, 1),
    l_val DECIMAL(10, 6) NOT NULL,
    m_val DECIMAL(10, 4) NOT NULL,
    s_val DECIMAL(10, 6) NOT NULL
);

-- 5. Tabel Riwayat Penimbangan & Hasil Analisis AI
CREATE TABLE measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    recorded_by UUID REFERENCES users(id),
    measured_at DATE NOT NULL,
    age_months INT NOT NULL,
    weight_kg DECIMAL(5, 2) NOT NULL,
    height_cm DECIMAL(5, 1) NOT NULL,
    head_circumference_cm DECIMAL(4, 1),
    zscore_wfa DECIMAL(5, 2), -- BB/U
    zscore_hfa DECIMAL(5, 2), -- TB/U
    zscore_wfh DECIMAL(5, 2), -- BB/TB
    nutrition_status VARCHAR(50) NOT NULL,
    faltering_risk_score INT DEFAULT 0, -- 0 - 100 dari Predictive ML
    faltering_risk_level VARCHAR(20) CHECK (faltering_risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
    ml_insight_text TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Tabel Rekomendasi Resep MPASI (Hasil RAG)
CREATE TABLE mpasi_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    measurement_id UUID REFERENCES measurements(id) ON DELETE CASCADE,
    daily_budget_idr INT NOT NULL,
    available_ingredients TEXT[] NOT NULL,
    recipe_payload JSONB NOT NULL, -- Terstruktur: menu, bahan, harga, langkah, nutrisi, sitasi
    created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Tabel Intervensi & Home Visit Bidan
CREATE TABLE interventions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    bidan_id UUID REFERENCES users(id),
    visit_date DATE NOT NULL,
    clinical_notes TEXT NOT NULL,
    pmt_given BOOLEAN DEFAULT FALSE,
    follow_up_status VARCHAR(30) DEFAULT 'SCHEDULED',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 8. Tabel Master Pangan Lokal Desa
CREATE TABLE local_foods (
    id SERIAL PRIMARY KEY,
    village_name VARCHAR(100) NOT NULL,
    food_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- Protein Hewani, Nabati, Karbohidrat, Sayur/Buah
    estimated_price_per_unit INT NOT NULL,
    unit_label VARCHAR(30) NOT NULL, -- misal: "1 butir", "100 gram", "1 ikat"
    is_available BOOLEAN DEFAULT TRUE
);

-- 9. Tabel Knowledge Base RAG (Dokumen Pedoman Kemenkes)
CREATE TABLE knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_title VARCHAR(200) NOT NULL,
    section_label VARCHAR(150),
    content_text TEXT NOT NULL,
    embedding vector(768) -- Dimensi output text-embedding-004
);

CREATE INDEX ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);
```

---

## 4. Spesifikasi Endpoint REST API Utama (Golang)

| Method | Endpoint | Role Akses | Deskripsi Fungsional |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Autentikasi pengguna dan mengembalikan JWT + profil role. |
| `GET` | `/api/public/child/:magicToken` | Public | Mengambil data kurva KMS & resep MPASI terbaru untuk orang tua tanpa login. |
| `GET` | `/api/children` | Kader, Bidan | Daftar balita sesuai cakupan wilayah (`posyandu_id` atau `village_name`). |
| `POST` | `/api/children` | Kader | Mendaftarkan profil balita baru + generate `magic_token`. |
| `POST` | `/api/ocr/kms` | Kader | Mengunggah foto Buku KIA untuk ekstraksi riwayat timbang via Vision AI. |
| `POST` | `/api/measurements` | Kader | Menyimpan hasil timbang, menghitung Z-Score WHO, dan menjalankan prediksi ML. |
| `POST` | `/api/measurements/sync` | Kader | *Batch sync* data penimbangan dari antrean *offline* web (`IndexedDB`). |
| `POST` | `/api/ai/mpasi-generate` | Kader | Menjalankan *pipeline* RAG Kemenkes untuk menyusun resep MPASI lokal sesuai budget. |
| `GET` | `/api/bidan/gis-clusters` | Bidan | Data koordinat & agregasi tingkat risiko *stunting* per RT/RW untuk peta Leaflet. |
| `GET` | `/api/bidan/priority-list` | Bidan | Daftar balita *stunted/wasted* dan *high-risk growth faltering* untuk intervensi. |
| `POST` | `/api/bidan/interventions` | Bidan | Mencatat jadwal dan hasil evaluasi *home visit* klinis. |
| `GET` | `/api/bidan/export` | Bidan | Mengunduh laporan rekapitulasi gizi bulanan dalam format `.xlsx` atau `.pdf`. |
| `POST` | `/api/admin/knowledge-base` | Admin | Mengunggah dokumen PDF pedoman gizi baru untuk di-chunk dan di-embed ke `pgvector`. |

---

## 5. Struktur Direktori Repository (Clean Architecture Golang + React Web)

```text
sigapgizi-seventx/
├── web/                        # Frontend Website (React + Vite + TypeScript + Tailwind PWA)
│   ├── public/                 # Manifest PWA, icons, offline fallback
│   └── src/
│       ├── components/         # UI reusable, AccessibilityBar, KMSChart, GISMap
│       ├── context/            # AuthContext, OfflineSyncContext
│       ├── hooks/              # useOfflineQueue, useTextToSpeech
│       ├── pages/
│       │   ├── kader/          # Dashboard, ChildList, MeasureForm, NutriChef, SyncQueue
│       │   ├── bidan/          # EpidemiologyDash, GISHeatmap, PriorityList, Reports
│       │   ├── admin/          # UserManagement, RegionMaster, LocalFoods, RAGManager
│       │   └── public/         # ParentMagicView (Kurva & Resep Suara)
│       └── services/           # Axios API client & IndexedDB wrapper
├── backend/                    # Backend Service (Golang - Clean Architecture)
│   ├── cmd/
│   │   ├── api/main.go         # Entrypoint HTTP server (Gin/Fiber)
│   │   └── seeder/main.go      # CLI seeder data WHO LMS, dummy 30 balita & chunks Kemenkes
│   ├── internal/
│   │   ├── config/             # Env loader, PostgreSQL (pgxpool + pgvector-go), Gemini Client
│   │   ├── domain/             # Struct entity & interface repository/service
│   │   ├── repository/         # Query PostgreSQL (sqlc / pgx)
│   │   ├── service/
│   │   │   ├── who_zscore.go   # Rumus deterministik LMS WHO
│   │   │   ├── growth_ml.go    # Model prediksi regresi growth faltering (gonum)
│   │   │   ├── rag_chef.go     # Vector search pgvector + Gemini Structured Output
│   │   │   └── vision_ocr.go   # Ekstraksi foto Buku KIA
│   │   └── delivery/http/
│   │       ├── handler/        # HTTP handlers per modul (Auth, Child, Measure, AI, Bidan)
│   │       ├── middleware/     # JWT auth, RBAC role guard, CORS
│   │       └── router.go       # Definisi route REST API
│   ├── go.mod
│   └── go.sum
├── docker-compose.yml          # Container PostgreSQL + pgvector & Backend Go
└── README.md                   # Dokumentasi instalasi, arsitektur, dan kredensial demo
```

---

## 6. Library Go Utama yang Direkomendasikan
*   **Web Framework:** `github.com/gin-gonic/gin` atau `github.com/gofiber/fiber/v2`
*   **Database & Vector:** `github.com/jackc/pgx/v5` + `github.com/pgvector/pgvector-go`
*   **AI & Multimodal SDK:** `google.golang.org/genai` (Official Google GenAI Go SDK)
*   **Statistik & Regresi ML:** `gonum.org/v1/gonum/stat`
*   **Auth & Security:** `github.com/golang-jwt/jwt/v5` + `golang.org/x/crypto/bcrypt`
*   **Export Laporan Excel:** `github.com/xuri/excelize/v2`