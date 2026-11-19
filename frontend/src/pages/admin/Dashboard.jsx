import {
  BookOpen,
  Database,
  LayoutDashboard,
  MapPin,
  Settings,
  ShoppingBasket,
  Users,
} from 'lucide-react'
import RoleDashboardShell from '../../components/layout/RoleDashboardShell'

const ADMIN_MENUS = [
  {
    id: 'dashboard',
    label: 'Dashboard Ikhtisar Sistem',
    route: '/admin/dashboard',
    icon: LayoutDashboard,
    badge: 'Global',
    backendPath: 'admin/dashboard/dashboard_controller.go',
    description:
      'Metrik infrastruktur desa, total Posyandu aktif, jumlah petugas terdaftar, status indeks vektor pgvector, dan sinkronisasi data.',
    features: [
      'Monitoring 8 Posyandu & RW aktif di seluruh dusun desa',
      'Status kesehatan Vector Index pgvector (156 chunks Kemenkes aktif)',
      'Ringkasan aktivitas login Kader & Bidan Desa',
      'Pemantauan antrean sinkronisasi offline seluruh perangkat lapangan',
    ],
  },
  {
    id: 'wilayah',
    label: 'Master Wilayah & Posyandu',
    route: '/admin/wilayah',
    icon: MapPin,
    badge: '8 Unit',
    backendPath: 'admin/wilayah/wilayah_controller.go',
    description:
      'Manajemen data Dusun, RW, RT, dan unit Posyandu beserta titik koordinat Latitude/Longitude untuk batas peta GIS Bidan.',
    features: [
      'CRUD profil unit Posyandu (Nama, Kode RW, Alamat Balai)',
      'Pengaturan titik koordinat GPS (Latitude & Longitude) pusat Posyandu',
      'Konfigurasi jadwal hari buka rutin bulanan per Posyandu',
      'Penetapan kuota sasaran balita (S) tingkat RW',
    ],
  },
  {
    id: 'pengguna',
    label: 'Manajemen Akun & RBAC',
    route: '/admin/pengguna',
    icon: Users,
    badge: '28 Akun',
    backendPath: 'admin/pengguna/pengguna_controller.go',
    description:
      'Pengelolaan akun Kader Posyandu, Bidan Desa, dan Admin beserta isolasi cakupan wilayah (Row-Level Scoping) dan reset Magic Token.',
    features: [
      'Pembuatan & verifikasi akun Kader, Bidan, serta Admin',
      'Pengikatan akun Kader ke posyandu_id spesifik (Row-Level Scoping)',
      'Aktivasi/penonaktifan petugas & reset kata sandi',
      'Regenerate Magic Token 64-karakter untuk keamanan kartu gizi orang tua',
    ],
  },
  {
    id: 'pangan-lokal',
    label: 'Harga Pangan Lokal Desa',
    route: '/admin/pangan-lokal',
    icon: ShoppingBasket,
    badge: '42 Bahan',
    backendPath: 'admin/panganlokal/panganlokal_controller.go',
    description:
      'Katalog komoditas bahan makanan bergizi di pasar desa beserta harga satuan eceran sebagai acuan kalkulasi biaya AI Nutri-Chef.',
    features: [
      'CRUD bahan pangan lokal (Ikan Lele, Telur Ayam, Hati Ayam, Daun Kelor, Tempe)',
      'Klasifikasi kategori gizi (Protein Hewani, Nabati, Karbohidrat, Sayur/Buah)',
      'Update harga eceran per satuan (butir, 100 gram, ikat) sesuai pasar desa',
      'Toggle ketersediaan musiman yang otomatis disinkronkan ke generator MPASI',
    ],
  },
  {
    id: 'knowledge-base',
    label: 'Knowledge Base AI (RAG)',
    route: '/admin/knowledge-base',
    icon: BookOpen,
    badge: 'pgvector',
    backendPath: 'admin/knowledgebase/knowledgebase_controller.go',
    description:
      'Unggah dokumen PDF pedoman resmi Kemenkes RI, auto-chunking & vector embedding (text-embedding-004), serta RAG Playground.',
    features: [
      'Unggah PDF Buku KIA, Pedoman PMBA Kemenkes, dan Tabel Komposisi Pangan',
      'Auto-chunking (500 token) & embedding 768 dimensi ke PostgreSQL pgvector',
      'Inspeksi daftar potongan teks (knowledge chunks) dan label bab sitasi',
      'RAG Playground untuk uji akurasi jawaban & sitasi AI sebelum dipakai kader',
    ],
  },
  {
    id: 'standar-who',
    label: 'Standar Antropometri WHO',
    route: '/admin/standar-who',
    icon: Database,
    badge: 'LMS Table',
    backendPath: 'admin/standarwho/standarwho_controller.go',
    description:
      'Inspeksi parameter referensi WHO LMS (L, M, S) usia 0-60 bulan untuk indikator BB/U, TB/U, BB/TB serta kalibrasi kalkulator klinis.',
    features: [
      'Tabel referensi parameter Box-Cox (L), Median (M), dan Variasi (S) WHO',
      'Simulator kalibrasi Z-Score untuk verifikasi kepatuhan Permenkes No. 2/2020',
      'Pengaturan ambang batas (threshold) sensitivitas prediksi ML Growth Faltering',
      'Audit integritas tabel referensi antropometri',
    ],
  },
  {
    id: 'pengaturan',
    label: 'Log Sinkronisasi & Pengaturan',
    route: '/admin/pengaturan',
    icon: Settings,
    backendPath: 'admin/pengaturan/pengaturan_controller.go',
    description:
      'Audit log sinkronisasi batch offline kader, verifikasi enkripsi hash NIK SHA-256, dan pengaturan identitas Pemerintahan Desa.',
    features: [
      'Log audit sinkronisasi batch offline dari perangkat kader seluruh RW',
      'Monitor keamanan enkripsi SHA-256 pada kolom NIK balita',
      'Pengaturan profil Desa, Kecamatan, dan kop laporan resmi PDF',
      'Kustomisasi template pesan broadcast WhatsApp orang tua',
    ],
  },
]

const ADMIN_STATS = [
  {
    label: 'Posyandu & RW Aktif',
    value: '8 Unit',
    badge: '4 Dusun',
    sub: 'Seluruh RW Desa Sukamaju aktif',
  },
  {
    label: 'Petugas Terdaftar',
    value: '28 Akun',
    badge: 'RBAC Aktif',
    sub: '24 Kader, 2 Bidan, 2 Admin',
  },
  {
    label: 'Komoditas Pangan Lokal',
    value: '42 Bahan',
    badge: 'Terverifikasi',
    sub: 'Harga pasar desa minggu ini',
  },
  {
    label: 'Vector Index (pgvector)',
    value: '156 Chunks',
    badge: 'Optimal',
    sub: '12 Dokumen Pedoman Kemenkes RI',
  },
]

export default function AdminDashboard({ user, onLogout, onSwitchRole }) {
  return (
    <RoleDashboardShell
      roleBadge="Admin"
      roleTitle="Dasbor Super Admin Desa & Sistem"
      roleSubtitle="Manajemen master wilayah, hak akses pengguna RBAC, katalog harga pangan lokal, dan Knowledge Base RAG Kemenkes."
      accentColor="#1e3a8a"
      user={user}
      menuItems={ADMIN_MENUS}
      statsCards={ADMIN_STATS}
      backendEndpoint="GET /api/v1/admin/dashboard"
      backendFolderHint="admin/dashboard/dashboard_controller.go"
      onLogout={onLogout}
      onSwitchRole={onSwitchRole}
    />
  )
}
