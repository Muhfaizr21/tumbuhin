import { useState } from 'react'
import {
  Baby,
  Camera,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Plus,
  RefreshCw,
  Scale,
  Send,
  Stethoscope,
  Users,
  Activity,
  CheckCircle2,
} from 'lucide-react'

const ROLE_SWITCH_ITEMS = [
  { key: 'kader', label: '1. Petugas' },
  { key: 'bidan', label: '2. Bidan' },
  { key: 'admin', label: '3. Super Admin' },
  { key: 'ortu', label: '4. Ortu' },
]

export default function KaderNavigationShell({
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
      {/* Column 1: Navy Vertical Icon Rail (Modified Navy) */}
      <nav
        aria-label="Navigasi Ikon Utama Petugas"
        className="w-16 bg-[#1e293b] text-white flex flex-col items-center justify-between py-5 shrink-0 select-none"
      >
        <div className="flex flex-col items-center gap-6">
          <button
            type="button"
            onClick={() => onSelectMenu(menus[0])}
            className="w-10 h-10 rounded-xl bg-white text-[#1e293b] flex items-center justify-center shadow-sm hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <Stethoscope className="w-5 h-5" aria-hidden="true" />
          </button>

          <div className="flex flex-col items-center gap-2.5">
            {menus.map((item) => {
              const Icon = item.icon || LayoutDashboard
              const isActive = item.id === activeMenuId
              return (
                <div key={item.id} className="relative flex items-center">
                  {isActive && <span className="absolute -left-3 w-1.5 h-1.5 rounded-full bg-white" />}
                  <button
                    type="button"
                    onClick={() => onSelectMenu(item)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      isActive ? 'bg-white/20 text-white shadow-xs' : 'text-white/75 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="w-10 h-10 rounded-xl text-white/80 hover:text-white hover:bg-white/15 flex items-center justify-center cursor-pointer"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
        </button>
      </nav>

      {/* Column 2: White Sidebar */}
      <aside
        className={`bg-white border-r border-slate-100 flex flex-col justify-between transition-all duration-200 ${
          sidebarCollapsed ? 'w-0 overflow-hidden border-r-0' : 'w-64'
        }`}
      >
        <div className="p-5 space-y-6 overflow-y-auto">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="w-7 h-7 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 flex items-center justify-center cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Posyandu RW</span>
          </div>

          <div>
            <h2 className="text-[18px] font-bold text-slate-800 tracking-tight mb-3.5">Menu Kader</h2>

            <div className="space-y-2.5">
              {featuredMenus.map((item) => {
                const Icon = item.icon || LayoutDashboard
                const isActive = item.id === activeMenuId
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectMenu(item)}
                    className={`w-full p-3 rounded-2xl text-left flex items-center gap-3 transition-all cursor-pointer ${
                      isActive ? 'bg-[#edf7fe] text-[#2597d0]' : 'bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${isActive ? 'bg-white text-[#2597d0]' : 'bg-slate-100 text-slate-600'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[13px] font-semibold truncate ${isActive ? 'text-[#2597d0]' : 'text-slate-800'}`}>{item.label}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

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
                    isActive ? 'bg-[#edf7fe] text-[#2597d0] font-semibold' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#2597d0]' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="p-4 space-y-3 border-t border-slate-100 bg-white">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-600 mb-1.5">
              <Users className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Role</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {ROLE_SWITCH_ITEMS.map((r) => {
                const isCurrentRole = (user?.role || 'kader').toLowerCase() === r.key
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => onSwitchRole && onSwitchRole(r.key)}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer ${
                      isCurrentRole ? 'bg-[#1e293b] text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {r.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </aside>

      {sidebarCollapsed && (
        <div className="bg-white border-r border-slate-100 p-2 flex flex-col items-center">
          <button type="button" onClick={onToggleCollapse} className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 flex items-center justify-center cursor-pointer">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
