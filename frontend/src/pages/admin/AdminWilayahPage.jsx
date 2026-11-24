import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  Edit3,
  MapPin,
  Plus,
  Power,
  Trash2,
  X,
} from 'lucide-react'
import PaginationBar from '../../components/ui/PaginationBar'
import { adminApi } from '../../lib/adminApi'

const EMPTY_FORM = {
  name: '',
  village_name: 'Desa Sukamaju',
  rw_code: '001',
  rt_code: '001',
  address: '',
  schedule_day: 'Sabtu Minggu Ke-2 (08.30 - 11.30 WIB)',
  latitude: -6.595038,
  longitude: 106.816635,
  is_active: true,
}

/**
 * Module 3.2: Master Wilayah & Posyandu (/admin/wilayah)
 * Full CRUD for Posyandu units including GIS coordinates for Bidan's spatial map.
 */
export default function AdminWilayahPage({ searchQuery = '', onDataChanged }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(4)

  const loadPosyandus = async () => {
    setLoading(true)
    try {
      const data = await adminApi.listPosyandus()
      setItems(Array.isArray(data) ? data : [])
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Gagal memuat data Posyandu' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPosyandus()
  }, [])

  const openCreateModal = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEditModal = (unit) => {
    setEditingId(unit.id)
    setForm({
      name: unit.name || '',
      village_name: unit.village_name || 'Desa Sukamaju',
      rw_code: unit.rw_code || '001',
      rt_code: unit.rt_code || '001',
      address: unit.address || '',
      schedule_day: unit.schedule_day || 'Sabtu Minggu Ke-2 (08.30 - 11.30 WIB)',
      latitude: Number(unit.latitude ?? -6.595038),
      longitude: Number(unit.longitude ?? 106.816635),
      is_active: Boolean(unit.is_active),
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setNotice(null)
    try {
      const payload = {
        ...form,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      }
      if (editingId) {
        await adminApi.updatePosyandu(editingId, payload)
        setNotice({ type: 'success', text: `Unit ${form.name} berhasil diperbarui.` })
      } else {
        await adminApi.createPosyandu(payload)
        setNotice({ type: 'success', text: `Unit ${form.name} berhasil ditambahkan ke Master Wilayah.` })
      }
      setModalOpen(false)
      await loadPosyandus()
      if (onDataChanged) onDataChanged()
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Gagal menyimpan unit Posyandu' })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (unit) => {
    try {
      await adminApi.togglePosyandu(unit.id)
      setNotice({
        type: 'success',
        text: `Status operasional ${unit.name} diubah menjadi ${unit.is_active ? 'Nonaktif' : 'Aktif'}.`,
      })
      await loadPosyandus()
      if (onDataChanged) onDataChanged()
    } catch (err) {
      setNotice({ type: 'error', text: err.message })
    }
  }

  const handleDelete = async (unit) => {
    if (!window.confirm(`Hapus unit ${unit.name} (RW ${unit.rw_code}) dari Master Wilayah?`)) {
      return
    }
    try {
      await adminApi.deletePosyandu(unit.id)
      setNotice({ type: 'success', text: `Unit ${unit.name} telah dihapus.` })
      await loadPosyandus()
      if (onDataChanged) onDataChanged()
    } catch (err) {
      setNotice({ type: 'error', text: err.message })
    }
  }

  const filtered = items.filter((p) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.rw_code || '').toLowerCase().includes(q) ||
      (p.address || '').toLowerCase().includes(q)
    )
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">
              Master Wilayah &amp; Unit Posyandu Desa
            </h2>
            <p className="text-[12px] text-slate-500">
              Kelola unit layanan Posyandu RW, jadwal buka bulanan, dan titik koordinat pusat klaster untuk Peta GIS Bidan.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e293b] hover:bg-[#0f172a] text-white text-[12.5px] font-semibold shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Unit Posyandu</span>
        </button>
      </div>

      {notice && (
        <div
          className={`p-3.5 px-4 rounded-2xl border text-[12.5px] font-medium flex items-center justify-between ${
            notice.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notice.text}</span>
          </span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-xs font-bold underline cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Cards Grid of Posyandu Units */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-44 rounded-2xl bg-white border border-slate-100 animate-pulse p-5" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedItems.map((unit) => (
            <div
              key={unit.id}
              className={`bg-white rounded-2xl border p-5 shadow-2xs transition-all flex flex-col justify-between gap-4 ${
                unit.is_active ? 'border-slate-100' : 'border-slate-200 opacity-70 bg-slate-50'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[15.5px] font-bold text-slate-800">{unit.name}</h3>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold">
                        RW {unit.rw_code} / RT {unit.rt_code}
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-500 mt-0.5">{unit.address}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold ${
                      unit.is_active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {unit.is_active ? 'AKTIF' : 'NONAKTIF'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="block text-[10px] text-slate-400 font-semibold uppercase">
                      Sasaran Balita
                    </span>
                    <span className="text-[13px] font-bold text-slate-800">
                      {unit.children_count} Anak
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="block text-[10px] text-slate-400 font-semibold uppercase">
                      Petugas Kader
                    </span>
                    <span className="text-[13px] font-bold text-slate-800">
                      {unit.kader_count} Akun
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="block text-[10px] text-slate-400 font-semibold uppercase">
                      Koordinat GIS
                    </span>
                    <span className="text-[11px] font-mono font-semibold text-[#2597d0]">
                      {Number(unit.latitude).toFixed(4)}, {Number(unit.longitude).toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-[11.5px]">
                <span className="text-slate-500 truncate">
                  Jadwal: <strong className="text-slate-700">{unit.schedule_day}</strong>
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(unit)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Ubah</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(unit)}
                    title={unit.is_active ? 'Nonaktifkan Posyandu' : 'Aktifkan Posyandu'}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(unit)}
                    title="Hapus Posyandu"
                    className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          </div>

          <PaginationBar
            totalItems={filtered.length}
            currentPage={safePage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[4, 6, 8, 12]}
            itemLabel="unit Posyandu"
          />
        </div>
      )}

      {/* Modal Form Add/Edit Posyandu */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div>
                <h3 className="text-[16px] font-bold text-slate-800">
                  {editingId ? 'Ubah Data Unit Posyandu' : 'Tambah Unit Posyandu Baru'}
                </h3>
                <p className="text-[11.5px] text-slate-400">
                  Titik koordinat akan langsung terintegrasi dengan Peta Klaster GIS Bidan Desa.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-[13px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                    Nama Unit Posyandu *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Cth: Posyandu Melati 09"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1e293b]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                    Desa / Kelurahan
                  </label>
                  <input
                    type="text"
                    value={form.village_name}
                    onChange={(e) => setForm({ ...form, village_name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1e293b]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                    Kode RW *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="004"
                    value={form.rw_code}
                    onChange={(e) => setForm({ ...form, rw_code: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1e293b]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                    Kode RT
                  </label>
                  <input
                    type="text"
                    placeholder="001"
                    value={form.rt_code}
                    onChange={(e) => setForm({ ...form, rt_code: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1e293b]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                  Alamat Lengkap Balai Posyandu
                </label>
                <input
                  type="text"
                  placeholder="Balai Warga RW 04, Dusun Krajan, Desa Sukamaju"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1e293b]"
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                  Jadwal Hari Buka Rutin
                </label>
                <input
                  type="text"
                  placeholder="Sabtu Minggu Ke-2 (08.30 - 11.30 WIB)"
                  value={form.schedule_day}
                  onChange={(e) => setForm({ ...form, schedule_day: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1e293b]"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="block text-[11.5px] font-bold text-slate-700">
                      Titik Koordinat Klaster Peta GIS Bidan Desa
                    </span>
                    <span className="text-[10.5px] text-slate-400">
                      Ambil otomatis dari sensor GPS perangkat atau pilih preset klaster RW Desa Sukamaju.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!navigator.geolocation) {
                        setNotice({ type: 'error', text: 'Browser tidak mendukung sensor Geolocation GPS.' })
                        return
                      }
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          setForm((prev) => ({
                            ...prev,
                            latitude: Number(pos.coords.latitude.toFixed(6)),
                            longitude: Number(pos.coords.longitude.toFixed(6)),
                          }))
                        },
                        () => {
                          setForm((prev) => ({
                            ...prev,
                            latitude: -6.595038,
                            longitude: 106.816635,
                          }))
                        },
                      )
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2597d0] hover:bg-[#1d7fae] text-white text-[11px] font-semibold cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Ambil Titik GPS Saat Ini</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { label: 'Klaster RW 01', lat: -6.5912, lng: 106.7998 },
                    { label: 'Klaster RW 02', lat: -6.5935, lng: 106.8042 },
                    { label: 'Klaster RW 03', lat: -6.5961, lng: 106.8089 },
                    { label: 'Klaster RW 04', lat: -6.5988, lng: 106.8132 },
                    { label: 'Klaster RW 05', lat: -6.6015, lng: 106.8175 },
                    { label: 'Klaster RW 06', lat: -6.6041, lng: 106.8211 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          latitude: preset.lat,
                          longitude: preset.lng,
                        }))
                      }
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-[#2597d0] text-slate-600 hover:text-[#2597d0] text-[10.5px] font-semibold cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Latitude (Garis Lintang)
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={form.latitude}
                      onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:border-[#1e293b]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Longitude (Garis Bujur)
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={form.longitude}
                      onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:border-[#1e293b]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#1e293b] hover:bg-[#0f172a] text-white font-semibold cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Posyandu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
