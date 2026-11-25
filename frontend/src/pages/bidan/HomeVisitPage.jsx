import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  HeartPulse,
  Menu,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Stethoscope,
  Trash2,
  X,
} from 'lucide-react'
import { bidanApi } from '../../lib/bidanApi'
import BidanNavigationShell from './components/BidanNavigationShell'
import { BIDAN_MENUS } from './bidanMenuItems'

const STATUS_META = {
  SCHEDULED: { label: 'Terjadwal', chip: 'bg-sky-50 text-sky-700 border-sky-200' },
  COMPLETED: { label: 'Selesai Dikunjungi', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  FOLLOW_UP: { label: 'Perlu Pantauan', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
  REFERRED: { label: 'Dirujuk Puskesmas', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
}

const STATUS_ORDER = ['SCHEDULED', 'COMPLETED', 'FOLLOW_UP', 'REFERRED']

const SOAP_FIELDS = [
  { key: 'soap_subjective', letter: 'S', label: 'Subjective', hint: 'Pola makan harian, sanitasi air/jamban, riwayat infeksi berulang.' },
  { key: 'soap_objective', letter: 'O', label: 'Objective', hint: 'Hasil pemeriksaan fisik, antropometri, dan kondisi rumah.' },
  { key: 'soap_assessment', letter: 'A', label: 'Assessment', hint: 'Validasi klinis diagnosa gizi oleh Bidan.' },
  { key: 'soap_plan', letter: 'P', label: 'Plan', hint: 'Paket PMT, suplemen, edukasi ibu, dan tanggal evaluasi berikutnya.' },
]

const EMPTY_FORM = {
  child_id: '',
  visit_date: '',
  follow_up_status: 'SCHEDULED',
  soap_subjective: '',
  soap_objective: '',
  soap_assessment: '',
  soap_plan: '',
  pmt_given: false,
  pmt_type: '',
  supplement_given: '',
  clinical_notes: '',
  follow_up_date: '',
  weight_kg: '',
  height_cm: '',
}

const PAGE_SIZE = 100

function todayISO() {
  const d = new Date()
  const offset = d.getTimezoneOffset()
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10)
}

function validateForm(form) {
  const errors = {}
  if (!form.child_id) errors.child_id = 'Pilih balita yang akan dikunjungi.'
  if (!form.visit_date) errors.visit_date = 'Tanggal kunjungan wajib diisi.'
  if (!form.follow_up_status) errors.follow_up_status = 'Status tindak lanjut wajib dipilih.'

  for (const field of SOAP_FIELDS) {
    const value = (form[field.key] || '').trim()
    if (!value) errors[field.key] = `Catatan ${field.label} (${field.letter}) wajib diisi.`
    else if (value.length > 4000) errors[field.key] = `Catatan ${field.label} maksimal 4000 karakter.`
  }

  if (form.pmt_given && !form.pmt_type.trim()) {
    errors.pmt_type = 'Jenis PMT wajib diisi bila pemberian PMT dicentang.'
  }
  if (form.follow_up_date && form.visit_date && form.follow_up_date < form.visit_date) {
    errors.follow_up_date = 'Tanggal evaluasi tidak boleh sebelum tanggal kunjungan.'
  }
  if (form.weight_kg !== '' && (Number(form.weight_kg) < 0.5 || Number(form.weight_kg) > 40)) {
    errors.weight_kg = 'Berat badan harus di antara 0.5 dan 40 kg.'
  }
  if (form.height_cm !== '' && (Number(form.height_cm) < 30 || Number(form.height_cm) > 140)) {
    errors.height_cm = 'Tinggi badan harus di antara 30 dan 140 cm.'
  }
  return errors
}

function buildQuery(filters, page) {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.search.trim()) params.set('search', filters.search.trim())
  if (filters.dateFrom) params.set('date_from', filters.dateFrom)
  if (filters.dateTo) params.set('date_to', filters.dateTo)
  params.set('limit', String(PAGE_SIZE))
  params.set('offset', String((page - 1) * PAGE_SIZE))
  return params.toString()
}

export default function HomeVisitPage({ user, prefill, onLogout, onSwitchRole }) {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [statusCounts, setStatusCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [page, setPage] = useState(1)

  const [searchInput, setSearchInput] = useState('')
  const [filters, setFilters] = useState({ status: '', search: '', dateFrom: '', dateTo: '' })

  const [children, setChildren] = useState([])
  const [childrenError, setChildrenError] = useState('')

  const [formErrors, setFormErrors] = useState({})
  const [formServerError, setFormServerError] = useState('')
  const [saving, setSaving] = useState(false)

  const [detail, setDetail] = useState(null)
  const [editingId, setEditingId] = useState('')
  const [statusBusyId, setStatusBusyId] = useState('')
  const formFirstFieldRef = useRef(null)

  // Shell state (mirrors BidanDashboard)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const prefillChildId = prefill?.child_id || ''
  const prefillChildName = prefill?.child_name || ''
  // The App router keys this page on child_id, so a fresh mount re-opens the
  // form with the child that came from the Prioritas triage table.
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    visit_date: todayISO(),
    child_id: prefillChildId,
  }))
  const [isFormOpen, setIsFormOpen] = useState(() => Boolean(prefillChildId))
  const [notice, setNotice] = useState(() =>
    prefillChildName ? `Kunjungan untuk ${prefillChildName} siap dicatat.` : ''
  )

  const loadVisits = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const data = await bidanApi.listHomeVisits(buildQuery(filters, page))
      setItems(Array.isArray(data?.items) ? data.items : [])
      setTotal(Number(data?.total) || 0)
      setStatusCounts(data?.status_counts || {})
    } catch (err) {
      setLoadError(err.message || 'Gagal memuat daftar kunjungan rumah.')
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => {
    loadVisits()
  }, [loadVisits])

  useEffect(() => {
    const handle = setTimeout(() => {
      setFilters((prev) => (prev.search === searchInput.trim() ? prev : { ...prev, search: searchInput.trim() }))
      setPage(1)
    }, 350)
    return () => clearTimeout(handle)
  }, [searchInput])

  useEffect(() => {
    let cancelled = false
    bidanApi.getPriorityList()
      .then((data) => {
        if (!cancelled) setChildren(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        if (!cancelled) setChildrenError(err.message || 'Daftar balita tidak dapat dimuat.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isFormOpen) return undefined
    const timer = setTimeout(() => formFirstFieldRef.current?.focus(), 40)
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setIsFormOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isFormOpen])

  useEffect(() => {
    if (!detail) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setDetail(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [detail])

  useEffect(() => {
    if (!notice) return undefined
    const timer = setTimeout(() => setNotice(''), 5000)
    return () => clearTimeout(timer)
  }, [notice])

  const openCreateForm = () => {
    setEditingId('')
    setForm({ ...EMPTY_FORM, visit_date: todayISO() })
    setFormErrors({})
    setFormServerError('')
    setIsFormOpen(true)
  }

  const openEditForm = (record) => {
    setEditingId(record.id)
    setForm({
      child_id: record.child_id || '',
      visit_date: record.visit_date || todayISO(),
      follow_up_status: record.follow_up_status || 'SCHEDULED',
      soap_subjective: record.soap_subjective || '',
      soap_objective: record.soap_objective || '',
      soap_assessment: record.soap_assessment || '',
      soap_plan: record.soap_plan || '',
      pmt_given: Boolean(record.pmt_given),
      pmt_type: record.pmt_type || '',
      supplement_given: record.supplement_given || '',
      clinical_notes: record.clinical_notes || '',
      follow_up_date: record.follow_up_date || '',
      weight_kg: record.weight_kg != null ? String(record.weight_kg) : '',
      height_cm: record.height_cm != null ? String(record.height_cm) : '',
    })
    setFormErrors({})
    setFormServerError('')
    setDetail(null)
    setIsFormOpen(true)
  }

  const handleDeleteVisit = async (record) => {
    if (!record?.id) return
    if (!window.confirm(`Hapus catatan kunjungan rumah ${record.child_name || ''}?`)) return
    setStatusBusyId(record.id)
    try {
      await bidanApi.deleteHomeVisit(record.id)
      setDetail(null)
      setNotice(`Catatan kunjungan ${record.child_name || ''} berhasil dihapus.`)
      await loadVisits()
    } catch (err) {
      setLoadError(err.message || 'Gagal menghapus kunjungan rumah.')
    } finally {
      setStatusBusyId('')
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const handleStatusChange = async (record, nextStatus) => {
    if (!nextStatus || nextStatus === record.follow_up_status) return
    setStatusBusyId(record.id)
    try {
      await bidanApi.updateHomeVisitStatus(record.id, nextStatus)
      setNotice(`Status kunjungan ${record.child_name} diubah menjadi ${STATUS_META[nextStatus]?.label || nextStatus}.`)
      await loadVisits()
    } catch (err) {
      setLoadError(err.message || 'Gagal memperbarui status kunjungan.')
    } finally {
      setStatusBusyId('')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const errors = validateForm(form)
    setFormErrors(errors)
    setFormServerError('')
    if (Object.keys(errors).length > 0) return

    setSaving(true)
    try {
      const payload = {
        ...form,
        weight_kg: form.weight_kg === '' ? null : Number(form.weight_kg),
        height_cm: form.height_cm === '' ? null : Number(form.height_cm),
      }
      if (editingId) {
        await bidanApi.updateHomeVisit(editingId, payload)
        setNotice('Catatan kunjungan rumah berhasil diperbarui.')
      } else {
        await bidanApi.createHomeVisit(payload)
        setNotice('Catatan kunjungan rumah berhasil disimpan.')
        setPage(1)
      }
      setEditingId('')
      setIsFormOpen(false)
      await loadVisits()
    } catch (err) {
      setFormServerError(err.message || 'Gagal menyimpan kunjungan rumah.')
    } finally {
      setSaving(false)
    }
  }

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFormErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const filterChips = useMemo(
    () => [
      { value: '', label: 'Semua', count: total },
      ...STATUS_ORDER.map((status) => ({
        value: status,
        label: STATUS_META[status].label,
        count: statusCounts[status] || 0,
      })),
    ],
    [statusCounts, total]
  )

  const activeFilterCount =
    (filters.status ? 1 : 0) + (filters.search ? 1 : 0) + (filters.dateFrom ? 1 : 0) + (filters.dateTo ? 1 : 0)

  const selectedChild = children.find((c) => c.child_id === form.child_id)

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
              Home Visit
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
            activeMenuId="intervensi"
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
          activeMenuId="intervensi"
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
              <HeartPulse className="w-4 h-4" aria-hidden="true" />
              <span className="text-[#60606c]">Bidan · Home Visit SOAP</span>
            </div>
            <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.04em] text-[#070709]">
              Kunjungan Rumah
            </h1>
            <p className="text-[13.5px] text-[#60606c] mt-0.5">
              Penjadwalan kunjungan lapangan, catatan klinis SOAP, dan pencatatan paket PMT balita desa.
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

        {/* Toolbar: schedule filters plus the single primary action */}
        <div className="rounded-[20px] bg-white border border-[#e4e4eb] shadow-[0_17px_37px_rgba(16,55,132,0.03)] p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {filterChips.map((chip) => {
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

            <button
              type="button"
              onClick={() => openCreateForm()}
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-full bg-[#0d5f8a] hover:bg-[#0a4b6e] text-white text-[13px] font-semibold cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Catat Kunjungan Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <label htmlFor="hv-search" className="sr-only">
                Cari nama balita
              </label>
              <Search
                className="w-4 h-4 text-[#60606c] absolute left-3.5 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                id="hv-search"
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
              <label htmlFor="hv-from" className="sr-only">
                Kunjungan sejak tanggal
              </label>
              <input
                id="hv-from"
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
              <label htmlFor="hv-to" className="sr-only">
                Kunjungan sampai tanggal
              </label>
              <input
                id="hv-to"
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

          <div className="flex items-center justify-between gap-3 pt-1 border-t border-[#f0f0f4]">
            <p className="text-[12px] text-[#60606c]">
              {total} kunjungan tercatat
              {activeFilterCount > 0 ? ` · ${activeFilterCount} filter aktif` : ''}
            </p>
            <button
              type="button"
              onClick={loadVisits}
              className="inline-flex items-center gap-1.5 min-h-[44px] text-[12.5px] font-semibold text-[#0d5f8a] cursor-pointer hover:underline"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>Muat ulang</span>
            </button>
          </div>
        </div>

        {/* Schedule table */}
        <div className="rounded-[20px] bg-white border border-[#e4e4eb] shadow-[0_17px_37px_rgba(16,55,132,0.03)] overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-[#f0f0f4] flex items-center gap-2.5">
            <ClipboardList className="w-4.5 h-4.5 text-[#2597d0]" aria-hidden="true" />
            <h2 className="text-[15px] font-semibold text-[#070709]">Daftar Tugas Kunjungan</h2>
          </div>

          {loading ? (
            <div className="py-14 text-center text-[13px] text-[#60606c]" role="status">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#2597d0] mb-2" aria-hidden="true" />
              <span>Memuat jadwal kunjungan rumah...</span>
            </div>
          ) : loadError ? (
            <div className="py-14 text-center px-4 space-y-3">
              <p className="text-[13.5px] font-semibold text-[#070709]">Daftar kunjungan gagal dimuat</p>
              <p className="text-[12.5px] text-[#60606c] max-w-md mx-auto">{loadError}</p>
              <button
                type="button"
                onClick={loadVisits}
                className="inline-flex items-center justify-center px-4 py-2.5 min-h-[44px] rounded-full bg-[#070709] text-white text-[12.5px] font-semibold cursor-pointer"
              >
                Coba Lagi
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-14 text-center px-4 space-y-3">
              <HeartPulse className="w-6 h-6 mx-auto text-[#2597d0]" aria-hidden="true" />
              <p className="text-[13.5px] font-semibold text-[#070709]">
                {activeFilterCount > 0 ? 'Tidak ada kunjungan pada filter ini' : 'Belum ada kunjungan rumah tercatat'}
              </p>
              <p className="text-[12.5px] text-[#60606c] max-w-md mx-auto">
                {activeFilterCount > 0
                  ? 'Longgarkan kata kunci atau rentang tanggal untuk melihat jadwal lain.'
                  : 'Mulai dengan mencatat kunjungan pertama untuk balita di desa Anda.'}
              </p>
              {activeFilterCount === 0 && (
                <button
                  type="button"
                  onClick={() => openCreateForm()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-full bg-[#0d5f8a] text-white text-[12.5px] font-semibold cursor-pointer hover:bg-[#0a4b6e]"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>Catat Kunjungan Baru</span>
                </button>
              )}
            </div>
          ) : (
            <div className="relative overflow-x-auto w-full">
              {/* relative so sr-only labels inside the table stay clipped by the scroller */}
              <table className="w-full text-left border-collapse text-[12.5px] min-w-[900px]">
                <thead>
                  <tr className="border-b border-[#f0f0f4] text-[#60606c] font-semibold text-[11.5px]">
                    <th className="py-3 px-5">Tanggal Kunjungan</th>
                    <th className="py-3 px-3">Balita &amp; Orang Tua</th>
                    <th className="py-3 px-3">PMT</th>
                    <th className="py-3 px-3">Catatan SOAP</th>
                    <th className="py-3 px-3">Status Tindak Lanjut</th>
                    <th className="py-3 px-5 text-right">Rincian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0f4]">
                  {items.map((record, idx) => {
                    const meta = STATUS_META[record.follow_up_status] || STATUS_META.SCHEDULED
                    const soapSummary =
                      record.soap_assessment?.trim() || record.soap_plan?.trim() || record.soap_subjective?.trim() || ''
                    return (
                      <tr key={`${record.id || 'visit'}-${idx}`} className="hover:bg-[#f7fbfe] transition-colors align-top">
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <div className="font-semibold text-[#070709]">{record.visit_date || '-'}</div>
                          <div className="text-[11px] text-[#60606c]">
                            {record.follow_up_date ? `Evaluasi ${record.follow_up_date}` : 'Belum ada evaluasi lanjutan'}
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-semibold text-[#070709]">{record.child_name || 'Tanpa nama'}</div>
                          <div className="text-[11px] text-[#60606c]">
                            {record.posyandu_name || record.village_name || '-'}
                            {record.parent_name ? ` · ${record.parent_name}` : ''}
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          {record.pmt_given ? (
                            <>
                              <span className="font-semibold text-[#0d5f8a]">{record.pmt_type || 'Paket PMT'}</span>
                              <div className="text-[11px] text-[#60606c]">{record.supplement_given || 'Tanpa suplemen'}</div>
                            </>
                          ) : (
                            <span className="text-[#60606c]">Tidak diberikan</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 max-w-[240px]">
                          <p className="text-[12px] text-[#60606c] line-clamp-2">
                            {soapSummary || 'Belum ada catatan SOAP.'}
                          </p>
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full border text-[11px] font-semibold ${meta.chip}`}
                          >
                            {meta.label}
                          </span>
                          <div className="mt-1.5">
                            <label htmlFor={`status-${record.id}`} className="sr-only">
                              Ubah status kunjungan {record.child_name}
                            </label>
                            <select
                              id={`status-${record.id}`}
                              value={record.follow_up_status}
                              disabled={statusBusyId === record.id}
                              onChange={(e) => handleStatusChange(record, e.target.value)}
                              className="w-full px-2 py-2.5 min-h-[44px] rounded-[10px] border border-[#e4e4eb] bg-white text-[11.5px] focus:border-[#2597d0] focus:outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {STATUS_ORDER.map((status) => (
                                <option key={status} value={status}>
                                  {STATUS_META[status].label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setDetail(record)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] rounded-full border border-[#e4e4eb] text-[11.5px] font-semibold text-[#0d5f8a] hover:border-[#2597d0] cursor-pointer transition-colors"
                          >
                            <Stethoscope className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Lihat SOAP</span>
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
                  className="inline-flex items-center gap-1 px-3 py-1.5 min-h-[44px] rounded-full border border-[#e4e4eb] text-[12px] font-semibold cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 hover:border-[#2597d0]"
                >
                  <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Sebelumnya</span>
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 min-h-[44px] rounded-full border border-[#e4e4eb] text-[12px] font-semibold cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 hover:border-[#2597d0]"
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create home visit form */}
      {isFormOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="home-visit-form-title"
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 bg-[#070709]/45 backdrop-blur-[2px]"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsFormOpen(false)
          }}
        >
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-[20px] border border-[#e4e4eb] shadow-xl w-full max-w-3xl my-6"
          >
            <div className="sticky top-0 bg-white px-5 sm:px-6 py-4 border-b border-[#f0f0f4] flex items-start justify-between gap-3 rounded-t-[20px]">
              <div>
                <h2 id="home-visit-form-title" className="text-[17px] font-semibold text-[#070709]">
                  Catatan Kunjungan Rumah
                </h2>
                <p className="text-[12.5px] text-[#60606c] mt-0.5">
                  Lengkapi identitas balita, catatan SOAP, dan paket PMT sebelum menyimpan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                aria-label="Tutup formulir kunjungan rumah"
                className="p-2 min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-full text-[#60606c] hover:bg-[#f5f5f5] cursor-pointer"
              >
                <X className="w-4.5 h-4.5" aria-hidden="true" />
              </button>
            </div>

            <div className="px-5 sm:px-6 py-5 space-y-5">
              {formServerError && (
                <div role="alert" className="px-4 py-3 rounded-[14px] bg-rose-50 border border-rose-200 text-rose-700 text-[12.5px]">
                  {formServerError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="hv-child" className="block text-[12.5px] font-semibold text-[#070709] mb-1.5">
                    Balita <span className="text-rose-600">*</span>
                  </label>
                  <select
                    id="hv-child"
                    ref={formFirstFieldRef}
                    value={form.child_id}
                    onChange={(e) => setField('child_id', e.target.value)}
                    className={`w-full px-3.5 py-2.5 min-h-[44px] rounded-[14px] border bg-white text-[13px] focus:outline-none cursor-pointer ${
                      formErrors.child_id ? 'border-rose-400' : 'border-[#e4e4eb] focus:border-[#2597d0]'
                    }`}
                  >
                    <option value="">
                      {childrenError ? 'Daftar balita tidak tersedia' : 'Pilih balita...'}
                    </option>
                    {children.map((child) => (
                      <option key={child.child_id} value={child.child_id}>
                        {child.child_name} ({child.age_months} bln, {child.posyandu_name})
                      </option>
                    ))}
                  </select>
                  {formErrors.child_id && (
                    <p className="text-[11.5px] text-rose-600 mt-1">{formErrors.child_id}</p>
                  )}
                  {!formErrors.child_id && childrenError && (
                    <p className="text-[11.5px] text-amber-700 mt-1">{childrenError}</p>
                  )}
                  {!formErrors.child_id && selectedChild && (
                    <p className="text-[11.5px] text-[#60606c] mt-1">
                      Orang tua: {selectedChild.parent_name || '-'} ({selectedChild.parent_phone || 'tanpa nomor'})
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="hv-date" className="block text-[12.5px] font-semibold text-[#070709] mb-1.5">
                    Tanggal Kunjungan <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="hv-date"
                    type="date"
                    value={form.visit_date}
                    onChange={(e) => setField('visit_date', e.target.value)}
                    className={`w-full px-3.5 py-2.5 min-h-[44px] rounded-[14px] border bg-white text-[13px] focus:outline-none cursor-pointer ${
                      formErrors.visit_date ? 'border-rose-400' : 'border-[#e4e4eb] focus:border-[#2597d0]'
                    }`}
                  />
                  {formErrors.visit_date && <p className="text-[11.5px] text-rose-600 mt-1">{formErrors.visit_date}</p>}
                </div>

                <div>
                  <label htmlFor="hv-status" className="block text-[12.5px] font-semibold text-[#070709] mb-1.5">
                    Status Tindak Lanjut <span className="text-rose-600">*</span>
                  </label>
                  <select
                    id="hv-status"
                    value={form.follow_up_status}
                    onChange={(e) => setField('follow_up_status', e.target.value)}
                    className="w-full px-3.5 py-2.5 min-h-[44px] rounded-[14px] border border-[#e4e4eb] bg-white text-[13px] focus:border-[#2597d0] focus:outline-none cursor-pointer"
                  >
                    {STATUS_ORDER.map((status) => (
                      <option key={status} value={status}>
                        {STATUS_META[status].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="hv-weight" className="block text-[12.5px] font-semibold text-[#070709] mb-1.5">
                    Berat Badan Saat Kunjungan (kg)
                  </label>
                  <input
                    id="hv-weight"
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="40"
                    value={form.weight_kg}
                    onChange={(e) => setField('weight_kg', e.target.value)}
                    placeholder="mis. 7.4"
                    className={`w-full px-3.5 py-2.5 min-h-[44px] rounded-[14px] border bg-white text-[13px] focus:outline-none cursor-text ${
                      formErrors.weight_kg ? 'border-rose-400' : 'border-[#e4e4eb] focus:border-[#2597d0]'
                    }`}
                  />
                  {formErrors.weight_kg && <p className="text-[11.5px] text-rose-600 mt-1">{formErrors.weight_kg}</p>}
                </div>

                <div>
                  <label htmlFor="hv-height" className="block text-[12.5px] font-semibold text-[#070709] mb-1.5">
                    Tinggi Badan Saat Kunjungan (cm)
                  </label>
                  <input
                    id="hv-height"
                    type="number"
                    step="0.1"
                    min="30"
                    max="140"
                    value={form.height_cm}
                    onChange={(e) => setField('height_cm', e.target.value)}
                    placeholder="mis. 68.5"
                    className={`w-full px-3.5 py-2.5 min-h-[44px] rounded-[14px] border bg-white text-[13px] focus:outline-none cursor-text ${
                      formErrors.height_cm ? 'border-rose-400' : 'border-[#e4e4eb] focus:border-[#2597d0]'
                    }`}
                  />
                  {formErrors.height_cm && <p className="text-[11.5px] text-rose-600 mt-1">{formErrors.height_cm}</p>}
                </div>
              </div>

              <fieldset className="space-y-3 pt-4 border-t border-[#f0f0f4]">
                <legend className="text-[12px] font-bold uppercase tracking-wide text-[#60606c] px-0">
                  Catatan Klinis SOAP
                </legend>
                {SOAP_FIELDS.map((field) => (
                  <div key={field.key}>
                    <label
                      htmlFor={`hv-${field.key}`}
                      className="flex items-baseline gap-2 text-[12.5px] font-semibold text-[#070709] mb-1"
                    >
                      <span className="w-5 h-5 rounded-md bg-[#edf7fe] text-[#0d5f8a] text-[11px] font-bold flex items-center justify-center shrink-0">
                        {field.letter}
                      </span>
                      <span>
                        {field.label}
                        <span className="text-rose-600"> *</span>
                      </span>
                    </label>
                    <textarea
                      id={`hv-${field.key}`}
                      rows={2}
                      value={form[field.key]}
                      onChange={(e) => setField(field.key, e.target.value)}
                      placeholder={field.hint}
                      className={`w-full px-3.5 py-2.5 min-h-[44px] rounded-[14px] border bg-white text-[13px] leading-relaxed focus:outline-none cursor-text resize-y ${
                        formErrors[field.key] ? 'border-rose-400' : 'border-[#e4e4eb] focus:border-[#2597d0]'
                      }`}
                    />
                    <div className="flex items-start justify-between gap-3 mt-1">
                      <p className={`text-[11.5px] ${formErrors[field.key] ? 'text-rose-600' : 'text-[#60606c]'}`}>
                        {formErrors[field.key] || field.hint}
                      </p>
                      <span className="text-[11px] text-[#60606c] shrink-0">{form[field.key].length}/4000</span>
                    </div>
                  </div>
                ))}
              </fieldset>

              <fieldset className="space-y-3 pt-4 border-t border-[#f0f0f4]">
                <legend className="text-[12px] font-bold uppercase tracking-wide text-[#60606c]">
                  Paket PMT &amp; Suplemen
                </legend>

                <label htmlFor="hv-pmt-given" className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    id="hv-pmt-given"
                    type="checkbox"
                    checked={form.pmt_given}
                    onChange={(e) => setField('pmt_given', e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-[#2597d0] cursor-pointer"
                  />
                  <span className="text-[13px] text-[#070709]">
                    Paket PMT Pemulihan diberikan pada kunjungan ini
                  </span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="hv-pmt-type" className="block text-[12.5px] font-semibold text-[#070709] mb-1.5">
                      Jenis PMT {form.pmt_given && <span className="text-rose-600">*</span>}
                    </label>
                    <input
                      id="hv-pmt-type"
                      type="text"
                      maxLength={80}
                      value={form.pmt_type}
                      onChange={(e) => setField('pmt_type', e.target.value)}
                      placeholder="mis. Telur, pisang, bubur kacang hijau"
                      disabled={!form.pmt_given}
                      className={`w-full px-3.5 py-2.5 min-h-[44px] rounded-[14px] border bg-white text-[13px] focus:outline-none cursor-text disabled:cursor-not-allowed disabled:bg-[#f5f5f5] disabled:text-[#60606c] ${
                        formErrors.pmt_type ? 'border-rose-400' : 'border-[#e4e4eb] focus:border-[#2597d0]'
                      }`}
                    />
                    {formErrors.pmt_type && <p className="text-[11.5px] text-rose-600 mt-1">{formErrors.pmt_type}</p>}
                  </div>
                  <div>
                    <label htmlFor="hv-supplement" className="block text-[12.5px] font-semibold text-[#070709] mb-1.5">
                      Suplemen Mikronutrien
                    </label>
                    <input
                      id="hv-supplement"
                      type="text"
                      maxLength={2000}
                      value={form.supplement_given}
                      onChange={(e) => setField('supplement_given', e.target.value)}
                      placeholder="mis. Tablet zat besi 1x seminggu"
                      className="w-full px-3.5 py-2.5 min-h-[44px] rounded-[14px] border border-[#e4e4eb] bg-white text-[13px] focus:border-[#2597d0] focus:outline-none cursor-text"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="hv-followup" className="block text-[12.5px] font-semibold text-[#070709] mb-1.5">
                      Tanggal Evaluasi Lanjutan
                    </label>
                    <input
                      id="hv-followup"
                      type="date"
                      value={form.follow_up_date}
                      onChange={(e) => setField('follow_up_date', e.target.value)}
                      className={`w-full px-3.5 py-2.5 min-h-[44px] rounded-[14px] border bg-white text-[13px] focus:outline-none cursor-pointer ${
                        formErrors.follow_up_date ? 'border-rose-400' : 'border-[#e4e4eb] focus:border-[#2597d0]'
                      }`}
                    />
                    {formErrors.follow_up_date && (
                      <p className="text-[11.5px] text-rose-600 mt-1">{formErrors.follow_up_date}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="hv-notes" className="block text-[12.5px] font-semibold text-[#070709] mb-1.5">
                      Catatan Tambahan
                    </label>
                    <input
                      id="hv-notes"
                      type="text"
                      maxLength={2000}
                      value={form.clinical_notes}
                      onChange={(e) => setField('clinical_notes', e.target.value)}
                      placeholder="mis. Ibu hadir, anak sedang batuk"
                      className="w-full px-3.5 py-2.5 min-h-[44px] rounded-[14px] border border-[#e4e4eb] bg-white text-[13px] focus:border-[#2597d0] focus:outline-none cursor-text"
                    />
                  </div>
                </div>
              </fieldset>
            </div>

            <div className="sticky bottom-0 bg-white px-5 sm:px-6 py-4 border-t border-[#f0f0f4] flex flex-wrap items-center justify-end gap-2.5 rounded-b-[20px]">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="inline-flex items-center justify-center px-4 py-2.5 min-h-[44px] rounded-full border border-[#e4e4eb] text-[13px] font-semibold text-[#60606c] hover:bg-[#f5f5f5] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0d5f8a] hover:bg-[#0a4b6e] text-white text-[13px] font-semibold cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <CalendarDays className="w-4 h-4" aria-hidden="true" />
                )}
                <span>{saving ? 'Menyimpan...' : 'Simpan Kunjungan'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SOAP detail */}
      {detail && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="home-visit-detail-title"
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 bg-[#070709]/45 backdrop-blur-[2px]"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDetail(null)
          }}
        >
          <div className="bg-white rounded-[20px] border border-[#e4e4eb] shadow-xl w-full max-w-2xl my-6">
            <div className="px-5 sm:px-6 py-4 border-b border-[#f0f0f4] flex items-start justify-between gap-3">
              <div>
                <h2 id="home-visit-detail-title" className="text-[17px] font-semibold text-[#070709]">
                  Catatan SOAP: {detail.child_name || 'Tanpa nama'}
                </h2>
                <p className="text-[12.5px] text-[#60606c] mt-0.5">
                  Kunjungan {detail.visit_date || '-'} · {detail.posyandu_name || detail.village_name || '-'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                aria-label="Tutup catatan SOAP"
                className="p-2 min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-full text-[#60606c] hover:bg-[#f5f5f5] cursor-pointer"
              >
                <X className="w-4.5 h-4.5" aria-hidden="true" />
              </button>
            </div>

            <div className="px-5 sm:px-6 py-5 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold ${
                    (STATUS_META[detail.follow_up_status] || STATUS_META.SCHEDULED).chip
                  }`}
                >
                  {(STATUS_META[detail.follow_up_status] || STATUS_META.SCHEDULED).label}
                </span>
                <span className="px-2.5 py-1 rounded-full border border-[#e4e4eb] bg-[#f5f5f5] text-[11px] font-semibold text-[#070709]">
                  {detail.pmt_given ? `PMT: ${detail.pmt_type || 'diberikan'}` : 'Tanpa PMT'}
                </span>
                {detail.weight_kg != null && (
                  <span className="px-2.5 py-1 rounded-full border border-[#e4e4eb] bg-[#f5f5f5] text-[11px] font-semibold text-[#070709]">
                    {detail.weight_kg} kg · {detail.height_cm ?? '-'} cm
                  </span>
                )}
              </div>

              {SOAP_FIELDS.map((field) => (
                <div key={field.key} className="p-3.5 rounded-[16px] bg-[#f5f5f5] border border-[#e4e4eb]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-5 h-5 rounded-md bg-[#070709] text-white text-[11px] font-bold flex items-center justify-center">
                      {field.letter}
                    </span>
                    <span className="text-[12.5px] font-semibold text-[#070709]">{field.label}</span>
                  </div>
                  <p className="text-[13px] text-[#070709] leading-relaxed whitespace-pre-wrap">
                    {detail[field.key]?.trim() || 'Belum diisi.'}
                  </p>
                </div>
              ))}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-[16px] border border-[#e4e4eb]">
                  <p className="text-[11.5px] font-semibold uppercase tracking-wide text-[#60606c] mb-1">Suplemen</p>
                  <p className="text-[13px] text-[#070709]">{detail.supplement_given || 'Tidak ada suplemen.'}</p>
                </div>
                <div className="p-3.5 rounded-[16px] border border-[#e4e4eb]">
                  <p className="text-[11.5px] font-semibold uppercase tracking-wide text-[#60606c] mb-1">
                    Tanggal Evaluasi
                  </p>
                  <p className="text-[13px] text-[#070709]">{detail.follow_up_date || 'Belum dijadwalkan.'}</p>
                </div>
              </div>

              <div>
                <p className="text-[11.5px] font-semibold uppercase tracking-wide text-[#60606c] mb-1.5">
                  Catatan Tambahan
                </p>
                <p className="text-[13px] text-[#070709] leading-relaxed whitespace-pre-wrap">
                  {detail.clinical_notes?.trim() || 'Tidak ada catatan tambahan.'}
                </p>
              </div>
            </div>

            <div className="px-5 sm:px-6 py-4 border-t border-[#f0f0f4] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditForm(detail)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-full border border-[#e4e4eb] text-[12.5px] font-semibold text-[#0d5f8a] hover:border-[#2597d0] cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Edit SOAP</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteVisit(detail)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-full border border-rose-200 bg-rose-50 text-[12.5px] font-semibold text-rose-700 hover:bg-rose-100 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Hapus</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="inline-flex items-center justify-center px-4 py-2.5 min-h-[44px] rounded-full bg-[#070709] text-white text-[13px] font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  )
}
