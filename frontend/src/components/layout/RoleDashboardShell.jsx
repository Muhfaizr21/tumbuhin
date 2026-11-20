import { useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  FolderGit2,
  LogOut,
  Menu,
  ShieldCheck,
  UserCheck,
  X,
} from 'lucide-react'
import { LettersStethoscopeIcon } from '../ui/LettersIcons'

export default function RoleDashboardShell({
  roleBadge,
  roleTitle,
  roleSubtitle,
  accentColor = '#2597d0',
  user,
  menuItems = [],
  statsCards = [],
  backendEndpoint,
  backendFolderHint,
  onLogout,
  onSwitchRole,
<<<<<<< HEAD
  onMenuSelect,
  activeMenuId: propActiveMenuId,
=======
  activeMenuId: propActiveMenuId,
  onMenuChange,
>>>>>>> 585fb2db644aa31a59d8af36addccf2f989347af
  children,
}) {
  const [internalActiveMenuId, setInternalActiveMenuId] = useState(menuItems[0]?.id || 'dashboard')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

<<<<<<< HEAD
  const activeMenuId = propActiveMenuId || internalActiveMenuId
=======
  const activeMenuId = propActiveMenuId !== undefined ? propActiveMenuId : internalActiveMenuId

  const handleMenuClick = (id) => {
    if (onMenuChange) {
      onMenuChange(id)
    } else {
      setInternalActiveMenuId(id)
    }
    setMobileSidebarOpen(false)
  }

>>>>>>> 585fb2db644aa31a59d8af36addccf2f989347af
  const currentMenu = menuItems.find((item) => item.id === activeMenuId) || menuItems[0]

  return (
    <div className="min-h-dvh bg-[#f5f5f5] text-[#070709] flex flex-col lg:flex-row font-runde selection:bg-[#2597d0] selection:text-white">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-[#e4e4eb] sticky top-0 z-40 shadow-[0_1px_2px_rgba(228,229,231,0.24)]">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-xs"
            style={{ backgroundColor: '#070709' }}
          >
            <LettersStethoscopeIcon className="w-4 h-4 text-[#2597d0]" />
          </div>
          <div>
            <span className="font-semibold text-[16px] tracking-[-0.02em]">Tumbuhin</span>
            <span className="ml-2 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#f5f5f5] text-[#070709] border border-[#e4e4eb]">
              {roleBadge}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileSidebarOpen((prev) => !prev)}
          className="p-2 rounded-full text-[#070709] hover:bg-[#f5f5f5] cursor-pointer"
          aria-label="Toggle Menu Sidebar"
        >
          {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-[#2597d0]" />}
        </button>
      </header>

      {/* Sidebar Navigation (Complete 100% Menu List from fitur.md) */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-[#e4e4eb] flex flex-col justify-between transition-transform duration-200 shadow-[0_17px_37px_rgba(16,55,132,0.02)] ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5 overflow-y-auto">
          {/* Brand Logo */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-xs"
                style={{ backgroundColor: '#070709' }}
              >
                <LettersStethoscopeIcon className="w-5 h-5 text-[#2597d0]" />
              </div>
              <div>
                <p className="font-semibold text-[17px] tracking-[-0.03em] text-[#070709] leading-none">
                  Tumbuhin
                </p>
                <p className="text-[11.5px] font-normal text-[#60606c] mt-0.5 tracking-[-0.01em]">
                  Clinical AI Ecosystem
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#f5f5f5] text-[#070709] border border-[#e4e4eb]">
              {roleBadge}
            </span>
          </div>

          {/* Active User Profile Card */}
          <div className="p-3.5 rounded-[18px] bg-[#f5f5f5] border border-[#e4e4eb] mb-6">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-[13px] shrink-0 bg-[#070709]"
              >
                {(user?.full_name || user?.name || roleBadge).slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[13px] text-[#070709] truncate tracking-[-0.01em]">
                  {user?.full_name || user?.name || roleTitle}
                </p>
                <p className="text-[11.5px] text-[#60606c] truncate">
                  {user?.posyandu_name || user?.email || 'Desa Sukamaju'}
                </p>
              </div>
            </div>
            <div className="mt-2.5 pt-2.5 border-t border-[#e4e4eb] flex items-center justify-between text-[11px] text-[#60606c]">
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Sesi JWT Aktif
              </span>
              <span>Role: {user?.role || roleBadge.toLowerCase()}</span>
            </div>
          </div>

          {/* Menu List */}
          <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-[#8b8b8b]">
            Modul & Menu Sidebar ({menuItems.length})
          </div>
          <nav className="space-y-1" aria-label="Menu Role">
            {menuItems.map((item) => {
              const IconComponent = item.icon
              const isActive = item.id === activeMenuId
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
<<<<<<< HEAD
                    setInternalActiveMenuId(item.id)
                    setMobileSidebarOpen(false)
                    if (onMenuSelect) {
                      onMenuSelect(item)
                    }
=======
                    handleMenuClick(item.id)
>>>>>>> 585fb2db644aa31a59d8af36addccf2f989347af
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-full text-left text-[13px] font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#070709] text-white shadow-[0_1px_2px_rgba(36,36,40,0.1)]'
                      : 'text-[#60606c] hover:bg-[#f5f5f5] hover:text-[#070709]'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    {IconComponent && (
                      <IconComponent
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-[#2597d0]' : 'text-[#8b8b8b]'
                        }`}
                      />
                    )}
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-[#f5f5f5] text-[#070709] border border-[#e4e4eb]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

<<<<<<< HEAD
        {/* Bottom Actions: Quick Role Switcher (for Team Dev) & Logout */}
        <div className="p-4 border-t border-[#e4e4eb] bg-[#ffffff] space-y-3">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[#8b8b8b] mb-1.5">
              Pindah Role Cepat (Mode Tim Dev)
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { key: 'kader', label: '1. Petugas' },
                { key: 'bidan', label: '2. Bidan' },
                { key: 'admin', label: '3. Super Admin' },
                { key: 'ortu', label: '4. Ortu' },
              ].map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => {
                    if (onSwitchRole) {
                      onSwitchRole(r.key)
                    }
                  }}
                  className={`px-2.5 py-1.5 rounded-full text-[11.5px] font-medium border transition-colors cursor-pointer ${
                    (user?.role || '').toLowerCase() === r.key
                      ? 'bg-[#070709] text-white border-[#070709]'
                      : 'bg-white text-[#60606c] border-[#e4e4eb] hover:bg-[#f5f5f5] hover:text-[#070709]'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

=======
        {/* Bottom Actions: Logout */}
        <div className="p-4 border-t border-black/8 bg-[#fafbfd]">
>>>>>>> 585fb2db644aa31a59d8af36addccf2f989347af
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium text-[12.5px] border border-rose-200 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar / Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-7 overflow-y-auto overflow-x-hidden">
        {/* Top Bar Container */}
        <div className="w-full max-w-[1340px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#e4e4eb]">
            <div>
              <div className="inline-flex items-center gap-2 text-[12px] font-medium text-[#2597d0] mb-1">
                <ShieldCheck className="w-4 h-4 text-[#2597d0]" />
                <span className="text-[#070709] font-semibold">{roleTitle}</span>
                <span className="text-[#8b8b8b]">•</span>
                <span className="text-[#60606c]">{currentMenu?.route || backendEndpoint}</span>
              </div>
              <h1 className="text-[24px] sm:text-[28px] font-semibold tracking-[-0.04em] text-[#070709]">
                {currentMenu?.label || roleTitle}
              </h1>
              <p className="text-[14px] text-[#60606c] mt-0.5 tracking-[-0.01em]">
                {currentMenu?.description || roleSubtitle}
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-center">
              <a
                href="#top"
                onClick={(e) => {
                  e.preventDefault()
                  if (onLogout) {
                    onLogout()
                  }
                }}
                className="letters-ghost-btn inline-flex items-center gap-1.5 px-4 py-2 text-[12.5px] cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#2597d0]" />
                <span>Beranda Utama</span>
              </a>
            </div>
          </div>

          {/* KPI Summary Cards (DESIGN.md 18-24px radius, atmospheric shadow) - Hanya ditampilkan di halaman dashboard/overview */}
          {(activeMenuId === 'dashboard' || activeMenuId === 'overview') && statsCards.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              {statsCards.map((card, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-[20px] bg-white border border-[#e4e4eb] shadow-[0_17px_37px_rgba(16,55,132,0.03)] flex flex-col justify-between"
                >
                  <span className="text-[12px] font-normal text-[#60606c] tracking-[-0.01em]">{card.label}</span>
                  <div className="mt-2 flex items-baseline justify-between gap-2">
                    <span className="text-[26px] font-semibold tracking-[-0.03em] text-[#070709]">
                      {card.value}
                    </span>
                    {card.badge && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#f5f5f5] text-[#070709] border border-[#e4e4eb]">
                        {card.badge}
                      </span>
                    )}
                  </div>
                  {card.sub && (
                    <span className="mt-2 text-[11.5px] text-[#8b8b8b] tracking-[-0.01em]">{card.sub}</span>
                  )}
                </div>
              ))}
            </div>
          )}

<<<<<<< HEAD
          {/* Active Menu Workspace / Team Feature Slot / Custom Children Component */}
          {children ? (
            <div className="mt-6 w-full animate-in fade-in duration-200">
              {children}
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-6">
                <div className="p-6 sm:p-8 rounded-[24px] bg-white border border-[#e4e4eb] shadow-[0_17px_37px_rgba(16,55,132,0.03)]">
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-[#2597d0]" />
                      <h2 className="font-semibold text-[17px] text-[#070709] tracking-[-0.02em]">
                        Workspace Fitur: {currentMenu?.label}
                      </h2>
                    </div>
                    <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-[#f5f5f5] text-[#070709] border border-[#e4e4eb]">
                      Route: {currentMenu?.route}
                    </span>
                  </div>

                  <p className="text-[14px] text-[#60606c] leading-relaxed tracking-[-0.01em]">
                    {currentMenu?.description}
                  </p>

                  {currentMenu?.features && (
                    <div className="mt-6 pt-6 border-t border-[#f0f0f4]">
                      <p className="text-[11.5px] font-semibold uppercase tracking-wider text-[#8b8b8b] mb-3">
                        Spesifikasi Checklist Fitur (Sesuai fitur.md):
                      </p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {currentMenu.features.map((feat, i) => (
                          <li
                            key={i}
                            className="p-3.5 rounded-[16px] bg-[#f5f5f5] border border-[#e4e4eb] text-[13px] text-[#070709] flex items-start gap-2.5"
                          >
                            <span className="w-2 h-2 rounded-full bg-[#2597d0] mt-1.5 shrink-0" />
                            <span className="leading-snug">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {currentMenu?.route && currentMenu.route !== '/bidan/dashboard' && (
                    <div className="mt-6 pt-5 border-t border-[#f0f0f4] flex flex-wrap items-center justify-between gap-3">
                      <span className="text-[13px] text-[#60606c] tracking-[-0.01em]">
                        Halaman interaktif fitur ini telah siap digunakan:
                      </span>
                      <a
                        href={`#${currentMenu.route}`}
                        className="letters-pill-btn inline-flex items-center gap-2 px-5 py-2.5 text-[13px] cursor-pointer"
                      >
                        <span>Buka {currentMenu.label}</span>
                        <span>→</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Clean Code Architecture Hint for Team Collaboration */}
              <div className="lg:col-span-4 space-y-4">
                <div className="p-6 rounded-[24px] bg-[#070709] text-white shadow-[0_17px_37px_rgba(7,7,9,0.12)]">
                  <div className="flex items-center gap-2 text-[#2597d0] text-[12px] font-semibold mb-2">
                    <FolderGit2 className="w-4 h-4 text-[#2597d0]" />
                    <span>Panduan Struktur Tim (SOLID)</span>
                  </div>
                  <p className="text-[13px] text-white/80 leading-relaxed tracking-[-0.01em]">
                    Untuk mengerjakan fitur <strong>{currentMenu?.label}</strong> di backend Golang tanpa konflik git antar anggota tim, gunakan folder modular:
                  </p>
                  <div className="mt-4 p-3.5 rounded-[16px] bg-white/8 font-mono text-[11.5px] text-[#2597d0] space-y-1.5 overflow-x-auto border border-white/10">
                    <div>controllers/{currentMenu?.backendPath || backendFolderHint}</div>
                    <div>services/{currentMenu?.backendPath || backendFolderHint}</div>
                    <div>repositories/{currentMenu?.backendPath || backendFolderHint}</div>
                  </div>
                </div>

                <div className="p-6 rounded-[24px] bg-white border border-[#e4e4eb] shadow-[0_17px_37px_rgba(16,55,132,0.03)]">
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-[#070709] mb-2 tracking-[-0.01em]">
                    <UserCheck className="w-4 h-4 text-[#2597d0]" />
                    <span>Status Integrasi Auth &amp; Role</span>
                  </div>
                  <p className="text-[13px] text-[#60606c] leading-relaxed tracking-[-0.01em]">
                    Halaman ini telah terhubung dengan endpoint <code>{backendEndpoint}</code> dan dilindungi oleh middleware RBAC JWT sesuai role <strong>{roleBadge}</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}
=======
          {/* Main Content Workspace */}
          <div className="mt-6">
            {children}
          </div>
>>>>>>> 585fb2db644aa31a59d8af36addccf2f989347af
        </div>
      </main>
    </div>
  )
}
