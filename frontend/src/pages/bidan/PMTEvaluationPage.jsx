import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Menu,
  RefreshCw,
  Search,
  Stethoscope,
  TrendingUp,
  X,
} from 'lucide-react'
import { fetchRoleDashboardData, patchRoleData } from '../../lib/authApi'
import BidanNavigationShell from './components/BidanNavigationShell'
import { BIDAN_MENUS } from './bidanMenuItems'

const EVAL_META = {
  ongoing: { label: 'Masih Berjalan', chip: 'bg-sky-50 text-sky-700 border-sky-200' },
  graduated: { label: 'Berhasil Graduasi', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  defaulter: { label: 'Perlu Pendampingan', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
  no_data: { label: 'Belum Ada Timbangan', chip: 'bg-slate-100 text-slate-700 border-slate-200' },
}

const EVAL_ORDER = ['ongoing', 'graduated', 'defaulter', 'no_data']

const VISIT_STATUS_LABEL = {
  SCHEDULED: 'Terjadwal',
  COMPLETED: 'Selesai Dikunjungi',
  FOLLOW_UP: 'Perlu Pantauan',
  REFERRED: 'Dirujuk Puskesmas',
}

const GIZI_LABEL = {
  normal: 'Normal (pita hijau)',
  stunted: 'Stunted',
  severely_stunted: 'Severely Stunted',
  wasted: 'Wasted',
  severely_wasted: 'Severely Wasted',
}

const TREND_POINTS = [
  { key: 'day0_weight_kg', label: 'Hari 0' },
  { key: 'day30_weight_kg', label: 'Hari 30' },
  { key: 'day60_weight_kg', label: 'Hari 60' },
  { key: 'day90_weight_kg', label: 'Hari 90' },
]

const EMPTY_COMPLIANCE = {
  consumption_compliance_percent: '',
  distribution_compliance_percent: '',
  notes: '',
}

function formatWeight(value) {
  if (value === null || value === undefined || value === '') return '-'
  return `${Number(value).toFixed(1)}`
}

function formatSigned(value) {
  if (value === null || value === undefined) return '-'
  const n = Number(value)
  return `${n > 0 ? '+' : ''}${n.toFixed(0)}`
}

function buildQuery(filters, page, pageSize) {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.search.trim()) params.set('search', filters.search.trim())
  if (filters.dateFrom) params.set('date_from', filters.dateFrom)
  if (filters.dateTo) params.set('date_to', filters.dateTo)
  if (filters.pmtOnly) params.set('pmt_only', 'true')
  params.set('limit', String(pageSize))
  params.set('offset', String((page - 1) * pageSize))
  return params.toString()
}

export default function PMTEvaluationPage({ user, onLogout, onSwitchRole }) {
  const pageSize = 100

  const [items, setItems] = useState([])
  const [summary, setSummary] = useState(null)
  const [totalFiltered, setTotalFiltered] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [notice, setNotice] = useState('')
  const [page, setPage] = useState(1)

  const [searchInput, setSearchInput] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    dateFrom: '',
    dateTo: '',
    pmtOnly: false,
  })

  const [activeChild, setActiveChild] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [compliance, setCompliance] = useState(EMPTY_COMPLIANCE)
  const [complianceError, setComplianceError] = useState('')
  const [saving, setSaving] = useState(false)

  // Shell state (mirrors BidanDashboard)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const loadCohort = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const data = await fetchRoleDashboardData(`/bidan/pmt-evaluations?${buildQuery(filters, page, pageSize)}`)
      setItems(Array.isArray(data?.items) ? data.items : [])
      setSummary(data?.summary || null)
      setTotalFiltered(Number(data?.total_filtered) || 0)
    } catch (err) {
      setLoadError(err.message || 'Gagal memuat evaluasi kohor PMT.')
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => {
    loadCohort()
  }, [loadCohort])

  useEffect(() => {
    const handle = setTimeout(() => {
      setFilters((prev) => (prev.search === searchInput.trim() ? prev : { ...prev, search: searchInput.trim() }))
      setPage(1)
    }, 350)
    return () => clearTimeout(handle)
  }, [searchInput])

  useEffect(() => {
    if (!notice) return undefined
    const timer = setTimeout(() => setNotice(''), 5000)
    return () => clearTimeout(timer)
  }, [notice])

  const openDetail = useCallback(async (child) => {
    setActiveChild(child)
    setDetail(null)
    setDetailError('')
    setComplianceError('')
    setCompliance({
      consumption_compliance_percent:
        child.consumption_compliance_percent === null || child.consumption_compliance_percent === undefined
          ? ''
          : String(child.consumption_compliance_percent),
      distribution_compliance_percent:
        child.distribution_compliance_percent === null || child.distribution_compliance_percent === undefined
          ? ''
          : String(child.distribution_compliance_percent),
      notes: child.notes || '',
    })

    setDetailLoading(true)
    try {
      const data = await fetchRoleDashboardData(`/bidan/pmt-evaluations/${child.child_id}`)
      setDetail(data)
    } catch (err) {
      setDetailError(err.message || 'Detail evaluasi tidak dapat dimuat.')
    } finally {
      setDetailLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!activeChild) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setActiveChild(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeChild])

  const trend = useMemo(
    () =>
      TREND_POINTS.map((point) => {
        const values = items
          .map((item) => item[point.key])
          .filter((v) => typeof v === 'number' && Number.isFinite(v))
        const avg = values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : null
        return { ...point, avg: avg === null ? null : Math.round(avg * 100) / 100, sample: values.length }
      }),
    [items]
  )

  const chartGeometry = useMemo(() => {
    const plotted = trend.filter((t) => t.avg !== null)
    if (plotted.length < 2) return null
    const values = plotted.map((p) => p.avg)
    let min = Math.min(...values)
    let max = Math.max(...values)
    if (min === max) {
      min -= 1
      max += 1
    }
    const width = 320
    const height = 132
    const padX = 34
    const padTop = 18
    const padBottom = 30
    const step = (width - padX * 2) / (plotted.length - 1)
    const points = plotted.map((p, i) => ({
      x: padX + i * step,
      y: padTop + (1 - (p.avg - min) / (max - min)) * (height - padTop - padBottom),
      label: p.label,
      avg: p.avg,
      sample: p.sample,
    }))
    return { width, height, points, min, max }
  }, [trend])

  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize))
  const activeFilterCount =
    (filters.status ? 1 : 0) +
    (filters.search ? 1 : 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0) +
    (filters.pmtOnly ? 1 : 0)

  const handleSaveCompliance = async (event) => {
    event.preventDefault()
    setComplianceError('')

    const consumption =
      compliance.consumption_compliance_percent === '' ? null : Number(compliance.consumption_compliance_percent)
    const distribution =
      compliance.distribution_compliance_percent === '' ? null : Number(compliance.distribution_compliance_percent)

    if (consumption !== null && (Number.isNaN(consumption) || consumption < 0 || consumption > 100)) {
      setComplianceError('Persentase kepatuhan konsumsi harus antara 0 dan 100.')
      return
    }
    if (distribution !== null && (Number.isNaN(distribution) || distribution < 0 || distribution > 100)) {
      setComplianceError('Persentase kepatuhan penyaluran harus antara 0 dan 100.')
      return
    }
    if (consumption === null && distribution === null && !compliance.notes.trim()) {
      setComplianceError('Isi salah satu kolom kepatuhan atau catatan sebelum menyimpan.')
      return
    }

    setSaving(true)
    try {
      await patchRoleData(`/bidan/pmt-evaluations/${activeChild.child_id}/compliance`, {
        consumption_compliance_percent: consumption,
        distribution_compliance_percent: distribution,
        notes: compliance.notes.trim(),
      })
      setNotice(`Kepatuhan PMT ${activeChild.child_name} berhasil disimpan.`)
      setActiveChild(null)
      await loadCohort()
    } catch (err) {
      setComplianceError(err.message || 'Gagal menyimpan kepatuhan PMT.')
    } finally {
      setSaving(false)
    }
  }

  const summaryCards = summary
    ? [
        { label: 'Peserta Kohor PMT', value: String(summary.cohort_count ?? 0), sub: `Jendela ${summary.window_days} hari` },
        {
          label: 'Tingkat Graduasi',
          value: `${summary.graduation_rate ?? 0}%`,
          sub: `${summary.graduated_count ?? 0} anak kembali ke pita hijau`,
          accent: true,
        },
        {
          label: 'Rata-rata Δ BB',
          value:
            summary.avg_weight_gain_g === null || summary.avg_weight_gain_g === undefined
              ? '-'
              : `${formatSigned(summary.avg_weight_gain_g)} g`,
          sub: `${summary.children_with_gain ?? 0} naik · ${summary.children_lost_weight ?? 0} turun`,
        },
        {
          label: 'Cakupan PMT',
          value: `${summary.pmt_coverage_rate ?? 0}%`,
          sub: `${summary.total_visits ?? 0} kunjungan tercatat`,
        },
        {
          label: 'Kepatuhan Konsumsi',
          value:
            summary.avg_consumption_compliance_percent === null ||
            summary.avg_consumption_compliance_percent === undefined
              ? '-'
              : `${summary.avg_consumption_compliance_percent}%`,
          sub: 'Rata-rata input manual bidan',
        },
      ]
    : []

  return (
    <div className="min-h-dvh bg-[#f6f9fc] text-slate-800 flex flex-col lg:flex-row font-runde selection:bg-[#2597d0] selection:text-white">
      {/* Mobile Header Bar */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#2597d0] text-white flex items-center justify-center shadow-xs">
            <Stethoscope className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <span className="font-bold text-[15px] text-slate-800">Tumbuhin</span>
            <span className="ml-2 px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-[#edf7fe] text-[#2597d0]">
              Evaluasi PMT
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
            activeMenuId="pmt-evaluasi"
            user={user}
            sidebarCollapsed={false}
            onToggleCollapse={() => setMobileMenuOpen(false)}
            onSelectMenu={(item) => {
              setMobileMenuOpen(false)
              if (item?.route) window.location.hash = `#${item.route}`
            }}
            onOpenQuickAdd={() => { setMobileMenuOpen(false); window.location.hash = '#/bidan/prioritas' }}
            onSwitchRole={onSwitchRole}
            onLogout={onLogout}
            statsSummary={{ totalBalita: 0, stuntingPrevalence: 0, wastingCount: 0, highRiskCount: 0, pendingVisits: 0, redCount: 0 }}
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
          activeMenuId="pmt-evaluasi"
          user={user}
          sidebarCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
          onSelectMenu={(item) => { if (item?.route) window.location.hash = `#${item.route}` }}
          onOpenQuickAdd={() => { window.location.hash = '#/bidan/prioritas' }}
          onSwitchRole={onSwitchRole}
          onLogout={onLogout}
          statsSummary={{ totalBalita: 0, stuntingPrevalence: 0, wastingCount: 0, highRiskCount: 0, pendingVisits: 0, redCount: 0 }}
        />
      </div>

      {/* Main Workspace */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-7 overflow-y-auto space-y-5">
        {/* Page heading */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 text-[11.5px] font-medium text-[#2597d0] mb-1">
              <Activity className="w-4 h-4" aria-hidden="true" />
              <span className="text-[#60606c]">Bidan · Evaluasi PMT 90H</span>
            </div>
            <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.04em] text-[#070709]">
              Evaluasi Program PMT
            </h1>
            <p className="text-[13.5px] text-[#60606c] mt-0.5">
              Monitoring kohor balita penerima PMT 90 hari: tren berat badan, kepatuhan, dan graduasi status gizi.
            </p>
          </div>
        </div>

        <div className="space-y-5">
        {notice && (
          <div
            role="status"
            className="flex items-center justify-between gap-3 px-4 py-3 rounded-[16px] bg-[#edf7fe] border border-[#cfe8f8] text-[13px] text-[#0d5f8a]"
          >
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice('')}
              className="inline-flex items-center justify-center min-h-[44px] px-1.5 text-[12.5px] font-semibold underline cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Cohort summary, computed live from interventions and measurements */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {summaryCards.map((card) => (
              <div
                key={card.label}
                className={`p-4 rounded-[18px] border flex flex-col justify-between ${
                  card.accent
                    ? 'bg-[#0d5f8a] border-[#0d5f8a] text-white shadow-[0_17px_37px_rgba(13,95,138,0.22)]'
                    : 'bg-white border-[#e4e4eb] shadow-[0_17px_37px_rgba(16,55,132,0.03)]'
                }`}
              >
                <span className={`text-[11.5px] ${card.accent ? 'text-white/85' : 'text-[#60606c]'}`}>
                  {card.label}
                </span>
                <span
                  className={`text-[24px] font-semibold tracking-[-0.03em] mt-1.5 ${
                    card.accent ? 'text-white' : 'text-[#070709]'
                  }`}
                >
                  {card.value}
                </span>
                <span className={`text-[11px] mt-0.5 ${card.accent ? 'text-white/80' : 'text-[#60606c]'}`}>
                  {card.sub}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Weight trend at day 0 / 30 / 60 / 90 */}
        <div className="rounded-[20px] bg-white border border-[#e4e4eb] shadow-[0_17px_37px_rgba(16,55,132,0.03)] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#2597d0]" aria-hidden="true" />
              <h2 className="text-[15px] font-semibold text-[#070709]">Tren Berat Badan Kohor</h2>
            </div>
            <span className="text-[11.5px] text-[#60606c]">
              Rata-rata dari {items.length} anak pada tampilan ini
            </span>
          </div>

          {loading ? (
            <div className="py-8 text-center text-[12.5px] text-[#60606c]" role="status">
              <RefreshCw className="w-4 h-4 animate-spin mx-auto text-[#2597d0] mb-2" aria-hidden="true" />
              <span>Memuat tren berat badan...</span>
            </div>
          ) : chartGeometry ? (
            <svg
              viewBox={`0 0 ${chartGeometry.width} ${chartGeometry.height}`}
              className="w-full max-w-[520px] h-auto"
              role="img"
              aria-label={`Grafik rata-rata berat badan dari hari 0 sampai hari 90, tertinggi ${chartGeometry.max.toFixed(1)} kg`}
            >
              <line
                x1="34"
                y1={chartGeometry.height - 30}
                x2={chartGeometry.width - 34}
                y2={chartGeometry.height - 30}
                stroke="#e4e4eb"
                strokeWidth="1"
              />
              <polyline
                points={chartGeometry.points.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="#2597d0"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {chartGeometry.points.map((p) => (
                <g key={p.label}>
                  <circle cx={p.x} cy={p.y} r="4.5" fill="#ffffff" stroke="#2597d0" strokeWidth="2.5" />
                  <text
                    x={p.x}
                    y={p.y - 11}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill="#070709"
                  >
                    {p.avg.toFixed(1)}
                  </text>
                  <text
                    x={p.x}
                    y={chartGeometry.height - 12}
                    textAnchor="middle"
                    fontSize="10.5"
                    fill="#60606c"
                  >
                    {p.label}
                  </text>
                </g>
              ))}
            </svg>
          ) : (
            <div className="py-8 text-center text-[12.5px] text-[#60606c]">
              Belum cukup data timbangan untuk menampilkan tren (minimal 2 titik hari).
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="rounded-[20px] bg-white border border-[#e4e4eb] shadow-[0_17px_37px_rgba(16,55,132,0.03)] p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {[{ value: '', label: 'Semua', count: summary?.cohort_count ?? 0 }, ...EVAL_ORDER.map((status) => ({
              value: status,
              label: EVAL_META[status].label,
              count:
                status === 'ongoing'
                  ? summary?.ongoing_count ?? 0
                  : status === 'graduated'
                    ? summary?.graduated_count ?? 0
                    : status === 'defaulter'
                      ? summary?.defaulter_count ?? 0
                      : summary?.no_data_count ?? 0,
            }))].map((chip) => {
              const isActive = filters.status === chip.value
              return (
                <button
                  key={chip.value || 'all'}
                  type="button"
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, status: chip.value }))
                    setPage(1)
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] rounded-full text-[12.5px] font-medium border transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#070709] text-white border-[#070709]'
                      : 'bg-white text-[#60606c] border-[#e4e4eb] hover:border-[#2597d0] hover:text-[#0d5f8a]'
                  }`}
                  aria-pressed={isActive}
                >
                  <span>{chip.label}</span>
                  <span className={isActive ? 'text-white/70' : 'text-[#60606c]'}>{chip.count}</span>
                </button>
              )
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <label htmlFor="pmt-search" className="sr-only">
                Cari nama balita
              </label>
              <Search
                className="w-4 h-4 text-[#60606c] absolute left-3.5 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                id="pmt-search"
                type="search"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value)
                  setPage(1)
                }}
                placeholder="Cari nama balita..."
                className="w-full pl-10 pr-3.5 py-2.5 min-h-[44px] rounded-[14px] bg-white border border-[#e4e4eb] text-[13px] placeholder:text-[#60606c] focus:border-[#2597d0] focus:outline-none cursor-text"
              />
            </div>
            <div>
              <label htmlFor="pmt-from" className="sr-only">
                Kunjungan sejak tanggal
              </label>
              <input
                id="pmt-from"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
                  setPage(1)
                }}
                className="w-full px-3.5 py-2.5 min-h-[44px] rounded-[14px] bg-white border border-[#e4e4eb] text-[13px] focus:border-[#2597d0] focus:outline-none cursor-pointer"
              />
            </div>
            <div>
              <label htmlFor="pmt-to" className="sr-only">
                Kunjungan sampai tanggal
              </label>
              <input
                id="pmt-to"
                type="date"
                value={filters.dateTo}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
                  setPage(1)
                }}
                className="w-full px-3.5 py-2.5 min-h-[44px] rounded-[14px] bg-white border border-[#e4e4eb] text-[13px] focus:border-[#2597d0] focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#f0f0f4]">
            <label htmlFor="pmt-only" className="flex items-center gap-2 text-[12.5px] text-[#60606c] cursor-pointer">
              <input
                id="pmt-only"
                type="checkbox"
                checked={filters.pmtOnly}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, pmtOnly: e.target.checked }))
                  setPage(1)
                }}
                className="w-4 h-4 accent-[#2597d0] cursor-pointer"
              />
              <span>Hanya anak yang pernah menerima paket PMT</span>
            </label>
            <button
              type="button"
              onClick={loadCohort}
              className="inline-flex items-center gap-1.5 min-h-[44px] text-[12.5px] font-semibold text-[#0d5f8a] cursor-pointer hover:underline"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>Muat ulang</span>
            </button>
          </div>
        </div>

        {/* Cohort table */}
        <div className="rounded-[20px] bg-white border border-[#e4e4eb] shadow-[0_17px_37px_rgba(16,55,132,0.03)] overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-[#f0f0f4] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Activity className="w-4 h-4 text-[#2597d0]" aria-hidden="true" />
              <h2 className="text-[15px] font-semibold text-[#070709]">Daftar Peserta Kohor</h2>
            </div>
            <span className="text-[11.5px] text-[#60606c]">
              {totalFiltered} anak{activeFilterCount > 0 ? ` · ${activeFilterCount} filter aktif` : ''}
            </span>
          </div>

          {loading ? (
            <div className="py-14 text-center text-[13px] text-[#60606c]" role="status">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#2597d0] mb-2" aria-hidden="true" />
              <span>Memuat kohor penerima PMT...</span>
            </div>
          ) : loadError ? (
            <div className="py-14 text-center px-4 space-y-3">
              <p className="text-[13.5px] font-semibold text-[#070709]">Evaluasi kohor gagal dimuat</p>
              <p className="text-[12.5px] text-[#60606c] max-w-md mx-auto">{loadError}</p>
              <button
                type="button"
                onClick={loadCohort}
                className="inline-flex items-center justify-center px-4 py-2.5 min-h-[44px] rounded-full bg-[#070709] text-white text-[12.5px] font-semibold cursor-pointer"
              >
                Coba Lagi
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-14 text-center px-4 space-y-2">
              <p className="text-[13.5px] font-semibold text-[#070709]">
                {activeFilterCount > 0 ? 'Tidak ada peserta pada filter ini' : 'Belum ada kohor PMT tercatat'}
              </p>
              <p className="text-[12.5px] text-[#60606c] max-w-md mx-auto">
                Kohor terisi otomatis begitu bidan mencatat kunjungan rumah untuk balita desa.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-[12.5px] min-w-[1080px]">
                <thead>
                  <tr className="border-b border-[#f0f0f4] text-[#60606c] font-semibold text-[11.5px]">
                    <th className="py-3 px-5">Balita</th>
                    <th className="py-3 px-3 text-right">Kunjungan</th>
                    <th className="py-3 px-3 text-right">BB H-0</th>
                    <th className="py-3 px-3 text-right">BB H-30</th>
                    <th className="py-3 px-3 text-right">BB H-60</th>
                    <th className="py-3 px-3 text-right">BB H-90</th>
                    <th className="py-3 px-3 text-right">Δ BB (g)</th>
                    <th className="py-3 px-3">Status Gizi</th>
                    <th className="py-3 px-3 text-right">Kepatuhan</th>
                    <th className="py-3 px-3">Status Evaluasi</th>
                    <th className="py-3 px-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0f4]">
                  {items.map((row, idx) => {
                    const meta = EVAL_META[row.evaluation_status] || EVAL_META.ongoing
                    const complianceLabel =
                      row.consumption_compliance_percent === null ||
                      row.consumption_compliance_percent === undefined
                        ? 'Belum diisi'
                        : `${row.consumption_compliance_percent}%`
                    return (
                      <tr key={`${row.child_id || 'eval'}-${idx}`} className="hover:bg-[#f7fbfe] transition-colors align-top">
                        <td className="py-3.5 px-5">
                          <div className="font-semibold text-[#070709]">{row.child_name}</div>
                          <div className="text-[11px] text-[#60606c]">
                            {row.age_months} bln · {row.posyandu_name || '-'}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <div className="font-semibold text-[#070709]">{row.visit_count}</div>
                          <div className="text-[11px] text-[#60606c]">{row.first_visit || '-'}</div>
                        </td>
                        <td className="py-3.5 px-3 text-right tabular-nums">{formatWeight(row.day0_weight_kg)}</td>
                        <td className="py-3.5 px-3 text-right tabular-nums">{formatWeight(row.day30_weight_kg)}</td>
                        <td className="py-3.5 px-3 text-right tabular-nums">{formatWeight(row.day60_weight_kg)}</td>
                        <td className="py-3.5 px-3 text-right tabular-nums">{formatWeight(row.day90_weight_kg)}</td>
                        <td className="py-3.5 px-3 text-right tabular-nums font-semibold">
                          <span
                            className={
                              row.weight_gain_g === null || row.weight_gain_g === undefined
                                ? 'text-[#60606c]'
                                : row.weight_gain_g >= 0
                                  ? 'text-emerald-700'
                                  : 'text-rose-700'
                            }
                          >
                            {formatSigned(row.weight_gain_g)}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-[12px] text-[#60606c]">
                          {GIZI_LABEL[row.status_gizi] || 'Belum ada data'}
                        </td>
                        <td className="py-3.5 px-3 text-right tabular-nums">{complianceLabel}</td>
                        <td className="py-3.5 px-3">
                          <span className={`inline-block px-2.5 py-1 rounded-full border text-[11px] font-semibold ${meta.chip}`}>
                            {meta.label}
                          </span>
                          <div className="text-[11px] text-[#60606c] mt-1">{row.success_indicator}</div>
                        </td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openDetail(row)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] rounded-full border border-[#e4e4eb] text-[11.5px] font-semibold text-[#0d5f8a] hover:border-[#2597d0] cursor-pointer transition-colors"
                          >
                            Detail &amp; Kepatuhan
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && !loadError && (
            <div className="px-5 py-3.5 border-t border-[#f0f0f4] flex items-center justify-between gap-3">
              <span className="text-[12px] text-[#60606c]">
                Halaman {page} dari {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 min-h-[44px] inline-flex items-center justify-center rounded-full border border-[#e4e4eb] text-[12px] font-semibold cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 hover:border-[#2597d0]"
                >
                  Sebelumnya
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 min-h-[44px] inline-flex items-center justify-center rounded-full border border-[#e4e4eb] text-[12px] font-semibold cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 hover:border-[#2597d0]"
                >
                  Berikutnya
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail + manual compliance entry */}
      {activeChild && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pmt-detail-title"
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 bg-[#070709]/45 backdrop-blur-[2px]"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setActiveChild(null)
          }}
        >
          <div className="bg-white rounded-[20px] border border-[#e4e4eb] shadow-xl w-full max-w-3xl my-6">
            <div className="px-5 sm:px-6 py-4 border-b border-[#f0f0f4] flex items-start justify-between gap-3">
              <div>
                <h2 id="pmt-detail-title" className="text-[17px] font-semibold text-[#070709]">
                  Evaluasi PMT: {activeChild.child_name}
                </h2>
                <p className="text-[12.5px] text-[#60606c] mt-0.5">
                  {activeChild.age_months} bln · {activeChild.posyandu_name || '-'} · mulai {activeChild.first_visit || '-'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveChild(null)}
                aria-label="Tutup detail evaluasi PMT"
                className="p-2 min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-full text-[#60606c] hover:bg-[#f5f5f5] cursor-pointer"
              >
                <X className="w-4.5 h-4.5" aria-hidden="true" />
              </button>
            </div>

            <div className="px-5 sm:px-6 py-5 space-y-5">
              {detailError && (
                <div role="alert" className="px-4 py-3 rounded-[14px] bg-rose-50 border border-rose-200 text-rose-700 text-[12.5px]">
                  {detailError}
                </div>
              )}

              {detailLoading ? (
                <div className="py-8 text-center text-[12.5px] text-[#60606c]" role="status">
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto text-[#2597d0] mb-2" aria-hidden="true" />
                  <span>Memuat riwayat timbangan dan kunjungan...</span>
                </div>
              ) : detail ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-[16px] bg-[#f5f5f5] border border-[#e4e4eb]">
                      <p className="text-[11px] text-[#60606c]">Kunjungan</p>
                      <p className="text-[19px] font-semibold text-[#070709]">{detail.visit_count}</p>
                    </div>
                    <div className="p-3.5 rounded-[16px] bg-[#f5f5f5] border border-[#e4e4eb]">
                      <p className="text-[11px] text-[#60606c]">Berjalan</p>
                      <p className="text-[19px] font-semibold text-[#070709]">{detail.elapsed_days} hari</p>
                    </div>
                    <div className="p-3.5 rounded-[16px] bg-[#f5f5f5] border border-[#e4e4eb]">
                      <p className="text-[11px] text-[#60606c]">Δ BB</p>
                      <p className="text-[19px] font-semibold text-[#070709]">{formatSigned(detail.weight_gain_g)} g</p>
                    </div>
                    <div className="p-3.5 rounded-[16px] bg-[#f5f5f5] border border-[#e4e4eb]">
                      <p className="text-[11px] text-[#60606c]">PMT</p>
                      <p className="text-[19px] font-semibold text-[#070709]">{detail.pmt_visit_count}x</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[12px] font-bold uppercase tracking-wide text-[#60606c] mb-2">
                      Riwayat Timbangan
                    </h3>
                    {detail.measurements?.length ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[12.5px] min-w-[420px]">
                          <thead>
                            <tr className="border-b border-[#f0f0f4] text-[#60606c] text-[11.5px]">
                              <th className="py-2 pr-3">Tanggal</th>
                              <th className="py-2 pr-3 text-right">Hari ke</th>
                              <th className="py-2 pr-3 text-right">BB (kg)</th>
                              <th className="py-2 pr-3 text-right">TB (cm)</th>
                              <th className="py-2">Status Gizi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#f0f0f4]">
                            {detail.measurements.map((m) => (
                              <tr key={`${m.measured_at}-${m.day_offset}`}>
                                <td className="py-2 pr-3">{m.measured_at}</td>
                                <td className="py-2 pr-3 text-right tabular-nums">{m.day_offset}</td>
                                <td className="py-2 pr-3 text-right tabular-nums font-semibold">
                                  {m.weight_kg?.toFixed?.(1) ?? '-'}
                                </td>
                                <td className="py-2 pr-3 text-right tabular-nums">{m.height_cm?.toFixed?.(1) ?? '-'}</td>
                                <td className="py-2 text-[12px] text-[#60606c]">
                                  {GIZI_LABEL[m.nutrition_status] || m.nutrition_status || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-[12.5px] text-[#60606c]">Belum ada data timbangan untuk anak ini.</p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-[12px] font-bold uppercase tracking-wide text-[#60606c] mb-2">
                      Riwayat Kunjungan Rumah
                    </h3>
                    {detail.visits?.length ? (
                      <ul className="space-y-2">
                        {detail.visits.map((visit) => (
                          <li
                            key={visit.id}
                            className="p-3 rounded-[14px] border border-[#e4e4eb] flex flex-wrap items-start justify-between gap-2"
                          >
                            <div>
                              <p className="text-[12.5px] font-semibold text-[#070709]">
                                {visit.visit_date} ·{' '}
                                {VISIT_STATUS_LABEL[visit.follow_up_status] || visit.follow_up_status}
                              </p>
                              <p className="text-[12px] text-[#60606c] line-clamp-2">
                                {visit.clinical_notes || visit.soap_plan || 'Tanpa catatan klinis.'}
                              </p>
                            </div>
                            <span className="text-[11px] font-semibold text-[#0d5f8a] shrink-0">
                              {visit.pmt_given ? visit.pmt_type || 'PMT diberikan' : 'Tanpa PMT'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[12.5px] text-[#60606c]">Belum ada kunjungan rumah tercatat.</p>
                    )}
                  </div>

                  <form onSubmit={handleSaveCompliance} className="pt-4 border-t border-[#f0f0f4] space-y-4">
                    <div>
                      <h3 className="text-[12px] font-bold uppercase tracking-wide text-[#60606c]">
                        Kepatuhan Program (input manual bidan)
                      </h3>
                      <p className="text-[12px] text-[#60606c] mt-1">
                        Kosongkan bila tidak ada data. Nilai tersimpan hanya untuk anak ini.
                      </p>
                    </div>

                    {complianceError && (
                      <div role="alert" className="px-4 py-3 rounded-[14px] bg-rose-50 border border-rose-200 text-rose-700 text-[12.5px]">
                        {complianceError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="pmt-consumption"
                          className="block text-[12.5px] font-semibold text-[#070709] mb-1.5"
                        >
                          Kepatuhan Konsumsi (%)
                        </label>
                        <input
                          id="pmt-consumption"
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={compliance.consumption_compliance_percent}
                          onChange={(e) =>
                            setCompliance((prev) => ({ ...prev, consumption_compliance_percent: e.target.value }))
                          }
                          placeholder="0 - 100"
                          className="w-full px-3.5 py-2.5 min-h-[44px] rounded-[14px] border border-[#e4e4eb] bg-white text-[13px] focus:border-[#2597d0] focus:outline-none cursor-text"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="pmt-distribution"
                          className="block text-[12.5px] font-semibold text-[#070709] mb-1.5"
                        >
                          Kepatuhan Penyaluran (%)
                        </label>
                        <input
                          id="pmt-distribution"
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={compliance.distribution_compliance_percent}
                          onChange={(e) =>
                            setCompliance((prev) => ({ ...prev, distribution_compliance_percent: e.target.value }))
                          }
                          placeholder="0 - 100"
                          className="w-full px-3.5 py-2.5 min-h-[44px] rounded-[14px] border border-[#e4e4eb] bg-white text-[13px] focus:border-[#2597d0] focus:outline-none cursor-text"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="pmt-notes" className="block text-[12.5px] font-semibold text-[#070709] mb-1.5">
                        Catatan Evaluasi
                      </label>
                      <textarea
                        id="pmt-notes"
                        rows={2}
                        maxLength={1000}
                        value={compliance.notes}
                        onChange={(e) => setCompliance((prev) => ({ ...prev, notes: e.target.value }))}
                        placeholder="mis. Ibu kooperatif, anak menolak telur 2 kali."
                        className="w-full px-3.5 py-2.5 min-h-[44px] rounded-[14px] border border-[#e4e4eb] bg-white text-[13px] focus:border-[#2597d0] focus:outline-none cursor-text resize-y"
                      />
                      <p className="text-[11px] text-[#60606c] mt-1">{compliance.notes.length}/1000</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => setActiveChild(null)}
                        className="inline-flex items-center justify-center px-4 py-2.5 min-h-[44px] rounded-full border border-[#e4e4eb] text-[13px] font-semibold text-[#60606c] hover:bg-[#f5f5f5] cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-5 py-2.5 rounded-full bg-[#0d5f8a] hover:bg-[#0a4b6e] text-white text-[13px] font-semibold cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving ? 'Menyimpan...' : 'Simpan Kepatuhan'}
                      </button>
                    </div>
                  </form>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  )
}
