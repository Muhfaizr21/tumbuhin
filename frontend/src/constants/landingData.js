// Copywriting and clinical data structured around letters.app & DESIGN.md specification

export const BRAND_INFO = {
  name: 'SigapGizi',
  parentBrand: 'Tumbuhin',
  tagline: 'Balita sehat, bukan tumpukan berkas',
  speechOverview:
    'Selamat datang di SigapGizi Tumbuhin. Sistem informasi Posyandu pintar dan peringatan dini stunting. Hitung Z-Score antropometri instan yang seratus persen akurat sesuai standar WHO LMS, deteksi risiko growth faltering dengan regresi linier, dan susun resep MPASI pangan lokal sesuai pedoman Kementerian Kesehatan Republik Indonesia.',
}

export const NAV_LINKS = [
  { label: 'Kasus Penggunaan', href: '#for-practice' },
  { label: 'Fitur Klinis', href: '#save-hours' },
  { label: 'Simulasi KMS', href: '#letters' },
  { label: 'Keamanan Data', href: '#safety' },
]

export const HERO_CONTENT = {
  headlineLine1: 'Balita sehat,',
  headlineLine2: 'bukan beban berkas',
  primaryCta: 'Mulai Simulasi Gratis',
  beforeNote: {
    greeting: 'Catatan KMS Posyandu RW 04,',
    body: 'Ananda Bima Saputra usia 14 bulan datang timbang rutin. BB 8.4 kg, TB 74.2 cm. Bulan lalu BB 8.3 kg, kenaikan lambat perlu cek tabel Z-Score manual dan susun saran menu PMT...',
  },
  afterNote: {
    greeting: 'Evaluasi Klinis SigapGizi (14 Bulan):',
    body: 'Z-Score TB/U: -1.92 SD, BB/U: -1.85 SD. Peringatan Regresi: Risiko Growth Faltering Tinggi (78%). Menu RAG Kemenkes: Nasi Tim Lele Sari Kelor (Rp 13.500/hari, 24.6g protein hewani).',
  },
}

export const SAVE_HOURS_CONTENT = {
  cardLeft: {
    tag: 'Antropometri & RAG',
    title: 'Susun laporan gizi & resep MPASI personal secara instan',
    beforePreview:
      'Catatan Buku KIA fisik Ananda Bima Saputra, kurva kenaikan berat badan mulai mendatar dalam tiga bulan terakhir dan perlu dihitung indeks simpangan baku serta saran menu pangan lokal',
    afterPreview:
      'Z-Score TB/U -1.92 SD (Normal Waspada Faltering). Resep Lokal: Nasi Tim Ikan Lele Telur Sari Kelor (485 kkal, Rp 13.500/3 porsi).',
  },
  cardRight: {
    tag: 'OCR & Edukasi Suara',
    title: 'Digitalisasi Buku KIA, konsultasi bidan, & pembaca suara',
    audioTranscript:
      'Ananda Bima membutuhkan tambahan protein hewani 24.6 gram per hari dari ikan lele dan telur ayam sesuai pedoman MPASI lokal Kemenkes.',
    audioDuration: '00:42',
  },
}

export const LETTERS_DEEP_DIVE = {
  tag: 'Antropometri & RAG',
  headingLine1: 'Rekomendasi gizi klinis yang',
  headingLine2: 'sesuai kondisi dapur desa',
  leftCard: {
    title: 'Mengacu penuh pada pedoman resmi',
    subtitle:
      'Unggah foto tabel Buku KIA atau pilih ketersediaan bahan pangan lokal desa untuk menyusun intervensi.',
    dropzone1Label: 'Unggah foto halaman KMS Buku KIA',
    dropzone1Action: 'Pilih dokumen gambar',
    dropzone2Label: 'Muat daftar harga pangan lokal desa',
    dropzone2Action: 'Pilih sumber pangan',
  },
  rightCard: {
    title: 'Gabungkan berbagai parameter klinis',
    subtitle:
      'Padukan usia bulan, indeks LMS WHO, riwayat alergi, dan batas anggaran harian keluarga.',
  },
  subFeatures: [
    {
      title: 'Koreksi & Verifikasi Kader',
      description:
        'Tinjau dan sesuaikan hasil ekstraksi angka timbangan sebelum disimpan. Sistem mencatat riwayat perubahan secara rapi.',
    },
    {
      title: 'Templat Intervensi Cepat',
      description:
        'Gunakan format standar catatan Pemberian Makanan Tambahan (PMT) dan rujukan Puskesmas untuk menghemat waktu di meja layanan.',
    },
    {
      title: 'Personalisasi Anggaran & Alergi',
      description:
        'Dari perhitungan Z-Score Box-Cox hingga filter alergi bahan makanan dan batas belanja harian keluarga, seluruhnya dapat dikustomisasi.',
    },
  ],
}

export const DICTIONARY_CONTENT = {
  headingLine1: 'Basis pengetahuan klinis yang',
  headingLine2: 'menjamin ketepatan analisis.',
  subtitle:
    'Mengeksekusi perhitungan antropometri dengan rumus deterministik WHO LMS dan mengambil referensi dokumen resmi Kemenkes RI melalui basis data vektor pgvector.',
  terms: [
    {
      term: 'Metode Box-Cox LMS (WHO)',
      definition:
        'Rumus matematis deterministik Z = ((y/M)^L - 1) / (L x S) untuk menghitung simpangan baku BB/U, TB/U, dan BB/TB anak usia 0-60 bulan sesuai Permenkes No. 2 Tahun 2020.',
    },
    {
      term: 'Growth Faltering (Weight Velocity)',
      definition:
        'Kondisi ketika laju kenaikan berat badan bulanan anak berada di bawah standar kenaikan minimal WHO, dideteksi melalui regresi linier terbobot (gonum) sebelum jatuh ke status stunted.',
    },
    {
      term: 'RAG Pangan Lokal (pgvector 768-d)',
      definition:
        'Pencarian kemiripan vektor pada dokumen Buku KIA dan Pedoman MPASI Kemenkes untuk menghasilkan resep kaya protein hewani beserta sitasi halaman resmi.',
    },
  ],
}

export const TRANSCRIBE_DEEP_DIVE = {
  tag: 'Lapangan & Luring',
  heading: 'Catat tanpa hambatan sinyal',
  subtitle:
    'Pencatatan meja penimbangan yang tetap beroperasi saat luring (offline) dan tersinkronisasi otomatis ke dashboard bidan desa.',
  leftCard: {
    title: 'Antrean luring otomatis',
    subtitle: 'Simpan hasil timbang di IndexedDB saat posyandu berada di area minim sinyal.',
    timer: '00:12:50',
    queueLabel: '3 data penimbangan Posyandu RW 04 tersimpan aman di penyimpanan lokal.',
  },
  rightCard: {
    title: 'Jembatan komunikasi bidan & ibu',
    subtitle: 'Kirim ringkasan hasil ukur dan panduan suara MPASI langsung ke WhatsApp keluarga.',
    messages: [
      {
        role: 'Bidan Desa',
        time: '08:12:50',
        isClinician: true,
        text: 'Dari hasil timbang hari ini, laju berat badan Bima perlu didorong dengan menu tim ikan lele dan telur tiga kali sehari. Tautan resep sudah kami kirim ke WhatsApp Ibu.',
      },
      {
        role: 'Ibu Balita',
        time: '08:13:24',
        isClinician: false,
        text: 'Baik Bu Bidan, kartu gizi digitalnya langsung terbuka tanpa harus login akun. Langkah memasaknya juga bisa saya putar lewat tombol suara.',
      },
    ],
  },
  subFeatures: [
    {
      title: 'Validasi Rentang Pengukuran',
      description:
        'Menyaring kesalahan ketik ekstrem pada input berat, tinggi badan, dan usia bulan sebelum masuk ke rekapitulasi gizi desa.',
    },
    {
      title: 'Komputasi Cepat <200ms',
      description:
        'Kalkulasi indeks antropometri dijalankan langsung oleh paket matematika murni di backend Golang tanpa jeda pemanggilan layanan luar.',
    },
    {
      title: 'Kartu Gizi Ramah Keluarga',
      description:
        'Menyajikan grafik kurva KMS, takaran bahan rumah tangga, dan pembaca suara Bahasa Indonesia melalui tautan Magic Link.',
    },
  ],
}

export const FOR_PRACTICE_CONTENT = {
  tag: 'Untuk Posyandu & Desa',
  heading: 'Hubungkan seluruh Posyandu desa',
  subtitle:
    'Koordinasikan kader RW, bidan desa, dan orang tua balita dalam satu alur pemantauan epidemiologi yang terukur.',
  cards: [
    {
      roleKey: 'kader',
      badge: 'Meja Layanan RW',
      title: 'Kemudahan orientasi kader baru',
      description:
        'Antarmuka mobile-first dengan panduan langkah demi langkah di setiap kolom input timbangan dan pemindaian foto Buku KIA.',
      metaTitle: 'Kader Posyandu Melati 04',
      metaRole: 'Pencatatan & OCR KMS',
    },
    {
      roleKey: 'bidan',
      badge: 'Epidemiologi Desa',
      title: 'Peta GIS klaster risiko RT/RW',
      description:
        'Identifikasi kantong kerawanan stunting secara spasial menggunakan peta interaktif Leaflet dan daftar prioritas kunjungan rumah (home visit).',
      metaTitle: 'Bidan Koordinator Puskesmas',
      metaRole: 'Supervisi Klinis & PMT',
    },
    {
      roleKey: 'dampak',
      badge: 'Pelaporan Puskesmas',
      title: 'Pantau dampak intervensi gizi desa',
      description:
        'Lacak tingkat partisipasi penimbangan bulanan antar-Posyandu dan ekspor laporan rekapitulasi langsung ke format Excel (.xlsx) atau PDF.',
      metaTitle: 'Rekapitulasi Bulanan Desa',
      metaRole: 'Ekspor .xlsx & .pdf',
    },
  ],
}

export const SAFETY_CONTENT = {
  heading: 'Data kesehatan balita terjaga aman',
  pillars: [
    {
      title: 'Penyamaran NIK Satu Arah (SHA-256)',
      description:
        'Nomor Induk Kependudukan balita diubah menggunakan fungsi cryptographic hash satu arah beserta salt sehingga identitas mentah tidak terekspos.',
    },
    {
      title: 'Isolasi Akses Tingkat Wilayah (RBAC)',
      description:
        'Pembatasan baris data memastikan kader hanya dapat melihat balita di Posyandu tugasnya, sementara bidan memantau agregasi tingkat desa.',
    },
    {
      title: 'Magic Link Baca-Saja Terenkripsi',
      description:
        'Tautan kartu gizi orang tua diamankan dengan token acak 64 karakter yang hanya mengizinkan pembacaan kurva KMS dan resep tanpa akses ubah data.',
    },
  ],
}

export const DEPLOYMENT_TIERS = [
  {
    name: 'Posyandu Mandiri',
    price: 'Terbuka',
    period: 'Unit Posyandu RW',
    description: 'Untuk operasional penimbangan bulanan kader dan edukasi gizi keluarga.',
    ctaLabel: 'Gunakan Modul Kader',
    features: [
      'Kalkulator Z-Score WHO LMS (0-60 bulan)',
      'Antrean penimbangan luring (IndexedDB)',
      'Kartu gizi orang tua via WhatsApp Magic Link',
      'Pembaca suara (Text-to-Speech Bahasa Indonesia)',
    ],
  },
  {
    name: 'Puskesmas & Bidan Desa',
    price: 'Terpadu',
    period: 'Cakupan Satu Desa',
    description: 'Untuk bidan desa dan tenaga gizi yang memantau tren serta intervensi lapangan.',
    ctaLabel: 'Buka Simulasi Klinis',
    highlighted: true,
    features: [
      'Seluruh fitur Posyandu Mandiri',
      'Prediksi regresi risiko growth faltering (gonum)',
      'AI Nutri-Chef RAG pedoman MPASI Kemenkes',
      'Smart KMS Vision OCR dari foto Buku KIA',
      'Peta GIS klaster RT/RW & ekspor laporan .xlsx',
    ],
  },
  {
    name: 'Dinas Kesehatan',
    price: 'Kustom',
    period: 'Multi-Desa & Kabupaten',
    description: 'Untuk integrasi lintas Puskesmas dan pengelolaan basis pengetahuan daerah.',
    ctaLabel: 'Pelajari Arsitektur',
    features: [
      'Manajemen dokumen RAG pgvector terpusat',
      'Basis data master harga pangan lokal daerah',
      'Opsi deployment server mandiri (On-Premise)',
      'Integrasi API Golang Clean Architecture',
    ],
  },
]

export const SIMULATION_PRESETS = [
  {
    id: 'faltering-case',
    label: 'Kasus Peringatan Dini (Faltering)',
    childName: 'Ananda Bima Saputra',
    ageMonths: 14,
    gender: 'Laki-laki',
    weightKg: 8.4,
    heightCm: 74.2,
    budgetIdr: 15000,
    ingredients: ['Telur Ayam', 'Ikan Lele', 'Daun Kelor', 'Beras Putih', 'Tempe'],
    zScoreWFA: '-1.85 SD',
    zScoreHFA: '-1.92 SD',
    zScoreWFH: '-1.40 SD',
    nutritionStatus: 'Normal (Waspada Pelambatan Laju Tumbuh / Growth Faltering)',
    riskScore: 78,
    riskLevel: 'TINGGI',
    trajectoryInsight:
      'Kenaikan berat badan 3 bulan terakhir (+100g/bulan) berada di bawah ambang kenaikan minimal WHO (+200g/bulan). Diperlukan intervensi protein hewani harian agar kurva tidak turun melewati batas -2.0 SD.',
    mpasiRecipe: {
      menuName: 'Nasi Tim Ikan Lele Telur Sari Daun Kelor',
      texture: 'Cincang Kasar / Makanan Keluarga Lunak (12-23 Bulan)',
      estimatedCost: 'Rp 13.500 / 3 Porsi',
      calories: '485 kkal',
      animalProtein: '24.6 g (Lele & Telur)',
      citation: 'Pedoman MPASI Pangan Lokal Kemenkes RI Bab 4 Hal. 32 & Permenkes No. 2/2020',
      steps: [
        'Kukus 75 gram daging ikan lele segar bersama bawang putih dan jahe hingga matang, kemudian suwir halus pastikan bebas duri.',
        'Masak nasi tim lunak dengan kaldu ayam, masukkan suwiran lele, satu butir telur kocok, dan potongan dadu kecil tempe.',
        'Masukkan daun kelor cincang dan satu sendok teh minyak kelapa menjelang diangkat untuk menambah densitas kalori.',
      ],
    },
  },
  {
    id: 'optimal-case',
    label: 'Kasus Pertumbuhan Optimal',
    childName: 'Ananda Citra Lestari',
    ageMonths: 9,
    gender: 'Perempuan',
    weightKg: 8.6,
    heightCm: 71.0,
    budgetIdr: 12000,
    ingredients: ['Hati Ayam', 'Telur Ayam', 'Bayam', 'Kentang', 'Tahu Putih'],
    zScoreWFA: '+0.15 SD',
    zScoreHFA: '+0.08 SD',
    zScoreWFH: '+0.22 SD',
    nutritionStatus: 'Gizi Baik & Laju Pertumbuhan Sesuai Kurva Median WHO',
    riskScore: 12,
    riskLevel: 'RENDAH',
    trajectoryInsight:
      'Laju penambahan berat badan (+350g/bulan) dan panjang badan mengikuti jalur hijau median KMS WHO secara konsisten. Pertahankan jadwal makan utama tiga kali sehari.',
    mpasiRecipe: {
      menuName: 'Bubur Kentang Hati Ayam Lumat Bayam',
      texture: 'Lumat / Cincang Halus (9-11 Bulan)',
      estimatedCost: 'Rp 10.500 / 3 Porsi',
      calories: '390 kkal',
      animalProtein: '19.8 g + Zat Besi Tinggi',
      citation: 'Buku KIA Kemenkes RI Revisi 2024: Standar MPASI Kaya Zat Besi',
      steps: [
        'Rebus 60 gram hati ayam segar dan 100 gram kentang hingga empuk, lalu lumatkan atau cincang halus sesuai tekstur usia sembilan bulan.',
        'Tumis bumbu aromatik dengan sedikit minyak, masukkan tahu putih lumat serta pucuk daun bayam cincang hingga matang.',
        'Campurkan seluruh bahan bersama kaldu hangat hingga mencapai tekstur kental yang tidak langsung tumpah dari sendok.',
      ],
    },
  },
]
