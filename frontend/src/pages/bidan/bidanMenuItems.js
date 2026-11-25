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
 * Single Source of Truth for Role 2: Bidan Desa Navigation Menus.
 */
export const BIDAN_MENUS = [
  {
    id: 'dashboard',
    label: 'Dashboard Epidemiologi Desa',
    shortLabel: 'Epidemiologi Desa',
    route: '/bidan/dashboard',
    icon: LayoutDashboard,
    badge: 'Surveilans',
    backendPath: 'bidan/dashboard/dashboard_controller.go',
    description:
      'Agregasi status gizi seluruh Posyandu desa, grafik tren prevalensi Stunting dan Wasting 12 bulan, serta perbandingan indikator SKDN.',
  },
  {
    id: 'peta-gis',
    label: 'Peta GIS & Klaster Risiko',
    shortLabel: 'Peta GIS Klaster',
    route: '/bidan/peta-gis',
    icon: MapPin,
    badge: 'GIS',
    backendPath: 'bidan/petagis/petagis_controller.go',
    description:
      'Pemetaan spasial interaktif tingkat RT/RW dengan indikator warna tingkat risiko stunting untuk identifikasi kantong kerawanan gizi.',
  },
  {
    id: 'prioritas',
    label: 'Daftar Prioritas Intervensi',
    shortLabel: 'Triase Prioritas',
    route: '/bidan/prioritas',
    icon: AlertTriangle,
    badge: 'Triase',
    backendPath: 'bidan/prioritas/prioritas_controller.go',
    description:
      'Tabel triase medis otomatis yang mengurutkan balita Stunted/Wasted serta balita Normal dengan skor prediksi ML Growth Faltering tinggi.',
  },
  {
    id: 'intervensi',
    label: 'Kunjungan Rumah (Home Visit)',
    shortLabel: 'Home Visit SOAP',
    route: '/bidan/intervensi',
    icon: HeartPulse,
    badge: 'SOAP',
    backendPath: 'bidan/interventions/interventions_controller.go',
    description:
      'Penjadwalan kunjungan lapangan dan pencatatan klinis format SOAP oleh Bidan Desa beserta pemberian paket PMT dan rujukan Puskesmas.',
  },
  {
    id: 'pmt-evaluasi',
    label: 'Evaluasi Program PMT',
    shortLabel: 'Evaluasi PMT 90H',
    route: '/bidan/pmt-evaluasi',
    icon: Activity,
    badge: '90 Hari',
    backendPath: 'bidan/pmt_evaluations/pmt_evaluations_controller.go',
    description:
      'Monitoring kohor balita penerima intervensi PMT 90 hari untuk mengukur dampak kenaikan berat badan dan graduasi status gizi.',
  },
  {
    id: 'supervisi',
    label: 'Supervisi Posyandu & Audit',
    shortLabel: 'Supervisi & Audit',
    route: '/bidan/supervisi',
    icon: ClipboardCheck,
    backendPath: 'bidan/supervisi/supervisi_controller.go',
    description:
      'Audit kualitas input antropometri petugas (deteksi outlier Z-Score ekstrem) dan monitoring ketepatan waktu pelaporan bulanan tiap RW.',
  },
  {
    id: 'laporan',
    label: 'Laporan & Ekspor e-PPGBM',
    shortLabel: 'Ekspor e-PPGBM',
    route: '/bidan/laporan',
    icon: FileSpreadsheet,
    badge: 'CSV/PDF',
    backendPath: 'bidan/laporan/laporan_controller.go',
    description:
      'Generator laporan gizi bulanan resmi tingkat desa yang siap diekspor ke format kompatibel e-PPGBM Kemenkes.',
  },
]

export const BIDAN_MENU_ITEMS = BIDAN_MENUS
