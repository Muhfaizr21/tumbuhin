import { useState } from 'react'
import {
  Baby,
  Camera,
  ChefHat,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Scale,
  Send,
  X,
} from 'lucide-react'
import { LettersStethoscopeIcon } from '../ui/LettersIcons'

const DEFAULT_MENUS = [
  {
    id: 'dashboard',
    label: 'Beranda Posyandu',
    route: '/kader/dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'balita',
    label: 'Data & Profil Balita',
    route: '/kader/balita',
    icon: Baby,
    badge: '48',
  },
  {
    id: 'timbang',
    label: 'Input Timbangan',
    route: '/kader/timbang',
    icon: Scale,
  },
  {
    id: 'ocr-kms',
    label: 'Smart KMS OCR',
    route: '/kader/ocr-kms',
    icon: Camera,
  },
  {
    id: 'nutri-chef',
    label: 'AI Nutri-Chef',
    route: '/kader/nutri-chef',
    icon: ChefHat,
  },
  {
    id: 'sinkronisasi',
    label: 'Antrean Sinkron',
    route: '/kader/sinkronisasi',
    icon: RefreshCw,
    badge: '0',
  },
  {
    id: 'distribusi',
    label: 'Distribusi WA & QR',
    route: '/kader/distribusi',
    icon: Send,
  },
]

export default function DashboardSidebar({
  user,
  activeMenuId = 'dashboard',
  onMenuChange,
  onLogout,
  onSwitchRole,
  isMobileOpen = false,
  onCloseMobile,
  isDevMode = false,
}) {
  const [showDevPanel, setShowDevPanel] = useState(false)
  const isDev = isDevMode || import.meta.env.VITE_DEV_MODE === 'true'

  const userInitials = (user?.full_name || user?.name || 'Siti Aminah')
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Tutup menu samping"
          onClick={onCloseMobile}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onCloseMobile()
            }
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden cursor-pointer"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 inset-y-0 left-0 z-50 w-72 h-dvh flex flex-col justify-between text-white transition-transform duration-300 ease-in-out clinicflow-sidebar shadow-2xl lg:shadow-none ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{
          background: 'linear-gradient(180deg, #0B1F4B 0%, #11306F 100%)',
        }}
      >
        {/* Top: Brand & Navigation */}
        <div className="p-5 flex-1 overflow-y-auto overflow-x-hidden">
          {/* Brand Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-white shadow-sm shrink-0">
                <LettersStethoscopeIcon className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[18px] tracking-tight text-white leading-tight">
                    Tumbuhin
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-200 border border-blue-400/30">
                    Petugas
                  </span>
                </div>
                <p className="text-[11px] font-normal text-blue-200/70">
                  Clinical AI Ecosystem
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
              aria-label="Tutup menu navigasi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Compact Card */}
          <div className="p-3.5 rounded-2xl bg-white/8 border border-white/12 mb-6 backdrop-blur-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 border border-white/20 shadow-xs">
                {userInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[13px] text-white truncate leading-snug">
                  {user?.full_name || 'Siti Aminah'}
                </p>
                <p className="text-[11px] text-blue-200/70 truncate">
                  {user?.posyandu_name || 'Posyandu Melati 04'}
                </p>
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10.5px] text-blue-200/60">
              <span className="inline-flex items-center gap-1.5 text-emerald-300 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Sistem Terhubung
              </span>
              <span>Role: Kader</span>
            </div>
          </div>

          {/* Nav Label */}
          <div className="px-2 mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-blue-200/50">
            Menu Operasional
          </div>

          {/* Menu Items */}
          <nav className="space-y-1" aria-label="Menu Posyandu">
            {DEFAULT_MENUS.map((item) => {
              const Icon = item.icon
              const isActive = activeMenuId === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (onMenuChange) onMenuChange(item.id)
                    if (onCloseMobile) onCloseMobile()
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-[13px] font-medium transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30 font-semibold'
                      : 'text-blue-100/70 hover:bg-white/8 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-white' : 'text-blue-200/60'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold shrink-0 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-white/10 text-blue-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Promotional / Stunting Awareness Card (ClinicFlow equivalent) */}
          <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-blue-600/30 to-purple-600/30 border border-white/12 relative overflow-hidden">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center shrink-0 text-blue-200">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-[12.5px] font-semibold text-white leading-tight">
                  Cegah Stunting Sejak Dini
                </h2>
                <p className="text-[11px] text-blue-100/75 mt-1 leading-relaxed">
                  Pantau kurva tumbuh kembang WHO LMS setiap bulan untuk generasi emas.
                </p>
              </div>
            </div>

            {/* Micro-Progress Bar */}
            <div className="mt-3 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between text-[10px] text-blue-200/80 mb-1">
                <span>Target Timbang RW 04</span>
                <span className="font-semibold text-white">41 / 48 (85,4%)</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/15 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: '85.4%' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Dev Switcher (optional) & Logout */}
        <div className="p-4 border-t border-white/10 bg-black/15 space-y-2">
          {/* Dev Mode Role Switcher */}
          {isDev && (
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 mb-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-200/60">
                  Mode Pengembang
                </span>
                <button
                  type="button"
                  onClick={() => setShowDevPanel((p) => !p)}
                  className="text-[10px] text-blue-300 hover:text-white underline cursor-pointer"
                >
                  {showDevPanel ? 'Tutup' : 'Pindah Role'}
                </button>
              </div>

              {showDevPanel && (
                <div className="grid grid-cols-2 gap-1.5 pt-1.5">
                  {[
                    { key: 'kader', label: '1. Petugas' },
                    { key: 'bidan', label: '2. Bidan' },
                    { key: 'admin', label: '3. Admin' },
                    { key: 'ortu', label: '4. Ortu' },
                  ].map((r) => (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => onSwitchRole && onSwitchRole(r.key)}
                      className={`px-2 py-1 rounded-lg text-[10.5px] font-medium border text-center transition-colors cursor-pointer ${
                        (user?.role || '').toLowerCase() === r.key
                          ? 'bg-blue-600 text-white border-blue-400'
                          : 'bg-white/10 text-white/80 border-white/10 hover:bg-white/20'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Logout Button */}
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 hover:text-white text-[12.5px] font-semibold border border-red-400/30 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar / Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}
