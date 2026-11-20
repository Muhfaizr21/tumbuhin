import { useEffect, useState } from 'react'
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Layers,
  MapPin,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import {
  deleteRoleData,
  fetchRoleDashboardData,
  postRoleData,
  putRoleData,
} from '../../lib/authApi'

const INITIAL_FORM_STATE = {
  child_name: '',
  age_months: '14',
  gender: 'L',
  posyandu_name: 'Posyandu Melati 03',
  rw_code: 'RW 03',
  rt_code: 'RT 01',
  parent_name: '',
  parent_phone: '081299112233',
  nutrition_status: 'stunted',
  zscore_hfa: '-2.4',
  zscore_wfa: '-1.6',
  zscore_wfh: '-1.1',
  faltering_risk_score: 78,
  pending_intervention: true,
}

const safeParseFloat = (val, defaultVal = 0) => {
  if (val === null || val === undefined || val === '') return defaultVal
  const parsed = parseFloat(String(val).replace(',', '.'))
  return Number.isNaN(parsed) ? defaultVal : parsed
}

const safeParseInt = (val, defaultVal = 0) => {
  if (val === null || val === undefined || val === '') return defaultVal
  const parsed = parseInt(val, 10)
  return Number.isNaN(parsed) ? defaultVal : parsed
}

export default function PrioritasList({
  user,
  embedded = false,
  externalCreateTrigger = 0,
  onDataChange,
}) {
  const [childrenList, setChildrenList] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorState, setErrorState] = useState('')
  const [filterCategory, setFilterCategory] = useState('ALL')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [actionNotice, setActionNotice] = useState('')

  // CRUD Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [selectedChildId, setSelectedChildId] = useState(null)
  const [formData, setFormData] = useState(INITIAL_FORM_STATE)
  const [formSubmitting, setFormSubmitting] = useState(false)

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  async function loadPriorityData() {
    setLoading(true)
    setErrorState('')
    try {
      const data = await fetchRoleDashboardData('/bidan/priority-list')
      if (Array.isArray(data)) {
        const uniqueMap = new Map()
        data.forEach((item) => {
          if (item && item.child_id && !uniqueMap.has(item.child_id)) {
            uniqueMap.set(item.child_id, item)
          }
        })
        const cleanList = Array.from(uniqueMap.values())
        setChildrenList(cleanList)
        if (onDataChange) onDataChange(cleanList)
      } else {
        setChildrenList([])
      }
    } catch (err) {
      setChildrenList([])
      setErrorState(err?.message || 'Tidak dapat memuat data prioritas dari server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPriorityData()
  }, [])

  useEffect(() => {
    if (externalCreateTrigger > 0) {
      handleOpenCreateModal()
    }
  }, [externalCreateTrigger])

  // Keyboard Escape handler for modals (R-32)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isModalOpen) setIsModalOpen(false)
        if (deleteTarget) setDeleteTarget(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen, deleteTarget])

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

  const handleOpenCreateModal = () => {
    setModalMode('create')
    setSelectedChildId(null)
    setFormData(INITIAL_FORM_STATE)
    setIsModalOpen(true)
  }

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
        } catch {
          // Fallback to local state if API unavailable
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

        const nextList = [saved, ...childrenList]
        setChildrenList(nextList)
        if (onDataChange) onDataChange(nextList)
        setActionNotice(`Balita ${saved.child_name} berhasil ditambahkan ke daftar triase prioritas.`)
      } else {
        let updated = null
        try {
          const res = await putRoleData(`/bidan/priority-list/${selectedChildId}`, payload)
          if (res && res.child_name) {
            updated = res
          }
        } catch {
          // Fallback to local update
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

        const nextList = childrenList.map((c) =>
          c.child_id === selectedChildId ? { ...c, ...updated } : c
        )
        setChildrenList(nextList)
        if (onDataChange) onDataChange(nextList)
        setActionNotice(`Data balita ${updated.child_name} berhasil diperbarui.`)
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

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)

    try {
      try {
        await deleteRoleData(`/bidan/priority-list/${deleteTarget.child_id}`)
      } catch {
        // Fallback local removal
      }

      const nextList = childrenList.filter((c) => c.child_id !== deleteTarget.child_id)
      setChildrenList(nextList)
      if (onDataChange) onDataChange(nextList)
      setActionNotice(`Balita ${deleteTarget.child_name} dihapus dari daftar prioritas.`)
      setDeleteTarget(null)
      setTimeout(() => setActionNotice(''), 4500)
    } catch (err) {
      setActionNotice(`Gagal menghapus data: ${err.message}`)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleToggleVisit = async (child) => {
    const nextStatus = !child.pending_intervention
    try {
      await putRoleData(`/bidan/priority-list/${child.child_id}`, {
        pending_intervention: nextStatus,
      })
    } catch {
      // Local state update fallback
    }

    const nextList = childrenList.map((c) =>
      c.child_id === child.child_id ? { ...c, pending_intervention: nextStatus } : c
    )
    setChildrenList(nextList)
    if (onDataChange) onDataChange(nextList)

    if (nextStatus) {
      setActionNotice(`Kunjungan lapangan dijadwalkan untuk ${child.child_name}.`)
    } else {
      setActionNotice(`Kunjungan lapangan untuk ${child.child_name} ditandai selesai.`)
    }
    setTimeout(() => setActionNotice(''), 4500)
  }

  const filterTabs = [
    {
      key: 'ALL',
      label: `Semua (${childrenList.length})`,
      icon: Layers,
      iconColor: 'text-[#2597d0]',
    },
    {
      key: 'MERAH',
      label: `Prioritas Merah (${countMerah})`,
      icon: AlertOctagon,
      iconColor: 'text-rose-500',
    },
    {
      key: 'ORANYE',
      label: `Prioritas Oranye (${countOranye})`,
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
    },
    {
      key: 'KUNING',
      label: `Pre-Stunting (${countKuning})`,
      icon: Activity,
      iconColor: 'text-[#2597d0]',
    },
  ]

  return (
    <div
      className={`text-slate-800 flex flex-col font-runde ${
        embedded ? 'w-full space-y-5' : 'min-h-screen bg-[#f6f9fc] p-5 sm:p-8'
      }`}
    >
      {!embedded && (
        <header className="max-w-[1400px] w-full mx-auto bg-white rounded-2xl border border-slate-100 px-6 py-4 mb-5 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => {
                window.location.hash = '#/bidan/dashboard'
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 text-[13px] font-semibold hover:bg-slate-50 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-[#2597d0]" aria-hidden="true" />
              <span>Dasbor Bidan</span>
            </button>
            <div>
              <h1 className="text-[19px] font-bold text-slate-800">
                Daftar Triase Prioritas Intervensi
              </h1>
              <p className="text-[12px] text-slate-400">
                Wilayah: <strong className="text-slate-700">{user?.village_name || 'Desa Sukamaju'}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                window.location.hash = '#/bidan/peta-gis'
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 text-[12.5px] font-semibold hover:bg-slate-50 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-[#2597d0]" aria-hidden="true" />
              <span>Peta GIS</span>
            </button>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2597d0] hover:bg-[#1e82b8] text-white text-[12.5px] font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Tambah Balita</span>
            </button>
          </div>
        </header>
      )}

      {actionNotice && (
        <div
          role="status"
          className="p-3.5 px-4 rounded-2xl bg-white border border-[#bde3fa] text-slate-800 text-[12.5px] font-medium flex items-center justify-between shadow-xs"
        >
          <span className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#2597d0] shrink-0" aria-hidden="true" />
            <span>{actionNotice}</span>
          </span>
          <button
            type="button"
            onClick={() => setActionNotice('')}
            className="text-slate-400 hover:text-slate-700 text-[12px] font-semibold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {errorState && (
        <div
          role="alert"
          className="p-3.5 px-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-[12.5px] flex items-center justify-between"
        >
          <span>{errorState}</span>
          <button
            type="button"
            onClick={loadPriorityData}
            className="font-semibold underline cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Main White Card Container styled like "My Files" in Reference Image */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {/* Card Header Bar */}
        <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">
                Data Triase &amp; Intervensi Balita
              </h2>
              <p className="text-[12px] text-slate-400 mt-0.5">
                Urutan prioritas klinis berdasarkan standar Z-Score WHO dan prediksi ML Faltering
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 sm:w-60">
              <label htmlFor="prioritas-search-input" className="sr-only">
                Cari balita, orang tua, atau RW
              </label>
              <Search
                className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                id="prioritas-search-input"
                type="text"
                placeholder="Cari balita, ortu, RW..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-[12.5px] rounded-xl border border-slate-200 bg-slate-50/70 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#2597d0] transition-colors"
              />
            </div>

            <button
              type="button"
              onClick={loadPriorityData}
              disabled={loading}
              title="Segarkan Data Triase"
              aria-label="Segarkan Data Triase"
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2597d0]"
            >
              <RefreshCw
                className={`w-4 h-4 text-[#2597d0] ${loading ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
            </button>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2597d0] hover:bg-[#1e82b8] text-white font-semibold text-[12.5px] shadow-2xs transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2597d0]"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Tambah Balita</span>
            </button>
          </div>
        </div>

        {/* Vector Icon Filter Pills (Zero Emojis) */}
        <div className="px-5 py-3 bg-slate-50/60 border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
          {filterTabs.map((tab) => {
            const TabIcon = tab.icon
            const isSelected = filterCategory === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilterCategory(tab.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2597d0] ${
                  isSelected
                    ? 'bg-[#2597d0] text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100'
                }`}
              >
                <TabIcon
                  className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : tab.iconColor}`}
                  aria-hidden="true"
                />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Clean Data Table ("My Files" layout from reference) */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11.5px]">
                <th className="py-3.5 px-5">Nama Balita &amp; Triase</th>
                <th className="py-3.5 px-3">Usia / JK</th>
                <th className="py-3.5 px-3.5">Status Klinis</th>
                <th className="py-3.5 px-3">Z-Score TB/U</th>
                <th className="py-3.5 px-3.5">ML Faltering</th>
                <th className="py-3.5 px-3.5">Wilayah Posyandu</th>
                <th className="py-3.5 px-3.5">Orang Tua</th>
                <th className="py-3.5 px-3.5 text-center">Kunjungan</th>
                <th className="py-3.5 px-5 text-right">Kelola</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {loading && childrenList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-[13px]">
                    <RefreshCw
                      className="w-5 h-5 animate-spin mx-auto text-[#2597d0] mb-2"
                      aria-hidden="true"
                    />
                    <span>Memuat data surveilans balita dari database...</span>
                  </td>
                </tr>
              ) : filteredChildren.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-[13px]">
                    {childrenList.length === 0 ? (
                      <div className="max-w-md mx-auto py-2 space-y-2">
                        <p className="font-bold text-slate-700 text-[14px]">
                          Belum Ada Data Balita Prioritas
                        </p>
                        <p className="text-[12px] text-slate-400">
                          Basis data siap menerima pencatatan triase baru. Tambahkan data balita untuk memulai pemantauan intervensi.
                        </p>
                        <button
                          type="button"
                          onClick={handleOpenCreateModal}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2597d0] text-white text-[12px] font-semibold hover:bg-[#1e82b8] transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Tambah Balita Sekarang</span>
                        </button>
                      </div>
                    ) : (
                      'Tidak ada balita yang sesuai dengan filter atau kata kunci pencarian.'
                    )}
                  </td>
                </tr>
              ) : (
                filteredChildren.map((c, idx) => {
                  const isMerah = c.triage_category === 'MERAH'
                  const isOranye = c.triage_category === 'ORANYE'

                  let iconBoxClass = 'bg-[#edf7fe] text-[#2597d0]'
                  let RowIcon = Activity
                  let badgeClass = 'bg-sky-50 text-[#2597d0] border-sky-200'

                  if (isMerah) {
                    iconBoxClass = 'bg-rose-50 text-rose-600'
                    RowIcon = AlertOctagon
                    badgeClass = 'bg-rose-50 text-rose-700 border-rose-200'
                  } else if (isOranye) {
                    iconBoxClass = 'bg-amber-50 text-amber-600'
                    RowIcon = AlertTriangle
                    badgeClass = 'bg-amber-50 text-amber-700 border-amber-200'
                  }

                  return (
                    <tr
                      key={`${c.child_id || 'child'}-${idx}`}
                      className="group hover:bg-[#eef7ff] transition-colors"
                    >
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBoxClass}`}
                          >
                            <RowIcon className="w-4 h-4" aria-hidden="true" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 group-hover:text-[#1a78a8] transition-colors">
                              {c.child_name}
                            </div>
                            <span
                              className={`inline-block mt-0.5 px-2 py-0.2 rounded text-[10px] font-bold border ${badgeClass}`}
                            >
                              {c.triage_category || 'PRIORITAS'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap text-slate-600">
                        <span className="font-semibold text-slate-700">{c.age_months} bln</span>
                        <span className="text-[11px] text-slate-400 ml-1">({c.gender})</span>
                      </td>

                      <td className="py-3.5 px-3.5">
                        <span className="capitalize font-semibold text-slate-700">
                          {(c.nutrition_status || 'stunted').replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`font-bold ${
                            c.zscore_hfa <= -3.0
                              ? 'text-rose-600'
                              : c.zscore_hfa <= -2.0
                                ? 'text-amber-600'
                                : 'text-slate-700'
                          }`}
                        >
                          {safeParseFloat(c.zscore_hfa, -2.0).toFixed(1)} SD
                        </span>
                      </td>

                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-14 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full bg-[#2597d0] rounded-full"
                              style={{
                                width: `${Math.min(
                                  safeParseFloat(c.faltering_risk_score, 70),
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                          <span className="font-bold text-slate-700 text-[11.5px]">
                            {safeParseFloat(c.faltering_risk_score, 70).toFixed(0)}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3.5">
                        <div className="font-semibold text-slate-700">{c.posyandu_name}</div>
                        <div className="text-[11px] text-slate-400">
                          {c.rw_code} / {c.rt_code || 'RT 01'}
                        </div>
                      </td>

                      <td className="py-3.5 px-3.5">
                        <div className="font-semibold text-slate-700">{c.parent_name}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-[#2597d0]" aria-hidden="true" />
                          <span>{c.parent_phone}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                        {c.pending_intervention ? (
                          <button
                            type="button"
                            onClick={() => handleToggleVisit(c)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2597d0] hover:bg-[#1e82b8] text-white text-[11px] font-semibold cursor-pointer transition-colors"
                          >
                            <Calendar className="w-3 h-3" aria-hidden="true" />
                            <span>Jadwalkan</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleVisit(c)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold cursor-pointer hover:bg-emerald-100 transition-colors"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                            <span>Selesai</span>
                          </button>
                        )}
                      </td>

                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(c)}
                            title={`Edit data ${c.child_name}`}
                            aria-label={`Edit data ${c.child_name}`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#2597d0] hover:bg-white transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(c)}
                            title={`Hapus data ${c.child_name}`}
                            aria-label={`Hapus data ${c.child_name}`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
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

      {/* CRUD Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-prioritas-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 id="modal-prioritas-title" className="text-[17px] font-bold text-slate-800">
                  {modalMode === 'create'
                    ? 'Tambah Balita ke Triase Prioritas'
                    : 'Perbarui Data Triase Balita'}
                </h3>
                <p className="text-[12px] text-slate-400 mt-0.5">
                  Surveilans intervensi gizi &amp; pemantauan faltering desa
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Tutup dialog"
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 sm:p-6 space-y-4">
              <div>
                <label
                  htmlFor="field-child-name"
                  className="block text-[12px] font-semibold text-slate-700 mb-1"
                >
                  Nama Lengkap Balita <span className="text-rose-600">*</span>
                </label>
                <input
                  id="field-child-name"
                  type="text"
                  required
                  placeholder="Contoh: Muhammad Rizky"
                  value={formData.child_name}
                  onChange={(e) => setFormData({ ...formData, child_name: e.target.value })}
                  className="w-full px-3.5 py-2 text-[13px] rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#2597d0]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="field-age-months"
                    className="block text-[12px] font-semibold text-slate-700 mb-1"
                  >
                    Usia (Bulan) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="field-age-months"
                    type="number"
                    min="0"
                    max="60"
                    required
                    value={formData.age_months}
                    onChange={(e) => setFormData({ ...formData, age_months: e.target.value })}
                    className="w-full px-3.5 py-2 text-[13px] rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#2597d0]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="field-gender"
                    className="block text-[12px] font-semibold text-slate-700 mb-1"
                  >
                    Jenis Kelamin <span className="text-rose-600">*</span>
                  </label>
                  <select
                    id="field-gender"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3.5 py-2 text-[13px] rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#2597d0]"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="field-posyandu"
                    className="block text-[12px] font-semibold text-slate-700 mb-1"
                  >
                    Posyandu
                  </label>
                  <select
                    id="field-posyandu"
                    value={formData.posyandu_name}
                    onChange={(e) => setFormData({ ...formData, posyandu_name: e.target.value })}
                    className="w-full px-3 py-2 text-[12px] rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#2597d0]"
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
                  <label
                    htmlFor="field-rw"
                    className="block text-[12px] font-semibold text-slate-700 mb-1"
                  >
                    RW
                  </label>
                  <input
                    id="field-rw"
                    type="text"
                    placeholder="RW 03"
                    value={formData.rw_code}
                    onChange={(e) => setFormData({ ...formData, rw_code: e.target.value })}
                    className="w-full px-3 py-2 text-[12.5px] rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#2597d0]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="field-rt"
                    className="block text-[12px] font-semibold text-slate-700 mb-1"
                  >
                    RT
                  </label>
                  <input
                    id="field-rt"
                    type="text"
                    placeholder="RT 01"
                    value={formData.rt_code}
                    onChange={(e) => setFormData({ ...formData, rt_code: e.target.value })}
                    className="w-full px-3 py-2 text-[12.5px] rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#2597d0]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="field-parent-name"
                    className="block text-[12px] font-semibold text-slate-700 mb-1"
                  >
                    Nama Orang Tua
                  </label>
                  <input
                    id="field-parent-name"
                    type="text"
                    placeholder="Ibu Ratna"
                    value={formData.parent_name}
                    onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                    className="w-full px-3.5 py-2 text-[13px] rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#2597d0]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="field-parent-phone"
                    className="block text-[12px] font-semibold text-slate-700 mb-1"
                  >
                    Nomor Telepon / WA
                  </label>
                  <input
                    id="field-parent-phone"
                    type="text"
                    placeholder="0812xxxx"
                    value={formData.parent_phone}
                    onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                    className="w-full px-3.5 py-2 text-[13px] rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#2597d0]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="field-nutrition-status"
                    className="block text-[12px] font-semibold text-slate-700 mb-1"
                  >
                    Status Gizi Klinis
                  </label>
                  <select
                    id="field-nutrition-status"
                    value={formData.nutrition_status}
                    onChange={(e) => setFormData({ ...formData, nutrition_status: e.target.value })}
                    className="w-full px-3.5 py-2 text-[13px] rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#2597d0]"
                  >
                    <option value="severely_stunted">Severely Stunted (Sangat Pendek)</option>
                    <option value="severely_wasted">Severely Wasted (Sangat Kurus)</option>
                    <option value="stunted">Stunted (Pendek)</option>
                    <option value="wasted">Wasted (Kurus)</option>
                    <option value="normal">Normal (Pre-Stunting Risk)</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="field-zscore-hfa"
                    className="block text-[12px] font-semibold text-slate-700 mb-1"
                  >
                    Z-Score TB/U
                  </label>
                  <input
                    id="field-zscore-hfa"
                    type="text"
                    placeholder="-2.5"
                    value={formData.zscore_hfa}
                    onChange={(e) => setFormData({ ...formData, zscore_hfa: e.target.value })}
                    className="w-full px-3.5 py-2 text-[13px] rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#2597d0]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="field-risk-score"
                  className="block text-[12px] font-semibold text-slate-700 mb-1"
                >
                  Prediksi ML Faltering Risk:{' '}
                  <span className="font-bold text-[#2597d0]">{formData.faltering_risk_score}%</span>
                </label>
                <input
                  id="field-risk-score"
                  type="range"
                  min="0"
                  max="100"
                  value={formData.faltering_risk_score}
                  onChange={(e) =>
                    setFormData({ ...formData, faltering_risk_score: Number(e.target.value) })
                  }
                  className="w-full accent-[#2597d0] cursor-pointer"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.pending_intervention}
                    onChange={(e) =>
                      setFormData({ ...formData, pending_intervention: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#2597d0] rounded"
                  />
                  <span className="text-[12.5px] font-semibold text-slate-700">
                    Jadwalkan Kunjungan Lapangan (Home Visit Bidan)
                  </span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-[12.5px] hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#2597d0] hover:bg-[#1e82b8] text-white font-semibold text-[12.5px] cursor-pointer"
                >
                  {formSubmitting && (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  )}
                  <span>{modalMode === 'create' ? 'Simpan Data' : 'Perbarui Data'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-delete-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" aria-hidden="true" />
            </div>

            <div>
              <h4 id="modal-delete-title" className="text-[16px] font-bold text-slate-800">
                Hapus Data Balita Prioritas?
              </h4>
              <p className="text-[12.5px] text-slate-500 mt-1 leading-relaxed">
                Konfirmasi penghapusan <strong>{deleteTarget.child_name}</strong> (
                {deleteTarget.posyandu_name}) dari daftar triase intervensi.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-[12.5px] hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[12.5px] transition-colors cursor-pointer"
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
