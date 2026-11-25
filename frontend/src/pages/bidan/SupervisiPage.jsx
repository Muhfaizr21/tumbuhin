import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Filter,
  Lock,
  Menu,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  Unlock,
  X,
} from 'lucide-react'
import { bidanApi } from '../../lib/bidanApi'
import BidanNavigationShell from './components/BidanNavigationShell'
import { BIDAN_MENUS } from './bidanMenuItems'

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export default function SupervisiPage({ user, onLogout, onSwitchRole }) {
  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())
  const [selectedPosyanduId, setSelectedPosyanduId] = useState('')

  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [notice, setNotice] = useState('')

  // Outlier filter state
  const [outlierFilter, setOutlierFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Lock Modal state
  const [lockModalOpen, setLockModalOpen] = useState(false)
  const [targetPosyandu, setTargetPosyandu] = useState(null) // null = all posyandus
  const [isLockAction, setIsLockAction] = useState(true) // true = lock, false = unlock
  const [auditNotes, setAuditNotes] = useState('')
  const [lockSubmitting, setLockSubmitting] = useState(false)

  // Shell state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const params = new URLSearchParams()
      params.set('period_month', String(selectedMonth))
      params.set('period_year', String(selectedYear))
      if (selectedPosyanduId) {
        params.set('posyandu_id', selectedPosyanduId)
      }

      const res = await bidanApi.getSupervisionOverview(params.toString())
      setOverview(res)
    } catch (err) {
      setLoadError(err.message || 'Gagal memuat data supervisi posyandu.')
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, selectedYear, selectedPosyanduId])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!notice) return undefined
    const timer = setTimeout(() => setNotice(''), 5000)
    return () => clearTimeout(timer)
  }, [notice])

  const handleOpenLockModal = (posyandu = null, shouldLock = true) => {
    setTargetPosyandu(posyandu)
    setIsLockAction(shouldLock)
    if (shouldLock) {
      setAuditNotes(
        posyandu
          ? `Data ${posyandu.posyandu_name} periode ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear} telah diverifikasi Bidan Desa dan dikunci untuk pelaporan e-PPGBM.`
          : `Seluruh Posyandu Desa periode ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear} telah diverifikasi Bidan Desa dan dikunci.`
      )
    } else {
      setAuditNotes(
        posyandu
          ? `Kunci data ${posyandu.posyandu_name} dibuka kembali untuk perbaikan hasil ukur antropometri.`
          : `Kunci data posyandu dibuka kembali untuk perbaikan data ukur.`
      )
    }
    setLockModalOpen(true)
  }

  const handleConfirmLock = async (e) => {
    e.preventDefault()
    setLockSubmitting(true)
    try {
      const payload = {
        posyandu_id: targetPosyandu ? targetPosyandu.posyandu_id : 'all',
        period_month: selectedMonth,
        period_year: selectedYear,
        is_locked: isLockAction,
        audit_notes: auditNotes.trim(),
      }

      await bidanApi.togglePeriodLock(payload)
      setLockModalOpen(false)
      setNotice(
        isLockAction
          ? `Periode ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear} berhasil dikunci (terverifikasi Bidan).`
          : `Kunci periode ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear} berhasil dibuka.`
      )
      await loadData()
    } catch (err) {
      setNotice(`Gagal memperbarui status penguncian: ${err.message}`)
    } finally {
      setLockSubmitting(false)
    }
  }

  const filteredOutliers = useMemo(() => {
    if (!overview?.outliers) return []
    return overview.outliers.filter((item) => {
      if (outlierFilter !== 'ALL' && item.outlier_type !== outlierFilter) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = item.child_name.toLowerCase().includes(q)
        const matchPos = item.posyandu_name.toLowerCase().includes(q)
        if (!matchName && !matchPos) return false
      }
      return true
    })
  }, [overview, outlierFilter, searchQuery])

  const stats = overview || {
    total_posyandus: 8,
    total_enrolled: 0,
    total_measured: 0,
    overall_rate_percent: 0,
    total_outliers: 0,
    locked_count: 0,
    all_locked: false,
    posyandus: [],
    outliers: [],
  }

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
              Supervisi
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
            activeMenuId="supervisi"
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
            onSwitchRole={onSwitchRole}
            onLogout={onLogout}
            statsSummary={{
              totalBalita: stats.total_enrolled || 342,
              stuntingPrevalence: 8.4,
              wastingCount: 11,
              highRiskCount: stats.total_outliers,
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
          activeMenuId="supervisi"
          user={user}
          sidebarCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
          onSelectMenu={(item) => {
            if (item?.route) window.location.hash = `#${item.route}`
          }}
          onOpenQuickAdd={() => {
            window.location.hash = '#/bidan/prioritas'
          }}
          onSwitchRole={onSwitchRole}
          onLogout={onLogout}
          statsSummary={{
            totalBalita: stats.total_enrolled || 342,
            stuntingPrevalence: 8.4,
            wastingCount: 11,
            highRiskCount: stats.total_outliers,
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
              <ClipboardCheck className="w-4 h-4" aria-hidden="true" />
              <span className="text-[#60606c]">Bidan · Supervisi Posyandu &amp; Audit</span>
            </div>
            <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.04em] text-[#070709]">
              Supervisi Posyandu &amp; Audit Data
            </h1>
            <p className="text-[13.5px] text-[#60606c] mt-0.5">
              Audit kualitas data antropometri, deteksi angka outlier klinis, dan validasi penguncian rekapitulasi desa.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenLockModal(null, !stats.all_locked)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-semibold cursor-pointer transition-colors shadow-xs ${
                stats.all_locked
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-[#0d5f8a] hover:bg-[#0a4b6e] text-white'
              }`}
            >
              {stats.all_locked ? (
                <>
                  <Unlock className="w-4 h-4" aria-hidden="true" />
                  <span>Buka Kunci Seluruh Desa</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" aria-hidden="true" />
                  <span>Kunci Semua Posyandu</span>
                </>
              )}
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

        {/* Toolbar: Period Selector & Posyandu Filter */}
        <div className="rounded-[20px] bg-white border border-[#e4e4eb] shadow-[0_17px_37px_rgba(16,55,132,0.03)] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label htmlFor="sup-month" className="block text-[11px] font-semibold uppercase tracking-wider text-[#60606c] mb-1">
                  Periode Bulan
                </label>
                <select
                  id="sup-month"
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
                <label htmlFor="sup-year" className="block text-[11px] font-semibold uppercase tracking-wider text-[#60606c] mb-1">
                  Tahun
                </label>
                <select
                  id="sup-year"
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
                <label htmlFor="sup-posyandu" className="block text-[11px] font-semibold uppercase tracking-wider text-[#60606c] mb-1">
                  Unit Posyandu
                </label>
                <select
                  id="sup-posyandu"
                  value={selectedPosyanduId}
                  onChange={(e) => setSelectedPosyanduId(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-[#e4e4eb] bg-white text-[13px] font-medium text-[#070709] focus:outline-none focus:border-[#2597d0] cursor-pointer min-w-[180px]"
                >
                  <option value="">Semua Posyandu ({stats.total_posyandus})</option>
                  {stats.posyandus.map((p) => (
                    <option key={p.posyandu_id} value={p.posyandu_id}>
                      {p.posyandu_name} (RW {p.rw_code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#e4e4eb] text-[12.5px] font-semibold text-[#0d5f8a] hover:bg-[#edf7fe] transition-colors cursor-pointer self-end"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>Muat Ulang Data</span>
            </button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 sm:p-5 rounded-[20px] bg-white border border-[#e4e4eb] shadow-[0_17px_37px_rgba(16,55,132,0.03)] flex flex-col justify-between">
            <span className="text-[12px] font-medium text-[#60606c]">Cakupan Partisipasi (D/S)</span>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="text-[26px] font-semibold tracking-[-0.03em] text-[#070709]">
                {stats.overall_rate_percent.toFixed(1)}%
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-[#0d5f8a] border border-sky-200">
                {stats.total_measured} / {stats.total_enrolled} Anak
              </span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-[#2597d0] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(stats.overall_rate_percent, 100)}%` }}
              />
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-[20px] bg-white border border-[#e4e4eb] shadow-[0_17px_37px_rgba(16,55,132,0.03)] flex flex-col justify-between">
            <span className="text-[12px] font-medium text-[#60606c]">Temuan Outlier Pengukuran</span>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className={`text-[26px] font-semibold tracking-[-0.03em] ${stats.total_outliers > 0 ? 'text-rose-600' : 'text-[#070709]'}`}>
                {stats.total_outliers}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${stats.total_outliers > 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                {stats.total_outliers > 0 ? 'Perlu Audit Klinis' : 'Kualitas Baik'}
              </span>
            </div>
            <span className="text-[11px] text-[#60606c] mt-2">
              Deteksi TB menyusut, lonjakan TB, atau Z-Score ekstrem
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-[20px] bg-white border border-[#e4e4eb] shadow-[0_17px_37px_rgba(16,55,132,0.03)] flex flex-col justify-between">
            <span className="text-[12px] font-medium text-[#60606c]">Status Kunci Periode Data</span>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="text-[26px] font-semibold tracking-[-0.03em] text-[#070709]">
                {stats.locked_count} / {stats.total_posyandus}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${stats.all_locked ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                {stats.all_locked ? 'Terkunci Penuh' : 'Sebagian Terbuka'}
              </span>
            </div>
            <span className="text-[11px] text-[#60606c] mt-2">
              {stats.all_locked ? 'Data siap sinkron e-PPGBM' : 'Menunggu verifikasi akhir bidan'}
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-[20px] bg-[#0d5f8a] text-white shadow-[0_17px_37px_rgba(13,95,138,0.22)] flex flex-col justify-between">
            <span className="text-[12px] font-medium text-white/85">Periode Audit Aktif</span>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="text-[24px] font-semibold tracking-[-0.03em] text-white">
                {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </span>
            </div>
            <span className="text-[11px] text-white/80 mt-2">
              Wilayah kerja: {stats.village_name || 'Desa Sukamaju'}
            </span>
          </div>
        </div>

        {/* Section 1: Deteksi Outlier Pengukuran (Audit Klinis Antropometri) */}
        <div className="rounded-[20px] bg-white border border-[#e4e4eb] shadow-[0_17px_37px_rgba(16,55,132,0.03)] overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-[#f0f0f4] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <ShieldAlert className="w-4.5 h-4.5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-[#070709]">
                  Deteksi Outlier &amp; Anomali Pengukuran
                </h2>
                <p className="text-[11.5px] text-[#60606c]">
                  Data antropometri kader yang dicurigai salah baca/salah ketik sebelum dikunci ke e-PPGBM
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#60606c] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari balita / posyandu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-full border border-[#e4e4eb] bg-white text-[12px] focus:outline-none focus:border-[#2597d0]"
                />
              </div>
            </div>
          </div>

          {/* Filter Chips for Anomaly Type */}
          <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-b border-[#f0f0f4] flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: 'Semua Temuan', count: stats.total_outliers },
              { id: 'HEIGHT_SHRINKAGE', label: 'TB Menyusut', count: stats.outliers.filter((o) => o.outlier_type === 'HEIGHT_SHRINKAGE').length },
              { id: 'HEIGHT_SURGE', label: 'Lonjakan TB Ekstrem', count: stats.outliers.filter((o) => o.outlier_type === 'HEIGHT_SURGE').length },
              { id: 'EXTREME_WEIGHT_CHANGE', label: 'Penurunan BB Drastis', count: stats.outliers.filter((o) => o.outlier_type === 'EXTREME_WEIGHT_CHANGE').length },
              { id: 'EXTREME_ZSCORE', label: 'Z-Score Ekstrem', count: stats.outliers.filter((o) => o.outlier_type === 'EXTREME_ZSCORE').length },
            ].map((tab) => {
              const active = outlierFilter === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setOutlierFilter(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-medium border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#070709] text-white border-[#070709]'
                      : 'bg-white text-[#60606c] border-[#e4e4eb] hover:border-[#2597d0]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={active ? 'text-white/70' : 'text-[#60606c]'}>({tab.count})</span>
                </button>
              )
            })}
          </div>

          {/* Outlier Items List */}
          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="py-12 text-center text-[#60606c] text-[13px]">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#2597d0] mb-2" />
                <span>Memuat audit anomali data...</span>
              </div>
            ) : filteredOutliers.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-[14px] font-semibold text-[#070709]">
                  Tidak Ditemukan Anomali Pengukuran
                </p>
                <p className="text-[12px] text-[#60606c] max-w-md mx-auto">
                  Semua data timbangan kader pada periode ini konsisten dengan kurva biologis normal.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOutliers.map((o) => {
                  const isHigh = o.severity === 'HIGH'
                  return (
                    <div
                      key={o.measurement_id}
                      className={`p-4 rounded-[16px] border transition-all ${
                        isHigh
                          ? 'bg-rose-50/40 border-rose-200'
                          : 'bg-amber-50/30 border-amber-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                              isHigh ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {isHigh ? (
                              <AlertOctagon className="w-4.5 h-4.5" />
                            ) : (
                              <AlertTriangle className="w-4.5 h-4.5" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-[14px] text-[#070709]">
                                {o.child_name}
                              </span>
                              <span className="text-[12px] text-[#60606c]">
                                ({o.age_months} bln · {o.gender} · {o.posyandu_name})
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  isHigh
                                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                                    : 'bg-amber-100 text-amber-800 border-amber-300'
                                }`}
                              >
                                {o.title}
                              </span>
                            </div>

                            <p className="text-[12.5px] text-slate-700 leading-relaxed">
                              {o.description}
                            </p>

                            <div className="flex flex-wrap items-center gap-4 text-[11.5px] text-[#60606c] pt-1">
                              <span>Tgl Timbang: <strong>{o.measured_at}</strong></span>
                              <span>BB: <strong>{o.weightKg} kg</strong></span>
                              <span>TB: <strong>{o.heightCm} cm</strong></span>
                              <span>TB/U: <strong>{o.zscore_hfa.toFixed(1)} SD</strong></span>
                              <span>Status: <strong className="capitalize">{o.nutrition_status.replace('_', ' ')}</strong></span>
                            </div>

                            <div className="mt-2 p-2.5 rounded-xl bg-white/80 border border-slate-200 text-[12px] text-slate-800 flex items-start gap-2">
                              <ShieldCheck className="w-4 h-4 text-[#2597d0] shrink-0 mt-0.5" />
                              <span><strong>Rekomendasi Bidan:</strong> {o.suggested_action}</span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 pt-1 sm:pt-0">
                          <a
                            href={`#/bidan/intervensi?child_id=${encodeURIComponent(o.child_id)}&child_name=${encodeURIComponent(o.child_name)}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0d5f8a] hover:bg-[#0a4b6e] text-white text-[11.5px] font-semibold transition-colors cursor-pointer"
                          >
                            <span>Tindak Lanjut Visit</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Tabel Rekapitulasi & Status Penguncian Posyandu */}
        <div className="rounded-[20px] bg-white border border-[#e4e4eb] shadow-[0_17px_37px_rgba(16,55,132,0.03)] overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-[#f0f0f4] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#2597d0] flex items-center justify-center">
                <ShieldCheck className="w-4.5 h-4.5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-[#070709]">
                  Status Verifikasi &amp; Penguncian Data Posyandu
                </h2>
                <p className="text-[11.5px] text-[#60606c]">
                  Kunci data yang tervalidasi agar tidak dapat diubah kader sebelum diunduh untuk laporan resmi
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-[12.5px] min-w-[850px]">
              <thead>
                <tr className="border-b border-[#f0f0f4] text-[#60606c] font-semibold text-[11.5px] bg-slate-50/50">
                  <th className="py-3 px-5">Posyandu &amp; Wilayah</th>
                  <th className="py-3 px-3 text-right">Sasaran (S)</th>
                  <th className="py-3 px-3 text-right">Ditimbang (D)</th>
                  <th className="py-3 px-3">Cakupan (D/S)</th>
                  <th className="py-3 px-3 text-center">Outlier</th>
                  <th className="py-3 px-3">Status Kunci</th>
                  <th className="py-3 px-3">Catatan Audit</th>
                  <th className="py-3 px-5 text-right">Aksi Bidan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f4]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#60606c]">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#2597d0] mb-2" />
                      <span>Memuat rekapitulasi posyandu...</span>
                    </td>
                  </tr>
                ) : stats.posyandus.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Belum ada data posyandu terdaftar.
                    </td>
                  </tr>
                ) : (
                  stats.posyandus.map((p) => {
                    return (
                      <tr key={p.posyandu_id} className="hover:bg-[#f7fbfe] transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="font-semibold text-[#070709]">{p.posyandu_name}</div>
                          <div className="text-[11px] text-[#60606c]">
                            RW {p.rw_code} · RT {p.rt_code}
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-right font-medium text-slate-700">
                          {p.total_enrolled}
                        </td>

                        <td className="py-3.5 px-3 text-right font-bold text-slate-900">
                          {p.total_measured}
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#0d5f8a] text-[12px] min-w-[42px]">
                              {p.measurement_rate_percent.toFixed(1)}%
                            </span>
                            <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-[#2597d0] h-full rounded-full"
                                style={{ width: `${Math.min(p.measurement_rate_percent, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          {p.outlier_count > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              {p.outlier_count} Kasus
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11.5px]">-</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3">
                          {p.is_locked ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Lock className="w-3 h-3" />
                                <span>Terkunci</span>
                              </span>
                              {p.locked_at && (
                                <div className="text-[10.5px] text-slate-400 mt-0.5">
                                  {p.locked_at}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              <Unlock className="w-3 h-3" />
                              <span>Terbuka</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 max-w-[200px]">
                          <p className="text-[11.5px] text-slate-600 truncate" title={p.audit_notes}>
                            {p.audit_notes || (p.is_locked ? 'Terverifikasi Bidan' : 'Belum diverifikasi')}
                          </p>
                        </td>

                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          {p.is_locked ? (
                            <button
                              type="button"
                              onClick={() => handleOpenLockModal(p, false)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 text-[11.5px] font-semibold cursor-pointer transition-colors"
                            >
                              <Unlock className="w-3 h-3" />
                              <span>Buka Kunci</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenLockModal(p, true)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0d5f8a] hover:bg-[#0a4b6e] text-white text-[11.5px] font-semibold cursor-pointer transition-colors"
                            >
                              <Lock className="w-3 h-3" />
                              <span>Kunci Data</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal Konfirmasi Penguncian Data */}
      {lockModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
        >
          <div className="bg-white rounded-[24px] border border-[#e4e4eb] shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isLockAction ? 'bg-sky-50 text-[#2597d0]' : 'bg-amber-50 text-amber-600'
                  }`}
                >
                  {isLockAction ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-[16px] text-slate-800">
                    {isLockAction ? 'Kunci Periode Data Posyandu' : 'Buka Kunci Periode Data'}
                  </h3>
                  <p className="text-[12px] text-slate-500">
                    {targetPosyandu ? targetPosyandu.posyandu_name : 'Seluruh Posyandu Desa'} · {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLockModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleConfirmLock} className="space-y-4">
              <p className="text-[13px] text-slate-600 leading-relaxed">
                {isLockAction
                  ? 'Setelah dikunci, Petugas Posyandu tidak dapat mengedit atau menghapus data timbangan periode ini sampai kunci dibuka kembali oleh Bidan.'
                  : 'Membuka kunci memungkinkan Petugas Posyandu memperbaiki data ukur balita yang mengalami anomali antropometri.'}
              </p>

              <div>
                <label htmlFor="audit-notes-input" className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                  Catatan Supervisi &amp; Audit Bidan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="audit-notes-input"
                  rows={3}
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  placeholder="Masukkan catatan verifikasi klinis..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-[13px] focus:outline-none focus:border-[#2597d0] resize-y"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setLockModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 text-[12.5px] font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={lockSubmitting}
                  className={`px-5 py-2 rounded-full text-white text-[12.5px] font-semibold cursor-pointer disabled:opacity-60 ${
                    isLockAction ? 'bg-[#0d5f8a] hover:bg-[#0a4b6e]' : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {lockSubmitting ? 'Memproses...' : isLockAction ? 'Konfirmasi Kunci Data' : 'Konfirmasi Buka Kunci'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
