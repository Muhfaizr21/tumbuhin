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
  children,
}) {
  const [activeMenuId, setActiveMenuId] = useState(menuItems[0]?.id || 'dashboard')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const currentMenu = menuItems.find((item) => item.id === activeMenuId) || menuItems[0]

  return (
    <div className="min-h-dvh bg-[#f5f8fc] text-[#070709] flex flex-col lg:flex-row font-runde">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-black/8 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs"
            style={{ backgroundColor: accentColor }}
          >
            <LettersStethoscopeIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-[16px] tracking-[-0.02em]">Tumbuhin</span>
            <span className="ml-2 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#eef5fc] text-[#2597d0]">
              {roleBadge}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileSidebarOpen((prev) => !prev)}
          className="p-2 rounded-xl text-[#070709] hover:bg-black/5 cursor-pointer"
          aria-label="Toggle Menu Sidebar"
        >
          {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar Navigation (Complete 100% Menu List from fitur.md) */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-black/8 flex flex-col justify-between transition-transform duration-200 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5 overflow-y-auto">
          {/* Brand Logo */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm"
                style={{ backgroundColor: accentColor }}
              >
                <LettersStethoscopeIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-[17px] tracking-[-0.02em] text-[#070709] leading-none">
                  Tumbuhin
                </p>
                <p className="text-[11px] font-medium text-[#60606c] mt-0.5">
                  Clinical AI Ecosystem
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#eef5fc] text-[#2597d0] border border-[#2597d0]/20">
              {roleBadge}
            </span>
          </div>

          {/* Active User Profile Card */}
          <div className="p-3.5 rounded-2xl bg-[#f5f8fc] border border-black/6 mb-6">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-[13px] shrink-0"
                style={{ backgroundColor: accentColor }}
              >
                {(user?.full_name || user?.name || roleBadge).slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[13px] text-[#070709] truncate">
                  {user?.full_name || user?.name || roleTitle}
                </p>
                <p className="text-[11.5px] text-[#60606c] truncate">
                  {user?.posyandu_name || user?.email || 'Desa Sukamaju'}
                </p>
              </div>
            </div>
            <div className="mt-2.5 pt-2.5 border-t border-black/6 flex items-center justify-between text-[11px] text-[#60606c]">
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
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
                    setActiveMenuId(item.id)
                    setMobileSidebarOpen(false)
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-[13.5px] font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#070709] text-white shadow-xs'
                      : 'text-[#4a5568] hover:bg-[#f0f4f9] hover:text-[#070709]'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    {IconComponent && (
                      <IconComponent
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-[#5cc0f0]' : 'text-[#60606c]'
                        }`}
                      />
                    )}
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-[#eef5fc] text-[#2597d0]'
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

        {/* Bottom Actions: Quick Role Switcher (for Team Dev) & Logout */}
        <div className="p-4 border-t border-black/8 bg-[#fafbfd] space-y-3">
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
                  className={`px-2.5 py-1.5 rounded-lg text-[11.5px] font-medium border transition-colors cursor-pointer ${
                    (user?.role || '').toLowerCase() === r.key
                      ? 'bg-[#2597d0] text-white border-[#2597d0]'
                      : 'bg-white text-[#070709] border-black/10 hover:bg-[#eef5fc]'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[13px] border border-rose-200 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar / Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-5 sm:p-8 overflow-y-auto">
        {/* Top Bar */}
        <div className="max-w-[1140px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-black/8">
            <div>
              <div className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#2597d0] mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>{roleTitle}</span>
                <span>•</span>
                <span className="text-[#60606c]">{currentMenu?.route || backendEndpoint}</span>
              </div>
              <h1 className="text-[24px] sm:text-[28px] font-bold tracking-[-0.03em] text-[#070709]">
                {currentMenu?.label || roleTitle}
              </h1>
              <p className="text-[14px] text-[#60606c] mt-0.5">
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
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-black/10 text-[12.5px] font-medium text-[#070709] hover:bg-black/4 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Beranda Utama</span>
              </a>
            </div>
          </div>

          {/* KPI Summary Cards */}
          {statsCards.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              {statsCards.map((card, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-white border border-black/8 shadow-2xs flex flex-col justify-between"
                >
                  <span className="text-[12.5px] font-medium text-[#60606c]">{card.label}</span>
                  <div className="mt-2 flex items-baseline justify-between gap-2">
                    <span className="text-[26px] font-bold tracking-[-0.03em] text-[#070709]">
                      {card.value}
                    </span>
                    {card.badge && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {card.badge}
                      </span>
                    )}
                  </div>
                  {card.sub && (
                    <span className="mt-1.5 text-[11.5px] text-[#8b8b8b]">{card.sub}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Active Menu Workspace / Team Feature Slot */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              <div className="p-6 rounded-2xl bg-white border border-black/8 shadow-2xs">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <h2 className="font-bold text-[17px] text-[#070709]">
                      Workspace Fitur: {currentMenu?.label}
                    </h2>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#eef5fc] text-[#2597d0]">
                    Route: {currentMenu?.route}
                  </span>
                </div>

                <p className="text-[14px] text-[#4a5568] leading-relaxed">
                  {currentMenu?.description}
                </p>

                {currentMenu?.features && (
                  <div className="mt-5 pt-5 border-t border-black/8">
                    <p className="text-[12px] font-semibold uppercase tracking-wider text-[#8b8b8b] mb-3">
                      Spesifikasi Checklist Fitur (Sesuai fitur.md):
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {currentMenu.features.map((feat, i) => (
                        <li
                          key={i}
                          className="p-3 rounded-xl bg-[#f5f8fc] border border-black/6 text-[13px] text-[#070709] flex items-start gap-2"
                        >
                          <span className="w-2 h-2 rounded-full bg-[#2597d0] mt-1.5 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {children && <div className="mt-6">{children}</div>}
              </div>
            </div>

            {/* Right Column: Clean Code Architecture Hint for Team Collaboration */}
            <div className="lg:col-span-4 space-y-4">
              <div className="p-5 rounded-2xl bg-[#070709] text-white shadow-sm">
                <div className="flex items-center gap-2 text-[#5cc0f0] text-[12px] font-semibold mb-2">
                  <FolderGit2 className="w-4 h-4" />
                  <span>Panduan Struktur Tim (SOLID)</span>
                </div>
                <p className="text-[13px] text-white/80 leading-snug">
                  Untuk mengerjakan fitur <strong>{currentMenu?.label}</strong> di backend Golang tanpa konflik git antar anggota tim, gunakan folder modular:
                </p>
                <div className="mt-3 p-3 rounded-xl bg-white/8 font-mono text-[11.5px] text-emerald-300 space-y-1.5 overflow-x-auto">
                  <div>controllers/{currentMenu?.backendPath || backendFolderHint}</div>
                  <div>services/{currentMenu?.backendPath || backendFolderHint}</div>
                  <div>repositories/{currentMenu?.backendPath || backendFolderHint}</div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-black/8 shadow-2xs">
                <div className="flex items-center gap-2 text-[13px] font-bold text-[#070709] mb-2">
                  <UserCheck className="w-4 h-4 text-[#2597d0]" />
                  <span>Status Integrasi Auth & Role</span>
                </div>
                <p className="text-[12.5px] text-[#60606c] leading-relaxed">
                  Halaman ini telah terhubung dengan endpoint <code>{backendEndpoint}</code> dan dilindungi oleh middleware RBAC JWT sesuai role <strong>{roleBadge}</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
