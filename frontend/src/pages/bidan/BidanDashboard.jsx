import { useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ClipboardCheck,
  FileSpreadsheet,
  HeartPulse,
  LayoutDashboard,
  MapPin,
} from 'lucide-react'
import RoleDashboardShell from '../../components/layout/RoleDashboardShell'
import { fetchRoleDashboardData } from '../../lib/authApi'
import PetaGIS from './PetaGIS'
import PrioritasList from './PrioritasList'

const BIDAN_MENUS = [
  {
    id: 'dashboard',
    label: 'Dashboard Epidemiologi Desa',
    route: '/bidan/dashboard',
    icon: LayoutDashboard,
    badge: 'Surveilans',
    backendPath: 'bidan/dashboard/dashboard_controller.go',
    description:
      'Agregasi status gizi seluruh Posyandu desa, grafik tren prevalensi Stunting/Wasting 12 bulan, dan perbandingan indikator SKDN.',
    features: [
      'KPI Prevalensi Stunting (TB/U < -2 SD) & Wasting (BB/TB < -2 SD)',
      'Grafik tren bulanan pergerakan status gizi desa',
      'Perbandingan capaian SKDN (Sasaran, KMS, Datang, Naik) antar-RW',
      'Distribusi kerawanan pada kelompok kritis 1000 HPK (0-23 bulan)',
    ],
  },
  {
    id: 'peta-gis',
    label: 'Peta GIS & Klaster Risiko',
    route: '/bidan/peta-gis',
    icon: MapPin,
    badge: 'Leaflet GIS',
    backendPath: 'bidan/petagis/petagis_controller.go',
    description:
      'Pemetaan spasial interaktif tingkat RT/RW dengan indikator warna tingkat risiko stunting untuk identifikasi kantong kerawanan gizi.',
    features: [
      'Peta interaktif Leaflet/OpenStreetMap tingkat RT/RW desa',
      'Cluster Marker & Heatmap warna: Merah (Kritis), Kuning (Waspada), Hijau (Aman)',
      'Filter layer spasial berdasarkan indikator TB/U, BB/TB, dan status Home Visit',
      'Popup profil klinis rumah balita beserta koordinat rute kunjungan',
    ],
  },
  {
    id: 'prioritas',
    label: 'Daftar Prioritas Intervensi',
    route: '/bidan/prioritas',
    icon: AlertTriangle,
    badge: '19 Kasus',
    backendPath: 'bidan/prioritas/prioritas_controller.go',
    description:
      'Tabel triase medis otomatis yang mengurutkan balita Stunted/Wasted serta balita Normal dengan skor prediksi ML Growth Faltering tinggi.',
    features: [
      'Triase Prioritas 1 (Merah): Severely Stunted / Severely Wasted (Z < -3 SD)',
      'Triase Prioritas 2 (Oranye): Stunted / Wasted (-3 SD <= Z < -2 SD)',
      'Triase Prioritas 3 (Kuning Pre-Stunting): Normal dengan ML Faltering >= 70%',
      'Kirim instruksi langsung ke Kader Posyandu RW terkait',
    ],
  },
  {
    id: 'intervensi',
    label: 'Kunjungan Rumah (Home Visit)',
    route: '/bidan/intervensi',
    icon: HeartPulse,
    badge: '6 Jadwal',
    backendPath: 'bidan/intervensi/intervensi_controller.go',
    description:
      'Penjadwalan kunjungan lapangan dan pencatatan klinis format SOAP oleh Bidan Desa beserta pemberian paket PMT dan rujukan Puskesmas.',
    features: [
      'Manajemen status kunjungan: SCHEDULED, COMPLETED, FOLLOW_UP, REFERRED',
      'Form catatan klinis SOAP (pola makan, sanitasi air, penyakit infeksi penyerta)',
      'Pencatatan distribusi PMT Pemulihan & suplemen mikronutrien',
      'Sinkronisasi otomatis catatan Bidan ke portal Magic Link orang tua',
    ],
  },
  {
    id: 'pmt-evaluasi',
    label: 'Evaluasi Program PMT',
    route: '/bidan/pmt-evaluasi',
    icon: Activity,
    backendPath: 'bidan/pmtevaluasi/pmtevaluasi_controller.go',
    description:
      'Monitoring kohor balita penerima intervensi PMT 90 hari untuk mengukur dampak kenaikan berat badan dan graduasi status gizi.',
    features: [
      'Pelacakan delta kenaikan berat badan (gram) hari ke-0, 30, 60, dan 90',
      'Grafik Before vs After perubahan Z-Score pasca-intervensi PMT',
      'Persentase tingkat graduasi balita kembali ke pita hijau KMS',
      'Evaluasi efektivitas anggaran PMT desa',
    ],
  },
  {
    id: 'supervisi',
    label: 'Supervisi Posyandu & Audit',
    route: '/bidan/supervisi',
    icon: ClipboardCheck,
    backendPath: 'bidan/supervisi/supervisi_controller.go',
    description:
      'Audit kualitas input antropometri kader (deteksi outlier Z-Score ekstrem) dan monitoring ketepatan waktu pelaporan bulanan tiap RW.',
    features: [
      'Deteksi otomatis angka outlier (misal Z-Score > +4 SD atau TB menyusut)',
      'Tombol permintaan verifikasi/ukur ulang ke Kader Posyandu',
      'Status kelengkapan rekapitulasi bulanan 8 Posyandu desa',
      'Penguncian data bulanan setelah tervalidasi Bidan',
    ],
  },
  {
    id: 'laporan',
    label: 'Laporan & Ekspor e-PPGBM',
    route: '/bidan/laporan',
    icon: FileSpreadsheet,
    badge: '.xlsx / .pdf',
    backendPath: 'bidan/laporan/laporan_controller.go',
    description:
      'Generator laporan gizi bulanan resmi tingkat desa yang siap diekspor ke format Excel (.xlsx) standar e-PPGBM Kemenkes dan PDF.',
    features: [
      'Filter laporan berdasarkan periode bulan/tahun dan unit Posyandu',
      'Ekspor satu klik ke format Excel (.xlsx) kompatibel e-PPGBM',
      'Cetak laporan eksekutif PDF lengkap dengan grafik SKDN & tanda tangan Bidan',
      'Arsip riwayat pelaporan bulanan ke Puskesmas Kecamatan',
    ],
  },
]

const BIDAN_STATS = [
  {
    label: 'Cakupan Balita Desa',
    value: '342 Anak',
    badge: '8 Posyandu',
    sub: 'Partisipasi timbang (D/S): 89.2%',
  },
  {
    label: 'Prevalensi Stunting Desa',
    value: '8.4%',
    badge: 'Turun 1.2%',
    sub: 'Target nasional < 14% tercapai',
  },
  {
    label: 'Early Warning Faltering',
    value: '19 Anak',
    badge: 'Pre-Stunting',
    sub: 'Skor regresi ML >= 70% bulan ini',
  },
  {
    label: 'Jadwal Home Visit Aktif',
    value: '6 Kasus',
    badge: 'Prioritas',
    sub: 'Menunggu kunjungan lapangan minggu ini',
  },
]

export default function BidanDashboard({
  user,
  currentSubPage = 'dashboard',
  onLogout,
  onSwitchRole,
}) {
  const [statsCards, setStatsCards] = useState(BIDAN_STATS)
  const [sourceNote, setSourceNote] = useState('Sinkronisasi...')
  const [activeMenuId, setActiveMenuId] = useState(() => {
    if (currentSubPage === 'peta-gis' || currentSubPage === 'gis') return 'peta-gis'
    if (currentSubPage === 'prioritas') return 'prioritas'
    return 'dashboard'
  })

  useEffect(() => {
    if (currentSubPage === 'peta-gis' || currentSubPage === 'gis') {
      setActiveMenuId('peta-gis')
    } else if (currentSubPage === 'prioritas') {
      setActiveMenuId('prioritas')
    } else if (currentSubPage === 'dashboard' || !currentSubPage) {
      setActiveMenuId('dashboard')
    }
  }, [currentSubPage])

  useEffect(() => {
    async function loadEpidemiologyStats() {
      try {
        const res = await fetchRoleDashboardData('/bidan/dashboard')
        if (res) {
          setStatsCards([
            {
              label: 'Cakupan Balita Desa',
              value: `${res.total_balita_desa || 342} Anak`,
              badge: '8 Posyandu',
              sub: 'Tercatat di basis data desa',
            },
            {
              label: 'Prevalensi Stunting Desa',
              value: `${(res.stunting_prevalence || 8.4).toFixed(1)}%`,
              badge: res.stunting_prevalence < 14 ? 'Target Tercapai' : 'Waspada',
              sub: `Kasus Wasting: ${res.wasting_count || 11} Balita`,
            },
            {
              label: 'Early Warning Faltering',
              value: `${res.high_risk_faltering || 19} Anak`,
              badge: 'Pre-Stunting',
              sub: 'Prediksi ML skor >= 70%',
            },
            {
              label: 'Jadwal Home Visit Aktif',
              value: `${res.pending_home_visits || 6} Kasus`,
              badge: 'Prioritas',
              sub: 'Menunggu kunjungan lapangan bidan',
            },
          ])
          setSourceNote('Data Realtime Database')
        }
      } catch (err) {
        console.warn('Menggunakan data default seeder:', err)
        setSourceNote('Data Seeder Baseline')
      }
    }

    loadEpidemiologyStats()
  }, [])

  const handleMenuSelect = (item) => {
    setActiveMenuId(item.id)
    if (item.route) {
      window.location.hash = `#${item.route}`
    }
  }

  // Determine what view to render inside the main dashboard workspace
  let workspaceContent = null
  if (activeMenuId === 'peta-gis') {
    workspaceContent = <PetaGIS user={user} embedded={true} />
  } else if (activeMenuId === 'prioritas') {
    workspaceContent = <PrioritasList user={user} embedded={true} />
  }

  return (
    <RoleDashboardShell
      roleBadge="Bidan"
      roleTitle="Dasbor Klinis & Epidemiologi Bidan Desa"
      roleSubtitle={`Surveilans gizi tingkat desa (${sourceNote}), pemetaan GIS klaster risiko, triase intervensi, dan pelaporan Puskesmas.`}
      accentColor="#070709"
      user={user}
      menuItems={BIDAN_MENUS}
      statsCards={statsCards}
      activeMenuId={activeMenuId}
      backendEndpoint="GET /api/v1/bidan/dashboard"
      backendFolderHint="bidan/dashboard/dashboard_controller.go"
      onLogout={onLogout}
      onSwitchRole={onSwitchRole}
      onMenuSelect={handleMenuSelect}
    >
      {workspaceContent}
    </RoleDashboardShell>
  )
}
