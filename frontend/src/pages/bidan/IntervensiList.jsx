import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Layers,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Stethoscope,
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
  child_id: '',
  child_name: '',
  visit_date: new Date().toISOString().split('T')[0],
  visit_status: 'SCHEDULED',
  soap_subjective: '',
  soap_objective: '',
  soap_assessment: '',
  soap_plan: '',
  pmt_given: false,
  pmt_type: '',
  supplement_given: '',
  clinical_notes: '',
  follow_up_date: '',
}

const STATUS_OPTIONS = [
  { value: 'SCHEDULED', label: 'Dijadwalkan' },
  { value: 'COMPLETED', label: 'Selesai' },
  { value: 'FOLLOW_UP', label: 'Tindak Lanjut' },
  { value: 'REFERRED', label: 'Dirujuk' },
]

function getStatusBadge(status) {
  switch (status) {
    case 'SCHEDULED':
      return {
        cls: 'bg-amber-50 text-amber-700 border-amber-200',
        label: 'Dijadwalkan',
      }
    case 'COMPLETED':
      return {
        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        label: 'Selesai',
      }
    case 'FOLLOW_UP':
      return {
        cls: 'bg-blue-50 text-blue-700 border-blue-200',
        label: 'Tindak Lanjut',
      }
    case 'REFERRED':
      return {
        cls: 'bg-rose-50 text-rose-700 border-rose-200',
        label: 'Dirujuk',
      }
    default:
      return {
        cls: 'bg-slate-100 text-slate-600 border-slate-200',
        label: status || '-',
      }
  }
}

export default function IntervensiList({ user, embedded = false }) {
  const [interventionList, setInterventionList] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [actionNotice, setActionNotice] = useState('')

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [selectedId, setSelectedId] = useState(null)
  const [formData, setFormData] = useState(INITIAL_FORM_STATE)
  const [formSubmitting, setFormSubmitting] = useState(false)

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  async function loadData() {
    setLoading(true)
    try {
      const data = await fetchRoleDashboardData('/bidan/intervensi')
      setInterventionList(Array.isArray(data) ? data : [])
    } catch {
      setInterventionList([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

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

  const countByStatus = (status) =>
    interventionList.filter((i) => i.visit_status === status).length

  const filtered = interventionList.filter((i) => {
    const matchStatus = filterStatus === 'ALL' || i.visit_status === filterStatus
    const kw = searchKeyword.toLowerCase()
    const matchSearch =
      !kw ||
      (i.child_name || '').toLowerCase().includes(kw) ||
      (i.clinical_notes || '').toLowerCase().includes(kw) ||
      (i.visit_date || '').includes(kw)
    return matchStatus && matchSearch
  })

  function handleOpenCreateModal() {
    setModalMode('create')
    setSelectedId(null)
    setFormData(INITIAL_FORM_STATE)
    setIsModalOpen(true)
  }

  function handleOpenEditModal(item) {
    setModalMode('edit')
    setSelectedId(item.id)
    setFormData({
      child_id: item.child_id || '',
      child_name: item.child_name || '',
      visit_date: item.visit_date || new Date().toISOString().split('T')[0],
      visit_status: item.visit_status || 'SCHEDULED',
      soap_subjective: item.soap_subjective || '',
      soap_objective: item.soap_objective || '',
      soap_assessment: item.soap_assessment || '',
      soap_plan: item.soap_plan || '',
      pmt_given: Boolean(item.pmt_given),
      pmt_type: item.pmt_type || '',
      supplement_given: item.supplement_given || '',
      clinical_notes: item.clinical_notes || '',
      follow_up_date: item.follow_up_date || '',
    })
    setIsModalOpen(true)
  }

  async function handleFormSubmit(e) {
    e.preventDefault()
    setFormSubmitting(true)

    const payload = {
      child_id: formData.child_id.trim(),
      visit_date: formData.visit_date,
      visit_status: formData.visit_status,
      soap_subjective: formData.soap_subjective,
      soap_objective: formData.soap_objective,
      soap_assessment: formData.soap_assessment,
      soap_plan: formData.soap_plan,
      pmt_given: Boolean(formData.pmt_given),
      pmt_type: formData.pmt_type,
      supplement_given: formData.supplement_given,
      clinical_notes: formData.clinical_notes,
      follow_up_date: formData.follow_up_date || null,
    }

    try {
      if (modalMode === 'create') {
        const res = await postRoleData('/bidan/intervensi', payload)
        const saved = res && res.id ? res : { ...payload, id: `tmp-${Date.now()}` }
        setInterventionList((prev) => [saved, ...prev])
        setActionNotice(`Kunjungan untuk balita berhasil ditambahkan.`)
      } else {
        const res = await putRoleData(`/bidan/intervensi/${selectedId}`, payload)
        const updated = res && res.id ? res : { ...payload, id: selectedId }
        setInterventionList((prev) =>
          prev.map((i) => (i.id === selectedId ? { ...i, ...updated } : i))
        )
        setActionNotice(`Data kunjungan berhasil diperbarui.`)
      }
      setIsModalOpen(false)
      setFormData(INITIAL_FORM_STATE)
      setTimeout(() => setActionNotice(''), 4500)
    } catch (err) {
      setActionNotice(`Gagal menyimpan: ${err?.message || 'Terjadi kesalahan'}`)
    } finally {
      setFormSubmitting(false)
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteRoleData(`/bidan/intervensi/${deleteTarget.id}`)
      setInterventionList((prev) => prev.filter((i) => i.id !== deleteTarget.id))
      setActionNotice(`Data kunjungan berhasil dihapus.`)
      setDeleteTarget(null)
      setTimeout(() => setActionNotice(''), 4500)
    } catch (err) {
      setActionNotice(`Gagal menghapus: ${err?.message || 'Terjadi kesalahan'}`)
    } finally {
      setDeleteLoading(false)
    }
  }

  const filterTabs = [
    {
      key: 'ALL',
      label: `Semua (${interventionList.length})`,
      icon: Layers,
      iconColor: 'text-[#2597d0]',
    },
    {
      key: 'SCHEDULED',
      label: `Dijadwalkan (${countByStatus('SCHEDULED')})`,
      icon: Calendar,
      iconColor: 'text-amber-500',
    },
    {
      key: 'COMPLETED',
      label: `Selesai (${countByStatus('COMPLETED')})`,
      icon: CheckCircle2,
      iconColor: 'text-emerald-500',
    },
    {
      key: 'FOLLOW_UP',
      label: `Tindak Lanjut (${countByStatus('FOLLOW_UP')})`,
      icon: ClipboardList,
      iconColor: 'text-blue-500',
    },
    {
      key: 'REFERRED',
      label: `Dirujuk (${countByStatus('REFERRED')})`,
      icon: Stethoscope,
      iconColor: 'text-rose-500',
    },
  ]

  const inputCls =
    'w-full px-3.5 py-2 text-[13px] rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#2597d0]'
  const labelCls = 'block text-[12px] font-semibold text-slate-700 mb-1'
  const textareaCls =
    'w-full px-3.5 py-2 text-[13px] rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#2597d0] resize-y min-h-[72px]'

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
                Kunjungan Rumah (Home Visit SOAP)
              </h1>
              <p className="text-[12px] text-slate-400">
                Wilayah:{' '}
                <strong className="text-slate-700">{user?.village_name || 'Desa Sukamaju'}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2597d0] hover:bg-[#1e82b8] text-white text-[12.5px] font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Tambah Kunjungan</span>
          </button>
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

      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {/* Card Header */}
        <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">
              Daftar Kunjungan Rumah (Home Visit SOAP)
            </h2>
            <p className="text-[12px] text-slate-400 mt-0.5">
              Pencatatan intervensi gizi bidan berbasis metode SOAP
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 sm:w-60">
              <label htmlFor="intervensi-search-input" className="sr-only">
                Cari balita atau catatan
              </label>
              <Search
                className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                id="intervensi-search-input"
                type="text"
                placeholder="Cari balita atau catatan..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-[12.5px] rounded-xl border border-slate-200 bg-slate-50/70 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#2597d0] transition-colors"
              />
            </div>

            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              title="Segarkan Data"
              aria-label="Segarkan Data"
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
              <span>Tambah Kunjungan</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-5 py-3 bg-slate-50/60 border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
          {filterTabs.map((tab) => {
            const TabIcon = tab.icon
            const isSelected = filterStatus === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilterStatus(tab.key)}
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

        {/* Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11.5px]">
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-3">Nama Balita</th>
                <th className="py-3.5 px-3">Tanggal Kunjungan</th>
                <th className="py-3.5 px-3.5">Catatan Klinis</th>
                <th className="py-3.5 px-3 text-center">PMT</th>
                <th className="py-3.5 px-3.5">Tindak Lanjut</th>
                <th className="py-3.5 px-5 text-right">Kelola</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {loading && interventionList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-[13px]">
                    <RefreshCw
                      className="w-5 h-5 animate-spin mx-auto text-[#2597d0] mb-2"
                      aria-hidden="true"
                    />
                    <span>Memuat data kunjungan rumah dari server...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-[13px]">
                    {interventionList.length === 0 ? (
                      <div className="max-w-md mx-auto py-2 space-y-2">
                        <p className="font-bold text-slate-700 text-[14px]">
                          Belum Ada Data Kunjungan Rumah
                        </p>
                        <p className="text-[12px] text-slate-400">
                          Tambahkan data kunjungan rumah (home visit) untuk memulai pencatatan
                          intervensi gizi berbasis SOAP.
                        </p>
                        <button
                          type="button"
                          onClick={handleOpenCreateModal}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2597d0] text-white text-[12px] font-semibold hover:bg-[#1e82b8] transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Tambah Kunjungan Sekarang</span>
                        </button>
                      </div>
                    ) : (
                      'Tidak ada kunjungan yang sesuai dengan filter atau kata kunci.'
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => {
                  const badge = getStatusBadge(item.visit_status)
                  return (
                    <tr
                      key={item.id || idx}
                      className="group hover:bg-[#eef7ff] transition-colors"
                    >
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-800 group-hover:text-[#1a78a8] transition-colors">
                          {item.child_name || <span className="text-slate-400 italic">—</span>}
                        </div>
                        {item.child_id && (
                          <div className="text-[11px] text-slate-400 font-mono truncate max-w-[120px]">
                            {item.child_id}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-semibold text-slate-700">
                          {item.visit_date
                            ? new Date(item.visit_date).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '—'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3.5 max-w-[180px]">
                        <span className="text-slate-600 line-clamp-2 text-[12px]">
                          {item.clinical_notes || item.soap_assessment || (
                            <span className="text-slate-300 italic">Tidak ada catatan</span>
                          )}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        {item.pmt_given ? (
                          <span className="inline-block px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                            {item.pmt_type || 'Ya'}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-[12px]">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        {item.follow_up_date ? (
                          <div className="text-[12px] font-semibold text-slate-700">
                            {new Date(item.follow_up_date).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        ) : (
                          <span className="text-slate-300 text-[12px]">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            title={`Edit kunjungan ${item.child_name || ''}`}
                            aria-label={`Edit kunjungan ${item.child_name || ''}`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#2597d0] hover:bg-white transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            title={`Hapus kunjungan ${item.child_name || ''}`}
                            aria-label={`Hapus kunjungan ${item.child_name || ''}`}
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
          aria-labelledby="modal-intervensi-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 id="modal-intervensi-title" className="text-[17px] font-bold text-slate-800">
                  {modalMode === 'create' ? 'Tambah Kunjungan Rumah' : 'Perbarui Data Kunjungan'}
                </h3>
                <p className="text-[12px] text-slate-400 mt-0.5">
                  Formulir pencatatan Home Visit SOAP Bidan
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="field-child-id" className={labelCls}>
                    ID Balita <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="field-child-id"
                    type="text"
                    required
                    placeholder="UUID atau ID balita"
                    value={formData.child_id}
                    onChange={(e) => setFormData({ ...formData, child_id: e.target.value })}
                    className={inputCls}
                    readOnly={modalMode === 'edit'}
                  />
                </div>

                {modalMode === 'edit' && formData.child_name && (
                  <div>
                    <label className={labelCls}>Nama Balita</label>
                    <div className="w-full px-3.5 py-2 text-[13px] rounded-xl border border-slate-100 bg-slate-50 text-slate-700 font-semibold">
                      {formData.child_name}
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="field-visit-date" className={labelCls}>
                    Tanggal Kunjungan <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="field-visit-date"
                    type="date"
                    required
                    value={formData.visit_date}
                    onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label htmlFor="field-visit-status" className={labelCls}>
                    Status Kunjungan <span className="text-rose-600">*</span>
                  </label>
                  <select
                    id="field-visit-status"
                    value={formData.visit_status}
                    onChange={(e) => setFormData({ ...formData, visit_status: e.target.value })}
                    className={inputCls}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SOAP Section */}
              <div className="border-t border-slate-100 pt-4">
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Catatan SOAP
                </h4>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="field-soap-s" className={labelCls}>
                      S — Subjektif (Keluhan Pasien)
                    </label>
                    <textarea
                      id="field-soap-s"
                      placeholder="Keluhan yang disampaikan oleh pasien/keluarga..."
                      value={formData.soap_subjective}
                      onChange={(e) =>
                        setFormData({ ...formData, soap_subjective: e.target.value })
                      }
                      className={textareaCls}
                    />
                  </div>

                  <div>
                    <label htmlFor="field-soap-o" className={labelCls}>
                      O — Objektif (Hasil Pemeriksaan)
                    </label>
                    <textarea
                      id="field-soap-o"
                      placeholder="Hasil pengukuran dan pemeriksaan fisik..."
                      value={formData.soap_objective}
                      onChange={(e) =>
                        setFormData({ ...formData, soap_objective: e.target.value })
                      }
                      className={textareaCls}
                    />
                  </div>

                  <div>
                    <label htmlFor="field-soap-a" className={labelCls}>
                      A — Asesmen (Diagnosa)
                    </label>
                    <textarea
                      id="field-soap-a"
                      placeholder="Diagnosa dan penilaian klinis..."
                      value={formData.soap_assessment}
                      onChange={(e) =>
                        setFormData({ ...formData, soap_assessment: e.target.value })
                      }
                      className={textareaCls}
                    />
                  </div>

                  <div>
                    <label htmlFor="field-soap-p" className={labelCls}>
                      P — Plan (Rencana Tindak Lanjut)
                    </label>
                    <textarea
                      id="field-soap-p"
                      placeholder="Rencana tindakan, edukasi, dan rujukan..."
                      value={formData.soap_plan}
                      onChange={(e) => setFormData({ ...formData, soap_plan: e.target.value })}
                      className={textareaCls}
                    />
                  </div>
                </div>
              </div>

              {/* PMT & Supplement */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  PMT & Suplemen
                </h4>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.pmt_given}
                    onChange={(e) => setFormData({ ...formData, pmt_given: e.target.checked })}
                    className="w-4 h-4 accent-[#2597d0] rounded"
                  />
                  <span className="text-[12.5px] font-semibold text-slate-700">
                    PMT Diberikan
                  </span>
                </label>

                {formData.pmt_given && (
                  <div>
                    <label htmlFor="field-pmt-type" className={labelCls}>
                      Jenis PMT
                    </label>
                    <input
                      id="field-pmt-type"
                      type="text"
                      placeholder="Contoh: Biskuit PMT, Susu Formula, dll."
                      value={formData.pmt_type}
                      onChange={(e) => setFormData({ ...formData, pmt_type: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="field-supplement" className={labelCls}>
                    Suplemen Diberikan
                  </label>
                  <input
                    id="field-supplement"
                    type="text"
                    placeholder="Contoh: Vitamin A, Zinc, Zat Besi, dll."
                    value={formData.supplement_given}
                    onChange={(e) =>
                      setFormData({ ...formData, supplement_given: e.target.value })
                    }
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Clinical Notes & Follow-up */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div>
                  <label htmlFor="field-clinical-notes" className={labelCls}>
                    Catatan Klinis Tambahan
                  </label>
                  <textarea
                    id="field-clinical-notes"
                    placeholder="Catatan klinis tambahan bidan..."
                    value={formData.clinical_notes}
                    onChange={(e) => setFormData({ ...formData, clinical_notes: e.target.value })}
                    className={textareaCls}
                  />
                </div>

                <div>
                  <label htmlFor="field-follow-up-date" className={labelCls}>
                    Tanggal Tindak Lanjut
                  </label>
                  <input
                    id="field-follow-up-date"
                    type="date"
                    value={formData.follow_up_date}
                    onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                    className={inputCls}
                  />
                </div>
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
                  <span>{modalMode === 'create' ? 'Simpan Kunjungan' : 'Perbarui Data'}</span>
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
          aria-labelledby="modal-delete-intervensi-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" aria-hidden="true" />
            </div>

            <div>
              <h4
                id="modal-delete-intervensi-title"
                className="text-[16px] font-bold text-slate-800"
              >
                Hapus Data Kunjungan?
              </h4>
              <p className="text-[12.5px] text-slate-500 mt-1 leading-relaxed">
                Konfirmasi penghapusan kunjungan{' '}
                <strong>{deleteTarget.child_name || deleteTarget.id}</strong> tanggal{' '}
                {deleteTarget.visit_date
                  ? new Date(deleteTarget.visit_date).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })
                  : ''}
                .
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
