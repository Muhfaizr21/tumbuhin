import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  Baby,
  Camera,
  CheckCircle2,
  ChefHat,
  Clock3,
  LayoutDashboard,
  RefreshCw,
  Scale,
  Send,
  UserPlus,
} from 'lucide-react'
import { SmartTopHeader } from '../../components/ui/SmartDashboardWidgets'
import { kaderApi } from '../../lib/kaderApi'
import { countQueue, subscribeQueue } from '../../lib/offlineQueue'
import KaderBalitaPage from './KaderBalitaPage'
import KaderDistribusiPage from './KaderDistribusiPage'
import KaderHomePage from './KaderHomePage'
import KaderNutriChefPage from './KaderNutriChefPage'
import KaderOCRPage from './KaderOCRPage'
import KaderParentAccountsPage from './KaderParentAccountsPage'
import KaderSinkronisasiPage from './KaderSinkronisasiPage'
import KaderTimbangPage from './KaderTimbangPage'
import KaderNavigationShell from './components/KaderNavigationShell'

const KADER_MENUS = [
  {
    id: 'dashboard',
    label: 'Beranda Posyandu',
    shortLabel: 'Posyandu Dashboard',
    route: '/kader/dashboard',
    icon: LayoutDashboard,
    description: 'Ringkasan hari buka Posyandu, kehadiran balita, dan instruksi bidan.',
    features: ['Kehadiran balita bulan ini', 'Status jaringan & PWA', 'Instruksi bidan'],
  },
  {
    id: 'balita',
    label: 'Data & Profil Balita',
    shortLabel: 'Direktori Balita',
    route: '/kader/balita',
    icon: Baby,
    description: 'Direktori profil balita RW, registrasi anak baru, dan profil kesehatan.',
    features: ['Enkripsi NIK SHA-256', 'Pencarian & filter RT/RW', 'Magic Token ortu'],
  },
  {
    id: 'orang-tua',
    label: 'Akun Orang Tua',
    shortLabel: 'Akun Orang Tua',
    route: '/kader/orang-tua',
    icon: UserPlus,
    description: 'Buat akun login orang tua dan tautkan balita di posyandu Anda.',
    features: ['Registrasi akun ortu', 'Tautkan banyak balita', 'Bagikan kredensial via WA'],
  },
  {
    id: 'timbang',
    label: 'Input Timbangan & Z-Score',
    shortLabel: 'Input Timbang WHO',
    route: '/kader/timbang',
    icon: Scale,
    badge: 'LMS',
    description: 'Kalkulator Z-Score WHO LMS dan deteksi dini Growth Faltering.',
    features: ['Z-Score WHO LMS', 'Koreksi posisi ukur', 'Predictive Trajectory'],
  },
  {
    id: 'ocr-kms',
    label: 'Smart KMS OCR',
    shortLabel: 'Smart Scan KIA',
    route: '/kader/ocr-kms',
    icon: Camera,
    badge: 'AI',
    description: 'Pemindaian foto Buku KIA fisik menjadi data digital siap simpan.',
    features: ['Multimodal Vision AI', 'Ekstraksi otomatis tabel', 'Verifikasi data'],
  },
  {
    id: 'nutri-chef',
    label: 'AI Nutri-Chef',
    shortLabel: 'AI Nutri-Chef MPASI',
    route: '/kader/nutri-chef',
    icon: ChefHat,
    badge: 'AI',
    description: 'Generator resep MPASI lokal sesuai anggaran keluarga dan gizi anak.',
    features: ['RAG Kemenkes RI', 'Bahan pangan desa', 'Target anggaran'],
  },
  {
    id: 'sinkronisasi',
    label: 'Sinkronisasi Offline',
    shortLabel: 'Sinkronisasi PWA',
    route: '/kader/sinkronisasi',
    icon: RefreshCw,
    description: 'Manajemen antrean data lokal saat Posyandu tanpa sinyal internet.',
    features: ['IndexedDB Queue', 'Batch Sync satu klik', 'Log status pengiriman'],
  },
  {
    id: 'distribusi',
    label: 'Distribusi WhatsApp',
    shortLabel: 'Broadcast WA Ortu',
    route: '/kader/distribusi',
    icon: Send,
    description: 'Pengiriman hasil timbang dan Magic Link ke WhatsApp orang tua.',
    features: ['One-Click WhatsApp', 'QR Code Buku KIA', 'Magic Link Personal'],
  },
]

export default function KaderDashboard({ user, onLogout, currentSubPage = 'dashboard' }) {
  const [activeMenuId, setActiveMenuId] = useState(() =>
    KADER_MENUS.some((menu) => menu.id === currentSubPage) ? currentSubPage : 'dashboard',
  )
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')
  const [activeModeTab, setActiveModeTab] = useState('Meja Layanan')
  const [stats, setStats] = useState({
    kehadiran: 100,
    growthFaltering: 1,
    totalBalita: 2,
    pendingSync: 0,
    sudahDitimbang: 2,
    persentaseDitimbang: 100,
    deltaDitimbang: 8.5,
    trendPartisipasi: [],
    recentActivity: [],
  })

  const [showNotifications, setShowNotifications] = useState(false)
  const [readNotifications, setReadNotifications] = useState({})
  const notificationRef = useRef(null)

  useEffect(() => {
    if (KADER_MENUS.some((menu) => menu.id === currentSubPage)) {
      setActiveMenuId(currentSubPage)
    }
  }, [currentSubPage])

  const notifications = useMemo(() => {
    const belumHadir = Math.max((stats.totalBalita || 0) - (stats.sudahDitimbang || 0), 0)
    const list = []

    if ((stats.growthFaltering || 0) > 0) {
      list.push({
        id: 'faltering',
        type: 'danger',
        title: `${stats.growthFaltering} balita perlu atensi gizi`,
        desc: 'Terdeteksi risiko stunting/wasting pada penimbangan terakhir.',
        menu: 'balita',
      })
    }

    if (belumHadir > 0) {
      list.push({
        id: 'belum-hadir',
        type: 'warning',
        title: `${belumHadir} balita belum ditimbang`,
        desc: 'Belum ada catatan timbang pada bulan berjalan.',
        menu: 'timbang',
      })
    }

    if ((stats.pendingSync || 0) > 0) {
      list.push({
        id: 'pending-sync',
        type: 'info',
        title: `${stats.pendingSync} data menunggu sinkronisasi`,
        desc: 'Antrean offline tersimpan di IndexedDB browser.',
        menu: 'sinkronisasi',
      })
    }

    if (list.length === 0) {
      list.push({
        id: 'all-good',
        type: 'success',
        title: 'Semua data Posyandu terpantau',
        desc: 'Tidak ada peringatan gizi maupun antrean tertunda.',
        menu: 'dashboard',
      })
    }

    return list
  }, [stats])

  const unreadCount = notifications.filter((n) => !readNotifications[n.id]).length

  useEffect(() => {
    if (!showNotifications) return
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showNotifications])

  const markAllRead = () => {
    setReadNotifications(
      notifications.reduce((acc, n) => {
        acc[n.id] = true
        return acc
      }, {}),
    )
  }

  const handleNotificationClick = (notif) => {
    setReadNotifications((prev) => ({ ...prev, [notif.id]: true }))
    setShowNotifications(false)
    if (notif.menu) setActiveMenuId(notif.menu)
  }

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await kaderApi.getOverview()
        if (data) {
          const total = data.total_balita || 2
          const weighed = data.sudah_ditimbang_bulan_ini || 2
          setStats({
            kehadiran: Math.round((weighed / Math.max(total, 1)) * 100) || 100,
            growthFaltering: data.risiko_faltering_count ?? 1,
            totalBalita: total,
            pendingSync: data.offline_queue_pending || 0,
            sudahDitimbang: weighed,
            persentaseDitimbang: Math.round((weighed / Math.max(total, 1)) * 100) || 100,
            deltaDitimbang: data.delta_partisipasi || 8.5,
            trendPartisipasi: data.trend_partisipasi || [],
            recentActivity: data.recent_activity || [],
          })
        }
      } catch {
        // Keep clean defaults
      }
    }
    fetchStats()
  }, [])

  useEffect(() => {
    let active = true
    const refreshPendingSync = async () => {
      try {
        const pending = await countQueue()
        if (active) {
          setStats((prev) => ({ ...prev, pendingSync: pending }))
        }
      } catch {
        // IndexedDB unavailable
      }
    }

    refreshPendingSync()
    const unsubscribe = subscribeQueue(refreshPendingSync)
    const timer = window.setInterval(refreshPendingSync, 10000)
    return () => {
      active = false
      unsubscribe()
      window.clearInterval(timer)
    }
  }, [])

  const currentMenu = KADER_MENUS.find((m) => m.id === activeMenuId) || KADER_MENUS[0]

  const handleSelectMenu = (itemOrId) => {
    const item = typeof itemOrId === 'string' ? KADER_MENUS.find((menu) => menu.id === itemOrId) : itemOrId
    const id = item?.id || 'dashboard'
    setActiveMenuId(id)
    setMobileMenuOpen(false)
    if (item?.route && window.location.hash !== `#${item.route}`) {
      window.location.hash = `#${item.route}`
    }
  }

  const renderContent = () => {
    switch (activeMenuId) {
      case 'balita':
        return (
          <KaderBalitaPage
            user={user}
            onLogout={onLogout}

            onNavigate={setActiveMenuId}
            searchQuery={globalSearch}
          />
        )
      case 'orang-tua':
        return <KaderParentAccountsPage user={user} searchQuery={globalSearch} />
      case 'timbang':
        return <KaderTimbangPage user={user} />
      case 'ocr-kms':
        return <KaderOCRPage />
      case 'nutri-chef':
        return <KaderNutriChefPage />
      case 'sinkronisasi':
        return <KaderSinkronisasiPage />
      case 'distribusi':
        return <KaderDistribusiPage searchQuery={globalSearch} />
      default:
        return (
          <KaderHomePage
            user={user}
            onMenuChange={setActiveMenuId}
            stats={stats}
          />
        )
    }
  }

  return (
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#f5f6f8] text-slate-800 flex flex-col lg:flex-row font-sans selection:bg-[#f26522] selection:text-white">
      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex bg-slate-900/40 backdrop-blur-xs">
          <KaderNavigationShell
            menus={KADER_MENUS}
            activeMenuId={activeMenuId}
            user={user}
            sidebarCollapsed={false}
            onToggleCollapse={() => setMobileMenuOpen(false)}
            onSelectMenu={handleSelectMenu}

            onLogout={onLogout}
          />
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setMobileMenuOpen(false)}
            className="flex-1"
          />
        </div>
      )}

      {/* Desktop Navigation */}
      <div className="hidden lg:flex">
        <KaderNavigationShell
          menus={KADER_MENUS}
          activeMenuId={activeMenuId}
          user={user}
          sidebarCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          onSelectMenu={handleSelectMenu}

          onLogout={onLogout}
        />
      </div>

      {/* Main Workspace */}
      <main className="flex-1 min-w-0 lg:h-dvh p-4 sm:p-6 overflow-y-auto space-y-5">
        <div className="relative" ref={notificationRef}>
          <SmartTopHeader
            user={user}
            roleLabel="Kader Posyandu RW"
            pageTitle={
              activeMenuId === 'dashboard'
                ? 'Kader Posyandu Operational Dashboard'
                : currentMenu.label
            }
            breadcrumbs={[
              'Dashboard',
              user?.posyandu_name || 'Posyandu Melati 04',
              currentMenu.shortLabel || currentMenu.label,
            ]}
            searchQuery={globalSearch}
            onSearchChange={setGlobalSearch}
            searchPlaceholder="Cari nama balita, RT/RW, resep MPASI, atau antrean timbang..."
            greenBadgeText={`Hadir Timbang ${stats.sudahDitimbang}/${stats.totalBalita}`}
            redBadgeText={`Atensi Gizi ${stats.growthFaltering}`}
            modeTabs={['Meja Layanan', 'Smart OCR KIA', 'AI Nutri-Chef']}
            activeModeTab={activeModeTab}
            onModeTabChange={(tab) => {
              setActiveModeTab(tab)
              if (tab === 'Smart OCR KIA') setActiveMenuId('ocr-kms')
              if (tab === 'AI Nutri-Chef') setActiveMenuId('nutri-chef')
              if (tab === 'Meja Layanan') setActiveMenuId('dashboard')
            }}
            onNotificationClick={() => setShowNotifications((v) => !v)}
            unreadCount={unreadCount}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
          />

          {/* Notification Popover */}
          {showNotifications && (
            <div className="absolute right-0 top-14 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <div>
                  <h3 className="text-[13px] font-bold text-slate-800">Notifikasi Posyandu</h3>
                  <p className="text-[10.5px] text-slate-400">
                    {unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua sudah dibaca'}
                  </p>
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-[10.5px] font-bold text-[#f26522] hover:underline cursor-pointer"
                  >
                    Tandai dibaca
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                {notifications.map((notif) => {
                  const Icon =
                    notif.type === 'danger'
                      ? AlertTriangle
                      : notif.type === 'warning'
                        ? Clock3
                        : notif.type === 'success'
                          ? CheckCircle2
                          : RefreshCw
                  return (
                    <button
                      key={notif.id}
                      type="button"
                      onClick={() => handleNotificationClick(notif)}
                      className="w-full text-left px-4 py-3 flex gap-3 items-start hover:bg-slate-50 cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#f26522] flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-bold text-slate-800">{notif.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{notif.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Module Content */}
        {renderContent()}
      </main>
    </div>
  )
}
