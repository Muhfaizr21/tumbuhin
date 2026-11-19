/**
 * Clean Data Layer — Marketing & Product Copywriting for Tumbuhin (SigapGizi)
 * Aligned with Product Requirements Document (PRD) & System Architecture Specification
 */

export const BRAND_INFO = {
  name: 'Tumbuhin',
  productTag: 'SigapGizi',
  tagline: 'Smart Posyandu & Stunting Early-Warning System',
  complianceLabel: 'Permenkes RI No. 2 Tahun 2020 • SDG 3 Indonesia',
  locationBadge: 'Ekosistem Posyandu & Puskesmas Desa Digital',
  speechOverview:
    'Selamat datang di Tumbuhin SigapGizi. Platform Posyandu Pintar dan Sistem Peringatan Dini Stunting berbasis empat lapisan kecerdasan buatan Hybrid AI. Kami membantu kader posyandu, bidan desa, dan orang tua balita mendeteksi risiko pelambatan pertumbuhan dua bulan lebih awal dengan akurasi medis seratus persen sesuai standar WHO dan Kementerian Kesehatan Republik Indonesia.',
}

export const NAV_LINKS = [
  { label: 'Tentang Sistem', href: '#manifesto' },
  { label: 'Layanan & AI', href: '#layanan' },
  { label: 'Simulasi Klinis', href: '#simulasi' },
  { label: 'Keunggulan', href: '#keunggulan' },
  { label: 'Ekosistem Role', href: '#ekosistem' },
]

export const HERO_CONTENT = {
  titleLine1: 'Posyandu',
  titleLine2: 'Pintar',
  miniSubtext:
    'Kami tidak sekadar mencatat angka timbangan — kami mengawal setiap fase emas tumbuh kembang anak desa.',
  techHeading: 'Dengan 4 Lapisan Hybrid AI',
  techDescription:
    'Kombinasi kalkulasi deterministik standar WHO LMS, prediksi regresi arah pertumbuhan, AI Nutri-Chef berbasis RAG Kemenkes, serta Vision OCR Buku KIA — dirancang tangguh meski tanpa sinyal internet.',
  primaryCta: 'Mulai Simulasi Gizi',
  floatingPills: [
    { id: 'reliability', label: 'Akurasi WHO LMS', position: 'left' },
    { id: 'experience', label: 'Prediksi Dini ML', position: 'right-top' },
    { id: 'professional', label: 'RAG Kemenkes RI', position: 'right-bottom' },
  ],
  stats: [
    {
      value: '100%',
      label: 'kepatuhan rumus antropometri WHO & Permenkes',
    },
    {
      value: '4 Lapis',
      label: 'arsitektur Hybrid AI bebas halusinasi klinis',
    },
    {
      value: '<200ms',
      label: 'kecepatan deteksi dini & klasifikasi Z-Score',
    },
  ],
  approachTitle: 'Pendekatan proaktif berbasis bukti:',
  approachSubtitle:
    'Intervensi nutrisi dilakukan sebelum kurva anak jatuh ke zona merah stunting.',
}

export const MANIFESTO_CONTENT = {
  sectionLabel: 'Visi Transformasi Kesehatan Desa',
  part1: 'Kami memadukan presisi',
  highlight1: 'teknologi Hybrid AI',
  part2: 'dengan pendekatan humanis bagi',
  highlight2: 'kader, bidan, & ibu balita',
  part3: 'agar pencegahan stunting terasa',
  highlight3: 'tenang, terarah, dan tepat sasaran.',
  subDescription:
    'Tumbuhin adalah ruang kolaborasi gizi tingkat desa — menggabungkan perhitungan klinis bebas bias, resep pangan lokal sesuai anggaran keluarga, dan pemetaan spasial RT/RW dalam satu antarmuka progresif.',
  ctaLabel: 'Pelajari Arsitektur Sistem',
}

export const BENTO_SERVICES = [
  {
    number: '01',
    iconName: 'Activity',
    title: 'Kalkulator Antropometri WHO LMS',
    description:
      'Perhitungan deterministik Z-Score (BB/U, TB/U, BB/TB) menggunakan parameter Box-Cox (L, M, S) sesuai Permenkes No. 2 Tahun 2020 tanpa risiko halusinasi AI.',
    actionLabel: 'Uji Kalkulator',
    actionHref: '#simulasi',
    badge: 'Layer 1 • Math',
  },
  {
    number: '02',
    iconName: 'TrendingUp',
    title: 'Predictive Growth Trajectory',
    description:
      'Model regresi linier terbobot (gonum ML) menganalisis laju kenaikan berat bulanan (weight velocity) untuk mendeteksi risiko growth faltering 2 bulan lebih awal.',
    actionLabel: 'Lihat Proyeksi Kurva',
    actionHref: '#simulasi',
    badge: 'Layer 2 • ML',
  },
  {
    number: '03',
    iconName: 'Utensils',
    title: 'AI Nutri-Chef (RAG Kemenkes)',
    description:
      'Generator menu MPASI berbahan pangan lokal desa yang disesuaikan otomatis dengan usia anak, alergi, dan anggaran harian keluarga berbasis vektor pgvector.',
    actionLabel: 'Susun Menu MPASI',
    actionHref: '#simulasi',
    badge: 'Layer 3 • RAG',
  },
  {
    number: '04',
    iconName: 'ScanLine',
    title: 'Smart KMS Vision OCR',
    description:
      'Digitalisasi instan catatan penimbangan fisik dari foto halaman Buku KIA lama menjadi deretan data terstruktur menggunakan ekstraksi Multimodal Vision AI.',
    actionLabel: 'Cara Kerja OCR',
    actionHref: '#ekosistem',
    badge: 'Layer 4 • Vision',
  },
  {
    number: '05',
    iconName: 'MapPin',
    title: 'GIS Heatmap & Intervensi Bidan',
    description:
      'Pemetaan klaster risiko stunting tingkat RT/RW berbasis Leaflet & daftar prioritas kunjungan rumah (home visit) beserta ekspor laporan Puskesmas (.xlsx / .pdf).',
    actionLabel: 'Peta Epidemiologi',
    actionHref: '#keunggulan',
    badge: 'Modul Bidan',
  },
]

export const WHY_CHOOSE_US = {
  heading: 'Mengapa memilih Tumbuhin',
  subheading: 'Dirancang khusus untuk realitas operasional Posyandu di Indonesia.',
  visualBadges: [
    { label: 'Bidan & Tenaga Gizi Terintegrasi', position: 'top-left' },
    { label: 'Kader Posyandu Tangguh Offline', position: 'bottom-left' },
    { label: 'Standar Klinis Kemenkes RI', position: 'right' },
  ],
  metrics: [
    {
      value: '100%',
      title: 'Validitas Standar Medis',
      description:
        'Seluruh indeks antropometri merujuk penuh pada tabel referensi WHO MGRS dan Permenkes RI No. 2 Tahun 2020 dengan waktu eksekusi di bawah 200 milidetik.',
    },
    {
      value: '2 Bulan',
      title: 'Lebih Awal Mendeteksi Risiko',
      description:
        'Tidak menunggu anak berstatus Stunted. Algoritma trajectory slope memberi peringatan dini saat laju kenaikan berat badan mulai melambat (Weight Faltering).',
    },
    {
      value: '0 Login',
      title: 'Kemudahan Akses Orang Tua',
      description:
        'Melalui terobosan WhatsApp Magic Link terenkripsi dan pembaca suara (Text-to-Speech Bahasa Indonesia), ibu balita dapat memantau grafik KMS & resep tanpa instal aplikasi.',
    },
    {
      value: '24/7',
      title: 'Ketahanan Offline-First PWA',
      description:
        'Didukung IndexedDB & Service Worker Sync Engine agar kader tetap lancar mencatat penimbangan di wilayah minim sinyal dan sinkron otomatis saat kembali online.',
    },
  ],
  bottomFact:
    'FAKTA OPERASIONAL: Mengurangi waktu rekapitulasi laporan bulanan Posyandu & Bidan Desa hingga 75% sekaligus meningkatkan akurasi sasaran pemberian PMT.',
}

export const ROLE_ECOSYSTEM = [
  {
    roleKey: 'kader',
    badge: 'Garda Depan Lapangan',
    title: 'Kader Posyandu',
    subtitle: 'Mobile-First PWA • Tangguh Tanpa Sinyal',
    highlights: [
      'Input timbangan cepat dengan kalkulasi Z-Score & peringatan faltering instan.',
      'Potret tabel Buku KIA fisik menggunakan Smart KMS OCR tanpa ketik manual.',
      'Buat rekomendasi resep MPASI sesuai bahan dapur desa & kirim via WhatsApp.',
      'Antrean data tersimpan aman di IndexedDB saat posyandu berada di area blank-spot.',
    ],
  },
  {
    roleKey: 'bidan',
    badge: 'Pengambil Keputusan Klinis',
    title: 'Bidan Desa & Tenaga Gizi',
    subtitle: 'Desktop & Tablet GIS Epidemiologi',
    highlights: [
      'Pantau peta sebaran klaster RT/RW rawan stunting dengan indikator warna risiko.',
      'Daftar Prioritas Intervensi otomatis untuk balita Stunted, Wasted, atau High-Risk Faltering.',
      'Pencatatan jadwal kunjungan rumah (home visit), evaluasi klinis, dan distribusi PMT.',
      'Unduh rekapitulasi laporan gizi bulanan desa dalam format Excel (.xlsx) & PDF.',
    ],
  },
  {
    roleKey: 'ortu',
    badge: 'Inklusif & Bebas Hambatan',
    title: 'Orang Tua Balita',
    subtitle: 'Public Magic Link • Tanpa Registrasi Akun',
    highlights: [
      'Buka kartu pertumbuhan digital anak langsung dari tautan WhatsApp kader.',
      'Panduan memasak MPASI langkah demi langkah sesuai tekstur usia & anggaran harian.',
      'Fitur tombol Suara (Text-to-Speech Bahasa Indonesia) untuk kemudahan literasi.',
      'Mode Kontras Tinggi & ukuran teks adaptif yang ramah bagi seluruh lapisan masyarakat.',
    ],
  },
  {
    roleKey: 'admin',
    badge: 'Tata Kelola Data Desa',
    title: 'Super Admin Desa',
    subtitle: 'Manajemen Wilayah & Knowledge Base AI',
    highlights: [
      'Kelola cakupan wilayah Posyandu, hak akses RBAC kader, serta penugasan bidan.',
      'Perbarui harga master pangan lokal desa agar estimasi biaya MPASI selalu akurat.',
      'Unggah dokumen PDF pedoman gizi terbaru Kemenkes ke vector database pgvector.',
      'Perlindungan privasi warga dengan penyamaran NIK menggunakan SHA-256 cryptographic hash.',
    ],
  },
]

export const SIMULATION_PRESETS = [
  {
    id: 'faltering-case',
    childName: 'Ananda Bima Saputra',
    ageMonths: 14,
    gender: 'Laki-laki (L)',
    weightKg: 8.4,
    heightCm: 74.2,
    budgetIdr: 15000,
    ingredients: ['Telur Ayam', 'Ikan Lele', 'Daun Kelor', 'Beras Putih', 'Tempe'],
    zScoreWFA: '-1.85 SD',
    zScoreHFA: '-1.92 SD',
    zScoreWFH: '-1.40 SD',
    nutritionStatus: 'Normal — Waspada Pelambatan Tumbuh (Growth Faltering)',
    riskScore: 78,
    riskLevel: 'HIGH',
    trajectoryInsight:
      'Kenaikan berat badan 3 bulan terakhir (+100g/bulan) berada di bawah ambang Minimum Weight Gain WHO (+200g/bulan). Tanpa intervensi protein hewani, anak berisiko jatuh ke status Stunted dalam 6–8 minggu.',
    mpasiRecipe: {
      menuName: 'Bubur Tim Lele Telur Puyuh Sari Kelor',
      texture: 'Cincang Kasar / Makanan Keluarga Lunak (Usia 12–23 Bulan)',
      estimatedCost: 'Rp 13.500 / 3 Porsi Harian',
      calories: '485 kkal',
      animalProtein: '24.6 gram (Ikan Lele & Telur)',
      citation: 'Pedoman MPASI Pangan Lokal Kemenkes RI Bab 4 Hal. 32 & Permenkes No. 2/2020',
      steps: [
        'Kukus 75g daging ikan lele segar bersama bawang putih dan jahe hingga matang, lalu suwir halus bebas duri.',
        'Masak nasi tim lunak dengan kaldu ayam/tulang, masukkan suwiran lele, 1 butir telur kocok, dan potongan tempe.',
        'Tambahkan pucuk daun kelor cincang dan 1 sendok teh minyak kelapa/margarin sebagai penambah densitas energi sebelum disajikan.',
      ],
    },
  },
  {
    id: 'optimal-case',
    childName: 'Ananda Citra Lestari',
    ageMonths: 9,
    gender: 'Perempuan (P)',
    weightKg: 8.6,
    heightCm: 71.0,
    budgetIdr: 12000,
    ingredients: ['Hati Ayam', 'Telur Ayam', 'Bayam', 'Kentang', 'Tahu'],
    zScoreWFA: '+0.15 SD',
    zScoreHFA: '+0.08 SD',
    zScoreWFH: '+0.22 SD',
    nutritionStatus: 'Gizi Baik & Pertumbuhan Optimal',
    riskScore: 12,
    riskLevel: 'LOW',
    trajectoryInsight:
      'Laju kenaikan berat badan (+350g/bulan) dan panjang badan konsisten mengikuti garis median hijau KMS WHO. Pertahankan variasi protein hewani harian.',
    mpasiRecipe: {
      menuName: 'Puree Kentang Hati Ayam Lumat Bayam',
      texture: 'Lumat / Cincang Halus (Usia 9–11 Bulan)',
      estimatedCost: 'Rp 10.500 / 3 Porsi Harian',
      calories: '390 kkal',
      animalProtein: '19.8 gram + Tinggi Zat Besi (Hati Ayam)',
      citation: 'Buku KIA Kemenkes RI Revisi 2024 — Standar MPASI Kaya Zat Besi',
      steps: [
        'Rebus 60g hati ayam dan 100g kentang hingga empuk, kemudian cincang halus atau saring kasar sesuai tekstur 9 bulan.',
        'Tumis bumbu aromatik dengan sedikit minyak kanola/kelapa, masukkan tahu lumat dan daun bayam muda cincang.',
        'Campurkan seluruh bahan dengan air kaldu hangat hingga mencapai konsistensi kental yang tidak mudah tumpah dari sendok.',
      ],
    },
  },
]
