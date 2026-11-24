import { useState } from 'react'
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Database,
  FolderGit2,
  KeyRound,
  Lock,
  Server,
  ShoppingBasket,
} from 'lucide-react'

/**
 * AdminRightPanel
 * Right-hand telemetry, audit timeline, and architecture panel for Super Admin Desa.
 */
export default function AdminRightPanel({
  user,
  activeMenu,
  statsSummary,
  onNavigateToMenu,
}) {
  const [activeTab, setActiveTab] = useState('audit')

  const auditLogs = Array.isArray(statsSummary?.recent_audit_logs)
    ? statsSummary.recent_audit_logs
    : []
  const posyanduSync = Array.isArray(statsSummary?.posyandu_sync_status)
    ? statsSummary.posyandu_sync_status
    : []

  const activePosyanduCount = statsSummary?.active_posyandus ?? 8
  const totalPosyanduCount = statsSummary?.total_posyandus ?? 8
  const healthPercent =
    totalPosyanduCount > 0
      ? Math.round((activePosyanduCount / totalPosyanduCount) * 100)
      : 100

  return (
    <aside
      aria-label="Panel Telemetri dan Audit Sistem Super Admin"
      className="w-full xl:w-80 bg-white border-t xl:border-t-0 xl:border-l border-slate-100 flex flex-col justify-between shrink-0"
    >
      <div className="p-5 space-y-5 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">
              {user?.village_name || 'Desa Sukamaju'}
            </h2>
            <p className="text-[11.5px] text-slate-400">
              Telemetri Infrastruktur &amp; RBAC
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToMenu && onNavigateToMenu('pengaturan')}
            title="Buka Log & Pengaturan"
            aria-label="Buka Log & Pengaturan"
            className="w-7 h-7 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 flex items-center justify-center cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div
          role="tablist"
          aria-label="Filter Informasi Panel Kanan Admin"
          className="flex items-center gap-1.5 border-b border-slate-100 pb-3"
        >
          {[
            { id: 'audit', label: 'Log Audit' },
            { id: 'keamanan', label: 'Keamanan' },
            { id: 'arsitektur', label: 'Teknis' },
          ].map((tab) => {
            const isSelected = activeTab === tab.id
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={isSelected}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#edf7fe] text-[#2597d0]'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => onNavigateToMenu && onNavigateToMenu('pangan-lokal')}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 text-center transition-colors cursor-pointer"
              >
                <ShoppingBasket className="w-3.5 h-3.5 text-amber-600 mx-auto mb-1" />
                <span className="block text-[9.5px] text-slate-400">Pangan</span>
                <span className="text-[11.5px] font-bold text-slate-800">
                  {statsSummary?.available_food_commodities ?? 11} Item
                </span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateToMenu && onNavigateToMenu('knowledge-base')}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 text-center transition-colors cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-rose-600 mx-auto mb-1" />
                <span className="block text-[9.5px] text-slate-400">RAG AI</span>
                <span className="text-[11.5px] font-bold text-slate-800">
                  {statsSummary?.knowledge_chunks_count ?? 10} Chunk
                </span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateToMenu && onNavigateToMenu('standar-who')}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 text-center transition-colors cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-indigo-600 mx-auto mb-1" />
                <span className="block text-[9.5px] text-slate-400">WHO LMS</span>
                <span className="text-[11.5px] font-bold text-slate-800">
                  {statsSummary?.who_standards_count ?? 40} Baris
                </span>
              </button>
            </div>

            <div className="relative pl-4 space-y-4 before:content-[''] before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-100">
              {(auditLogs.length > 0
                ? auditLogs
                : [
                    {
                      id: 'a-1',
                      timestamp: 'Hari ini',
                      actor: 'Posyandu Melati 04',
                      category: 'RAG & Pangan',
                      action: 'Sinkronisasi katalog harga pangan lokal & indeks pgvector Kemenkes',
                      status: 'OPTIMAL',
                    },
                    {
                      id: 'a-2',
                      timestamp: 'Hari ini',
                      actor: 'Super Admin Desa',
                      category: 'RBAC & Akun',
                      action: 'Isolasi wilayah 8 Posyandu RW & verifikasi SHA-256 NIK balita',
                      status: 'AKTIF',
                    },
                  ]
              ).map((item) => (
                <div key={item.id} className="relative">
                  <span
                    className="absolute -left-4 top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white bg-[#2597d0]"
                    aria-hidden="true"
                  />
                  <div className="flex items-center justify-between text-[10.5px] text-slate-400 mb-1">
                    <span className="font-medium text-slate-600">{item.timestamp}</span>
                    <span className="px-1.5 py-0.5 rounded bg-sky-50 text-[#2597d0] text-[9.5px] font-bold">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-[12px] font-semibold text-slate-800 leading-snug">
                    {item.actor}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                    {item.action}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'keamanan' && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5">
              <div className="flex items-center gap-2 text-[12px] font-bold text-emerald-900">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>SHA-256 NIK Anonymization</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Seluruh identitas kependudukan balita disimpan sebagai one-way cryptographic hash (SHA-256).
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
              <div className="flex items-center gap-2 text-[12px] font-bold text-slate-800">
                <KeyRound className="w-4 h-4 text-[#2597d0]" />
                <span>Row-Level Scoping RBAC</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Petugas Kader diisolasi per unit Posyandu RW, sedangkan Bidan Desa melihat agregasi tingkat Desa.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-[11.5px] font-bold text-slate-700">
                <span>Status Sinkronisasi RW</span>
                <span className="text-emerald-600">{posyanduSync.length || 8} Unit</span>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {posyanduSync.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-lg bg-white border border-slate-100"
                  >
                    <span className="font-medium text-slate-700 truncate">{p.name}</span>
                    <span className="text-[10px] font-semibold text-emerald-600 shrink-0">
                      RW {p.rw_code}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'arsitektur' && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-slate-900 text-white space-y-2">
              <div className="flex items-center gap-2 text-[#38bdf8] text-[11.5px] font-semibold">
                <FolderGit2 className="w-4 h-4" aria-hidden="true" />
                <span>Modular SOLID Backend</span>
              </div>
              <p className="text-[11.5px] text-slate-300 leading-relaxed">
                Modul aktif: <strong>{activeMenu?.label}</strong>
              </p>
              <div className="p-2.5 rounded-xl bg-white/5 font-mono text-[10.5px] text-sky-300 space-y-1 overflow-x-auto border border-white/10">
                <div>controllers/{activeMenu?.backendPath || 'admin/dashboard/dashboard_controller.go'}</div>
                <div>
                  services/
                  {(activeMenu?.backendPath || 'admin/dashboard/dashboard_controller.go').replace(
                    '_controller',
                    '_service',
                  )}
                </div>
                <div>
                  repositories/
                  {(activeMenu?.backendPath || 'admin/dashboard/dashboard_controller.go').replace(
                    '_controller',
                    '_repository',
                  )}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
              <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-800">
                <Server className="w-4 h-4 text-[#2597d0]" aria-hidden="true" />
                <span>Integrasi Lintas Role Real-Time</span>
              </div>
              <p className="text-[11.5px] text-slate-500 leading-relaxed">
                Perubahan harga pangan lokal, chunk RAG Kemenkes, dan standar WHO LMS langsung memengaruhi kalkulasi Kader, Bidan, dan Portal Ortu.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50/60">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-bold text-slate-800">
              Kesehatan Infrastruktur{' '}
              <span className="text-emerald-600">{healthPercent}%</span>
            </span>
            <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" /> Online
            </span>
          </div>

          <div className="space-y-2 text-[11.5px]">
            <div className="flex items-center justify-between text-slate-600">
              <span className="truncate font-medium">Indeks RAG pgvector</span>
              <span className="text-[#2597d0] font-semibold shrink-0">
                {statsSummary?.knowledge_chunks_count ?? 10} Chunks
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span className="truncate font-medium">Update Pasar Desa</span>
              <span className="text-slate-700 font-semibold shrink-0 text-[10.5px]">
                {statsSummary?.last_price_update || 'Hari ini'}
              </span>
            </div>

            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(healthPercent, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
