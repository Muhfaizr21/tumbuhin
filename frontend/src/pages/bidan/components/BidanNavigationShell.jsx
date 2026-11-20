import {
  Activity,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileSpreadsheet,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  MapPin,
  Plus,
  ShieldCheck,
  Stethoscope,
  Users,
} from 'lucide-react'

const ROLE_SWITCH_ITEMS = [
  { key: 'kader', label: '1. Petugas' },
  { key: 'bidan', label: '2. Bidan' },
  { key: 'admin', label: '3. Super Admin' },
  { key: 'ortu', label: '4. Ortu' },
]

/**
 * BidanNavigationShell
 * Implements the dual-sidebar architecture from the reference UI:
 * 1. Far-left solid blue vertical icon rail (#2597d0)
 * 2. White secondary navigation sidebar with highlighted module cards, clean icon list, and quick action CTA
 */
export default function BidanNavigationShell({
  menus = [],
  activeMenuId = 'dashboard',
  user,
  sidebarCollapsed = false,
  onToggleCollapse,
  onSelectMenu,
  onOpenQuickAdd,
  onSwitchRole,
  onLogout,
  statsSummary,
}) {
  const featuredMenus = menus.slice(0, 3)
  const secondaryMenus = menus.slice(3)

  return (
    <div className="flex shrink-0">
      {/* Column 1: Navy Vertical Icon Rail */}
      <nav
        aria-label="Navigasi Ikon Utama Bidan"
        className="w-16 bg-[#1e293b] text-white flex flex-col items-center justify-between py-5 shrink-0 select-none"
      >
        {/* Top Brand Icon */}
        <div className="flex flex-col items-center gap-6">
          <button
            type="button"
            onClick={() => onSelectMenu(menus[0])}
            title="Beranda Surveilans Tumbuhin"
            aria-label="Beranda Surveilans Tumbuhin"
            className="w-10 h-10 rounded-xl bg-white text-[#1e293b] flex items-center justify-center shadow-sm hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <Stethoscope className="w-5 h-5" aria-hidden="true" />
          </button>

          {/* Rail Icon Buttons */}
          <div className="flex flex-col items-center gap-2.5">
            {menus.map((item) => {
              const Icon = item.icon || LayoutDashboard
              const isActive = item.id === activeMenuId
              return (
                <div key={item.id} className="relative flex items-center">
                  {isActive && (
                    <span
                      className="absolute -left-3 w-1.5 h-1.5 rounded-full bg-white"
                      aria-hidden="true"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => onSelectMenu(item)}
                    title={item.label}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white/20 text-white shadow-xs'
                        : 'text-white/75 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom Logout Icon */}
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onLogout}
            title="Keluar Sesi Bidan"
            aria-label="Keluar Sesi Bidan"
            className="w-10 h-10 rounded-xl text-white/80 hover:text-white hover:bg-white/15 flex items-center justify-center cursor-pointer"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </nav>

      {/* Column 2: Secondary White Navigation Sidebar */}
      <aside
        aria-label="Daftar Modul Klinis Bidan"
        className={`bg-white border-r border-slate-100 flex flex-col justify-between transition-all duration-200 ${
          sidebarCollapsed ? 'w-0 overflow-hidden border-r-0' : 'w-64'
        }`}
      >
        <div className="p-5 space-y-6 overflow-y-auto">
          {/* Header with collapse button */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Sembunyikan panel menu samping"
              className="w-7 h-7 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 flex items-center justify-center cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Puskesmas Desa
            </span>
          </div>

          <div>
            <h2 className="text-[18px] font-bold text-slate-800 tracking-tight mb-3.5">
              Surveilans Gizi
            </h2>

            {/* Top 3 Featured Storage-like Navigation Cards */}
            <div className="space-y-2.5">
              {featuredMenus.map((item) => {
                const Icon = item.icon || LayoutDashboard
                const isActive = item.id === activeMenuId
                let metricSub = '8 Posyandu Aktif'
                if (item.id === 'peta-gis') {
                  metricSub = `${statsSummary?.totalBalita || 342} Balita Terpetakan`
                } else if (item.id === 'prioritas') {
                  metricSub = `${statsSummary?.highRiskCount || 19} Kasus Triase Aktif`
                } else {
                  metricSub = `Prevalensi ${(statsSummary?.stuntingPrevalence || 8.4).toFixed(1)}%`
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectMenu(item)}
                    className={`w-full p-3 rounded-2xl text-left flex items-center gap-3 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-slate-100 text-[#1e293b]'
                        : 'bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                        isActive
                          ? 'bg-[#1e293b] text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-[13px] font-semibold truncate ${
                          isActive ? 'text-[#1e293b]' : 'text-slate-800'
                        }`}
                      >
                        {item.shortLabel || item.label}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {metricSub}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Secondary Clean Icon Links */}
          <div className="pt-2 border-t border-slate-100 space-y-1">
            {secondaryMenus.map((item) => {
              const Icon = item.icon || Activity
              const isActive = item.id === activeMenuId
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectMenu(item)}
                  className={`w-full px-3 py-2.5 rounded-xl text-left flex items-center justify-between text-[12.5px] font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-slate-100 text-[#1e293b] font-semibold'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-[#1e293b]' : 'text-slate-400'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="truncate">{item.shortLabel || item.label}</span>
                  </span>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600">
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Bottom Info Box & Primary Action CTA */}
        <div className="p-4 space-y-3 border-t border-slate-100 bg-white">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-700 mb-1.5">
              <Users className="w-4 h-4" aria-hidden="true" />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Pindah Role Cepat
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {ROLE_SWITCH_ITEMS.map((r) => {
                const isCurrentRole = (user?.role || 'bidan').toLowerCase() === r.key
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => onSwitchRole && onSwitchRole(r.key)}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                      isCurrentRole
                        ? 'bg-[#1e293b] text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {r.label}
                  </button>
                )
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenQuickAdd}
            className="w-full py-2.5 px-4 rounded-xl bg-[#1e293b] hover:bg-[#0f172a] text-white font-semibold text-[12.5px] flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Tambah Data Triase</span>
          </button>
        </div>
      </aside>

      {/* Expand Trigger if collapsed */}
      {sidebarCollapsed && (
        <div className="bg-white border-r border-slate-100 p-2 flex flex-col items-center">
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Buka panel menu samping"
            aria-label="Buka panel menu samping"
            className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 flex items-center justify-center cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}
