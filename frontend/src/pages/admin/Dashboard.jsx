import { useCallback, useEffect, useState } from 'react'
import {
  BookOpen,
  Database,
  LayoutDashboard,
  MapPin,
  Settings,
  ShoppingBasket,
  Users,
} from 'lucide-react'
import {
  SmartTopHeader,
} from '../../components/ui/SmartDashboardWidgets'
import { adminApi } from '../../lib/adminApi'
import AdminNavigationShell from './components/AdminNavigationShell'
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
    shortLabel: 'IT & Governance Dashboard',
    route: '/admin/dashboard',
    backendPath: 'admin/dashboard/dashboard_controller.go',
    icon: LayoutDashboard,
  },
  {
    id: 'wilayah',
    label: 'Master Wilayah & Posyandu',
    shortLabel: 'Master Wilayah GIS',
    route: '/admin/wilayah',
    backendPath: 'admin/wilayah/wilayah_controller.go',
    icon: MapPin,
    badge: 'GIS',
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
    shortLabel: 'Pangan Lokal Desa',
    route: '/admin/pangan-lokal',
    backendPath: 'admin/pangan/pangan_controller.go',
    icon: ShoppingBasket,
  },
  {
    id: 'knowledge-base',
    label: 'Knowledge Base AI (RAG)',
    shortLabel: 'Knowledge Base RAG',
    route: '/admin/knowledge-base',
    backendPath: 'admin/knowledge/knowledge_controller.go',
    icon: BookOpen,
    badge: 'AI',
  },
  {
    id: 'standar-who',
    label: 'Standar Antropometri WHO',
    shortLabel: 'Standar WHO LMS',
    route: '/admin/standar-who',
    backendPath: 'admin/standarwho/standarwho_controller.go',
    icon: Database,
    badge: 'LMS',
  },
  {
    id: 'pengaturan',
    label: 'Log Sinkronisasi & Pengaturan',
    shortLabel: 'Pengaturan & Audit',
    route: '/admin/pengaturan',
    backendPath: 'admin/pengaturan/pengaturan_controller.go',
    icon: Settings,
  },
]

function resolveMenuFromHash() {
  if (typeof window === 'undefined') return 'dashboard'
  const clean = window.location.hash.replace(/^#\/?/, '').split('?')[0]
  const sub = clean.replace(/^admin\/?/, '')
  const found = ADMIN_MENUS.find((m) => m.id === sub)
  return found ? found.id : 'dashboard'
}

export default function AdminDashboard({ user, onLogout }) {
  const [activeMenuId, setActiveMenuId] = useState(() => resolveMenuFromHash())
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')
  const [quickAddUserTrigger, setQuickAddUserTrigger] = useState(0)
  const [loadingStats, setLoadingStats] = useState(true)
  const [activeModeTab, setActiveModeTab] = useState('Production')
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
    knowledge_chunks_count: 11,
    embedded_chunks_count: 11,
    who_standards_count: 60,
    pending_sync_items: 0,
    synced_items_count: 12,
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
      // Keep fallback metrics if offline
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
            onQuickAddAccount={handleQuickAddAccount}
            onRefresh={loadOverview}
          />
        )
    }
  }

  return (
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#f5f6f8] text-slate-800 flex flex-col lg:flex-row font-sans selection:bg-[#f26522] selection:text-white">
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

          onLogout={onLogout}
          statsSummary={stats}
        />
      </div>

      {/* Main Workspace */}
      <main className="flex-1 min-w-0 lg:h-dvh p-4 sm:p-6 overflow-y-auto space-y-5">
        <SmartTopHeader
          user={user}
          roleLabel="Super Admin Desa"
          pageTitle={
            activeMenuId === 'dashboard'
              ? 'Super Admin & AI Governance Dashboard'
              : currentMenu.label
          }
          breadcrumbs={['Dashboard', 'Super Admin Desa', currentMenu.shortLabel || currentMenu.label]}
          searchQuery={globalSearch}
          onSearchChange={setGlobalSearch}
          searchPlaceholder="Cari Posyandu RW, akun RBAC, pangan lokal, atau chunk RAG..."
          greenBadgeText={`Active Posyandu ${stats.active_posyandus}/${stats.total_posyandus}`}
          redBadgeText={`Sync Alerts ${stats.pending_sync_items || 0}`}
          modeTabs={['Production', 'pgvector RAG', 'Audit SHA-256']}
          activeModeTab={activeModeTab}
          onModeTabChange={(mode) => {
            setActiveModeTab(mode)
            if (mode === 'pgvector RAG') handleSelectMenu('knowledge-base')
            if (mode === 'Audit SHA-256') handleSelectMenu('pengaturan')
            if (mode === 'Production') handleSelectMenu('dashboard')
          }}
          onNotificationClick={() => handleSelectMenu('pengaturan')}
          unreadCount={stats.pending_sync_items || 0}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* Active Module Workspace */}
        <section aria-label={`Ruang Kerja ${currentMenu.label}`}>
          {renderActiveModule()}
        </section>
      </main>
    </div>
  )
}
