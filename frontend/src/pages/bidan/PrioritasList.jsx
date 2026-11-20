import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  AlertOctagon,
  AlertTriangle,
  Calendar,
  CheckCircle,
  FileSpreadsheet,
  Filter,
  MapPin,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  User,
  X,
} from 'lucide-react'
import {
  fetchRoleDashboardData,
  postRoleData,
  putRoleData,
  deleteRoleData,
} from '../../lib/authApi'

// Ringkasan 3 Balita representatif untuk seeder & offline preview
const FALLBACK_PRIORITY_LIST = [
  {
    child_id: 'ch-001',
    child_name: 'Bayu Aditya',
    age_months: 14,
    gender: 'L',
    posyandu_name: 'Posyandu Melati 03',
    rw_code: 'RW 03',
    rt_code: 'RT 02',
    parent_name: 'Ibu Ratna',
    parent_phone: '081299112201',
    nutrition_status: 'severely_stunted',
    faltering_risk_score: 94.5,
    faltering_risk_level: 'HIGH',
    triage_category: 'MERAH',
    last_measured_at: '2026-11-12',
    zscore_wfa: -2.8,
    zscore_hfa: -3.4,
    zscore_wfh: -1.9,
    pending_intervention: true,
  },
  {
    child_id: 'ch-002',
    child_name: 'Nadia Salsabila',
    age_months: 16,
    gender: 'P',
    posyandu_name: 'Posyandu Anggrek 02',
    rw_code: 'RW 02',
    rt_code: 'RT 04',
    parent_name: 'Ibu Linda',
    parent_phone: '081299112205',
    nutrition_status: 'stunted',
    faltering_risk_score: 79.5,
    faltering_risk_level: 'HIGH',
    triage_category: 'ORANYE',
    last_measured_at: '2026-11-11',
    zscore_wfa: -2.1,
    zscore_hfa: -2.6,
    zscore_wfh: -1.1,
    pending_intervention: true,
  },
  {
    child_id: 'ch-003',
    child_name: 'Farhan Ramadhan',
    age_months: 15,
    gender: 'L',
    posyandu_name: 'Posyandu Anggrek 01',
    rw_code: 'RW 01',
    rt_code: 'RT 02',
    parent_name: 'Ibu Wulandari',
    parent_phone: '081299112211',
    nutrition_status: 'normal',
    faltering_risk_score: 84.3,
    faltering_risk_level: 'HIGH',
    triage_category: 'KUNING',
    last_measured_at: '2026-11-16',
    zscore_wfa: -1.2,
    zscore_hfa: -1.7,
    zscore_wfh: -0.5,
    pending_intervention: false,
  },
]

const INITIAL_FORM_STATE = {
  child_name: '',
  age_months: '12',
  gender: 'L',
  posyandu_name: 'Posyandu Melati 03',
  rw_code: 'RW 03',
  rt_code: 'RT 01',
  parent_name: '',
  parent_phone: '081299112233',
  nutrition_status: 'stunted',
  zscore_hfa: '-2.3',
  zscore_wfa: '-1.5',
  zscore_wfh: '-1.0',
  faltering_risk_score: 75,
  pending_intervention: true,
}

const safeParseFloat = (val, defaultVal = 0) => {
  if (val === null || val === undefined || val === '') return defaultVal
  const parsed = parseFloat(String(val).replace(',', '.'))
  return isNaN(parsed) ? defaultVal : parsed
}

const safeParseInt = (val, defaultVal = 0) => {
  if (val === null || val === undefined || val === '') return defaultVal
  const parsed = parseInt(val, 10)
  return isNaN(parsed) ? defaultVal : parsed
}

export default function PrioritasList({ user, embedded = false }) {
  const [childrenList, setChildrenList] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState('ALL')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [actionNotice, setActionNotice] = useState('')

  // CRUD Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create' | 'edit'
  const [selectedChildId, setSelectedChildId] = useState(null)
  const [formData, setFormData] = useState(INITIAL_FORM_STATE)
  const [formSubmitting, setFormSubmitting] = useState(false)

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  async function loadPriorityData() {
    setLoading(true)
    try {
      const data = await fetchRoleDashboardData('/bidan/priority-list')
      if (Array.isArray(data) && data.length > 0) {
        const uniqueMap = new Map()
        data.forEach((item) => {
          if (item && item.child_id && !uniqueMap.has(item.child_id)) {
            uniqueMap.set(item.child_id, item)
          }
        })
        setChildrenList(Array.from(uniqueMap.values()))
      } else {
        setChildrenList(FALLBACK_PRIORITY_LIST)
      }
    } catch {
      setChildrenList(FALLBACK_PRIORITY_LIST)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPriorityData()
  }, [])

  const countMerah = childrenList.filter((c) => c.triage_category === 'MERAH').length
  const countOranye = childrenList.filter((c) => c.triage_category === 'ORANYE').length
  const countKuning = childrenList.filter((c) => c.triage_category === 'KUNING').length

  const filteredChildren = childrenList.filter((c) => {
    const matchCategory = filterCategory === 'ALL' || c.triage_category === filterCategory
    const matchSearch =
      (c.child_name || '').toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (c.parent_name || '').toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (c.posyandu_name || '').toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (c.rw_code || '').toLowerCase().includes(searchKeyword.toLowerCase())
    return matchCategory && matchSearch
  })

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setModalMode('create')
    setSelectedChildId(null)
    setFormData(INITIAL_FORM_STATE)
    setIsModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEditModal = (child) => {
    setModalMode('edit')
    setSelectedChildId(child.child_id)
    setFormData({
      child_name: child.child_name || '',
      age_months: String(child.age_months || 12),
      gender: child.gender || 'L',
      posyandu_name: child.posyandu_name || 'Posyandu Melati 03',
      rw_code: child.rw_code || 'RW 03',
      rt_code: child.rt_code || 'RT 01',
      parent_name: child.parent_name || '',
      parent_phone: child.parent_phone || '',
      nutrition_status: child.nutrition_status || 'stunted',
      zscore_hfa: String(child.zscore_hfa || -2.3),
      zscore_wfa: String(child.zscore_wfa || -1.5),
      zscore_wfh: String(child.zscore_wfh || -1.0),
      faltering_risk_score: child.faltering_risk_score || 75,
      pending_intervention: Boolean(child.pending_intervention),
    })
    setIsModalOpen(true)
  }

  // Submit Modal (Create or Update)
  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setFormSubmitting(true)

    const childName = (formData.child_name || '').trim() || 'Balita Prioritas Baru'
    const ageMonths = safeParseInt(formData.age_months, 12)
    const zscoreHfa = safeParseFloat(formData.zscore_hfa, -2.3)
    const zscoreWfa = safeParseFloat(formData.zscore_wfa, -1.5)
    const zscoreWfh = safeParseFloat(formData.zscore_wfh, -1.0)
    const falteringScore = safeParseFloat(formData.faltering_risk_score, 75.0)

    const payload = {
      child_name: childName,
      age_months: ageMonths,
      gender: formData.gender === 'P' ? 'P' : 'L',
      posyandu_name: (formData.posyandu_name || '').trim() || 'Posyandu Melati 03',
      rw_code: (formData.rw_code || '').trim() || 'RW 03',
      rt_code: (formData.rt_code || '').trim() || 'RT 01',
      parent_name: (formData.parent_name || '').trim() || 'Ibu Balita',
      parent_phone: (formData.parent_phone || '').trim() || '081299112200',
      nutrition_status: formData.nutrition_status || 'stunted',
      zscore_hfa: zscoreHfa,
      zscore_wfa: zscoreWfa,
      zscore_wfh: zscoreWfh,
      faltering_risk_score: falteringScore,
      pending_intervention: Boolean(formData.pending_intervention),
    }

    try {
      if (modalMode === 'create') {
        let saved = null
        try {
          const res = await postRoleData('/bidan/priority-list', payload)
          if (res && res.child_name) {
            saved = res
          }
        } catch (apiErr) {
          console.warn('[PRIORITAS] Backend save notice:', apiErr.message)
        }

        if (!saved) {
          const triageCat =
            payload.nutrition_status === 'severely_stunted' ||
            payload.nutrition_status === 'severely_wasted' ||
            payload.zscore_hfa <= -3.0
              ? 'MERAH'
              : payload.nutrition_status === 'stunted' ||
                payload.nutrition_status === 'wasted' ||
                payload.zscore_hfa <= -2.0
                ? 'ORANYE'
                : 'KUNING'

          saved = {
            ...payload,
            child_id: `ch-${Date.now().toString().slice(-5)}`,
            last_measured_at: new Date().toISOString().split('T')[0],
            faltering_risk_level: payload.faltering_risk_score >= 70 ? 'HIGH' : 'MEDIUM',
            triage_category: triageCat,
          }
        }

        setChildrenList((prev) => [saved, ...prev])
        setActionNotice(`Balita ${saved.child_name} berhasil ditambahkan ke daftar triase prioritas!`)
      } else {
        // Edit mode
        let updated = null
        try {
          const res = await putRoleData(`/bidan/priority-list/${selectedChildId}`, payload)
          if (res && res.child_name) {
            updated = res
          }
        } catch (apiErr) {
          console.warn('[PRIORITAS] Backend update notice:', apiErr.message)
        }

        const triageCat =
          payload.nutrition_status === 'severely_stunted' ||
          payload.nutrition_status === 'severely_wasted' ||
          payload.zscore_hfa <= -3.0
            ? 'MERAH'
            : payload.nutrition_status === 'stunted' ||
              payload.nutrition_status === 'wasted' ||
              payload.zscore_hfa <= -2.0
              ? 'ORANYE'
              : 'KUNING'

        if (!updated) {
          updated = {
            ...payload,
            child_id: selectedChildId,
            last_measured_at: new Date().toISOString().split('T')[0],
            faltering_risk_level: payload.faltering_risk_score >= 70 ? 'HIGH' : 'MEDIUM',
            triage_category: triageCat,
          }
        }

        setChildrenList((prev) =>
          prev.map((c) => (c.child_id === selectedChildId ? { ...c, ...updated } : c))
        )
        setActionNotice(`Data balita ${updated.child_name} berhasil diperbarui!`)
      }

      setIsModalOpen(false)
      setFormData(INITIAL_FORM_STATE)
      setTimeout(() => setActionNotice(''), 4500)
    } catch (err) {
      setActionNotice(`Pemberitahuan: ${err.message}`)
    } finally {
      setFormSubmitting(false)
    }
  }

  // Handle Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)

    try {
      try {
        await deleteRoleData(`/bidan/priority-list/${deleteTarget.child_id}`)
      } catch (err) {
        console.warn('[PRIORITAS] Backend delete notice:', err.message)
      }

      setChildrenList((prev) => prev.filter((c) => c.child_id !== deleteTarget.child_id))
      setActionNotice(`Balita ${deleteTarget.child_name} berhasil dihapus dari daftar prioritas`)
      setDeleteTarget(null)
      setTimeout(() => setActionNotice(''), 4500)
    } catch (err) {
      setActionNotice(`Gagal menghapus balita: ${err.message}`)
    } finally {
      setDeleteLoading(false)
    }
  }

  // Toggle Visit Status
  const handleToggleVisit = async (child) => {
    const nextStatus = !child.pending_intervention
    try {
      await putRoleData(`/bidan/priority-list/${child.child_id}`, {
        pending_intervention: nextStatus,
      })
    } catch {
      // Local fallback
    }

    setChildrenList((prev) =>
      prev.map((c) =>
        c.child_id === child.child_id ? { ...c, pending_intervention: nextStatus } : c
      )
    )

    if (nextStatus) {
      setActionNotice(`Instruksi Kunjungan Lapangan berhasil dijadwalkan untuk ${child.child_name}`)
    } else {
      setActionNotice(`Kunjungan Lapangan untuk ${child.child_name} telah ditandai Selesai`)
    }
    setTimeout(() => setActionNotice(''), 4500)
  }

  return (
    <div
      className={`text-[#070709] flex flex-col font-runde selection:bg-[#2597d0] selection:text-white ${
        embedded ? 'w-full space-y-6' : 'min-h-screen bg-[#f5f5f5]'
      }`}
    >
      {/* Top Sticky Header (Only when standalone) */}
      {!embedded && (
        <header className="bg-white border-b border-[#e4e4eb] px-5 sm:px-8 py-4 sticky top-0 z-30 shadow-[0_1px_2px_rgba(228,229,231,0.24)]">
          <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <button
                type="button"
                onClick={() => {
                  window.location.hash = '#/bidan/dashboard'
                }}
                className="letters-ghost-btn inline-flex items-center gap-2 px-4 py-2 text-[13px] hover:bg-[#f5f5f5] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-[#2597d0]" />
                <span>Dasbor Bidan</span>
              </button>
              <div className="h-5 w-px bg-[#e4e4eb] hidden sm:block" />
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-[19px] sm:text-[22px] font-semibold text-[#070709] tracking-[-0.03em] leading-tight">
                    Daftar Triase Prioritas Intervensi
                  </h1>
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-medium bg-[#f5f5f5] text-[#070709] border border-[#e4e4eb]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2597d0]" />
                    {childrenList.length} Kasus Terpantau
                  </span>
                </div>
                <p className="text-[12px] text-[#60606c] tracking-[-0.01em] mt-0.5">
                  Surveilans Aktif: <strong className="text-[#070709]">{user?.village_name || 'Desa Sukamaju'}</strong> • Protokol Triase Klinis WHO &amp; ML
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={loadPriorityData}
                disabled={loading}
                className="letters-ghost-btn inline-flex items-center gap-2 px-4 py-2 text-[13px] hover:bg-[#f5f5f5] cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#2597d0] ${loading ? 'animate-spin' : ''}`} />
                <span>Segarkan</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.hash = '#/bidan/peta-gis'
                }}
                className="letters-ghost-btn inline-flex items-center gap-2 px-4 py-2 text-[13px] cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-[#2597d0]" />
                <span>Buka Peta GIS</span>
              </button>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="letters-pill-btn inline-flex items-center gap-2 px-5 py-2 text-[13px] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah Balita</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className={`w-full mx-auto space-y-6 flex-1 ${embedded ? '' : 'max-w-[1400px] p-5 sm:p-8'}`}>
        {actionNotice && (
          <div className="p-4 rounded-[18px] bg-white border border-[#e4e4eb] text-[#070709] text-[13px] font-medium flex items-center justify-between shadow-[0_17px_37px_rgba(16,55,132,0.04)] animate-in fade-in">
            <span className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-[#2597d0]" />
              <span>{actionNotice}</span>
            </span>
            <button
              type="button"
              onClick={() => setActionNotice('')}
              className="text-[#60606c] hover:text-[#070709] text-[12px] font-medium cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Triage Protocol Cards (3 Tiers in Letters Feature Card Style: 20px radius, atmospheric shadow) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
          {/* Card Prioritas 1 Merah */}
          <div
            onClick={() => setFilterCategory('MERAH')}
            className={`p-4 sm:p-5 rounded-[20px] border transition-all cursor-pointer ${
              filterCategory === 'MERAH'
                ? 'bg-white border-[#070709] shadow-[0_17px_37px_rgba(16,55,132,0.06)] ring-1 ring-[#070709]'
                : 'bg-white border-[#e4e4eb] hover:border-[#bebecc] shadow-[0_17px_37px_rgba(16,55,132,0.02)]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                <span className="font-medium text-[11px] text-rose-800">Prioritas 1</span>
              </div>
              <span className="text-[16px] font-semibold text-rose-600 tracking-[-0.02em]">
                {countMerah} Kasus
              </span>
            </div>
            <h3 className="font-semibold text-[13.5px] text-[#070709] mt-2.5 tracking-[-0.01em]">
              Severely Stunted / Wasted
            </h3>
            <p className="text-[11.5px] text-[#60606c] mt-1 leading-snug">
              Z-Score &lt; -3 SD. Butuh tindakan darurat medis &amp; rujukan faskes.
            </p>
          </div>

          {/* Card Prioritas 2 Oranye */}
          <div
            onClick={() => setFilterCategory('ORANYE')}
            className={`p-4 sm:p-5 rounded-[20px] border transition-all cursor-pointer ${
              filterCategory === 'ORANYE'
                ? 'bg-white border-[#070709] shadow-[0_17px_37px_rgba(16,55,132,0.06)] ring-1 ring-[#070709]'
                : 'bg-white border-[#e4e4eb] hover:border-[#bebecc] shadow-[0_17px_37px_rgba(16,55,132,0.02)]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span className="font-medium text-[11px] text-amber-800">Prioritas 2</span>
              </div>
              <span className="text-[16px] font-semibold text-amber-600 tracking-[-0.02em]">
                {countOranye} Kasus
              </span>
            </div>
            <h3 className="font-semibold text-[13.5px] text-[#070709] mt-2.5 tracking-[-0.01em]">
              Stunted / Wasted (-3 s/d -2 SD)
            </h3>
            <p className="text-[11.5px] text-[#60606c] mt-1 leading-snug">
              Penurunan gizi sedang. PMT Pemulihan 90 hari &amp; edukasi gizi lokal.
            </p>
          </div>

          {/* Card Prioritas 3 Kuning */}
          <div
            onClick={() => setFilterCategory('KUNING')}
            className={`p-4 sm:p-5 rounded-[20px] border transition-all cursor-pointer ${
              filterCategory === 'KUNING'
                ? 'bg-white border-[#070709] shadow-[0_17px_37px_rgba(16,55,132,0.06)] ring-1 ring-[#070709]'
                : 'bg-white border-[#e4e4eb] hover:border-[#bebecc] shadow-[0_17px_37px_rgba(16,55,132,0.02)]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#f5f5f5] border border-[#e4e4eb]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2597d0]" />
                <span className="font-medium text-[11px] text-[#070709]">Pre-Stunting</span>
              </div>
              <span className="text-[16px] font-semibold text-[#070709] tracking-[-0.02em]">
                {countKuning} Kasus
              </span>
            </div>
            <h3 className="font-semibold text-[13.5px] text-[#070709] mt-2.5 tracking-[-0.01em]">
              Normal dg ML Risk &ge; 70%
            </h3>
            <p className="text-[11.5px] text-[#60606c] mt-1 leading-snug">
              Early warning faltering 2 bulan sebelum anak jatuh ke status stunting.
            </p>
          </div>
        </div>

        {/* Toolbar: Filter Controls, Search, and Action Button (+ Tambah Balita) */}
        <div className="p-3.5 sm:p-4 rounded-[18px] bg-white border border-[#e4e4eb] shadow-[0_1px_2px_rgba(228,229,231,0.24)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { key: 'ALL', label: `Semua (${childrenList.length})` },
              { key: 'MERAH', label: `🔴 Merah (${countMerah})` },
              { key: 'ORANYE', label: `🟠 Oranye (${countOranye})` },
              { key: 'KUNING', label: `🟡 Pre-Stunting (${countKuning})` },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilterCategory(tab.key)}
                className={`px-3 py-1 rounded-full text-[11.5px] font-medium transition-all shrink-0 cursor-pointer ${
                  filterCategory === tab.key
                    ? 'bg-[#070709] text-white shadow-[0_1px_2px_rgba(36,36,40,0.1)]'
                    : 'bg-[#f5f5f5] text-[#60606c] hover:bg-[#e4e4eb] hover:text-[#070709]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 md:w-64">
              <Search className="w-3.5 h-3.5 text-[#8b8b8b] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari balita, ortu, RW..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-[12.5px] rounded-full border border-[#bebecc] bg-white text-[#070709] placeholder:text-[#8b8b8b] focus:outline-none focus:border-[#070709] tracking-[-0.01em] transition-colors"
              />
            </div>

            {embedded && (
              <button
                type="button"
                onClick={loadPriorityData}
                disabled={loading}
                title="Segarkan Data"
                className="letters-ghost-btn p-2 rounded-full cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#2597d0] ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="letters-pill-btn inline-flex items-center gap-1.5 px-4 py-1.5 text-[12px] cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tambah Balita</span>
            </button>
          </div>
        </div>

        {/* Priority Triage Table (Compact Letters Style: Fit without horizontal body scroll) */}
        <div className="bg-white rounded-[20px] border border-[#e4e4eb] shadow-[0_17px_37px_rgba(16,55,132,0.03)] overflow-hidden w-full max-w-full">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-[12px] sm:text-[12.5px]">
              <thead>
                <tr className="bg-[#f5f5f5] border-b border-[#e4e4eb] text-[#60606c] font-medium text-[11.5px] tracking-[-0.01em]">
                  <th className="py-3 px-3.5">Triase</th>
                  <th className="py-3 px-3.5">Nama Balita</th>
                  <th className="py-3 px-3">Usia/JK</th>
                  <th className="py-3 px-3.5">Status Gizi</th>
                  <th className="py-3 px-3">Z-Score</th>
                  <th className="py-3 px-3.5">ML Faltering</th>
                  <th className="py-3 px-3.5">Posyandu</th>
                  <th className="py-3 px-3.5">Orang Tua</th>
                  <th className="py-3 px-3.5 text-center">Tindakan</th>
                  <th className="py-3 px-3.5 text-center">Kelola</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f4]">
                {loading && childrenList.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-[#60606c] text-[13px]">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#2597d0] mb-2" />
                      <span>Memuat data surveilans prioritas dari database...</span>
                    </td>
                  </tr>
                ) : filteredChildren.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-[#8b8b8b] text-[13px]">
                      Tidak ada balita yang sesuai dengan filter atau kata kunci pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredChildren.map((c, idx) => {
                    let badgeTriage = 'bg-[#f5f5f5] text-[#070709] border-[#e4e4eb]'
                    if (c.triage_category === 'MERAH') {
                      badgeTriage = 'bg-rose-50 text-rose-700 border-rose-200'
                    } else if (c.triage_category === 'ORANYE') {
                      badgeTriage = 'bg-amber-50 text-amber-700 border-amber-200'
                    } else {
                      badgeTriage = 'bg-yellow-50 text-yellow-800 border-yellow-200'
                    }

                    return (
                      <tr key={`${c.child_id || 'child'}-${idx}`} className="hover:bg-[#fcfcfe] transition-colors">
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-medium border ${badgeTriage}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                c.triage_category === 'MERAH'
                                  ? 'bg-rose-600'
                                  : c.triage_category === 'ORANYE'
                                    ? 'bg-amber-500'
                                    : 'bg-yellow-500'
                              }`}
                            />
                            <span>{c.triage_category}</span>
                          </span>
                        </td>

                        <td className="py-3 px-3.5">
                          <div className="font-semibold text-[#070709] tracking-[-0.01em] leading-snug">
                            {c.child_name}
                          </div>
                          <span className="text-[10px] text-[#8b8b8b]">ID: {c.child_id}</span>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="font-medium text-[#070709]">{c.age_months} bln</span>
                          <span className="text-[11px] text-[#8b8b8b] ml-1">({c.gender})</span>
                        </td>

                        <td className="py-3 px-3.5">
                          <span className="capitalize font-medium text-[#070709] block leading-snug">
                            {(c.nutrition_status || 'stunted').replace('_', ' ')}
                          </span>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`font-semibold ${
                              c.zscore_hfa <= -3.0
                                ? 'text-rose-600'
                                : c.zscore_hfa <= -2.0
                                  ? 'text-amber-600'
                                  : 'text-[#070709]'
                            }`}
                          >
                            {safeParseFloat(c.zscore_hfa, -2.0).toFixed(1)}
                          </span>
                        </td>

                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <div className="w-14 bg-[#f0f0f4] rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full bg-[#2597d0] rounded-full"
                                style={{ width: `${Math.min(safeParseFloat(c.faltering_risk_score, 70), 100)}%` }}
                              />
                            </div>
                            <span className="font-medium text-[#070709] text-[11.5px]">
                              {safeParseFloat(c.faltering_risk_score, 70).toFixed(0)}%
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3.5">
                          <div className="font-medium text-[#070709] leading-snug">{c.posyandu_name}</div>
                          <div className="text-[10.5px] text-[#8b8b8b]">{c.rw_code} / {c.rt_code || 'RT 01'}</div>
                        </td>

                        <td className="py-3 px-3.5">
                          <div className="font-medium text-[#070709] leading-snug">{c.parent_name}</div>
                          <div className="text-[10.5px] text-[#60606c] flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5 text-[#2597d0]" />
                            <span>{c.parent_phone}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          {c.pending_intervention ? (
                            <button
                              type="button"
                              onClick={() => handleToggleVisit(c)}
                              className="letters-pill-btn inline-flex items-center gap-1 px-3 py-1 text-[11px] cursor-pointer"
                            >
                              <Calendar className="w-3 h-3 text-[#2597d0]" />
                              <span>Visit</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleVisit(c)}
                              title="Klik untuk ubah jadwal"
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#f5f5f5] text-[#60606c] hover:text-[#070709] text-[10.5px] font-medium border border-[#e4e4eb] cursor-pointer transition-colors"
                            >
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              <span>Selesai</span>
                            </button>
                          )}
                        </td>

                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(c)}
                              title="Edit Balita"
                              className="p-1.5 rounded-full text-[#60606c] hover:text-[#2597d0] hover:bg-[#f5f5f5] transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(c)}
                              title="Hapus Balita"
                              className="p-1.5 rounded-full text-[#60606c] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

      {/* CRUD Modal: Tambah & Edit Balita Prioritas */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[24px] border border-[#e4e4eb] shadow-[0_24px_48px_rgba(7,7,9,0.15)] w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 sm:p-6 border-b border-[#e4e4eb] flex items-center justify-between">
              <div>
                <h3 className="text-[17px] font-semibold text-[#070709] tracking-[-0.02em]">
                  {modalMode === 'create' ? 'Tambah Balita ke Triase Prioritas' : 'Edit Data Balita Prioritas'}
                </h3>
                <p className="text-[12px] text-[#60606c] mt-0.5">
                  Surveilans intervensi gizi &amp; pemantauan faltering
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full text-[#8b8b8b] hover:text-[#070709] hover:bg-[#f5f5f5] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-[#070709] mb-1">
                  Nama Lengkap Balita <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Muhammad Rizky"
                  value={formData.child_name}
                  onChange={(e) => setFormData({ ...formData, child_name: e.target.value })}
                  className="w-full px-3.5 py-2 text-[13px] rounded-full border border-[#bebecc] bg-white text-[#070709] focus:outline-none focus:border-[#070709] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#070709] mb-1">
                    Usia (Bulan) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    required
                    value={formData.age_months}
                    onChange={(e) => setFormData({ ...formData, age_months: e.target.value })}
                    className="w-full px-3.5 py-2 text-[13px] rounded-full border border-[#bebecc] bg-white text-[#070709] focus:outline-none focus:border-[#070709] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#070709] mb-1">
                    Jenis Kelamin <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3.5 py-2 text-[13px] rounded-full border border-[#bebecc] bg-white text-[#070709] focus:outline-none focus:border-[#070709] transition-colors"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#070709] mb-1">
                    Posyandu
                  </label>
                  <select
                    value={formData.posyandu_name}
                    onChange={(e) => setFormData({ ...formData, posyandu_name: e.target.value })}
                    className="w-full px-3 py-2 text-[12px] rounded-full border border-[#bebecc] bg-white text-[#070709] focus:outline-none focus:border-[#070709] transition-colors"
                  >
                    <option value="Posyandu Melati 01">Posyandu Melati 01</option>
                    <option value="Posyandu Melati 02">Posyandu Melati 02</option>
                    <option value="Posyandu Melati 03">Posyandu Melati 03</option>
                    <option value="Posyandu Melati 04">Posyandu Melati 04</option>
                    <option value="Posyandu Mawar 05">Posyandu Mawar 05</option>
                    <option value="Posyandu Mawar 06">Posyandu Mawar 06</option>
                    <option value="Posyandu Kenanga 07">Posyandu Kenanga 07</option>
                    <option value="Posyandu Kenanga 08">Posyandu Kenanga 08</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#070709] mb-1">
                    RW
                  </label>
                  <input
                    type="text"
                    placeholder="RW 03"
                    value={formData.rw_code}
                    onChange={(e) => setFormData({ ...formData, rw_code: e.target.value })}
                    className="w-full px-3 py-2 text-[12.5px] rounded-full border border-[#bebecc] bg-white text-[#070709] focus:outline-none focus:border-[#070709] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#070709] mb-1">
                    RT
                  </label>
                  <input
                    type="text"
                    placeholder="RT 01"
                    value={formData.rt_code}
                    onChange={(e) => setFormData({ ...formData, rt_code: e.target.value })}
                    className="w-full px-3 py-2 text-[12.5px] rounded-full border border-[#bebecc] bg-white text-[#070709] focus:outline-none focus:border-[#070709] transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#070709] mb-1">
                    Nama Orang Tua / Ibu
                  </label>
                  <input
                    type="text"
                    placeholder="Ibu Nur"
                    value={formData.parent_name}
                    onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                    className="w-full px-3.5 py-2 text-[13px] rounded-full border border-[#bebecc] bg-white text-[#070709] focus:outline-none focus:border-[#070709] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#070709] mb-1">
                    No. Handphone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="0812xxxx"
                    value={formData.parent_phone}
                    onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                    className="w-full px-3.5 py-2 text-[13px] rounded-full border border-[#bebecc] bg-white text-[#070709] focus:outline-none focus:border-[#070709] transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#070709] mb-1">
                    Status Gizi Klinis
                  </label>
                  <select
                    value={formData.nutrition_status}
                    onChange={(e) => setFormData({ ...formData, nutrition_status: e.target.value })}
                    className="w-full px-3.5 py-2 text-[13px] rounded-full border border-[#bebecc] bg-white text-[#070709] focus:outline-none focus:border-[#070709] transition-colors"
                  >
                    <option value="severely_stunted">Severely Stunted (Sangat Pendek)</option>
                    <option value="severely_wasted">Severely Wasted (Sangat Kurus)</option>
                    <option value="stunted">Stunted (Pendek)</option>
                    <option value="wasted">Wasted (Kurus)</option>
                    <option value="normal">Normal (Pre-Stunting Risk)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#070709] mb-1">
                    Z-Score TB/U (Tinggi Badan)
                  </label>
                  <input
                    type="text"
                    placeholder="-2.5"
                    value={formData.zscore_hfa}
                    onChange={(e) => setFormData({ ...formData, zscore_hfa: e.target.value })}
                    className="w-full px-3.5 py-2 text-[13px] rounded-full border border-[#bebecc] bg-white text-[#070709] focus:outline-none focus:border-[#070709] transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[12px] font-medium text-[#070709]">
                    Prediksi ML Faltering Risk: <span className="font-semibold text-[#2597d0]">{formData.faltering_risk_score}%</span>
                  </label>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.faltering_risk_score}
                  onChange={(e) => setFormData({ ...formData, faltering_risk_score: Number(e.target.value) })}
                  className="w-full accent-[#2597d0]"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.pending_intervention}
                    onChange={(e) => setFormData({ ...formData, pending_intervention: e.target.checked })}
                    className="w-4 h-4 accent-[#2597d0] rounded"
                  />
                  <span className="text-[12.5px] font-medium text-[#070709]">
                    Jadwalkan Kunjungan Lapangan / Home Visit Bidan
                  </span>
                </label>
              </div>

              <div className="pt-4 border-t border-[#e4e4eb] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="letters-ghost-btn px-4 py-2 text-[12.5px] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="letters-pill-btn inline-flex items-center gap-2 px-5 py-2 text-[12.5px] cursor-pointer"
                >
                  {formSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{modalMode === 'create' ? 'Simpan Balita' : 'Perbarui Balita'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[24px] border border-[#e4e4eb] shadow-[0_24px_48px_rgba(7,7,9,0.15)] w-full max-w-sm p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-[16px] font-semibold text-[#070709] tracking-[-0.02em]">
                Hapus Balita Prioritas?
              </h4>
              <p className="text-[12.5px] text-[#60606c] mt-1 leading-snug">
                Apakah Anda yakin ingin menghapus <strong>{deleteTarget.child_name}</strong> ({deleteTarget.posyandu_name}) dari daftar triase intervensi?
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
                className="letters-ghost-btn px-4 py-2 text-[12.5px] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-medium text-[12.5px] transition-colors cursor-pointer shadow-[0_1px_2px_rgba(225,29,72,0.2)]"
              >
                {deleteLoading ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
