import { useMemo, useState } from 'react'
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Command,
  Home,
  LayoutGrid,
  LogOut,
  Menu,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'

export const ROLE_SWITCH_OPTIONS = [
  { key: 'kader', label: '1. Kader', fullLabel: 'Kader Posyandu' },
  { key: 'bidan', label: '2. Bidan', fullLabel: 'Bidan Desa' },
  { key: 'admin', label: '3. Admin', fullLabel: 'Super Admin' },
  { key: 'ortu', label: '4. Ortu', fullLabel: 'Orang Tua' },
]

/**
 * Helper: builds an SVG polyline + closed area path from an array of numbers
 */
function buildSvgAreaPaths(values = [], width = 800, height = 135, padTop = 14, padBottom = 10) {
  const clean = Array.isArray(values) && values.length >= 2
    ? values.map((v) => (Number.isFinite(Number(v)) ? Number(v) : 0))
    : [40, 55, 48, 70, 62, 85, 78, 92]

  const minVal = Math.min(...clean)
  const maxVal = Math.max(...clean)
  const range = maxVal - minVal > 0 ? maxVal - minVal : 1
  const usableH = height - padTop - padBottom

  const coords = clean.map((v, idx) => {
    const x = Number(((idx / (clean.length - 1)) * width).toFixed(1))
    const norm = (v - minVal) / range
    const y = Number((padTop + usableH * (1 - norm)).toFixed(1))
    return { x, y, value: v, index: idx }
  })

  const lineCmd = coords
    .map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x},${pt.y}`)
    .join(' ')
  const areaCmd = `${lineCmd} L${width},${height} L0,${height} Z`

  return { coords, lineCmd, areaCmd }
}

/**
 * Helper: builds a smooth cubic-bezier SVG path from an array of numbers
 */
function buildSmoothBezierPaths(values = [], width = 360, height = 120, padTop = 14, padBottom = 10) {
  const { coords } = buildSvgAreaPaths(values, width, height, padTop, padBottom)
  if (coords.length < 2) {
    return { coords, lineCmd: '', areaCmd: '' }
  }

  let d = `M${coords[0].x},${coords[0].y}`
  for (let i = 0; i < coords.length - 1; i += 1) {
    const curr = coords[i]
    const next = coords[i + 1]
    const midX = Number(((curr.x + next.x) / 2).toFixed(1))
    d += ` C${midX},${curr.y} ${midX},${next.y} ${next.x},${next.y}`
  }

  const areaCmd = `${d} L${width},${height} L0,${height} Z`
  return { coords, lineCmd: d, areaCmd }
}

/**
 * 1. SmartSidebarShell
 * Fixed, non-scrollable (h-dvh overflow-hidden), user-friendly enterprise sidebar.
 */
export function SmartSidebarShell({
  brandSubtitle = 'SIGAPGIZI DESA',
  roleKey = 'admin',
  roleTitle = 'Super Admin Desa',
  menus = [],
  activeMenuId = 'dashboard',
  user,
  sidebarCollapsed = false,
  onToggleCollapse,
  onSelectMenu,
  onOpenQuickAdd,
  quickAddLabel = 'Tambah Data Baru',
  onSwitchRole,
  onLogout,
}) {
  const userInitials = (user?.full_name || roleTitle || 'TB')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <aside
      aria-label={`Navigasi ${roleTitle}`}
      className={`h-dvh sticky top-0 overflow-hidden bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 select-none transition-all duration-200 ${
        sidebarCollapsed ? 'w-[76px]' : 'w-64'
      }`}
    >
      <div className="flex flex-col min-h-0">
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-slate-100 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={() => menus[0] && onSelectMenu(menus[0])}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f26522] to-[#d94e0f] text-white flex items-center justify-center shadow-xs shrink-0 font-extrabold text-[15px]">
              T
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-[17px] tracking-tight text-[#1b2537]">
                    Tumbuhin
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-orange-50 text-[#f26522] border border-orange-200/70">
                    PRO
                  </span>
                </div>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 truncate">
                  {brandSubtitle}
                </span>
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={onToggleCollapse}
            title={sidebarCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
            className="w-7 h-7 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 flex items-center justify-center cursor-pointer shrink-0"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Single Clean Navigation Menu */}
        <div className="px-3.5 pt-4 pb-2">
          {!sidebarCollapsed && (
            <div className="px-2.5 mb-2.5 flex items-center justify-between">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                MENU UTAMA
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                {menus.length} Modul
              </span>
            </div>
          )}

          <nav aria-label="Daftar Modul" className="space-y-1">
            {menus.map((item) => {
              const Icon = item.icon || LayoutGrid
              const isActive = item.id === activeMenuId

              if (sidebarCollapsed) {
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectMenu(item)}
                    title={item.label}
                    className={`w-11 h-11 mx-auto rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#f26522] text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                )
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectMenu(item)}
                  className={`w-full px-3 py-2.5 rounded-xl text-left flex items-center justify-between gap-2 transition-all cursor-pointer relative ${
                    isActive
                      ? 'bg-orange-50/90 text-[#f26522] font-bold border border-orange-200/70 shadow-2xs before:content-[""] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3.5px] before:rounded-r-full before:bg-[#f26522]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/90 font-medium border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isActive
                          ? 'bg-[#f26522] text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-[12.5px] truncate">
                      {item.shortLabel || item.label}
                    </span>
                  </span>

                  {item.badge && (
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[9.5px] font-bold shrink-0 ${
                        isActive
                          ? 'bg-[#f26522] text-white'
                          : 'bg-slate-100 text-slate-500'
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
      </div>

      {/* Bottom Section: Compact 2x2 Role Switcher + Quick Add CTA + User Profile Footer */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/60 space-y-2.5 shrink-0">
        {!sidebarCollapsed && (
          <div className="p-2.5 rounded-xl bg-white border border-slate-200/70 space-y-1.5">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Users className="w-3 h-3 text-[#f26522]" />
                <span>Pindah Role Cepat</span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {ROLE_SWITCH_OPTIONS.map((opt) => {
                const isCurrent = String(roleKey).toLowerCase() === opt.key
                return (
                  <button
                    key={opt.key}
                    type="button"
                    title={opt.fullLabel}
                    onClick={() => onSwitchRole && onSwitchRole(opt.key)}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer truncate ${
                      isCurrent
                        ? 'bg-[#1b2537] text-white shadow-2xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {!sidebarCollapsed && onOpenQuickAdd && (
          <button
            type="button"
            onClick={onOpenQuickAdd}
            className="w-full py-2 px-3 rounded-xl bg-[#f26522] hover:bg-[#d94e0f] text-white font-bold text-[12px] flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="truncate">{quickAddLabel}</span>
          </button>
        )}

        <div className="flex items-center justify-between gap-2 pt-0.5">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#1b2537] text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                {userInitials}
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-bold text-slate-800 truncate leading-tight">
                  {(user?.full_name || roleTitle).split('(')[0].trim()}
                </p>
                <p className="text-[10.5px] text-slate-400 truncate leading-tight">
                  {user?.posyandu_name || user?.village_name || 'Desa Sukamaju'}
                </p>
              </div>
            </div>
          )}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              title="Keluar Sesi"
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-rose-600 hover:border-rose-200 transition-colors cursor-pointer shrink-0 mx-auto"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}

/**
 * 2. SmartTopHeader
 */
export function SmartTopHeader({
  user,
  roleLabel = 'Super Admin',
  pageTitle = 'IT Admin Dashboard',
  breadcrumbs = ['Dashboard', 'IT Admin Dashboard'],
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search in Tumbuhin...',
  greenBadgeText = 'Active Units 8',
  redBadgeText = 'Alerts 0',
  modeTabs = ['Production Live', 'Offline PWA', 'Mode Audit'],
  activeModeTab = 'Production Live',
  onModeTabChange,
  onNotificationClick,
  unreadCount = 0,
  onOpenMobileMenu,
}) {
  const initials = (user?.full_name || roleLabel || 'TB')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200/80 px-4 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-[220px] max-w-md">
          {onOpenMobileMenu && (
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-16 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[12.5px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#f26522]"
            />
            <span className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2">
              <Command className="w-2.5 h-2.5" /> /
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] font-semibold text-slate-600">
            <Sparkles className="w-3.5 h-3.5 text-[#f26522]" />
            <span>{user?.posyandu_name || 'Desa Sukamaju'}</span>
          </span>

          {onNotificationClick && (
            <button
              type="button"
              onClick={onNotificationClick}
              className="relative w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 flex items-center justify-center text-slate-600 cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 ? (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#f26522] text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              ) : (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </button>
          )}

          <div className="flex items-center gap-2.5 pl-1">
            <div className="hidden sm:block text-right">
              <p className="text-[12.5px] font-bold text-slate-800 leading-tight">
                {(user?.full_name || roleLabel).split(' ').slice(0, 2).join(' ')}
              </p>
              <p className="text-[10.5px] font-semibold text-slate-400 leading-tight">
                {roleLabel}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#1b2537] text-white font-bold text-[12px] flex items-center justify-center ring-2 ring-orange-100">
              {initials}
            </div>
          </div>
        </div>
      </div>

      {/* Executive Title, Breadcrumb, Status Badges & Environment Mode Switcher */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] sm:text-[24px] font-extrabold text-[#1b2537] tracking-tight">
            {pageTitle}
          </h1>
          <div className="flex items-center gap-1.5 text-[12px] text-slate-400 font-medium mt-0.5">
            <Home className="w-3.5 h-3.5 text-slate-400" />
            {breadcrumbs.map((crumb, idx) => (
              <span key={idx} className="flex items-center gap-1.5">
                <span>&gt;</span>
                <span
                  className={
                    idx === breadcrumbs.length - 1
                      ? 'text-slate-700 font-semibold'
                      : 'text-slate-400'
                  }
                >
                  {crumb}
                </span>
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-2 bg-white border border-slate-200/80 rounded-xl px-3 py-1.5 shadow-2xs">
            <span className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </span>
            <span className="text-[12px] font-bold text-slate-700">{greenBadgeText}</span>
          </div>

          <div className="inline-flex items-center gap-2 bg-white border border-slate-200/80 rounded-xl px-3 py-1.5 shadow-2xs">
            <span className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center">
              <ShieldAlert className="w-3.5 h-3.5" />
            </span>
            <span className="text-[12px] font-bold text-slate-700">{redBadgeText}</span>
          </div>

          <div className="inline-flex items-center bg-white border border-slate-200/80 rounded-xl p-1 shadow-2xs">
            {modeTabs.map((tab) => {
              const isCurrent = tab === activeModeTab
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => onModeTabChange && onModeTabChange(tab)}
                  className={`px-3 py-1 rounded-lg text-[11.5px] font-bold transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-[#f26522] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 3. SmartSparkKpiCard
 * Data-driven KPI card whose mini sparkline/equalizer/bars/pulse are dynamically computed from `sparkValues`.
 */
export function SmartSparkKpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  visualType = 'area',
  accentColor = '#f26522',
  sparkValues = [45, 58, 52, 74, 65, 86, 78, 94],
  onClick,
}) {
  const { lineCmd, areaCmd } = useMemo(
    () => buildSvgAreaPaths(sparkValues, 92, 40, 4, 2),
    [sparkValues],
  )

  const maxSpark = Math.max(...sparkValues.map((v) => Number(v) || 1), 1)

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-[#f26522]/60 shadow-2xs text-left transition-all group cursor-pointer flex flex-col justify-between gap-4"
    >
      <div className="flex items-center justify-between gap-2 w-full">
        <span className="text-[13px] font-semibold text-slate-500 group-hover:text-slate-800 transition-colors">
          {title}
        </span>
        <div className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-orange-50 text-slate-700 group-hover:text-[#f26522] flex items-center justify-center transition-colors shrink-0">
          {Icon && <Icon className="w-4 h-4" />}
        </div>
      </div>

      <div className="flex items-end justify-between gap-3 w-full">
        <div className="min-w-0">
          <p className="text-[26px] font-extrabold text-[#1b2537] tracking-tight leading-none">
            {value}
          </p>
          <p className="text-[11.5px] font-medium text-slate-400 mt-1.5 truncate">{subtitle}</p>
        </div>

        {/* Dynamic Mini Visual Graphic */}
        <div className="shrink-0 flex items-end h-11">
          {visualType === 'area' && (
            <svg width="92" height="42" viewBox="0 0 92 42" className="overflow-visible">
              <defs>
                <linearGradient
                  id={`grad-${title.replace(/[^a-zA-Z0-9]/g, '')}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={accentColor} stopOpacity="0.45" />
                  <stop offset="100%" stopColor={accentColor} stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <path
                d={areaCmd}
                fill={`url(#grad-${title.replace(/[^a-zA-Z0-9]/g, '')})`}
              />
              <path
                d={lineCmd}
                fill="none"
                stroke={accentColor}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          )}

          {visualType === 'equalizer' && (
            <div className="flex items-end gap-[4px] h-10">
              {sparkValues.slice(0, 10).map((v, idx) => {
                const hPct = Math.max(20, Math.round((Number(v) / maxSpark) * 100))
                const isHighlight = hPct >= 82
                return (
                  <span
                    key={idx}
                    style={{ height: `${hPct}%` }}
                    className={`w-[3.5px] rounded-full transition-all duration-300 ${
                      isHighlight ? 'bg-[#f26522]' : 'bg-slate-300'
                    }`}
                  />
                )
              })}
            </div>
          )}

          {visualType === 'bars' && (
            <div className="flex items-end gap-[5px] h-10">
              {sparkValues.slice(0, 8).map((v, idx) => {
                const hPct = Math.max(25, Math.round((Number(v) / maxSpark) * 100))
                return (
                  <span
                    key={idx}
                    style={{ height: `${hPct}%` }}
                    className={`w-[4px] rounded-full transition-all duration-300 ${
                      idx % 2 === 0 ? 'bg-[#f26522]' : 'bg-[#0f4c5c]'
                    }`}
                  />
                )
              })}
            </div>
          )}

          {visualType === 'pulse' && (
            <div className="flex items-end gap-[4px] h-10">
              {sparkValues.slice(0, 8).map((v, idx) => {
                const hPct = Math.max(22, Math.round((Number(v) / maxSpark) * 100))
                return (
                  <span
                    key={idx}
                    style={{ height: `${hPct}%` }}
                    className={`w-[4.5px] rounded-t-md transition-all duration-300 ${
                      hPct >= 80 ? 'bg-[#f26522]' : 'bg-slate-200'
                    }`}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

/**
 * 4. SmartCapsuleBarChart
 * Interactive capsule chart where switching 1H/1D/1W/1M dynamically recalculates capsule heights and values,
 * and hovering/clicking any capsule highlights its details.
 */
export function SmartCapsuleBarChart({
  title = 'Kapasitas & Cakupan Modul Operasional',
  icon: Icon,
  timeTabs = ['1H', '1D', '1W', '1M'],
  activeTimeTab = '1M',
  onTimeTabChange,
  bars = [],
  subCards = [],
  onBarClick,
}) {
  const [selectedBarIdx, setSelectedBarIdx] = useState(2)

  // Scale factors per timeframe so switching 1H/1D/1W/1M dynamically updates the chart
  const timeScaleFactor = useMemo(() => {
    if (activeTimeTab === '1H') return 0.72
    if (activeTimeTab === '1D') return 0.84
    if (activeTimeTab === '1W') return 0.93
    return 1.0
  }, [activeTimeTab])

  const computedBars = useMemo(() => {
    return bars.map((b, idx) => {
      const basePct = Number(b.percent || 65)
      const jitter = ((idx % 3) - 1) * (activeTimeTab === '1M' ? 0 : 4)
      const scaledPct = Math.max(24, Math.min(100, Math.round(basePct * timeScaleFactor + jitter)))
      return {
        ...b,
        scaledPct,
      }
    })
  }, [bars, timeScaleFactor, activeTimeTab])

  const activeBar = computedBars[selectedBarIdx] || computedBars[0]

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-[#f26522]" />}
          <h3 className="text-[15.5px] font-extrabold text-[#1b2537] tracking-tight">{title}</h3>
          {activeBar && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 text-[#f26522] text-[10.5px] font-bold">
              {activeBar.label}: {activeBar.valueLabel} ({activeBar.scaledPct}%)
            </span>
          )}
        </div>
        <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {timeTabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onTimeTabChange && onTimeTabChange(t)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                activeTimeTab === t
                  ? 'bg-[#0f4c5c] text-white'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Capsule Bars Visual */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pt-1 items-end">
        {computedBars.map((bar, idx) => {
          const isSelected = idx === selectedBarIdx
          const isOrange = bar.tone === 'orange' || isSelected
          return (
            <button
              key={bar.id || idx}
              type="button"
              onMouseEnter={() => setSelectedBarIdx(idx)}
              onClick={() => {
                setSelectedBarIdx(idx)
                if (onBarClick) onBarClick(bar)
              }}
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div
                className={`w-full max-w-[78px] h-40 rounded-2xl bg-slate-100/90 p-1 flex flex-col justify-end relative overflow-hidden border transition-all ${
                  isSelected
                    ? 'border-[#f26522] ring-2 ring-orange-100'
                    : 'border-slate-200/50'
                }`}
              >
                <div
                  style={{ height: `${bar.scaledPct}%` }}
                  className={`w-full rounded-xl transition-all duration-300 flex items-end justify-center pb-2.5 ${
                    isOrange
                      ? 'bg-gradient-to-t from-[#d94e0f] to-[#f26522] text-white'
                      : 'bg-gradient-to-t from-[#093844] to-[#0f4c5c] text-white'
                  }`}
                >
                  <span className="px-2 py-0.5 rounded-md bg-black/25 text-white text-[10px] font-bold tracking-tight">
                    {bar.valueLabel}
                  </span>
                </div>
              </div>
              <span
                className={`text-[11.5px] font-semibold truncate max-w-full ${
                  isSelected ? 'text-[#f26522] font-bold' : 'text-slate-600 group-hover:text-[#1b2537]'
                }`}
              >
                {bar.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Bottom 2x3 Module Health Sub-Cards */}
      {subCards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {subCards.map((sc, idx) => {
            const isAlert = sc.status === 'alert' || sc.status === 'warning'
            return (
              <button
                key={sc.id || idx}
                type="button"
                onClick={sc.onClick}
                className="p-3.5 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/60 flex items-center justify-between text-left transition-colors cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-slate-500 truncate">{sc.title}</p>
                  <p className="text-[13.5px] font-extrabold text-[#1b2537] mt-0.5 truncate">
                    {sc.metric}
                  </p>
                </div>
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    isAlert
                      ? 'bg-rose-100 text-rose-600'
                      : 'bg-emerald-100 text-emerald-600'
                  }`}
                >
                  {isAlert ? (
                    <ShieldAlert className="w-3.5 h-3.5" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/**
 * 5. SmartDotProgressCard
 */
export function SmartDotProgressCard({
  title = 'Kepatuhan Enkripsi & Kartu Gizi Digital',
  icon: Icon,
  subtitle = '312 dari 342 balita aktif',
  percentage = 89,
  totalDots = 16,
}) {
  const safePct = Math.max(0, Math.min(100, Number(percentage) || 0))
  const filledDots = Math.round((safePct / 100) * totalDots)

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3.5">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-[#f26522]" />}
        <h3 className="text-[15px] font-extrabold text-[#1b2537] tracking-tight">{title}</h3>
      </div>

      <div className="flex items-center justify-between text-[12.5px]">
        <span className="text-slate-500 font-medium">{subtitle}</span>
        <span className="text-[15px] font-extrabold text-[#1b2537]">{safePct}%</span>
      </div>

      <div className="flex items-center justify-between gap-1 pt-0.5">
        {Array.from({ length: totalDots }).map((_, idx) => {
          const isFilled = idx < filledDots
          return (
            <span
              key={idx}
              title={`Indikator #${idx + 1}: ${isFilled ? 'Terpenuhi' : 'Belum'}`}
              className={`w-3.5 h-3.5 rounded-full transition-colors ${
                isFilled ? 'bg-[#f26522]' : 'bg-slate-200'
              }`}
            />
          )
        })}
      </div>
    </div>
  )
}

/**
 * 6. SmartQuickActionsGrid
 */
export function SmartQuickActionsGrid({
  title = 'Aksi Cepat Operasional',
  icon: Icon,
  actions = [],
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4 flex-1">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        {Icon && <Icon className="w-4 h-4 text-[#f26522]" />}
        <h3 className="text-[15px] font-extrabold text-[#1b2537] tracking-tight">{title}</h3>
      </div>

      <div className="grid grid-cols-3 gap-y-4 gap-x-2 pt-1">
        {actions.map((act, idx) => {
          const ActIcon = act.icon || Sparkles
          return (
            <button
              key={act.id || idx}
              type="button"
              onClick={act.onClick}
              className="flex flex-col items-center text-center gap-2 group cursor-pointer"
            >
              <div className="relative w-12 h-12 rounded-full bg-[#1b2537] group-hover:bg-[#f26522] text-white flex items-center justify-center shadow-xs transition-colors">
                <ActIcon className="w-4 h-4" />
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#f26522] group-hover:bg-[#1b2537] text-white text-[8px] font-bold flex items-center justify-center ring-2 ring-white">
                  +
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-600 group-hover:text-[#1b2537] leading-tight line-clamp-2">
                {act.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * 7. SmartPeakMatrixAndAreaCard
 * Fully data-driven 2x5 progress matrix + interactive SVG Area Chart with hoverable/clickable points and period switcher.
 */
export function SmartPeakMatrixAndAreaCard({
  title = 'Distribusi Aktivitas & Analisis Tren Operasional',
  subtitle = 'Kapasitas Layanan per Posyandu / Jam Operasional',
  icon: Icon,
  periodLabel = 'Hari Ini',
  cells = [],
  areaTitle = 'Analisis Tren Aktivitas & Penimbangan Bulanan',
  areaSeries = [],
  highlightCallout = { label: 'Puncak Layanan', value: '94%' },
}) {
  const periods = [periodLabel, 'Minggu Ini', 'Bulan Ini']
  const [periodIdx, setPeriodIdx] = useState(0)
  const [hoveredIdx, setHoveredIdx] = useState(null)

  const defaultSeries = useMemo(() => {
    if (Array.isArray(areaSeries) && areaSeries.length >= 4) {
      return areaSeries
    }
    // Derive dynamic series from cells if areaSeries is not explicitly passed
    const baseFromCells = cells.map((c, i) => ({
      label: c.label ? c.label.split(' ')[0] : `Slot ${i + 1}`,
      value: Number(c.percent ?? 75),
      unit: '%',
    }))
    if (baseFromCells.length >= 6) return baseFromCells
    return [
      { label: '08:00', value: 64, unit: '%' },
      { label: '09:00', value: 82, unit: '%' },
      { label: '10:00', value: 91, unit: '%' },
      { label: '11:00', value: 78, unit: '%' },
      { label: '12:00', value: 56, unit: '%' },
      { label: '13:00', value: 72, unit: '%' },
      { label: '14:00', value: 88, unit: '%' },
      { label: '15:00', value: 95, unit: '%' },
      { label: '16:00', value: 74, unit: '%' },
      { label: '17:00', value: 68, unit: '%' },
    ]
  }, [areaSeries, cells])

  // Apply slight period shift when user clicks < or > period arrows
  const activeSeries = useMemo(() => {
    const offset = periodIdx === 0 ? 0 : periodIdx === 1 ? -4 : 3
    return defaultSeries.map((pt, idx) => ({
      ...pt,
      value: Math.max(8, Number((Number(pt.value || 0) + offset * ((idx % 2) ? 1 : -1)).toFixed(1))),
    }))
  }, [defaultSeries, periodIdx])

  const numericValues = useMemo(
    () => activeSeries.map((s) => Number(s.value || 0)),
    [activeSeries],
  )

  const { coords, lineCmd, areaCmd } = useMemo(
    () => buildSvgAreaPaths(numericValues, 800, 138, 16, 8),
    [numericValues],
  )

  const activePointIndex =
    hoveredIdx !== null && hoveredIdx < coords.length
      ? hoveredIdx
      : Math.max(0, Math.floor(coords.length * 0.6))
  const activeCoord = coords[activePointIndex] || coords[0]
  const activeMeta = activeSeries[activePointIndex] || activeSeries[0]

  const getToneColors = (pct) => {
    if (pct >= 88) return { dot: 'bg-rose-500', bar: 'bg-rose-500' }
    if (pct >= 70) return { dot: 'bg-[#f26522]', bar: 'bg-[#f26522]' }
    if (pct >= 50) return { dot: 'bg-amber-400', bar: 'bg-amber-400' }
    return { dot: 'bg-emerald-500', bar: 'bg-emerald-500' }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-5">
      {/* Header + Legend + Interactive Period Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-[#f26522]" />}
          <h3 className="text-[15.5px] font-extrabold text-[#1b2537] tracking-tight">{title}</h3>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Optimal (0-50%)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Sedang (50-70%)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f26522]" /> Tinggi (70-88%)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Prioritas (88-100%)
          </span>

          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold">
            <button
              type="button"
              onClick={() => setPeriodIdx((p) => (p - 1 + periods.length) % periods.length)}
              className="px-1 hover:text-[#f26522] cursor-pointer"
            >
              &lt;
            </button>
            <span>{periods[periodIdx]}</span>
            <button
              type="button"
              onClick={() => setPeriodIdx((p) => (p + 1) % periods.length)}
              className="px-1 hover:text-[#f26522] cursor-pointer"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* 2x5 Mini Progress Cards Grid */}
      <div>
        <p className="text-[12.5px] font-bold text-slate-700 mb-3">{subtitle}</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {cells.slice(0, 10).map((cell, idx) => {
            const pct = Math.max(10, Math.min(100, Number(cell.percent ?? 75)))
            const tone = getToneColors(pct)
            const isPointActive = hoveredIdx === idx
            return (
              <div
                key={cell.id || idx}
                onMouseEnter={() => idx < coords.length && setHoveredIdx(idx)}
                onClick={() => {
                  if (idx < coords.length) setHoveredIdx(idx)
                  if (cell.onClick) cell.onClick()
                }}
                className={`p-3.5 rounded-xl bg-slate-50/70 border space-y-2 transition-all cursor-pointer ${
                  isPointActive
                    ? 'border-[#f26522] bg-orange-50/30 shadow-2xs'
                    : 'border-slate-200/70 hover:border-[#f26522]/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 truncate">
                    {cell.label}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${tone.dot}`} />
                </div>
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-[17px] font-extrabold text-[#1b2537]">
                    {cell.valueText || `${pct}%`}
                  </span>
                  {cell.subText && (
                    <span className="text-[10px] font-semibold text-slate-400 truncate">
                      {cell.subText}
                    </span>
                  )}
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    style={{ width: `${pct}%` }}
                    className={`h-full rounded-full transition-all duration-300 ${tone.bar}`}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Interactive Smooth Gradient Area Chart */}
      <div className="pt-2 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[12.5px] font-bold text-slate-700">{areaTitle}</p>
          <div className="px-3 py-1 rounded-xl bg-white border border-slate-200 shadow-2xs text-[11px] font-bold text-slate-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#f26522]" />
            <span>
              {activeMeta ? `${activeMeta.label}: ` : `${highlightCallout.label}: `}
            </span>
            <span className="text-[#f26522]">
              {activeMeta
                ? `${activeMeta.value}${activeMeta.unit || '%'} • (${highlightCallout.value})`
                : highlightCallout.value}
            </span>
          </div>
        </div>

        <div className="w-full pt-2">
          <svg viewBox="0 0 800 148" className="w-full h-36 overflow-visible">
            <defs>
              <linearGradient id="smartAreaOrangeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f26522" stopOpacity="0.38" />
                <stop offset="100%" stopColor="#f26522" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {[25, 60, 95, 130].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="800"
                y2={y}
                stroke="#f1f5f9"
                strokeWidth="1"
              />
            ))}

            <path d={areaCmd} fill="url(#smartAreaOrangeGrad)" />
            <path
              d={lineCmd}
              fill="none"
              stroke="#f26522"
              strokeWidth="2.4"
              strokeLinecap="round"
            />

            {/* Vertical guide line on active point */}
            {activeCoord && (
              <line
                x1={activeCoord.x}
                y1={activeCoord.y}
                x2={activeCoord.x}
                y2={138}
                stroke="#f26522"
                strokeDasharray="3 3"
                strokeWidth="1.2"
              />
            )}

            {/* Interactive Hoverable Data Points */}
            {coords.map((pt, i) => {
              const isCurr = i === activePointIndex
              return (
                <g
                  key={i}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onClick={() => setHoveredIdx(i)}
                  className="cursor-pointer"
                >
                  <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isCurr ? 5.5 : 3.2}
                    fill="#fff"
                    stroke="#f26522"
                    strokeWidth={isCurr ? 2.8 : 1.8}
                  />
                </g>
              )
            })}
          </svg>

          <div
            style={{
              gridTemplateColumns: `repeat(${activeSeries.length}, minmax(0, 1fr))`,
            }}
            className="grid gap-1 text-[10px] font-semibold text-slate-400 pt-1 text-center"
          >
            {activeSeries.map((pt, i) => (
              <button
                key={i}
                type="button"
                onMouseEnter={() => setHoveredIdx(i)}
                onClick={() => setHoveredIdx(i)}
                className={`truncate cursor-pointer ${
                  i === activePointIndex ? 'text-[#f26522] font-bold' : 'hover:text-slate-700'
                }`}
              >
                {pt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 8. SmartTrendAndComplianceCard
 * Interactive Teal Smooth Curve Chart with 1H/1D/1W/1M timeframe filter + data-driven compliance rows.
 */
export function SmartTrendAndComplianceCard({
  title = 'Tren Pertumbuhan & Kepatuhan Klinis',
  icon: Icon,
  trendSeries = [
    { label: 'Sen', value: 62 },
    { label: 'Sel', value: 78 },
    { label: 'Rab', value: 74 },
    { label: 'Kam', value: 65 },
    { label: 'Jum', value: 88 },
    { label: 'Sab', value: 94 },
    { label: 'Min', value: 98 },
  ],
  complianceTitle = 'Keamanan & Kepatuhan Standar',
  complianceRows = [],
}) {
  const [tf, setTf] = useState('1W')
  const [hoverIdx, setHoverIdx] = useState(trendSeries.length - 1)

  const activeSeries = useMemo(() => {
    const mult = tf === '1H' ? 0.82 : tf === '1D' ? 0.9 : tf === '1W' ? 1.0 : 1.06
    return trendSeries.map((item, i) => ({
      ...item,
      value: Math.round(Number(item.value || 70) * mult + (tf === '1M' ? i * 2 : 0)),
    }))
  }, [trendSeries, tf])

  const { coords, lineCmd, areaCmd } = useMemo(
    () =>
      buildSmoothBezierPaths(
        activeSeries.map((s) => s.value),
        360,
        122,
        14,
        8,
      ),
    [activeSeries],
  )

  const selectedPt = coords[hoverIdx] || coords[coords.length - 1]
  const selectedMeta = activeSeries[hoverIdx] || activeSeries[activeSeries.length - 1]

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between gap-5">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3.5 mb-3">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-[#0f4c5c]" />}
            <h3 className="text-[15px] font-extrabold text-[#1b2537] tracking-tight">{title}</h3>
          </div>
          <div className="inline-flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
            {['1H', '1D', '1W', '1M'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTf(t)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer ${
                  tf === t ? 'bg-[#0f4c5c] text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {selectedMeta && (
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1 px-1">
            <span>Titik Pantau: <strong className="text-slate-800">{selectedMeta.label}</strong></span>
            <span className="font-extrabold text-[#0f4c5c]">Indeks: {selectedMeta.value}</span>
          </div>
        )}

        {/* Interactive Smooth Teal Area Curve */}
        <svg viewBox="0 0 360 128" className="w-full h-32 overflow-visible">
          <defs>
            <linearGradient id="smartTealGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f4c5c" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0f4c5c" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d={areaCmd} fill="url(#smartTealGrad)" />
          <path
            d={lineCmd}
            fill="none"
            stroke="#0f4c5c"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {coords.map((pt, idx) => (
            <g
              key={idx}
              onMouseEnter={() => setHoverIdx(idx)}
              onClick={() => setHoverIdx(idx)}
              className="cursor-pointer"
            >
              <circle cx={pt.x} cy={pt.y} r="12" fill="transparent" />
              <circle
                cx={pt.x}
                cy={pt.y}
                r={idx === hoverIdx ? 4.5 : 2.5}
                fill="#fff"
                stroke="#0f4c5c"
                strokeWidth={idx === hoverIdx ? 2.5 : 1.5}
              />
            </g>
          ))}
          {selectedPt && (
            <line
              x1={selectedPt.x}
              y1={selectedPt.y}
              x2={selectedPt.x}
              y2={122}
              stroke="#0f4c5c"
              strokeDasharray="2 2"
              strokeWidth="1"
            />
          )}
        </svg>
        <div className="flex items-center justify-between text-[10.5px] font-semibold text-slate-400 px-1 pt-1">
          {activeSeries.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onMouseEnter={() => setHoverIdx(idx)}
              onClick={() => setHoverIdx(idx)}
              className={`cursor-pointer ${
                idx === hoverIdx ? 'text-[#0f4c5c] font-bold' : ''
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Security & Compliance 3-Row List */}
      <div className="pt-3 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[13.5px] font-extrabold text-[#1b2537]">{complianceTitle}</h4>
          <span className="text-[11px] font-semibold text-slate-400">&lt; Live &gt;</span>
        </div>

        <div className="space-y-3">
          {complianceRows.map((row, idx) => {
            const barColor =
              idx === 0 ? 'bg-[#f26522]' : idx === 1 ? 'bg-[#0f4c5c]' : 'bg-emerald-500'
            const strokeColor = idx === 0 ? '#f26522' : idx === 1 ? '#0f4c5c' : '#10b981'
            const rowSpark = row.sparkValues || [40 + idx * 8, 55, 48, 72, 66, 90]
            const { lineCmd: miniLine } = buildSvgAreaPaths(rowSpark, 66, 22, 3, 3)

            return (
              <div
                key={row.id || idx}
                onClick={row.onClick}
                className={`flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 ${
                  row.onClick ? 'hover:border-slate-300 cursor-pointer' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[19px] font-extrabold text-[#1b2537] w-12 text-right shrink-0">
                    {row.value}
                  </span>
                  <span className={`w-1 h-8 rounded-full ${barColor} shrink-0`} />
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-bold text-slate-800 truncate">{row.title}</p>
                    <p className="text-[11px] text-slate-400 truncate">{row.subtitle}</p>
                  </div>
                </div>

                <svg width="68" height="24" viewBox="0 0 68 24" className="shrink-0">
                  <path
                    d={miniLine}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/**
 * 9. SmartStackedDistributionCard
 * Calculates TRUE proportional bar widths based on each segment's numeric `count`, matching SmartHR "User Roles Distribution".
 */
export function SmartStackedDistributionCard({
  title = 'Distribusi Proporsi Kategori & Status',
  icon: Icon,
  periodLabel = 'Bulanan',
  segments = [],
}) {
  const palette = [
    'bg-[#f26522]',
    'bg-[#0f4c5c]',
    'bg-[#1b2537]',
    'bg-amber-400',
  ]

  const totalCount = useMemo(() => {
    const sum = segments.reduce((acc, s) => {
      const n = parseFloat(String(s.count || '0').replace(/[^0-9.]/g, ''))
      return acc + (Number.isFinite(n) ? n : 1)
    }, 0)
    return sum > 0 ? sum : 1
  }, [segments])

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-[#f26522]" />}
          <h3 className="text-[15px] font-extrabold text-[#1b2537] tracking-tight">{title}</h3>
        </div>
        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold">
          &lt; {periodLabel} &gt;
        </span>
      </div>

      {/* Proportional Horizontal Stacked Bar Row */}
      <div className="flex items-stretch gap-2 pt-1 w-full">
        {segments.map((seg, idx) => {
          const rawNum = parseFloat(String(seg.count || '0').replace(/[^0-9.]/g, ''))
          const sharePct = Math.round(((Number.isFinite(rawNum) ? rawNum : 1) / totalCount) * 100)
          // Clamp visual flex weight so small numbers remain readable while large numbers are visibly wider
          const flexWeight = Math.max(18, Math.min(60, sharePct))

          return (
            <div
              key={seg.label || idx}
              style={{ flex: `${flexWeight} 1 0%` }}
              className="min-w-0 space-y-1.5"
            >
              <span className="block text-[11px] font-semibold text-slate-500 truncate">
                {seg.label}
              </span>
              <div
                title={`${seg.label}: ${seg.count} (${sharePct}%)`}
                className={`h-6 rounded-lg ${palette[idx % palette.length]} w-full shadow-2xs flex items-center justify-end px-2`}
              >
                <span className="text-[9.5px] font-bold text-white/90">{sharePct}%</span>
              </div>
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-[14px] font-extrabold text-[#1b2537]">{seg.count}</span>
                {seg.sublabel && (
                  <span className="text-[10px] font-semibold text-slate-400 truncate">
                    {seg.sublabel}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * 10. SmartHeatmapMatrixCard
 * Interactive 84-cell heatmap matrix derived from live data with hover inspection and period switching.
 */
export function SmartHeatmapMatrixCard({
  title = 'Peta Intensitas Aktivitas & Risiko Klaster (24 Jam)',
  icon: Icon,
  periodLabel = 'Hari Ini',
  matrixSeed,
}) {
  const periods = [periodLabel, '7 Hari', '30 Hari']
  const [periodIdx, setPeriodIdx] = useState(0)
  const [activeCell, setActiveCell] = useState(null)

  const baseSeed = useMemo(() => {
    if (Array.isArray(matrixSeed) && matrixSeed.length >= 28) {
      return matrixSeed
    }
    return [
      0, 1, 0, 2, 0, 0, 3, 1, 0, 0, 2, 3, 1, 0,
      1, 2, 0, 1, 3, 0, 2, 2, 0, 1, 3, 2, 0, 1,
      0, 0, 2, 3, 2, 1, 0, 1, 2, 0, 1, 0, 2, 3,
      2, 1, 0, 1, 2, 3, 1, 0, 3, 2, 0, 1, 3, 2,
      0, 2, 1, 0, 1, 2, 0, 2, 1, 0, 2, 3, 1, 0,
      1, 0, 0, 2, 0, 1, 2, 0, 1, 2, 1, 2, 3, 1,
    ]
  }, [matrixSeed])

  const computedCells = useMemo(() => {
    return Array.from({ length: 84 }).map((_, idx) => {
      const raw = Number(baseSeed[idx % baseSeed.length] || 0)
      const shifted = (raw + periodIdx * ((idx % 3 === 0) ? 1 : 0)) % 4
      const rwNum = (idx % 8) + 1
      const hourSlot = 8 + (idx % 12)
      return {
        index: idx,
        level: shifted,
        label: `Posyandu RW 0${rwNum} • ${String(hourSlot).padStart(2, '0')}:00 WIB`,
        statusText:
          shifted === 3
            ? 'Aktivitas Puncak / Prioritas Tinggi'
            : shifted === 2
              ? 'Aktivitas Menengah'
              : shifted === 1
                ? 'Aktivitas Normal'
                : 'Idle / Bersih',
      }
    })
  }, [baseSeed, periodIdx])

  const shadeClass = (lvl) => {
    if (lvl >= 3) return 'bg-[#f26522]'
    if (lvl === 2) return 'bg-[#f26522]/65'
    if (lvl === 1) return 'bg-[#f26522]/30'
    return 'bg-slate-100'
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3.5 flex-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-[#f26522]" />}
          <h3 className="text-[15px] font-extrabold text-[#1b2537] tracking-tight">{title}</h3>
        </div>

        <div className="flex items-center gap-2">
          {activeCell && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-orange-50 text-[#f26522] text-[10.5px] font-bold">
              {activeCell.label}: {activeCell.statusText}
            </span>
          )}
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setPeriodIdx((p) => (p - 1 + periods.length) % periods.length)}
              className="px-1 hover:text-[#f26522] cursor-pointer"
            >
              &lt;
            </button>
            <span>{periods[periodIdx]}</span>
            <button
              type="button"
              onClick={() => setPeriodIdx((p) => (p + 1) % periods.length)}
              className="px-1 hover:text-[#f26522] cursor-pointer"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-14 gap-1.5 pt-1">
        {computedCells.map((cell) => (
          <button
            key={cell.index}
            type="button"
            onMouseEnter={() => setActiveCell(cell)}
            onClick={() => setActiveCell(cell)}
            title={`${cell.label} — ${cell.statusText}`}
            className={`h-5 rounded-md transition-transform hover:scale-110 cursor-pointer ${shadeClass(
              cell.level,
            )} ${
              activeCell?.index === cell.index ? 'ring-2 ring-[#1b2537]' : ''
            }`}
          />
        ))}
      </div>
    </div>
  )
}
