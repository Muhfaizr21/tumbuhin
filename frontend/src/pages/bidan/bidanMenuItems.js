import {
  Activity,
  AlertTriangle,
  ClipboardCheck,
  FileSpreadsheet,
  HeartPulse,
  LayoutDashboard,
  MapPin,
} from 'lucide-react'

/**
 * Sidebar menu for the Batch 2 Bidan pages that render outside BidanDashboard.
 * Routes mirror fitur.md "Struktur Menu Sidebar Bidan" so navigation keeps
 * working when the user jumps between the two shells.
 */
export const BIDAN_MENU_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard Epidemiologi Desa',
    route: '/bidan/dashboard',
    icon: LayoutDashboard,
    badge: 'Surveilans',
    description: 'Agregasi status gizi seluruh Posyandu desa dan tren prevalensi 12 bulan.',
  },
  {
    id: 'peta-gis',
    label: 'Peta GIS & Klaster Risiko',
    route: '/bidan/peta-gis',
    icon: MapPin,
    badge: 'GIS',
    description: 'Pemetaan spasial RT/RW dengan indikator warna tingkat risiko gizi.',
  },
  {
    id: 'prioritas',
    label: 'Daftar Prioritas Intervensi',
    route: '/bidan/prioritas',
    icon: AlertTriangle,
    badge: 'Triase',
    description: 'Tabel triase medis otomatis untuk balita Stunted, Wasted, dan pre-stunting.',
  },
  {
    id: 'intervensi',
    label: 'Kunjungan Rumah (Home Visit)',
    route: '/bidan/intervensi',
    icon: HeartPulse,
    badge: 'SOAP',
    description: 'Penjadwalan kunjungan lapangan dan pencatatan klinis format SOAP oleh Bidan Desa.',
  },
  {
    id: 'pmt-evaluasi',
    label: 'Evaluasi Program PMT',
    route: '/bidan/pmt-evaluasi',
    icon: Activity,
    badge: '90 Hari',
    description: 'Monitoring kohor balita penerima PMT 90 hari untuk mengukur kenaikan berat badan dan graduasi.',
  },
  {
    id: 'supervisi',
    label: 'Supervisi Posyandu & Audit',
    route: '/bidan/supervisi',
    icon: ClipboardCheck,
    description: 'Audit kualitas input antropometri petugas dan monitoring ketepatan waktu pelaporan.',
  },
  {
    id: 'laporan',
    label: 'Laporan & Ekspor e-PPGBM',
    route: '/bidan/laporan',
    icon: FileSpreadsheet,
    badge: 'CSV',
    description: 'Generator laporan gizi bulanan tingkat desa siap ekspor format e-PPGBM.',
  },
]

/**
 * BIDAN_MENUS — full format required by BidanNavigationShell
 * (includes shortLabel, icon, badge, route for the dual-sidebar navigation).
 */
export const BIDAN_MENUS = [
  {
    id: 'dashboard',
    label: 'Dashboard Epidemiologi Desa',
    shortLabel: 'Epidemiologi Desa',
    route: '/bidan/dashboard',
    icon: LayoutDashboard,
    badge: 'Surveilans',
    description: 'Agregasi status gizi seluruh Posyandu desa, grafik tren prevalensi Stunting dan Wasting 12 bulan.',
  },
  {
    id: 'peta-gis',
    label: 'Peta GIS & Klaster Risiko',
    shortLabel: 'Peta GIS Klaster',
    route: '/bidan/peta-gis',
    icon: MapPin,
    badge: 'GIS',
    description: 'Pemetaan spasial interaktif tingkat RT/RW dengan indikator warna tingkat risiko stunting.',
  },
  {
    id: 'prioritas',
    label: 'Daftar Prioritas Intervensi',
    shortLabel: 'Triase Prioritas',
    route: '/bidan/prioritas',
    icon: AlertTriangle,
    badge: 'Triase',
    description: 'Tabel triase medis otomatis yang mengurutkan balita Stunted/Wasted serta balita pre-stunting.',
  },
  {
    id: 'intervensi',
    label: 'Kunjungan Rumah (Home Visit)',
    shortLabel: 'Home Visit SOAP',
    route: '/bidan/intervensi',
    icon: HeartPulse,
    badge: 'SOAP',
    description: 'Penjadwalan kunjungan lapangan dan pencatatan klinis format SOAP oleh Bidan Desa.',
  },
  {
    id: 'pmt-evaluasi',
    label: 'Evaluasi Program PMT',
    shortLabel: 'Evaluasi PMT 90H',
    route: '/bidan/pmt-evaluasi',
    icon: Activity,
    description: 'Monitoring kohor balita penerima intervensi PMT 90 hari untuk mengukur dampak kenaikan BB.',
  },
  {
    id: 'supervisi',
    label: 'Supervisi Posyandu & Audit',
    shortLabel: 'Supervisi & Audit',
    route: '/bidan/supervisi',
    icon: ClipboardCheck,
    description: 'Audit kualitas input antropometri petugas dan monitoring ketepatan waktu pelaporan bulanan.',
  },
  {
    id: 'laporan',
    label: 'Laporan & Ekspor e-PPGBM',
    shortLabel: 'Ekspor e-PPGBM',
    route: '/bidan/laporan',
    icon: FileSpreadsheet,
    badge: 'CSV/PDF',
    description: 'Generator laporan gizi bulanan resmi tingkat desa yang siap diekspor ke format e-PPGBM.',
  },
]
