import { useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  HeartPulse,
  LayoutDashboard,
  MapPin,
  Menu,
  Plus,
  Search,
  Stethoscope,
  X,
} from 'lucide-react'
import { fetchRoleDashboardData } from '../../lib/authApi'
import BidanNavigationShell from './components/BidanNavigationShell'
import BidanRightPanel from './components/BidanRightPanel'
import CircularProgressRing from './components/CircularProgressRing'
import PetaGIS from './PetaGIS'
import PrioritasList from './PrioritasList'

const BIDAN_MENUS = [
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
    features: [
      'KPI Prevalensi Stunting (TB/U < -2 SD) dan Wasting (BB/TB < -2 SD)',
      'Grafik tren bulanan pergerakan status gizi desa',
      'Perbandingan capaian SKDN (Sasaran, KMS, Datang, Naik) antar-RW',
      'Distribusi kerawanan pada kelompok kritis 1000 HPK (0-23 bulan)',
    ],
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
    features: [
      'Peta interaktif Leaflet/OpenStreetMap tingkat RT/RW desa',
      'Cluster Marker warna: Merah (Kritis), Kuning (Waspada), Hijau (Aman)',
      'Filter layer spasial berdasarkan indikator TB/U, BB/TB, dan status Home Visit',
      'Popup profil klinis rumah balita beserta koordinat rute kunjungan',
    ],
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
    features: [
      'Triase Prioritas 1 (Merah): Severely Stunted / Severely Wasted (Z < -3 SD)',
      'Triase Prioritas 2 (Oranye): Stunted / Wasted (-3 SD s/d -2 SD)',
      'Triase Prioritas 3 (Kuning Pre-Stunting): Normal dengan ML Faltering >= 70%',
      'Kirim instruksi langsung ke Petugas Posyandu RW terkait',
    ],
  },
  {
    id: 'intervensi',
    label: 'Kunjungan Rumah (Home Visit)',
    shortLabel: 'Home Visit SOAP',
    route: '/bidan/intervensi',
    icon: HeartPulse,
    badge: 'SOAP',
    backendPath: 'bidan/intervensi/intervensi_controller.go',
    description:
      'Penjadwalan kunjungan lapangan dan pencatatan klinis format SOAP oleh Bidan Desa beserta pemberian paket PMT dan rujukan Puskesmas.',
    features: [
      'Manajemen status kunjungan: SCHEDULED, COMPLETED, FOLLOW_UP, REFERRED',
      'Form catatan klinis SOAP (pola makan, sanitasi air, penyakit infeksi penyerta)',
      'Pencatatan distribusi PMT Pemulihan dan suplemen mikronutrien',
      'Sinkronisasi otomatis catatan Bidan ke portal buku KIA digital orang tua',
    ],
  },
  {
    id: 'pmt-evaluasi',
    label: 'Evaluasi Program PMT',
    shortLabel: 'Evaluasi PMT 90H',
    route: '/bidan/pmt-evaluasi',
    icon: Activity,
    backendPath: 'bidan/pmtevaluasi/pmtevaluasi_controller.go',
    description:
      'Monitoring kohor balita penerima intervensi PMT 90 hari untuk mengukur dampak kenaikan berat badan dan graduasi status gizi.',
    features: [
      'Pelacakan delta kenaikan berat badan (gram) hari ke-0, 30, 60, dan 90',
      'Perbandingan Before vs After perubahan Z-Score pasca-intervensi PMT',
      'Persentase tingkat graduasi balita kembali ke pita hijau KMS',
      'Evaluasi efektivitas distribusi PMT tingkat RW',
    ],
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
    features: [
      'Deteksi otomatis angka outlier (misal Z-Score > +4 SD atau TB menyusut)',
      'Permintaan verifikasi atau ukur ulang ke Petugas Posyandu',
      'Status kelengkapan rekapitulasi bulanan 8 Posyandu desa',
      'Penguncian data bulanan setelah tervalidasi Bidan',
    ],
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
    features: [
      'Filter laporan berdasarkan periode bulan/tahun dan unit Posyandu',
      'Ekspor satu klik data ringkasan surveilans gizi desa',
      'Rekapitulasi indikator SKDN terverifikasi Bidan Desa',
      'Arsip riwayat pelaporan bulanan ke Puskesmas Kecamatan',
    ],
  },
]

const QUICK_ACCESS_ITEMS = [
  {
    id: 'dashboard',
    label: 'Epidemiologi',
    icon: LayoutDashboard,
    boxBg: 'bg-indigo-50 text-indigo-600',
  },
  {
    id: 'peta-gis',
    label: 'Peta GIS',
    icon: MapPin,
    boxBg: 'bg-rose-50 text-rose-600',
  },
  {
    id: 'prioritas',
    label: 'Triase Gizi',
    icon: AlertTriangle,
    boxBg: 'bg-amber-50 text-amber-600',
  },
  {
    id: 'intervensi',
    label: 'Home Visit',
    icon: HeartPulse,
    boxBg: 'bg-sky-50 text-[#2597d0]',
  },
  {
    id: 'pmt-evaluasi',
    label: 'Evaluasi PMT',
    icon: Activity,
    boxBg: 'bg-teal-50 text-teal-600',
  },
  {
    id: 'supervisi',
    label: 'Audit Data',
    icon: ClipboardCheck,
    boxBg: 'bg-blue-50 text-blue-600',
  },
  {
    id: 'laporan',
    label: 'e-PPGBM',
    icon: FileSpreadsheet,
    boxBg: 'bg-emerald-50 text-emerald-600',
  },
]

export default function BidanDashboard({
  user,
  currentSubPage = 'dashboard',
  onLogout,
  onSwitchRole,
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')
  const [createTriggerCount, setCreateTriggerCount] = useState(0)
  const [priorityChildren, setPriorityChildren] = useState([])
  const [exportNotice, setExportNotice] = useState('')

  const [statsSummary, setStatsSummary] = useState({
    totalBalita: 342,
    stuntingPrevalence: 8.4,
    wastingCount: 11,
    highRiskCount: 19,
    pendingVisits: 6,
    redCount: 0,
    sourceLabel: 'Sinkronisasi Basis Data',
  })

  const [activeMenuId, setActiveMenuId] = useState(() => {
    if (currentSubPage === 'peta-gis' || currentSubPage === 'gis') return 'peta-gis'
    if (currentSubPage === 'prioritas') return 'prioritas'
    const found = BIDAN_MENUS.find((m) => m.id === currentSubPage)
    return found ? found.id : 'dashboard'
  })

  useEffect(() => {
    if (currentSubPage === 'peta-gis' || currentSubPage === 'gis') {
      setActiveMenuId('peta-gis')
    } else if (currentSubPage === 'prioritas') {
      setActiveMenuId('prioritas')
    } else if (currentSubPage) {
      const found = BIDAN_MENUS.find((m) => m.id === currentSubPage)
      setActiveMenuId(found ? found.id : 'dashboard')
    }
  }, [currentSubPage])

  useEffect(() => {
    async function fetchOverview() {
      try {
        const [dashRes, priorityRes] = await Promise.all([
          fetchRoleDashboardData('/bidan/dashboard').catch(() => null),
          fetchRoleDashboardData('/bidan/priority-list').catch(() => null),
        ])

        const pList = Array.isArray(priorityRes) ? priorityRes : []
        setPriorityChildren(pList)
        const redCases = pList.filter((c) => c.triage_category === 'MERAH').length

        if (dashRes) {
          setStatsSummary({
            totalBalita: dashRes.total_balita_desa || 342,
            stuntingPrevalence: Number(dashRes.stunting_prevalence ?? 8.4),
            wastingCount: dashRes.wasting_count ?? 11,
            highRiskCount: dashRes.high_risk_faltering ?? (pList.length || 19),
            pendingVisits: dashRes.pending_home_visits ?? 6,
            redCount: redCases,
            sourceLabel: 'PostgreSQL Live',
          })
        }
      } catch {
        // Keep clean initial metrics
      }
    }

    fetchOverview()
  }, [])

  const handleSelectMenu = (itemOrId) => {
    const targetMenu =
      typeof itemOrId === 'string'
        ? BIDAN_MENUS.find((m) => m.id === itemOrId) || BIDAN_MENUS[0]
        : itemOrId

    setActiveMenuId(targetMenu.id)
    setMobileMenuOpen(false)
    if (targetMenu.route) {
      window.location.hash = `#${targetMenu.route}`
    }
  }

  const handleOpenQuickAdd = () => {
    setActiveMenuId('prioritas')
    window.location.hash = '#/bidan/prioritas'
    setCreateTriggerCount((prev) => prev + 1)
  }

  const handlePriorityDataChange = (updatedList) => {
    setPriorityChildren(updatedList)
    const redCases = updatedList.filter((c) => c.triage_category === 'MERAH').length
    const pendingCount = updatedList.filter((c) => c.pending_intervention).length
    setStatsSummary((prev) => ({
      ...prev,
      highRiskCount: updatedList.length || prev.highRiskCount,
      pendingVisits: pendingCount,
      redCount: redCases,
    }))
  }

  const handleExportCSV = () => {
    const rows = [
      ['Nama Balita', 'Usia (Bulan)', 'JK', 'Posyandu', 'RW', 'Status Gizi', 'Z-Score TB/U', 'ML Risk (%)', 'Triase'],
      ...priorityChildren.map((c) => [
        c.child_name,
        c.age_months,
        c.gender,
        c.posyandu_name,
        c.rw_code,
        c.nutrition_status,
        c.zscore_hfa,
        c.faltering_risk_score,
        c.triage_category,
      ]),
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((r) => r.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `e-PPGBM_Surveilans_${user?.village_name || 'Desa_Sukamaju'}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setExportNotice('Berkas laporan CSV standar e-PPGBM berhasil diunduh.')
    setTimeout(() => setExportNotice(''), 4000)
  }

  const currentMenu = BIDAN_MENUS.find((m) => m.id === activeMenuId) || BIDAN_MENUS[0]
  const bidanFirstName = (user?.full_name || 'Bidan Rina').split(' ').slice(0, 2).join(' ')
  const bidanInitials = (user?.full_name || 'BR')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  // Calculate ring percentages for Top 3 Storage-Style Cards
  const dsCoveragePercent = 89
  const targetBebasStuntingPercent = Math.max(
    Math.min(Math.round(100 - statsSummary.stuntingPrevalence * 2), 98),
    12
  )
  const visitActionPercent =
    priorityChildren.length > 0
      ? Math.round(
          ((priorityChildren.length -
            priorityChildren.filter((c) => c.pending_intervention).length) /
            priorityChildren.length) *
            100
        )
      : 68

  return (
    <div className="min-h-dvh bg-[#f6f9fc] text-slate-800 flex flex-col lg:flex-row font-runde selection:bg-[#2597d0] selection:text-white">
      {/* Mobile Header Bar */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#2597d0] text-white flex items-center justify-center shadow-xs">
            <Stethoscope className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <span className="font-bold text-[15px] text-slate-800">Tumbuhin</span>
            <span className="ml-2 px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-[#edf7fe] text-[#2597d0]">
              Bidan Desa
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Buka menu navigasi"
          className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 cursor-pointer"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" aria-hidden="true" />
          ) : (
            <Menu className="w-5 h-5 text-[#2597d0]" aria-hidden="true" />
          )}
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex bg-slate-900/40 backdrop-blur-xs">
          <BidanNavigationShell
            menus={BIDAN_MENUS}
            activeMenuId={activeMenuId}
            user={user}
            sidebarCollapsed={false}
            onToggleCollapse={() => setMobileMenuOpen(false)}
            onSelectMenu={handleSelectMenu}
            onOpenQuickAdd={handleOpenQuickAdd}
            onSwitchRole={onSwitchRole}
            onLogout={onLogout}
            statsSummary={statsSummary}
          />
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setMobileMenuOpen(false)}
            className="flex-1"
          />
        </div>
      )}

      {/* Desktop Left Dual Navigation Shell (Blue Icon Rail + White Sidebar) */}
      <div className="hidden lg:flex">
        <BidanNavigationShell
          menus={BIDAN_MENUS}
          activeMenuId={activeMenuId}
          user={user}
          sidebarCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
          onSelectMenu={handleSelectMenu}
          onOpenQuickAdd={handleOpenQuickAdd}
          onSwitchRole={onSwitchRole}
          onLogout={onLogout}
          statsSummary={statsSummary}
        />
      </div>

      {/* Center Main Workspace */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-7 overflow-y-auto space-y-6">
        {/* Top Utility & Greeting Bar (Matching Reference Search + "Hi, Ilham") */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <label htmlFor="bidan-global-search" className="sr-only">
              Cari modul, balita, atau Posyandu
            </label>
            <Search
              className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              id="bidan-global-search"
              type="text"
              placeholder="Cari data balita, Posyandu RW, atau modul klinis..."
              value={globalSearch}
              onChange={(e) => {
                setGlobalSearch(e.target.value)
                if (e.target.value.trim().length > 1 && activeMenuId === 'dashboard') {
                  // Automatically filter below
                }
              }}
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white border border-slate-100 text-[13px] text-slate-800 placeholder:text-slate-400 shadow-2xs focus:outline-none focus:border-[#2597d0] transition-colors"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4">
            <button
              type="button"
              onClick={() => handleSelectMenu('prioritas')}
              title="Notifikasi Triase Prioritas"
              aria-label="Lihat Notifikasi Triase Prioritas"
              className="relative w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-600 hover:text-[#2597d0] hover:bg-[#edf7fe] flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" aria-hidden="true" />
              {statsSummary.pendingVisits > 0 && (
                <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>

            <div className="flex items-center gap-3 bg-white px-3.5 py-1.5 rounded-2xl border border-slate-100 shadow-2xs">
              <span className="text-[13.5px] font-bold text-slate-800">
                Halo, {bidanFirstName}
              </span>
              <div
                className="w-8 h-8 rounded-full bg-[#2597d0] text-white font-bold text-[12px] flex items-center justify-center shrink-0"
                aria-hidden="true"
              >
                {bidanInitials}
              </div>
            </div>
          </div>
        </div>

        {exportNotice && (
          <div
            role="status"
            className="p-3.5 px-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[12.5px] font-medium flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              <span>{exportNotice}</span>
            </span>
            <button
              type="button"
              onClick={() => setExportNotice('')}
              className="font-semibold underline cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Top 3 Featured Storage-Style Cards with Circular SVG Progress Rings */}
        <section aria-label="Ringkasan Surveilans Utama">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Primary Blue Card (Matching Dropbox active blue card in reference) */}
            <button
              type="button"
              onClick={() => handleSelectMenu('dashboard')}
              className={`p-5 rounded-2xl text-left flex items-center justify-between gap-4 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2597d0] ${
                activeMenuId === 'dashboard'
                  ? 'bg-[#2597d0] text-white shadow-md shadow-[#2597d0]/15'
                  : 'bg-[#2597d0] text-white opacity-95 hover:opacity-100 shadow-sm'
              }`}
            >
              <div className="space-y-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white text-[#2597d0] flex items-center justify-center shadow-xs">
                  <Stethoscope className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold tracking-tight truncate">
                    Cakupan Balita Desa
                  </h3>
                  <p className="text-[12px] text-white/85 mt-0.5 truncate">
                    {statsSummary.totalBalita} Anak / 8 Posyandu
                  </p>
                </div>
              </div>
              <CircularProgressRing
                percentage={dsCoveragePercent}
                isPrimaryCard={true}
              />
            </button>

            {/* Card 2: White Card (Matching Google Drive card in reference) */}
            <button
              type="button"
              onClick={() => handleSelectMenu('peta-gis')}
              className={`p-5 rounded-2xl bg-white border text-left flex items-center justify-between gap-4 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2597d0] ${
                activeMenuId === 'peta-gis'
                  ? 'border-[#2597d0] ring-2 ring-[#2597d0]/15 shadow-sm'
                  : 'border-slate-100 hover:border-slate-200 shadow-2xs'
              }`}
            >
              <div className="space-y-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <MapPin className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-slate-800 tracking-tight truncate">
                    Peta Klaster GIS
                  </h3>
                  <p className="text-[12px] text-slate-400 mt-0.5 truncate">
                    Prevalensi {statsSummary.stuntingPrevalence.toFixed(1)}% / Target &lt;14%
                  </p>
                </div>
              </div>
              <CircularProgressRing
                percentage={targetBebasStuntingPercent}
                isPrimaryCard={false}
                accentColor="#10b981"
              />
            </button>

            {/* Card 3: White Card (Matching One Drive card in reference) */}
            <button
              type="button"
              onClick={() => handleSelectMenu('prioritas')}
              className={`p-5 rounded-2xl bg-white border text-left flex items-center justify-between gap-4 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2597d0] ${
                activeMenuId === 'prioritas'
                  ? 'border-[#2597d0] ring-2 ring-[#2597d0]/15 shadow-sm'
                  : 'border-slate-100 hover:border-slate-200 shadow-2xs'
              }`}
            >
              <div className="space-y-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-slate-800 tracking-tight truncate">
                    Triase &amp; Intervensi
                  </h3>
                  <p className="text-[12px] text-slate-400 mt-0.5 truncate">
                    {statsSummary.highRiskCount} Kasus / {statsSummary.pendingVisits} Home Visit
                  </p>
                </div>
              </div>
              <CircularProgressRing
                percentage={visitActionPercent}
                isPrimaryCard={false}
                accentColor="#2597d0"
              />
            </button>
          </div>
        </section>

        {/* Quick Access Icon Grid (Matching "Quick Access" row of 8 tiles in reference) */}
        <section aria-label="Akses Cepat Modul Bidan">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-bold text-slate-800 tracking-tight">
              Akses Cepat Modul Klinis
            </h2>
            <span className="text-[11.5px] text-slate-400">
              {currentMenu.label}
            </span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {QUICK_ACCESS_ITEMS.map((item) => {
              const Icon = item.icon
              const isCurrent = activeMenuId === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectMenu(item.id)}
                  className="group flex flex-col items-center gap-2 text-center cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2597d0] rounded-2xl p-1"
                >
                  <div
                    className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-[#2597d0] text-white shadow-sm scale-105'
                        : 'bg-white border border-slate-100 shadow-2xs group-hover:border-[#2597d0]/40 group-hover:bg-[#f2f9ff]'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        isCurrent ? 'bg-white/20 text-white' : item.boxBg
                      }`}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </div>
                  </div>
                  <span
                    className={`text-[11.5px] font-medium leading-tight ${
                      isCurrent ? 'text-[#2597d0] font-bold' : 'text-slate-600'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              )
            })}

            {/* 8th Dashed "+ Add" Tile matching reference "+ Add" button */}
            <button
              type="button"
              onClick={handleOpenQuickAdd}
              className="group flex flex-col items-center gap-2 text-center cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2597d0] rounded-2xl p-1"
            >
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:border-[#2597d0] hover:bg-[#edf7fe] text-slate-400 hover:text-[#2597d0] flex items-center justify-center transition-all">
                <Plus className="w-5 h-5" aria-hidden="true" />
              </div>
              <span className="text-[11.5px] font-medium text-slate-500 group-hover:text-[#2597d0] leading-tight">
                Tambah
              </span>
            </button>
          </div>
        </section>

        {/* Active Workspace Section */}
        <section aria-label={`Ruang Kerja ${currentMenu.label}`}>
          {activeMenuId === 'peta-gis' ? (
            <PetaGIS user={user} embedded={true} />
          ) : activeMenuId === 'prioritas' || activeMenuId === 'dashboard' ? (
            <PrioritasList
              user={user}
              embedded={true}
              externalCreateTrigger={createTriggerCount}
              onDataChange={handlePriorityDataChange}
            />
          ) : (
            /* Clean Functional Workspace for Home Visit, Evaluasi PMT, Supervisi, and Laporan e-PPGBM */
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#edf7fe] text-[#2597d0] flex items-center justify-center shrink-0">
                    {currentMenu.icon && (
                      <currentMenu.icon className="w-5 h-5" aria-hidden="true" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-[18px] font-bold text-slate-800 tracking-tight">
                      {currentMenu.label}
                    </h2>
                    <p className="text-[12.5px] text-slate-500 mt-0.5">
                      {currentMenu.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {activeMenuId === 'laporan' && (
                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2597d0] hover:bg-[#1e82b8] text-white text-[12.5px] font-semibold cursor-pointer"
                    >
                      <Download className="w-4 h-4" aria-hidden="true" />
                      <span>Unduh CSV e-PPGBM</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSelectMenu('prioritas')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-[12.5px] font-semibold cursor-pointer"
                  >
                    <span>Buka Tabel Triase</span>
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Cakupan Protokol &amp; Indikator Modul
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentMenu.features?.map((feat, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 flex items-start gap-3"
                    >
                      <CheckCircle2
                        className="w-4 h-4 text-[#2597d0] shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span className="text-[13px] font-medium text-slate-700 leading-snug">
                        {feat}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Right Clinical Timeline & Progress Panel (Matching Right Dropbox Panel in Reference) */}
      <BidanRightPanel
        user={user}
        activeMenu={currentMenu}
        priorityChildren={priorityChildren.filter((c) =>
          !globalSearch.trim()
            ? true
            : (c.child_name || '').toLowerCase().includes(globalSearch.toLowerCase()) ||
              (c.posyandu_name || '').toLowerCase().includes(globalSearch.toLowerCase())
        )}
        statsSummary={statsSummary}
        onNavigateToMenu={handleSelectMenu}
        onSelectChildForEdit={() => handleSelectMenu('prioritas')}
      />
    </div>
  )
}
