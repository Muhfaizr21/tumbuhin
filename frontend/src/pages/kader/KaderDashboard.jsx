import { useState, useEffect } from 'react'
import { 
  Baby, Camera, ChefHat, LayoutDashboard, RefreshCw, Scale, Send, 
  Search, Bell, Menu, X, Plus, CheckCircle2, Stethoscope, AlertTriangle, Activity, MapPin
} from 'lucide-react'
import KaderNavigationShell from './components/KaderNavigationShell'
import KaderRightPanel from './components/KaderRightPanel'
import CircularProgressRing from '../bidan/components/CircularProgressRing'
import KaderBalitaPage from './KaderBalitaPage'
import KaderTimbangPage from './KaderTimbangPage'
import KaderOCRPage from './KaderOCRPage'
import KaderNutriChefPage from './KaderNutriChefPage'
import KaderSinkronisasiPage from './KaderSinkronisasiPage'
import KaderDistribusiPage from './KaderDistribusiPage'
import KaderHomePage from './KaderHomePage'
import { fetchRoleDashboardData } from '../../lib/authApi'

const KADER_MENUS = [
  { 
    id: 'dashboard', 
    label: 'Beranda Posyandu', 
    shortLabel: 'Beranda',
    route: '/kader/dashboard', 
    icon: LayoutDashboard,
    description: 'Ringkasan hari buka Posyandu, kehadiran balita, dan instruksi bidan.',
    features: ['Kehadiran balita bulan ini', 'Status jaringan & PWA', 'Instruksi bidan']
  },
  { 
    id: 'balita', 
    label: 'Data & Profil Balita', 
    shortLabel: 'Data Balita',
    route: '/kader/balita', 
    icon: Baby,
    description: 'Direktori profil balita RW, registrasi anak baru, dan profil kesehatan.',
    features: ['Enkripsi NIK SHA-256', 'Pencarian & filter RT/RW', 'Magic Token ortu']
  },
  { 
    id: 'timbang', 
    label: 'Input Timbangan & Z-Score', 
    shortLabel: 'Input Timbang',
    route: '/kader/timbang', 
    icon: Scale,
    description: 'Kalkulator Z-Score WHO LMS dan deteksi dini Growth Faltering.',
    features: ['Z-Score WHO LMS', 'Koreksi posisi ukur', 'Predictive Trajectory']
  },
  { 
    id: 'ocr-kms', 
    label: 'Smart KMS OCR', 
    shortLabel: 'Scan KIA',
    route: '/kader/ocr-kms', 
    icon: Camera, 
    badge: 'AI',
    description: 'Pemindaian foto Buku KIA fisik menjadi data digital siap simpan.',
    features: ['Multimodal Vision AI', 'Ekstraksi otomatis tabel', 'Verifikasi data']
  },
  { 
    id: 'nutri-chef', 
    label: 'AI Nutri-Chef', 
    shortLabel: 'Resep MPASI',
    route: '/kader/nutri-chef', 
    icon: ChefHat, 
    badge: 'AI',
    description: 'Generator resep MPASI lokal sesuai anggaran keluarga dan gizi anak.',
    features: ['RAG Kemenkes RI', 'Bahan pangan desa', 'Target anggaran']
  },
  { 
    id: 'sinkronisasi', 
    label: 'Sinkronisasi Offline', 
    shortLabel: 'Sync Offline',
    route: '/kader/sinkronisasi', 
    icon: RefreshCw,
    description: 'Manajemen antrean data lokal saat Posyandu tanpa sinyal internet.',
    features: ['IndexedDB Queue', 'Batch Sync satu klik', 'Log status pengiriman']
  },
  { 
    id: 'distribusi', 
    label: 'Distribusi WhatsApp', 
    shortLabel: 'Kirim WA',
    route: '/kader/distribusi', 
    icon: Send,
    description: 'Pengiriman hasil timbang dan Magic Link ke WhatsApp orang tua.',
    features: ['One-Click WhatsApp', 'QR Code Buku KIA', 'Magic Link Personal']
  },
]

const QUICK_ACCESS_ITEMS = [
  { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard, boxBg: 'bg-indigo-50 text-indigo-600' },
  { id: 'timbang', label: 'Timbang', icon: Scale, boxBg: 'bg-blue-50 text-blue-600' },
  { id: 'ocr-kms', label: 'Scan KIA', icon: Camera, boxBg: 'bg-rose-50 text-rose-600' },
  { id: 'balita', label: 'Data Balita', icon: Baby, boxBg: 'bg-emerald-50 text-emerald-600' },
  { id: 'nutri-chef', label: 'MPASI', icon: ChefHat, boxBg: 'bg-amber-50 text-amber-600' },
  { id: 'sinkronisasi', label: 'Sinkronisasi', icon: RefreshCw, boxBg: 'bg-slate-50 text-slate-600' },
  { id: 'distribusi', label: 'Kirim WA', icon: Send, boxBg: 'bg-sky-50 text-sky-600' },
]

export default function KaderDashboard({ user, onLogout, onSwitchRole }) {
  const [activeMenuId, setActiveMenuId] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')
  const [stats, setStats] = useState({
    kehadiran: 0,
    growthFaltering: 0,
    totalBalita: 0,
    pendingSync: 0,
    sudahDitimbang: 0,
    persentaseDitimbang: 0,
    deltaDitimbang: 0,
    trendPartisipasi: []
  })

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await fetchRoleDashboardData('/kader/dashboard')
        if (data) {
          setStats({
            kehadiran: Math.round((data.sudah_ditimbang_bulan_ini / data.total_balita) * 100) || 0,
            growthFaltering: data.risiko_faltering_count || 0,
            totalBalita: data.total_balita || 0,
            pendingSync: data.offline_queue_pending || 0,
            sudahDitimbang: data.sudah_ditimbang_bulan_ini || 0,
            persentaseDitimbang: Math.round((data.sudah_ditimbang_bulan_ini / data.total_balita) * 100) || 0,
            deltaDitimbang: 0,
            trendPartisipasi: data.trend_partisipasi || []
          })
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err)
      }
    }
    fetchStats()
  }, [])

  const currentMenu = KADER_MENUS.find((m) => m.id === activeMenuId) || KADER_MENUS[0]

  const renderContent = () => {
    if (activeMenuId === 'dashboard') {
      return (
        <div className="space-y-6">
          {/* Top 3 Featured Cards with Progress Rings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => setActiveMenuId('balita')}
              className="p-5 rounded-2xl bg-[#1e293b] text-white flex items-center justify-between gap-4 shadow-sm text-left group"
            >
              <div className="space-y-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white text-[#1e293b] flex items-center justify-center shadow-xs">
                  <Baby className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold truncate">Kehadiran Balita</h3>
                  <p className="text-[12px] text-white/80 truncate">{stats.sudahDitimbang} / {stats.totalBalita} Anak (RW 04)</p>
                </div>
              </div>
              <CircularProgressRing percentage={stats.kehadiran} isPrimaryCard={true} accentColor="white" />
            </button>

            <button 
              onClick={() => setActiveMenuId('balita')}
              className="p-5 rounded-2xl bg-white border border-slate-100 flex items-center justify-between gap-4 shadow-2xs text-left group hover:border-[#1e293b] transition-all"
            >
              <div className="space-y-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-slate-800">Growth Faltering</h3>
                  <p className="text-[12px] text-slate-400">{stats.growthFaltering} Anak Perlu Atensi</p>
                </div>
              </div>
              <CircularProgressRing percentage={Math.round((stats.growthFaltering / stats.totalBalita) * 100) || 0} isPrimaryCard={false} accentColor="#e11d48" />
            </button>

            <button 
              onClick={() => setActiveMenuId('sinkronisasi')}
              className="p-5 rounded-2xl bg-white border border-slate-100 flex items-center justify-between gap-4 shadow-2xs text-left group hover:border-[#1e293b] transition-all"
            >
              <div className="space-y-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-slate-800">Sinkronisasi</h3>
                  <p className="text-[12px] text-slate-400">{stats.pendingSync === 0 ? 'Data Tersinkron' : `${stats.pendingSync} Data Tertunda`}</p>
                </div>
              </div>
              <CircularProgressRing percentage={stats.pendingSync === 0 ? 100 : 70} isPrimaryCard={false} accentColor="#2563eb" />
            </button>
          </div>

          {/* Quick Access Icon Grid */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-bold text-slate-800 tracking-tight">Akses Cepat Modul Meja Layanan</h2>
              <span className="text-[11px] text-slate-400">{currentMenu.label}</span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
              {QUICK_ACCESS_ITEMS.map((item) => {
                const isCurrent = activeMenuId === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveMenuId(item.id)}
                    className="flex flex-col items-center gap-2 text-center group"
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${isCurrent ? 'bg-[#1e293b] border-[#1e293b] shadow-sm' : 'border-slate-100 bg-white shadow-2xs group-hover:border-[#1e293b]/40 group-hover:bg-slate-50'}`}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isCurrent ? 'bg-white/20 text-white' : item.boxBg}`}>
                        <item.icon className="w-4 h-4" />
                      </div>
                    </div>
                    <span className={`text-[11px] font-medium truncate w-full ${isCurrent ? 'text-[#1e293b] font-bold' : 'text-slate-600'}`}>{item.label}</span>
                  </button>
                )
              })}
              <button 
                onClick={() => setActiveMenuId('balita')}
                className="flex flex-col items-center gap-2 text-center group"
              >
                <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-[#1e293b] group-hover:text-[#1e293b] group-hover:bg-slate-50 transition-all">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-medium text-slate-500 group-hover:text-[#1e293b]">Tambah</span>
              </button>
            </div>
          </section>

          {/* Detailed View for Active Module */}
          <KaderHomePage user={user} onMenuChange={setActiveMenuId} stats={stats} />
        </div>
      )
    }

    switch (activeMenuId) {
      case 'balita': return <KaderBalitaPage user={user} onLogout={onLogout} onSwitchRole={onSwitchRole} onNavigate={setActiveMenuId} />
      case 'timbang': return <KaderTimbangPage user={user} />
      case 'ocr-kms': return <KaderOCRPage />
      case 'nutri-chef': return <KaderNutriChefPage />
      case 'sinkronisasi': return <KaderSinkronisasiPage />
      case 'distribusi': return <KaderDistribusiPage />
      default: return <KaderHomePage user={user} onMenuChange={setActiveMenuId} stats={stats} />
    }
  }

  return (
    <div className="min-h-dvh bg-[#f6f9fc] text-slate-800 flex flex-col lg:flex-row font-sans selection:bg-[#2597d0] selection:text-white">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b sticky top-0 z-40">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-lg bg-[#1e293b] text-white flex items-center justify-center shadow-xs"><Stethoscope className="w-4 h-4"/></div>
           <span className="font-bold text-slate-800">Tumbuhin</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2"><Menu className="w-6 h-6 text-[#1e293b]"/></button>
      </header>

      {/* Desktop Navigation */}
      <div className="hidden lg:flex">
        <KaderNavigationShell
          menus={KADER_MENUS}
          activeMenuId={activeMenuId}
          user={user}
          sidebarCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onSelectMenu={(item) => setActiveMenuId(item.id)}
          onSwitchRole={onSwitchRole}
          onLogout={onLogout}
        />
      </div>

      {/* Main Workspace */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-7 overflow-y-auto space-y-6">
        {/* Top Search & Profile Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari balita, NIK, atau jadwal..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white border border-slate-100 text-[13px] shadow-2xs focus:outline-none focus:border-[#1e293b]"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4">
            <button className="relative w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-2xs hover:bg-slate-50">
              <Bell className="w-4 h-4 text-slate-600" />
              <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-rose-500" />
            </button>

            <div className="flex items-center gap-3 bg-white px-3.5 py-1.5 rounded-2xl border border-slate-100 shadow-2xs">
              <span className="text-[13.5px] font-bold text-slate-800">Halo, {user?.full_name?.split(' ')[0] || 'Kader'}</span>
              <div className="w-8 h-8 rounded-full bg-[#1e293b] text-white font-bold text-[12px] flex items-center justify-center shrink-0">
                {user?.full_name?.slice(0, 2).toUpperCase() || 'K'}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Content Area */}
        {renderContent()}
      </main>

      {/* Right Panel */}
      <KaderRightPanel user={user} activeMenu={currentMenu} stats={stats} />
    </div>
  )
}