import {
  Baby,
  Camera,
  ChefHat,
  LayoutDashboard,
  RefreshCw,
  Scale,
  Send,
} from 'lucide-react'
import RoleDashboardShell from '../../components/layout/RoleDashboardShell'

const KADER_MENUS = [
  {
    id: 'dashboard',
    label: 'Beranda Posyandu',
    route: '/kader/dashboard',
    icon: LayoutDashboard,
    badge: 'Live',
    backendPath: 'kader/dashboard/dashboard_controller.go',
    description:
      'Ringkasan hari buka Posyandu, kehadiran balita, peringatan dini Growth Faltering, serta instruksi tindak lanjut dari Bidan Desa.',
    features: [
      'Kartu ringkasan target vs kehadiran balita bulan berjalan',
      'Indikator status jaringan Online / Offline IndexedDB Queue',
      'Pintasan aksi cepat: Input Timbang, Scan KIA, Tambah Balita',
      'Notifikasi instruksi balik dari Bidan Desa',
    ],
  },
  {
    id: 'balita',
    label: 'Data & Profil Balita',
    route: '/kader/balita',
    icon: Baby,
    badge: '48 Anak',
    backendPath: 'kader/balita/balita_controller.go',
    description:
      'Direktori profil balita RW, registrasi anak baru dengan penyamaran NIK SHA-256, koordinat rumah, alergi, dan penerbitan Magic Token.',
    features: [
      'Enkripsi NIK satu arah (SHA-256 + salt) demi privasi medis',
      'Pencarian & filter berdasarkan RT/RW, usia, dan status gizi',
      'Auto-generate Magic Token 64-karakter untuk orang tua',
      'Detail histori kurva KMS digital per balita',
    ],
  },
  {
    id: 'timbang',
    label: 'Input Timbangan & Z-Score',
    route: '/kader/timbang',
    icon: Scale,
    badge: 'WHO LMS',
    backendPath: 'kader/timbang/timbang_controller.go',
    description:
      'Kalkulator deterministik Z-Score WHO LMS (BB/U, TB/U, BB/TB) dengan koreksi posisi ukur terlentang/berdiri dan prediksi ML Growth Faltering.',
    features: [
      'Input BB (kg), TB/PB (cm), Lingkar Kepala, dan LiLA',
      'Koreksi otomatis +/- 0.7 cm sesuai cara ukur terlentang/berdiri',
      'Kalkulasi Z-Score Permenkes No. 2 Tahun 2020 (< 200ms)',
      'Predictive Growth Trajectory (Skor Risiko Growth Faltering 0-100%)',
    ],
  },
  {
    id: 'ocr-kms',
    label: 'Smart KMS OCR (Scan KIA)',
    route: '/kader/ocr-kms',
    icon: Camera,
    badge: 'Vision AI',
    backendPath: 'kader/ocrkms/ocrkms_controller.go',
    description:
      'Pemindaian foto lembar catatan penimbangan Buku KIA fisik menggunakan Multimodal Vision AI menjadi tabel riwayat siap simpan.',
    features: [
      'Ambil foto kamera langsung atau unggah gambar lembar KMS',
      'Ekstraksi otomatis array (bulan, tanggal, berat_kg, tinggi_cm)',
      'Tabel pratinjau interaktif untuk koreksi angka sebelum simpan',
      'Batch commit riwayat penimbangan & kalkulasi ulang kurva KMS',
    ],
  },
  {
    id: 'nutri-chef',
    label: 'AI Nutri-Chef (Resep MPASI)',
    route: '/kader/nutri-chef',
    icon: ChefHat,
    badge: 'RAG AI',
    backendPath: 'kader/nutrichef/nutrichef_controller.go',
    description:
      'Generator resep MPASI pangan lokal sesuai anggaran keluarga dan tekstur usia balita berbasis RAG dokumen resmi Kemenkes RI (pgvector).',
    features: [
      'Parameter otomatis usia, status gizi Z-Score, dan pantangan alergi',
      'Pilihan bahan lokal desa & slider batas anggaran harian (Rupiah)',
      'Output menu terstruktur: takaran sendok makan, langkah masak, nutrisi',
      'Sitasi resmi Buku KIA/PMBA Kemenkes & tombol pembaca suara TTS',
    ],
  },
  {
    id: 'sinkronisasi',
    label: 'Antrean Sinkronisasi Offline',
    route: '/kader/sinkronisasi',
    icon: RefreshCw,
    badge: '0 Antrean',
    backendPath: 'kader/sinkronisasi/sinkronisasi_controller.go',
    description:
      'Manajemen antrean pencatatan timbangan lokal (IndexedDB) saat Posyandu berjalan tanpa sinyal internet dan tombol Batch Sync.',
    features: [
      'Penyimpanan transaksi timbangan offline di IndexedDB browser',
      'Kalkulasi Z-Score lokal tetap aktif meski tanpa sinyal',
      'Batch Sync satu klik saat perangkat kembali terhubung ke internet',
      'Log status pengiriman & resolusi konflik data',
    ],
  },
  {
    id: 'distribusi',
    label: 'Distribusi WhatsApp & QR',
    route: '/kader/distribusi',
    icon: Send,
    backendPath: 'kader/distribusi/distribusi_controller.go',
    description:
      'Pengiriman satu klik ringkasan hasil timbang dan tautan Magic Link Kartu Gizi ke WhatsApp orang tua serta cetak QR Code Buku KIA.',
    features: [
      'One-Click Share ringkasan tumbuh kembang & resep ke WhatsApp Ibu',
      'Penyertaan tautan Magic Link personal tanpa login untuk orang tua',
      'Generator QR Code balita untuk ditempel di sampul Buku KIA fisik',
      'Broadcast pengingat jadwal Posyandu bulan berikutnya',
    ],
  },
]

const KADER_STATS = [
  {
    label: 'Total Balita Posyandu',
    value: '48',
    badge: 'RW 04',
    sub: 'Posyandu Melati 04 • Desa Sukamaju',
  },
  {
    label: 'Sudah Ditimbang Bulan Ini',
    value: '41 / 48',
    badge: '85.4%',
    sub: '7 balita belum hadir penimbangan',
  },
  {
    label: 'Peringatan Growth Faltering',
    value: '4 Anak',
    badge: 'Early Warning',
    sub: 'Tren berat badan melambat 2 bulan',
  },
  {
    label: 'Antrean Offline (IndexedDB)',
    value: '0 Data',
    badge: 'Tersinkron',
    sub: 'Seluruh data timbangan sudah di cloud',
  },
]

export default function KaderDashboard({ user, onLogout, onSwitchRole }) {
  return (
    <RoleDashboardShell
      roleBadge="Petugas"
      roleTitle="Dasbor Petugas Posyandu"
      roleSubtitle="Pencatatan antropometri meja layanan RW, Smart KMS OCR, dan edukasi MPASI lokal."
      accentColor="#2597d0"
      user={user}
      menuItems={KADER_MENUS}
      statsCards={KADER_STATS}
      backendEndpoint="GET /api/v1/kader/dashboard"
      backendFolderHint="kader/dashboard/dashboard_controller.go"
      onLogout={onLogout}
      onSwitchRole={onSwitchRole}
    />
  )
}
