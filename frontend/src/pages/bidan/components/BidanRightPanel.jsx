import { useState } from 'react'
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  FolderGit2,
  HeartPulse,
  MapPin,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react'

/**
 * BidanRightPanel
 * Implements the right-hand activity & status panel from the reference UI:
 * - Header with tabs (Terbaru, Tindakan, Arsitektur)
 * - Vertical timeline with blue marker dots and structured clinical updates
 * - Bottom docked progress widget ("Target Intervensi & Home Visit")
 */
export default function BidanRightPanel({
  user,
  activeMenu,
  priorityChildren = [],
  statsSummary,
  onNavigateToMenu,
  onSelectChildForEdit,
}) {
  const [activeTab, setActiveTab] = useState('terbaru')

  const pendingVisits = priorityChildren.filter((c) => c.pending_intervention)
  const completedVisitsCount = Math.max(priorityChildren.length - pendingVisits.length, 0)
  const totalCases = priorityChildren.length || 1
  const completionRate =
    priorityChildren.length > 0
      ? Math.round((completedVisitsCount / totalCases) * 100)
      : 78

  const timelineItems =
    priorityChildren.length > 0
      ? priorityChildren.slice(0, 4).map((child, index) => ({
          id: child.child_id || index,
          timeLabel: child.last_measured_at || 'Hari ini',
          title: child.child_name,
          subtitle: `${child.posyandu_name} (${child.rw_code})`,
          triage: child.triage_category || 'ORANYE',
          zscore: child.zscore_hfa,
          riskScore: child.faltering_risk_score,
          pending: child.pending_intervention,
          raw: child,
        }))
      : [
          {
            id: 'log-1',
            timeLabel: '10 menit lalu',
            title: 'Sinkronisasi Surveilans Desa',
            subtitle: '8 Posyandu RW 01 - RW 08 terhubung',
            triage: 'AMAN',
            zscore: -1.1,
            riskScore: 18,
            pending: false,
          },
          {
            id: 'log-2',
            timeLabel: '09:30 WIB',
            title: 'Pemetaan GIS Klaster RW 03',
            subtitle: 'Deteksi zona perhatian tinggi',
            triage: 'MERAH',
            zscore: -3.1,
            riskScore: 89,
            pending: true,
          },
          {
            id: 'log-3',
            timeLabel: '08:15 WIB',
            title: 'Evaluasi Kohor PMT 90 Hari',
            subtitle: 'Graduasi status gizi balita RW 02',
            triage: 'ORANYE',
            zscore: -2.2,
            riskScore: 72,
            pending: false,
          },
        ]

  return (
    <aside
      aria-label="Panel Aktivitas dan Progres Klinis"
      className="w-full xl:w-80 bg-white border-t xl:border-t-0 xl:border-l border-slate-100 flex flex-col justify-between shrink-0"
    >
      <div className="p-5 space-y-5 overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">
              {user?.village_name || 'Desa Sukamaju'}
            </h2>
            <p className="text-[11.5px] text-slate-400">
              Monitor Aktivitas &amp; Triase
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToMenu('prioritas')}
            title="Lihat Semua Triase"
            aria-label="Lihat Semua Triase"
            className="w-7 h-7 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 flex items-center justify-center cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2597d0]"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Clean Pill Tabs matching "Recent | Activity | Details" in reference */}
        <div
          role="tablist"
          aria-label="Filter Informasi Panel Kanan"
          className="flex items-center gap-1.5 border-b border-slate-100 pb-3"
        >
          {[
            { id: 'terbaru', label: 'Terbaru' },
            { id: 'tindakan', label: 'Kunjungan' },
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
                className={`px-3 py-1 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2597d0] ${
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

        {/* Tab 1: Vertical Timeline ("Recent" in reference) */}
        {activeTab === 'terbaru' && (
          <div className="relative pl-4 space-y-5 before:content-[''] before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-100">
            {timelineItems.map((item) => {
              const isHigh = item.triage === 'MERAH'
              const isMedium = item.triage === 'ORANYE'
              return (
                <div key={item.id} className="relative group">
                  {/* Blue timeline dot */}
                  <span
                    className={`absolute -left-4 top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white ${
                      isHigh
                        ? 'bg-rose-500'
                        : isMedium
                          ? 'bg-amber-500'
                          : 'bg-[#2597d0]'
                    }`}
                    aria-hidden="true"
                  />

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                    <span className="font-medium text-slate-600">{item.timeLabel}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        isHigh
                          ? 'bg-rose-50 text-rose-700'
                          : isMedium
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-sky-50 text-[#2597d0]'
                      }`}
                    >
                      {item.triage}
                    </span>
                  </div>

                  {/* Mini Visual Metric Tiles (Replacing generic thumbnails with clinical metrics) */}
                  <div className="grid grid-cols-3 gap-1.5 mb-2">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-center">
                      <span className="block text-[9.5px] text-slate-400">TB/U</span>
                      <span className="text-[11.5px] font-bold text-slate-700">
                        {Number(item.zscore || -2.0).toFixed(1)} SD
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-center">
                      <span className="block text-[9.5px] text-slate-400">ML Risk</span>
                      <span className="text-[11.5px] font-bold text-[#2597d0]">
                        {Math.round(Number(item.riskScore || 75))}%
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        item.raw
                          ? onSelectChildForEdit && onSelectChildForEdit(item.raw)
                          : onNavigateToMenu('prioritas')
                      }
                      className="p-2 rounded-xl bg-[#edf7fe] hover:bg-[#d8eefc] text-[#2597d0] text-center flex flex-col items-center justify-center transition-colors cursor-pointer"
                    >
                      <span className="text-[10.5px] font-bold">Detail</span>
                    </button>
                  </div>

                  <div className="flex items-start gap-2 text-[12px]">
                    {isHigh ? (
                      <AlertOctagon
                        className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                    ) : (
                      <Stethoscope
                        className="w-3.5 h-3.5 text-[#2597d0] shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Tab 2: Pending Home Visits */}
        {activeTab === 'tindakan' && (
          <div className="space-y-2.5">
            <p className="text-[11.5px] text-slate-500">
              Daftar balita yang membutuhkan kunjungan rumah (*Home Visit*) segera:
            </p>
            {pendingVisits.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-1.5">
                <CheckCircle2
                  className="w-5 h-5 text-emerald-600 mx-auto"
                  aria-hidden="true"
                />
                <p className="text-[12px] font-semibold text-slate-700">
                  Tidak Ada Antrean Kunjungan
                </p>
                <p className="text-[11px] text-slate-400">
                  Seluruh jadwal intervensi lapangan minggu ini telah tertangani.
                </p>
              </div>
            ) : (
              pendingVisits.slice(0, 5).map((child, idx) => (
                <div
                  key={`${child.child_id || 'visit'}-${idx}`}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-semibold text-slate-800 truncate">
                      {child.child_name}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {child.posyandu_name} • {child.rw_code}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigateToMenu('prioritas')}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-[#2597d0] hover:bg-[#edf7fe] cursor-pointer shrink-0"
                  >
                    Tindak
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: SOLID Backend Mapping Info */}
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
                <div>controllers/{activeMenu?.backendPath}</div>
                <div>services/{activeMenu?.backendPath?.replace('_controller', '_service')}</div>
                <div>repositories/{activeMenu?.backendPath?.replace('_controller', '_repository')}</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
              <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-[#2597d0]" aria-hidden="true" />
                <span>Otorisasi JWT Aktif</span>
              </div>
              <p className="text-[11.5px] text-slate-500 leading-relaxed">
                Endpoint dilindungi middleware RBAC khusus Role Bidan Desa dan Super Admin.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Docked Progress Card (Matching "Uploading 3 items 78%" widget from reference) */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/60">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-bold text-slate-800">
              Progres Intervensi{' '}
              <span className="text-[#2597d0]">{completionRate}%</span>
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              {statsSummary?.pendingVisits || pendingVisits.length} Jadwal
            </span>
          </div>

          <div className="space-y-2.5 text-[11.5px]">
            <div className="flex items-center justify-between text-slate-600">
              <span className="truncate font-medium">Cakupan Timbang Posyandu</span>
              <span className="text-emerald-600 font-semibold shrink-0">89.2%</span>
            </div>

            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-rose-50/80 text-rose-700">
              <span className="truncate font-medium">
                Kasus Prioritas Merah ({statsSummary?.redCount ?? 0})
              </span>
              <button
                type="button"
                onClick={() => onNavigateToMenu('prioritas')}
                className="font-bold underline hover:text-rose-900 cursor-pointer shrink-0 ml-2"
              >
                Cek
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-[11px]">
                <span>Target Bebas Stunting (&lt;14%)</span>
                <span className="font-semibold text-slate-700">
                  {(statsSummary?.stuntingPrevalence || 8.4).toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2597d0] rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(completionRate, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
