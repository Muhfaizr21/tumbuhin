import { useCallback, useEffect, useState } from 'react'
import {
  Bell,
  BookOpen,
  Database,
  LayoutDashboard,
  MapPin,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBasket,
  Users,
  X,
} from 'lucide-react'
import { adminApi } from '../../lib/adminApi'
import CircularProgressRing from '../bidan/components/CircularProgressRing'
import AdminNavigationShell from './components/AdminNavigationShell'
import AdminRightPanel from './components/AdminRightPanel'
import AdminKnowledgeBasePage from './AdminKnowledgeBasePage'
import AdminOverviewPage from './AdminOverviewPage'
import AdminPanganLokalPage from './AdminPanganLokalPage'
import AdminPengaturanPage from './AdminPengaturanPage'
import AdminPenggunaPage from './AdminPenggunaPage'
import AdminStandarWhoPage from './AdminStandarWhoPage'
import AdminWilayahPage from './AdminWilayahPage'

const ADMIN_MENUS = [
  {
    id: 'dashboard',
    label: 'Dashboard Ikhtisar Sistem',
    shortLabel: 'Ikhtisar Sistem',
    route: '/admin/dashboard',
    backendPath: 'admin/dashboard/dashboard_controller.go',
    icon: LayoutDashboard,
  },
  {
    id: 'wilayah',
    label: 'Master Wilayah & Posyandu',
    shortLabel: 'Master Wilayah',
    route: '/admin/wilayah',
    backendPath: 'admin/wilayah/wilayah_controller.go',
    icon: MapPin,
  },
  {
    id: 'pengguna',
    label: 'Manajemen Akun & RBAC',
    shortLabel: 'Akun & RBAC',
    route: '/admin/pengguna',
    backendPath: 'admin/pengguna/pengguna_controller.go',
    icon: Users,
    badge: 'RBAC',
  },
  {
    id: 'pangan-lokal',
    label: 'Harga Pangan Lokal Desa',
    shortLabel: 'Pangan Lokal',
    route: '/admin/pangan-lokal',
    backendPath: 'admin/pangan/pangan_controller.go',
    icon: ShoppingBasket,
  },
  {
    id: 'knowledge-base',
    label: 'Knowledge Base AI (RAG)',
    shortLabel: 'Knowledge Base',
    route: '/admin/knowledge-base',
    backendPath: 'admin/knowledge/knowledge_controller.go',
    icon: BookOpen,
    badge: 'AI',
  },
  {
    id: 'standar-who',
    label: 'Standar Antropometri WHO',
    shortLabel: 'Standar WHO',
    route: '/admin/standar-who',
    backendPath: 'admin/standarwho/standarwho_controller.go',
    icon: Database,
    badge: 'LMS',
  },
  {
    id: 'pengaturan',
    label: 'Log Sinkronisasi & Pengaturan',
    shortLabel: 'Pengaturan',
    route: '/admin/pengaturan',
    backendPath: 'admin/pengaturan/pengaturan_controller.go',
    icon: Settings,
  },
]

const QUICK_ACCESS_ITEMS = [
  {
    id: 'dashboard',
    label: 'Ikhtisar',
    icon: LayoutDashboard,
    boxBg: 'bg-slate-100 text-slate-700',
  },
  {
    id: 'wilayah',
    label: 'Wilayah',
    icon: MapPin,
    boxBg: 'bg-emerald-50 text-emerald-600',
  },
  {
    id: 'pengguna',
    label: 'Akun RBAC',
    icon: Users,
    boxBg: 'bg-blue-50 text-blue-600',
  },
  {
    id: 'pangan-lokal',
    label: 'Pangan',
    icon: ShoppingBasket,
    boxBg: 'bg-amber-50 text-amber-600',
  },
  {
    id: 'knowledge-base',
    label: 'RAG AI',
    icon: BookOpen,
    boxBg: 'bg-rose-50 text-rose-600',
  },
  {
    id: 'standar-who',
    label: 'WHO LMS',
    icon: Database,
    boxBg: 'bg-indigo-50 text-indigo-600',
  },
  {
    id: 'pengaturan',
    label: 'Pengaturan',
    icon: Settings,
    boxBg: 'bg-sky-50 text-[#2597d0]',
  },
]

function resolveMenuFromHash() {
  if (typeof window === 'undefined') return 'dashboard'
  const clean = window.location.hash.replace(/^#\/?/, '').split('?')[0]
  const sub = clean.replace(/^admin\/?/, '')
  const found = ADMIN_MENUS.find((m) => m.id === sub)
  return found ? found.id : 'dashboard'
}

export default function AdminDashboard({ user, onLogout, onSwitchRole }) {
  const [activeMenuId, setActiveMenuId] = useState(() => resolveMenuFromHash())
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')
  const [quickAddUserTrigger, setQuickAddUserTrigger] = useState(0)
  const [loadingStats, setLoadingStats] = useState(true)
  const [stats, setStats] = useState({
    active_posyandus: 8,
    total_posyandus: 8,
    total_users: 4,
    active_users: 4,
    kader_count: 1,
    bidan_count: 1,
    admin_count: 1,
    ortu_count: 1,
    total_children: 2,
    total_measurements: 12,
    local_food_commodities: 11,
    available_food_commodities: 11,
    knowledge_chunks_count: 10,
    embedded_chunks_count: 10,
    who_standards_count: 40,
    pending_sync_items: 0,
    synced_items_count: 0,
    vector_index_status: 'Optimal (pgvector 768-dim)',
    last_price_update: 'Hari ini',
    posyandu_sync_status: [],
    recent_audit_logs: [],
  })

  const loadOverview = useCallback(async () => {
    setLoadingStats(true)
    try {
      const data = await adminApi.getOverview()
      if (data) {
        setStats((prev) => ({
          ...prev,
          ...data,
          total_posyandus: data.total_posyandus ?? data.active_posyandus ?? prev.total_posyandus,
          active_users: data.active_users ?? data.total_users ?? prev.active_users,
          available_food_commodities:
            data.available_food_commodities ??
            data.local_food_commodities ??
            prev.available_food_commodities,
        }))
      }
    } catch {
      // Keep initial fallback metrics if backend is unreachable
    } finally {
      setLoadingStats(false)
    }
  }, [])

  useEffect(() => {
    loadOverview()
  }, [loadOverview])

  useEffect(() => {
    const onHash = () => {
      setActiveMenuId(resolveMenuFromHash())
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const handleSelectMenu = (itemOrId) => {
    const target =
      typeof itemOrId === 'string'
        ? ADMIN_MENUS.find((m) => m.id === itemOrId) || ADMIN_MENUS[0]
        : itemOrId
    setActiveMenuId(target.id)
    setMobileMenuOpen(false)
    if (target.route) {
      window.location.hash = `#${target.route}`
    }
  }

  const handleQuickAddAccount = () => {
    handleSelectMenu('pengguna')
    setQuickAddUserTrigger((c) => c + 1)
  }

  const currentMenu = ADMIN_MENUS.find((m) => m.id === activeMenuId) || ADMIN_MENUS[0]
  const adminFirstName = (user?.full_name || 'Hendra Wijaya').split(' ').slice(0, 2).join(' ')
  const adminInitials = (user?.full_name || 'HW')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const posyanduPercent =
    stats.total_posyandus > 0
      ? Math.round((stats.active_posyandus / stats.total_posyandus) * 100)
      : 100
  const userPercent =
    stats.total_users > 0 ? Math.round((stats.active_users / stats.total_users) * 100) : 100
  const foodPercent =
    stats.local_food_commodities > 0
      ? Math.round((stats.available_food_commodities / stats.local_food_commodities) * 100)
      : 100

  const renderActiveModule = () => {
    switch (activeMenuId) {
      case 'wilayah':
        return (
          <AdminWilayahPage
            searchQuery={globalSearch}
            onDataChanged={loadOverview}
          />
        )
      case 'pengguna':
        return (
          <AdminPenggunaPage
            searchQuery={globalSearch}
            externalAddTrigger={quickAddUserTrigger}
            onDataChanged={loadOverview}
          />
        )
      case 'pangan-lokal':
        return (
          <AdminPanganLokalPage
            searchQuery={globalSearch}
            onDataChanged={loadOverview}
          />
        )
      case 'knowledge-base':
        return (
          <AdminKnowledgeBasePage
            searchQuery={globalSearch}
            onDataChanged={loadOverview}
          />
        )
      case 'standar-who':
        return <AdminStandarWhoPage onDataChanged={loadOverview} />
      case 'pengaturan':
        return <AdminPengaturanPage onDataChanged={loadOverview} />
      default:
        return (
          <AdminOverviewPage
            stats={stats}
            loading={loadingStats}
            searchQuery={globalSearch}
            onNavigate={handleSelectMenu}
            onRefresh={loadOverview}
          />
        )
    }
  }

  return (
    <div className="min-h-dvh bg-[#f6f9fc] text-slate-800 flex flex-col lg:flex-row font-sans selection:bg-[#1e293b] selection:text-white">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#1e293b] text-white flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-[15px] text-slate-800">Tumbuhin</span>
            <span className="ml-2 px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-slate-100 text-slate-600">
              Super Admin
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label="Buka menu navigasi"
          className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-[#1e293b]" />}
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex bg-slate-900/40 backdrop-blur-xs">
          <AdminNavigationShell
            menus={ADMIN_MENUS}
            activeMenuId={activeMenuId}
            user={user}
            sidebarCollapsed={false}
            onToggleCollapse={() => setMobileMenuOpen(false)}
            onSelectMenu={handleSelectMenu}
            onOpenQuickAdd={handleQuickAddAccount}
            onSwitchRole={onSwitchRole}
            onLogout={onLogout}
            statsSummary={stats}
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
        <AdminNavigationShell
          menus={ADMIN_MENUS}
          activeMenuId={activeMenuId}
          user={user}
          sidebarCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          onSelectMenu={handleSelectMenu}
          onOpenQuickAdd={handleQuickAddAccount}
          onSwitchRole={onSwitchRole}
          onLogout={onLogout}
          statsSummary={stats}
        />
      </div>

      {/* Main Workspace */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-7 overflow-y-auto space-y-6">
        {/* Top Utility & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari Posyandu RW, akun petugas, komoditas pangan, atau chunk RAG..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white border border-slate-100 text-[13px] shadow-2xs focus:outline-none focus:border-[#1e293b]"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4">
            <button
              type="button"
              onClick={() => handleSelectMenu('pengaturan')}
              title="Log Audit & Sinkronisasi"
              className="relative w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-2xs hover:bg-slate-50 cursor-pointer"
            >
              <Bell className="w-4 h-4 text-slate-600" />
              <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-emerald-500" />
            </button>
            <div className="flex items-center gap-3 bg-white px-3.5 py-1.5 rounded-2xl border border-slate-100 shadow-2xs">
              <span className="text-[13.5px] font-bold text-slate-800">
                Halo, {adminFirstName}
              </span>
              <div className="w-8 h-8 rounded-full bg-[#1e293b] text-white flex items-center justify-center text-[12px] font-bold">
                {adminInitials}
              </div>
            </div>
          </div>
        </div>

        {/* Top 3 Featured Storage-Style Cards with Progress Rings */}
        <section aria-label="Ringkasan Tata Kelola Utama">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => handleSelectMenu('wilayah')}
              className={`p-5 rounded-2xl bg-[#1e293b] text-white flex items-center justify-between gap-4 shadow-sm text-left transition-all cursor-pointer ${
                activeMenuId === 'wilayah' ? 'ring-2 ring-[#2597d0]' : 'opacity-95 hover:opacity-100'
              }`}
            >
              <div className="space-y-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white text-[#1e293b] flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold truncate">Infrastruktur Posyandu</h3>
                  <p className="text-[12px] text-white/80 truncate">
                    {stats.active_posyandus} / {stats.total_posyandus} Unit Aktif •{' '}
                    {stats.total_children} Balita
                  </p>
                </div>
              </div>
              <CircularProgressRing
                percentage={posyanduPercent}
                isPrimaryCard={true}
                accentColor="white"
              />
            </button>

            <button
              type="button"
              onClick={() => handleSelectMenu('pengguna')}
              className={`p-5 rounded-2xl bg-white border flex items-center justify-between gap-4 shadow-2xs text-left transition-all cursor-pointer ${
                activeMenuId === 'pengguna'
                  ? 'border-[#1e293b] ring-2 ring-[#1e293b]/15'
                  : 'border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="space-y-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-slate-800 truncate">
                    Manajemen Akun &amp; RBAC
                  </h3>
                  <p className="text-[12px] text-slate-400 truncate">
                    {stats.active_users} Petugas Aktif • Row-Level Scope
                  </p>
                </div>
              </div>
              <CircularProgressRing
                percentage={userPercent}
                isPrimaryCard={false}
                accentColor="#2563eb"
              />
            </button>

            <button
              type="button"
              onClick={() => handleSelectMenu('knowledge-base')}
              className={`p-5 rounded-2xl bg-white border flex items-center justify-between gap-4 shadow-2xs text-left transition-all cursor-pointer ${
                activeMenuId === 'knowledge-base'
                  ? 'border-[#1e293b] ring-2 ring-[#1e293b]/15'
                  : 'border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="space-y-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-slate-800 truncate">
                    RAG Kemenkes &amp; Pangan
                  </h3>
                  <p className="text-[12px] text-slate-400 truncate">
                    {stats.knowledge_chunks_count} Chunks • {stats.available_food_commodities} Pangan
                  </p>
                </div>
              </div>
              <CircularProgressRing
                percentage={foodPercent}
                isPrimaryCard={false}
                accentColor="#e11d48"
              />
            </button>
          </div>
        </section>

        {/* Quick Access Grid */}
        <section aria-label="Akses Cepat Modul Super Admin">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-bold text-slate-800 tracking-tight">
              Akses Cepat Modul Super Admin
            </h2>
            <span className="text-[11.5px] text-slate-400">{currentMenu.label}</span>
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
                  className="flex flex-col items-center gap-2 text-center group cursor-pointer"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${
                      isCurrent
                        ? 'bg-[#1e293b] border-[#1e293b] text-white shadow-sm'
                        : 'bg-white border-slate-100 shadow-2xs group-hover:border-[#1e293b]/40 group-hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        isCurrent ? 'bg-white/20 text-white' : item.boxBg
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-medium truncate w-full ${
                      isCurrent ? 'text-[#1e293b] font-bold' : 'text-slate-600'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              )
            })}

            <button
              type="button"
              onClick={handleQuickAddAccount}
              className="flex flex-col items-center gap-2 text-center group cursor-pointer"
            >
              <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:border-[#1e293b] hover:bg-slate-50 text-slate-400 hover:text-[#1e293b] flex items-center justify-center transition-all">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium text-slate-500 group-hover:text-[#1e293b]">
                + Akun
              </span>
            </button>
          </div>
        </section>

        {/* Active Module Workspace */}
        <section aria-label={`Ruang Kerja ${currentMenu.label}`}>
          {renderActiveModule()}
        </section>
      </main>

      {/* Right Telemetry & Audit Panel */}
      <AdminRightPanel
        user={user}
        activeMenu={currentMenu}
        statsSummary={stats}
        onNavigateToMenu={handleSelectMenu}
      />
    </div>
  )
}
