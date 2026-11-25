import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  HeartPulse,
  Menu,
  RefreshCw,
  Search,
  Stethoscope,
  X,
} from 'lucide-react'
import { bidanApi } from '../../lib/bidanApi'
import BidanNavigationShell from './components/BidanNavigationShell'
import { BIDAN_MENUS } from './bidanMenuItems'

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

const PAGE_SIZE = 50

export default function LaporanExportPage({ user, onLogout }) {
  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())
  const [selectedPosyanduId, setSelectedPosyanduId] = useState('')

  const [previewData, setPreviewData] = useState(null)
  const [posyanduOptions, setPosyanduOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [downloadingFormat, setDownloadingFormat] = useState('')
  const [notice, setNotice] = useState('')

  // Preview table filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)

  // Shell state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    let active = true
    bidanApi.getGisClusters()
      .then((list) => {
        if (active && Array.isArray(list)) {
          setPosyanduOptions(list)
        }
      })
      .catch(() => { })
    return () => {
      active = false
    }
  }, [])

  const loadPreview = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const params = new URLSearchParams()
      params.set('format', 'json')
      params.set('period_month', String(selectedMonth))
      params.set('period_year', String(selectedYear))
      if (selectedPosyanduId) {
        params.set('posyandu_id', selectedPosyanduId)
      }

      const res = await bidanApi.previewExport(params.toString())
      setPreviewData(res)
      setCurrentPage(1)
    } catch (err) {
      setLoadError(err.message || 'Gagal memuat pratinjau data e-PPGBM.')
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, selectedYear, selectedPosyanduId])

  useEffect(() => {
    loadPreview()
  }, [loadPreview])

  useEffect(() => {
    if (!notice) return undefined
    const timer = setTimeout(() => setNotice(''), 5000)
    return () => clearTimeout(timer)
  }, [notice])

  const handleDownload = async (format) => {
    setDownloadingFormat(format)
    try {
      const params = new URLSearchParams()
      params.set('format', format)
      params.set('period_month', String(selectedMonth))
      params.set('period_year', String(selectedYear))
      if (selectedPosyanduId) {
        params.set('posyandu_id', selectedPosyanduId)
      }

      const ext = format === 'pdf' ? 'pdf' : format === 'csv' ? 'csv' : 'xlsx'
      const fallback = `ePPGBM_Surveilans_${selectedYear}_${selectedMonth}.${ext}`
      const savedName = await bidanApi.downloadExport(params.toString(), fallback)
      setNotice(`Berkas ${savedName} berhasil diunduh.`)
    } catch (err) {
      setNotice(`Gagal mengunduh berkas ${format.toUpperCase()}: ${err.message}`)
    } finally {
      setDownloadingFormat('')
    }
  }

  const items = previewData?.items || []
  const summary = previewData?.summary || {
    village_name: 'Desa Sukamaju',
    period_month: selectedMonth,
    period_year: selectedYear,
    total_children: 0,
    total_measured: 0,
    coverage_rate_percent: 0,
    stunted_count: 0,
    wasted_count: 0,
    underweight_count: 0,
    normal_count: 0,
    pmt_count: 0,
  }

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'STUNTED' && !item.nutrition_status?.includes('stunted')) return false
        if (statusFilter === 'WASTED' && !item.nutrition_status?.includes('wasted')) return false
        if (statusFilter === 'NORMAL' && item.nutrition_status !== 'normal') return false
        if (statusFilter === 'PMT' && !item.pmt_received) return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = item.child_name?.toLowerCase().includes(q)
        const matchPos = item.posyandu_name?.toLowerCase().includes(q)
        const matchOrtu = item.parent_name?.toLowerCase().includes(q)
        if (!matchName && !matchPos && !matchOrtu) return false
      }
      return true
    })
  }, [items, statusFilter, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE))
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredItems.slice(start, start + PAGE_SIZE)
  }, [filteredItems, currentPage])

  return (
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#f6f9fc] text-slate-800 flex flex-col lg:flex-row font-runde selection:bg-[#2597d0] selection:text-white">
      {/* Mobile Header Bar */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#2597d0] text-white flex items-center justify-center shadow-xs">
            <Stethoscope className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <span className="font-bold text-[15px] text-slate-800">Tumbuhin</span>
            <span className="ml-2 px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-[#edf7fe] text-[#2597d0]">
              e-PPGBM
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Buka menu navigasi"
          className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 cursor-pointer"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" aria-hidden="true" />
          ) : (
            <Menu className="w-5 h-5 text-[#2597d0]" aria-hidden="true" />
          )}
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex bg-slate-900/40 backdrop-blur-xs">
          <BidanNavigationShell
            menus={BIDAN_MENUS}
            activeMenuId="laporan"
            user={user}
            sidebarCollapsed={false}
            onToggleCollapse={() => setMobileMenuOpen(false)}
            onSelectMenu={(item) => {
              setMobileMenuOpen(false)
              if (item?.route) window.location.hash = `#${item.route}`
            }}
            onOpenQuickAdd={() => {
              setMobileMenuOpen(false)
              window.location.hash = '#/bidan/prioritas'
            }}

            onLogout={onLogout}
            statsSummary={{
              totalBalita: summary.total_children || 342,
              stuntingPrevalence: summary.total_children > 0 ? (summary.stunted_count / summary.total_children) * 100 : 8.4,
              wastingCount: summary.wasted_count || 11,
              highRiskCount: summary.stunted_count,
              pendingVisits: 6,
              redCount: 0,
            }}
          />
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setMobileMenuOpen(false)}
            className="flex-1"
          />
        </div>
      )}

      {/* Desktop Dual Navigation Shell */}
      <div className="hidden lg:flex">
        <BidanNavigationShell
          menus={BIDAN_MENUS}
          activeMenuId="laporan"
          user={user}
          sidebarCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
          onSelectMenu={(item) => {
            if (item?.route) window.location.hash = `#${item.route}`
          }}
          onOpenQuickAdd={() => {
            window.location.hash = '#/bidan/prioritas'
          }}

          onLogout={onLogout}
          statsSummary={{
            totalBalita: summary.total_children || 342,
            stuntingPrevalence: summary.total_children > 0 ? (summary.stunted_count / summary.total_children) * 100 : 8.4,
            wastingCount: summary.wasted_count || 11,
            highRiskCount: summary.stunted_count,
            pendingVisits: 6,
            redCount: 0,
          }}
        />
      </div>

      {/* Main Workspace */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-7 overflow-y-auto space-y-6">
        {/* Page Top Heading */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 text-[11.5px] font-medium text-[#2597d0] mb-1">
              <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
              <span className="text-[#60606c]">Bidan · e-PPGBM Ekspor &amp; Laporan</span>
            </div>
            <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.04em] text-[#070709]">
              Laporan &amp; Ekspor e-PPGBM
            </h1>
            <p className="text-[13.5px] text-[#60606c] mt-0.5">
              Generator rekapitulasi gizi desa standar Kemenkes RI yang siap diunduh dalam format Excel (.xlsx), PDF, dan CSV.
            </p>
          </div>

          {/* Action Buttons: 3 format downloads */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={Boolean(downloadingFormat)}
              onClick={() => handleDownload('xlsx')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-[12.5px] font-semibold cursor-pointer transition-colors shadow-xs disabled:opacity-60"
            >
              {downloadingFormat === 'xlsx' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              <span>Unduh Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              disabled={Boolean(downloadingFormat)}
              onClick={() => handleDownload('pdf')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0d5f8a] hover:bg-[#0a4b6e] text-white text-[12.5px] font-semibold cursor-pointer transition-colors shadow-xs disabled:opacity-60"
            >
              {downloadingFormat === 'pdf' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              <span>Unduh PDF</span>
            </button>

            <button
              type="button"
              disabled={Boolean(downloadingFormat)}
              onClick={() => handleDownload('csv')}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[12.5px] font-semibold cursor-pointer transition-colors disabled:opacity-60"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {notice && (
          <div
            role="status"
            className="flex items-center justify-between gap-3 px-4 py-3 rounded-[16px] bg-[#edf7fe] border border-[#cfe8f8] text-[13px] text-[#0d5f8a]"
          >
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice('')}
              className="inline-flex items-center justify-center min-h-[44px] px-2 text-[12.5px] font-semibold underline cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Toolbar: Filters */}
        <div className="rounded-[20px] bg-white border border-[#e4e4eb] shadow-[0_17px_37px_rgba(16,55,132,0.03)] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label htmlFor="exp-month" className="block text-[11px] font-semibold uppercase tracking-wider text-[#60606c] mb-1">
                  Periode Bulan
                </label>
                <select
                  id="exp-month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-3 py-2 rounded-xl border border-[#e4e4eb] bg-white text-[13px] font-medium text-[#070709] focus:outline-none focus:border-[#2597d0] cursor-pointer"
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={name} value={idx + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="exp-year" className="block text-[11px] font-semibold uppercase tracking-wider text-[#60606c] mb-1">
                  Tahun
                </label>
                <select
                  id="exp-year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-2 rounded-xl border border-[#e4e4eb] bg-white text-[13px] font-medium text-[#070709] focus:outline-none focus:border-[#2597d0] cursor-pointer"
                >
                  {[2024, 2025, 2026, 2027].map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="exp-posyandu" className="block text-[11px] font-semibold uppercase tracking-wider text-[#60606c] mb-1">
                  Unit Posyandu
                </label>
                <select
                  id="exp-posyandu"
                  value={selectedPosyanduId}
                  onChange={(e) => setSelectedPosyanduId(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-[#e4e4eb] bg-white text-[13px] font-medium text-[#070709] focus:outline-none focus:border-[#2597d0] cursor-pointer min-w-[190px]"
                >
                  <option value="">Semua Posyandu Desa</option>
                  {posyanduOptions.map((pos) => (
                    <option key={pos.posyandu_id} value={pos.posyandu_id}>
                      {pos.posyandu_name} ({pos.rw_code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={loadPreview}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#e4e4eb] text-[12.5px] font-semibold text-[#0d5f8a] hover:bg-[#edf7fe] transition-colors cursor-pointer self-end"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>Perbarui Pratinjau</span>
            </button>
          </div>
        </div>

        {/* Epidemiological KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-4 rounded-[18px] bg-white border border-[#e4e4eb] shadow-[0_17px_37px_rgba(16,55,132,0.03)] flex flex-col justify-between">
            <span className="text-[11.5px] text-[#60606c]">Sasaran Terdaftar (S)</span>
            <span className="text-[24px] font-semibold tracking-[-0.03em] text-[#070709] mt-1.5">
              {summary.total_children}
            </span>
            <span className="text-[11px] text-[#60606c] mt-0.5">Balita di wilayah desa</span>
          </div>

          <div className="p-4 rounded-[18px] bg-white border border-[#e4e4eb] shadow-[0_17px_37px_rgba(16,55,132,0.03)] flex flex-col justify-between">
            <span className="text-[11.5px] text-[#60606c]">Ditimbang (D)</span>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-[24px] font-semibold tracking-[-0.03em] text-[#070709]">
                {summary.total_measured}
              </span>
              <span className="text-[12px] font-bold text-[#0d5f8a]">
                ({summary.coverage_rate_percent.toFixed(1)}%)
              </span>
            </div>
            <span className="text-[11px] text-[#60606c] mt-0.5">Capaian partisipasi D/S</span>
          </div>

          <div className="p-4 rounded-[18px] bg-white border border-[#e4e4eb] shadow-[0_17px_37px_rgba(16,55,132,0.03)] flex flex-col justify-between">
            <span className="text-[11.5px] text-[#60606c]">Kasus Stunting (TB/U)</span>
            <span className="text-[24px] font-semibold tracking-[-0.03em] text-rose-600 mt-1.5">
              {summary.stunted_count}
            </span>
            <span className="text-[11px] text-rose-600/80 mt-0.5">Z-Score &lt; -2.0 SD</span>
          </div>

          <div className="p-4 rounded-[18px] bg-white border border-[#e4e4eb] shadow-[0_17px_37px_rgba(16,55,132,0.03)] flex flex-col justify-between">
            <span className="text-[11.5px] text-[#60606c]">Kasus Wasting (BB/TB)</span>
            <span className="text-[24px] font-semibold tracking-[-0.03em] text-amber-600 mt-1.5">
              {summary.wasted_count}
            </span>
            <span className="text-[11px] text-amber-600/80 mt-0.5">Gizi kurang/buruk</span>
          </div>

          <div className="p-4 rounded-[18px] bg-[#0d5f8a] border border-[#0d5f8a] text-white shadow-[0_17px_37px_rgba(13,95,138,0.22)] flex flex-col justify-between">
            <span className="text-[11.5px] text-white/85">Penerima Paket PMT</span>
            <span className="text-[24px] font-semibold tracking-[-0.03em] text-white mt-1.5">
              {summary.pmt_count}
            </span>
            <span className="text-[11px] text-white/80 mt-0.5">Intervensi 90 hari aktif</span>
          </div>
        </div>

        {/* Section: Pratinjau Tabel Surveilans e-PPGBM */}
        <div className="rounded-[20px] bg-white border border-[#e4e4eb] shadow-[0_17px_37px_rgba(16,55,132,0.03)] overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-[#f0f0f4] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-4.5 h-4.5 text-[#2597d0]" />
              <div>
                <h2 className="text-[15px] font-semibold text-[#070709]">
                  Pratinjau Lembar Data Surveilans e-PPGBM
                </h2>
                <p className="text-[11.5px] text-[#60606c]">
                  {filteredItems.length} balita terdata dalam cakupan unduhan {summary.village_name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#60606c] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari balita / orang tua..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-8 pr-3 py-1.5 rounded-full border border-[#e4e4eb] bg-white text-[12px] focus:outline-none focus:border-[#2597d0]"
                />
              </div>
            </div>
          </div>

          {/* Filter Status Chips */}
          <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-b border-[#f0f0f4] flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: 'Semua Status' },
              { id: 'STUNTED', label: 'Stunting' },
              { id: 'WASTED', label: 'Wasting' },
              { id: 'NORMAL', label: 'Normal' },
              { id: 'PMT', label: 'Penerima PMT' },
            ].map((tab) => {
              const active = statusFilter === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setStatusFilter(tab.id)
                    setCurrentPage(1)
                  }}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11.5px] font-medium border transition-colors cursor-pointer ${active
                    ? 'bg-[#070709] text-white border-[#070709]'
                    : 'bg-white text-[#60606c] border-[#e4e4eb] hover:border-[#2597d0]'
                    }`}
                >
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Table */}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-[12.5px] min-w-[1050px]">
              <thead>
                <tr className="border-b border-[#f0f0f4] text-[#60606c] font-semibold text-[11.5px] bg-slate-50/50">
                  <th className="py-3 px-4">No</th>
                  <th className="py-3 px-4">Nama Balita &amp; Ortu</th>
                  <th className="py-3 px-3">JK/Usia</th>
                  <th className="py-3 px-3">Posyandu (RW)</th>
                  <th className="py-3 px-3">Tgl Timbang</th>
                  <th className="py-3 px-3 text-right">BB (kg)</th>
                  <th className="py-3 px-3 text-right">TB (cm)</th>
                  <th className="py-3 px-3 text-right">TB/U (SD)</th>
                  <th className="py-3 px-3">Status Gizi</th>
                  <th className="py-3 px-3 text-right">ML Faltering</th>
                  <th className="py-3 px-4">Paket PMT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f4]">
                {loading ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-[#60606c]">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#2597d0] mb-2" />
                      <span>Menyiapkan pratinjau lembar e-PPGBM...</span>
                    </td>
                  </tr>
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-10 text-center text-slate-400">
                      Tidak ada balita yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((r, idx) => {
                    const isStunted = r.nutrition_status?.includes('stunted')
                    const isWasted = r.nutrition_status?.includes('wasted')
                    return (
                      <tr key={r.child_id || idx} className="hover:bg-[#f7fbfe] transition-colors">
                        <td className="py-3 px-4 font-mono text-[11.5px] text-slate-400">
                          {(currentPage - 1) * PAGE_SIZE + idx + 1}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#070709]">{r.child_name}</div>
                          <div className="text-[11px] text-[#60606c]">
                            Ortu: {r.parent_name} · {r.parent_phone}
                          </div>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="font-semibold text-slate-700">{r.age_months} bln</span>
                          <span className="text-[11px] text-slate-400 ml-1">({r.gender})</span>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-800">{r.posyandu_name}</div>
                          <div className="text-[11px] text-slate-400">RW {r.rw_code} / RT {r.rt_code}</div>
                        </td>

                        <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                          {r.measured_at || '-'}
                        </td>

                        <td className="py-3 px-3 text-right tabular-nums font-medium text-slate-800">
                          {r.weight_kg ? r.weight_kg.toFixed(1) : '-'}
                        </td>

                        <td className="py-3 px-3 text-right tabular-nums font-medium text-slate-800">
                          {r.height_cm ? r.height_cm.toFixed(1) : '-'}
                        </td>

                        <td className="py-3 px-3 text-right tabular-nums font-bold">
                          <span
                            className={
                              r.zscore_hfa <= -3.0
                                ? 'text-rose-600'
                                : r.zscore_hfa <= -2.0
                                  ? 'text-amber-600'
                                  : 'text-slate-700'
                            }
                          >
                            {r.zscore_hfa ? `${r.zscore_hfa.toFixed(1)} SD` : '-'}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${isStunted
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : isWasted
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                          >
                            {(r.nutrition_status || 'normal').replace('_', ' ')}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right tabular-nums font-semibold text-slate-700">
                          {r.faltering_risk_score ? `${r.faltering_risk_score.toFixed(0)}%` : '0%'}
                        </td>

                        <td className="py-3 px-4">
                          {r.pmt_received ? (
                            <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{r.pmt_type || 'PMT Aktif'}</span>
                            </span>
                          ) : (
                            <span className="text-[11.5px] text-slate-400">Tidak</span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-3.5 border-t border-[#f0f0f4] flex items-center justify-between gap-3">
              <span className="text-[12px] text-[#60606c]">
                Halaman {currentPage} dari {totalPages} · Menampilkan {paginatedItems.length} dari {filteredItems.length} data
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#e4e4eb] text-[12px] font-semibold cursor-pointer disabled:opacity-40 hover:border-[#2597d0]"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Sebelumnya</span>
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#e4e4eb] text-[12px] font-semibold cursor-pointer disabled:opacity-40 hover:border-[#2597d0]"
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
