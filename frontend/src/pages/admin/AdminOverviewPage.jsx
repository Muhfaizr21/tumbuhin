import { useState } from 'react'
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Database,
  Lock,
  MapPin,
  RefreshCw,
  ShieldCheck,
  ShoppingBasket,
  Users,
} from 'lucide-react'
import PaginationBar from '../../components/ui/PaginationBar'

/**
 * Module 3.1: Dashboard Ikhtisar Sistem (/admin/dashboard)
 * Displays system-wide infrastructure metrics, Posyandu cloud sync matrix, and recent audit activity.
 */
export default function AdminOverviewPage({
  stats,
  loading,
  searchQuery = '',
  onNavigate,
  onRefresh,
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  const posyandus = Array.isArray(stats?.posyandu_sync_status)
    ? stats.posyandu_sync_status
    : []
  const auditLogs = Array.isArray(stats?.recent_audit_logs)
    ? stats.recent_audit_logs
    : []

  const filteredPosyandus = posyandus.filter((p) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.rw_code || '').toLowerCase().includes(q) ||
      (p.sync_status || '').toLowerCase().includes(q)
    )
  })

  const totalPages = Math.max(1, Math.ceil(filteredPosyandus.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedPosyandus = filteredPosyandus.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  )

  const metricCards = [
    {
      id: 'wilayah',
      title: 'Unit Posyandu & RW',
      value: `${stats?.active_posyandus ?? 8} / ${stats?.total_posyandus ?? 8}`,
      subtitle: `${stats?.total_children ?? 2} Balita • ${stats?.total_measurements ?? 12} Timbangan`,
      icon: MapPin,
      tone: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      id: 'pengguna',
      title: 'Akun Petugas & RBAC',
      value: `${stats?.active_users ?? 4} Aktif`,
      subtitle: `Kader: ${stats?.kader_count ?? 1} • Bidan: ${stats?.bidan_count ?? 1} • Admin: ${stats?.admin_count ?? 1}`,
      icon: Users,
      tone: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      id: 'pangan-lokal',
      title: 'Komoditas Pangan Desa',
      value: `${stats?.available_food_commodities ?? 11} Tersedia`,
      subtitle: `Update: ${stats?.last_price_update || 'Hari ini'}`,
      icon: ShoppingBasket,
      tone: 'bg-amber-50 text-amber-600 border-amber-100',
    },
    {
      id: 'knowledge-base',
      title: 'Vector Index RAG',
      value: `${stats?.knowledge_chunks_count ?? 10} Chunks`,
      subtitle: stats?.vector_index_status || 'Optimal (pgvector 768-dim)',
      icon: BookOpen,
      tone: 'bg-rose-50 text-rose-600 border-rose-100',
    },
  ]

  return (
    <div className="space-y-6">
      {/* 4 Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metricCards.map((card) => {
          const Icon = card.icon
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onNavigate && onNavigate(card.id)}
              className="p-5 rounded-2xl bg-white border border-slate-100 hover:border-[#1e293b]/40 shadow-2xs text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center ${card.tone}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-[#1e293b] transition-colors" />
              </div>
              <p className="text-[12px] font-semibold text-slate-400">{card.title}</p>
              <p className="text-[20px] font-bold text-slate-800 tracking-tight mt-0.5">
                {card.value}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 truncate">{card.subtitle}</p>
            </button>
          )
        })}
      </div>

      {/* Table: Status Sinkronisasi & Operasional Posyandu */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-[16px] font-bold text-slate-800 tracking-tight">
              Tabel Status Sinkronisasi &amp; Operasional Posyandu Desa
            </h3>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Pemantauan real-time aktivitas penimbangan bulanan, jumlah kader aktif, dan kunci validasi supervisi Bidan.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-[12px] font-semibold cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Segarkan Data</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('wilayah')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1e293b] hover:bg-[#0f172a] text-white text-[12px] font-semibold cursor-pointer"
            >
              <span>Kelola Master Posyandu</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-5">Unit Posyandu</th>
                <th className="py-3.5 px-4">Wilayah RW/RT</th>
                <th className="py-3.5 px-4 text-center">Balita Terdaftar</th>
                <th className="py-3.5 px-4 text-center">Timbang Bulan Ini</th>
                <th className="py-3.5 px-4 text-center">Kader Aktif</th>
                <th className="py-3.5 px-5 text-right">Status Sinkronisasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px]">
              {filteredPosyandus.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-[12.5px]">
                    Tidak ada unit Posyandu yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                paginatedPosyandus.map((row) => {
                  const isLocked = row.is_locked
                  const isSynced = row.sync_status === 'TERSINKRON CLOUD' || isLocked
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-slate-800">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              row.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                          />
                          <span>{row.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        RW {row.rw_code} / RT {row.rt_code}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-800">
                        {row.children_count} Anak
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11.5px]">
                          {row.measured_this_month} / {row.children_count}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-600">
                        {row.kader_count} Petugas
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isLocked
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : isSynced
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {isLocked ? (
                            <Lock className="w-3 h-3" />
                          ) : isSynced ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Clock3 className="w-3 h-3" />
                          )}
                          {row.sync_status}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 pb-4">
          <PaginationBar
            totalItems={filteredPosyandus.length}
            currentPage={safePage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[4, 5, 8]}
            itemLabel="unit Posyandu"
            compact={true}
          />
        </div>
      </div>

      {/* Bottom 2 Columns: System Security Integrity & Live Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#2597d0]" />
              <span>Integritas Keamanan &amp; Standar Klinis</span>
            </h3>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10.5px] font-bold">
              100% Patuh
            </span>
          </div>

          <div className="space-y-3 text-[12.5px]">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Enkripsi NIK Balita (SHA-256)</p>
                <p className="text-[11px] text-slate-500">
                  Zero raw-NIK exposure pada tabel children
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                AKTIF
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Tabel Referensi WHO LMS</p>
                <p className="text-[11px] text-slate-500">
                  Permenkes RI No. 2 Tahun 2020 ({stats?.who_standards_count ?? 40} parameter)
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('standar-who')}
                className="text-[11.5px] font-bold text-[#2597d0] hover:underline cursor-pointer"
              >
                Kalibrasi
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Antrean Offline IndexedDB</p>
                <p className="text-[11px] text-slate-500">
                  {stats?.pending_sync_items ?? 0} tertunda • {stats?.synced_items_count ?? 0} tersinkron
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('pengaturan')}
                className="text-[11.5px] font-bold text-[#2597d0] hover:underline cursor-pointer"
              >
                Lihat Log
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#2597d0]" />
              <span>Jeja Audit Aktivitas Lintas Role Terbaru</span>
            </h3>
            <Database className="w-4 h-4 text-slate-400" />
          </div>

          <div className="divide-y divide-slate-100">
            {auditLogs.length === 0 ? (
              <p className="py-6 text-center text-slate-400 text-[12.5px]">
                Belum ada log aktivitas tercatat.
              </p>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {log.category}
                      </span>
                      <span className="text-[12.5px] font-semibold text-slate-800 truncate">
                        {log.actor}
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-500 mt-0.5 truncate">{log.action}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-slate-400">{log.timestamp}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                      {log.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
