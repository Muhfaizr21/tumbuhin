import { useState, useEffect } from 'react'
import {
  LayoutDashboard, MapPin, Users, ShoppingBasket, BookOpen, Database, Settings,
  Search, Bell, Menu, X, Plus, CheckCircle2, ShieldAlert
} from 'lucide-react'
import BidanNavigationShell from '../bidan/components/BidanNavigationShell'
import BidanRightPanel from '../bidan/components/BidanRightPanel'
import CircularProgressRing from '../bidan/components/CircularProgressRing'

const ADMIN_MENUS = [
  { id: 'dashboard', label: 'Dashboard Ikhtisar Sistem', shortLabel: 'Ikhtisar Sistem', route: '/admin/dashboard', icon: LayoutDashboard },
  { id: 'wilayah', label: 'Master Wilayah & Posyandu', shortLabel: 'Master Wilayah', route: '/admin/wilayah', icon: MapPin },
  { id: 'pengguna', label: 'Manajemen Akun & RBAC', shortLabel: 'Akun & RBAC', route: '/admin/pengguna', icon: Users },
  { id: 'pangan-lokal', label: 'Harga Pangan Lokal Desa', shortLabel: 'Pangan Lokal', route: '/admin/pangan-lokal', icon: ShoppingBasket },
  { id: 'knowledge-base', label: 'Knowledge Base AI (RAG)', shortLabel: 'Knowledge Base', route: '/admin/knowledge-base', icon: BookOpen, badge: 'AI' },
  { id: 'standar-who', label: 'Standar Antropometri WHO', shortLabel: 'Standar WHO', route: '/admin/standar-who', icon: Database },
  { id: 'pengaturan', label: 'Log Sinkronisasi & Pengaturan', shortLabel: 'Pengaturan', route: '/admin/pengaturan', icon: Settings },
]

const QUICK_ACCESS_ITEMS = [
  { id: 'wilayah', label: 'Wilayah', icon: MapPin, boxBg: 'bg-emerald-50 text-emerald-600' },
  { id: 'pengguna', label: 'Akun', icon: Users, boxBg: 'bg-blue-50 text-blue-600' },
  { id: 'pangan-lokal', label: 'Pangan', icon: ShoppingBasket, boxBg: 'bg-amber-50 text-amber-600' },
  { id: 'knowledge-base', label: 'RAG AI', icon: BookOpen, boxBg: 'bg-rose-50 text-rose-600' },
  { id: 'standar-who', label: 'WHO', icon: Database, boxBg: 'bg-indigo-50 text-indigo-600' },
  { id: 'pengaturan', label: 'Log', icon: Settings, boxBg: 'bg-slate-50 text-slate-600' },
]

export default function AdminDashboard({ user, onLogout, onSwitchRole }) {
  const [activeMenuId, setActiveMenuId] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')

  const currentMenu = ADMIN_MENUS.find((m) => m.id === activeMenuId) || ADMIN_MENUS[0]

  return (
    <div className="min-h-dvh bg-[#f6f9fc] text-slate-800 flex flex-col lg:flex-row font-sans selection:bg-[#1e293b] selection:text-white">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b sticky top-0 z-40">
        <span className="font-bold">Tumbuhin Admin</span>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2"><Menu /></button>
      </header>

      {/* Desktop Navigation */}
      <div className="hidden lg:flex">
        <BidanNavigationShell
          menus={ADMIN_MENUS}
          activeMenuId={activeMenuId}
          user={user}
          sidebarCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onSelectMenu={(item) => setActiveMenuId(item.id)}
          onSwitchRole={onSwitchRole}
          onLogout={onLogout}
          statsSummary={{ totalBalita: 8, stuntingPrevalence: 0, highRiskCount: 28 }}
        />
      </div>

      {/* Main Workspace */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-7 overflow-y-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari konfigurasi sistem, akun, atau wilayah..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white border border-slate-100 text-[13px] shadow-2xs focus:outline-none focus:border-[#1e293b]"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4">
            <button className="relative w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-2xs hover:bg-slate-50">
              <Bell className="w-4 h-4 text-slate-600" />
            </button>
            <div className="flex items-center gap-3 bg-white px-3.5 py-1.5 rounded-2xl border shadow-2xs">
              <span className="text-[13.5px] font-bold">Halo, {user?.full_name?.split(' ')[0] || 'Admin'}</span>
              <div className="w-8 h-8 rounded-full bg-[#1e293b] text-white flex items-center justify-center text-[12px] font-bold">
                AD
              </div>
            </div>
          </div>
        </div>

        {/* Top 3 Featured Cards with Progress Rings */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => setActiveMenuId('dashboard')}
              className="p-5 rounded-2xl bg-[#1e293b] text-white flex items-center justify-between gap-4 shadow-sm text-left"
            >
              <div className="space-y-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white text-[#1e293b] flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold truncate">Infrastruktur Desa</h3>
                  <p className="text-[12px] text-white/80 truncate">8 Posyandu Aktif</p>
                </div>
              </div>
              <CircularProgressRing percentage={100} isPrimaryCard={true} accentColor="white" />
            </button>

            <button 
              onClick={() => setActiveMenuId('pengguna')}
              className="p-5 rounded-2xl bg-white border flex items-center justify-between gap-4 shadow-2xs text-left"
            >
              <div className="space-y-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-slate-800">Manajemen Akun</h3>
                  <p className="text-[12px] text-slate-400">28 Petugas Terdaftar</p>
                </div>
              </div>
              <CircularProgressRing percentage={92} isPrimaryCard={false} accentColor="#2563eb" />
            </button>

            <button 
              onClick={() => setActiveMenuId('knowledge-base')}
              className="p-5 rounded-2xl bg-white border flex items-center justify-between gap-4 shadow-2xs text-left"
            >
              <div className="space-y-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-slate-800">Vector Index RAG</h3>
                  <p className="text-[12px] text-slate-400">156 Chunks Kemenkes</p>
                </div>
              </div>
              <CircularProgressRing percentage={100} isPrimaryCard={false} accentColor="#e11d48" />
            </button>
          </div>
        </section>

        {/* Quick Access Grid */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-bold text-slate-800 tracking-tight">Akses Cepat Pengaturan Sistem</h2>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-7 gap-3">
            {QUICK_ACCESS_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveMenuId(item.id)}
                className="flex flex-col items-center gap-2 text-center group"
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center border bg-white shadow-2xs group-hover:border-[#1e293b]/40 group-hover:bg-slate-50 transition-all">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${item.boxBg}`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-[11px] font-medium text-slate-600 truncate w-full">{item.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Active Workspace */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
             <div>
               <h2 className="text-lg font-bold text-slate-800">{currentMenu.label}</h2>
               <p className="text-xs text-slate-500 mt-0.5">Modol kontrol super admin desa & integrasi sistem backend.</p>
             </div>
             <button className="px-4 py-2 bg-[#1e293b] hover:bg-[#0f172a] text-white text-xs font-semibold rounded-xl">
               Simpan Perubahan
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
             <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
               <h4 className="font-bold text-xs uppercase text-slate-400 mb-2">Status Layanan Backend</h4>
               <p className="text-sm font-medium text-slate-700">Golang REST API: <span className="text-emerald-600 font-bold">ONLINE</span></p>
               <p className="text-sm font-medium text-slate-700 mt-1">PostgreSQL pgvector: <span className="text-emerald-600 font-bold">CONNECTED</span></p>
             </div>
             <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
               <h4 className="font-bold text-xs uppercase text-slate-400 mb-2">Keamanan & Enkripsi</h4>
               <p className="text-sm font-medium text-slate-700">SHA-256 NIK Anonymization: <span className="text-emerald-600 font-bold">ACTIVE</span></p>
               <p className="text-sm font-medium text-slate-700 mt-1">JWT Supabase Auth: <span className="text-emerald-600 font-bold">SECURE</span></p>
             </div>
          </div>
        </div>
      </main>

      {/* Right Panel */}
      <BidanRightPanel user={user} activeMenu={currentMenu} />
    </div>
  )
}
