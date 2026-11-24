import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  ChefHat,
  Edit3,
  Flame,
  Plus,
  ShoppingBasket,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
} from 'lucide-react'
import PaginationBar from '../../components/ui/PaginationBar'
import { adminApi } from '../../lib/adminApi'

const CATEGORIES = [
  'Semua',
  'Protein Hewani',
  'Protein Nabati',
  'Karbohidrat',
  'Sayur & Buah',
  'Sumber Lemak',
]

const EMPTY_FOOD = {
  food_key: '',
  name: '',
  category: 'Protein Hewani',
  unit_label: '1 porsi (50 g)',
  estimated_price_idr: 2500,
  calories_kcal: 85,
  protein_grams: 8.0,
  is_animal_protein: true,
  allergen_tag: '',
  is_available: true,
  village_name: 'Desa Sukamaju',
}

/**
 * Module 3.4: Harga Pangan Lokal Desa (/admin/pangan-lokal)
 * Manages the village local food market catalog consumed directly by Kader's AI Nutri-Chef.
 */
export default function AdminPanganLokalPage({ searchQuery = '', onDataChanged }) {
  const [foods, setFoods] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingFood, setEditingFood] = useState(null)
  const [form, setForm] = useState(EMPTY_FOOD)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(6)

  const loadFoods = async () => {
    setLoading(true)
    try {
      const data = await adminApi.listLocalFoods()
      setFoods(Array.isArray(data) ? data : [])
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Gagal memuat katalog pangan lokal' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFoods()
  }, [])

  const openCreateModal = () => {
    setEditingFood(null)
    setForm(EMPTY_FOOD)
    setModalOpen(true)
  }

  const openEditModal = (item) => {
    setEditingFood(item)
    setForm({
      food_key: item.food_key || '',
      name: item.name || '',
      category: item.category || 'Protein Hewani',
      unit_label: item.unit_label || '1 porsi',
      estimated_price_idr: Number(item.estimated_price_idr ?? 2000),
      calories_kcal: Number(item.calories_kcal ?? 80),
      protein_grams: Number(item.protein_grams ?? 6.0),
      is_animal_protein: Boolean(item.is_animal_protein),
      allergen_tag: item.allergen_tag || '',
      is_available: Boolean(item.is_available),
      village_name: item.village_name || 'Desa Sukamaju',
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
        estimated_price_idr: Number(form.estimated_price_idr),
        calories_kcal: Number(form.calories_kcal),
        protein_grams: Number(form.protein_grams),
      }
      if (editingFood) {
        await adminApi.updateLocalFood(editingFood.id, payload)
        setNotice({
          type: 'success',
          text: `Harga & detail ${form.name} berhasil diperbarui dan disinkronkan ke AI Nutri-Chef.`,
        })
      } else {
        await adminApi.createLocalFood(payload)
        setNotice({
          type: 'success',
          text: `Komoditas ${form.name} berhasil ditambahkan ke katalog pasar desa.`,
        })
      }
      setModalOpen(false)
      await loadFoods()
      if (onDataChanged) onDataChanged()
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Gagal menyimpan komoditas pangan' })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleAvailable = async (item) => {
    try {
      await adminApi.toggleLocalFood(item.id)
      setNotice({
        type: 'success',
        text: `Ketersediaan musiman ${item.name} diubah menjadi ${
          item.is_available ? 'Stok Kosong' : 'Tersedia di Pasar Desa'
        }.`,
      })
      await loadFoods()
      if (onDataChanged) onDataChanged()
    } catch (err) {
      setNotice({ type: 'error', text: err.message })
    }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Hapus komoditas ${item.name} dari katalog pangan lokal desa?`)) return
    try {
      await adminApi.deleteLocalFood(item.id)
      setNotice({ type: 'success', text: `Komoditas ${item.name} dihapus.` })
      await loadFoods()
      if (onDataChanged) onDataChanged()
    } catch (err) {
      setNotice({ type: 'error', text: err.message })
    }
  }

  const filteredFoods = foods.filter((f) => {
    if (selectedCategory !== 'Semua' && f.category !== selectedCategory) return false
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      (f.name || '').toLowerCase().includes(q) ||
      (f.category || '').toLowerCase().includes(q) ||
      (f.food_key || '').toLowerCase().includes(q)
    )
  })

  const totalPages = Math.max(1, Math.ceil(filteredFoods.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedFoods = filteredFoods.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <ShoppingBasket className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">
              Katalog Harga Pangan Lokal Pasar Desa
            </h2>
            <p className="text-[12px] text-slate-500">
              Terintegrasi langsung ke mesin <strong>AI Nutri-Chef Kader</strong> sebagai acuan kalkulasi anggaran resep MPASI harian keluarga.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e293b] hover:bg-[#0f172a] text-white text-[12.5px] font-semibold cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Komoditas Pangan</span>
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

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-[12px] font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#1e293b] text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>
        <span className="text-[11.5px] font-medium text-slate-400 flex items-center gap-1.5">
          <ChefHat className="w-3.5 h-3.5 text-[#2597d0]" />
          <span>Sinkron otomatis ke generator resep MPASI</span>
        </span>
      </div>

      {/* Commodities Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-44 rounded-2xl bg-white border border-slate-100 animate-pulse p-5" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginatedFoods.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border p-5 shadow-2xs flex flex-col justify-between gap-4 transition-all ${
                item.is_available
                  ? 'border-slate-100'
                  : 'border-slate-200 bg-slate-50/70 opacity-75'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          item.is_animal_protein
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.category}
                      </span>
                      {item.allergen_tag && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-semibold">
                          Alergen: {item.allergen_tag}
                        </span>
                      )}
                    </div>
                    <h3 className="text-[15.5px] font-bold text-slate-800 mt-1.5">{item.name}</h3>
                    <p className="text-[11.5px] text-slate-400">
                      Takaran: <strong className="text-slate-600">{item.unit_label}</strong> • Kode:{' '}
                      <code className="font-mono">{item.food_key}</code>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleAvailable(item)}
                    title="Ubah Ketersediaan Musiman"
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold cursor-pointer ${
                      item.is_available
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {item.is_available ? (
                      <ToggleRight className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-3.5 h-3.5" />
                    )}
                    <span>{item.is_available ? 'Tersedia' : 'Musiman Habis'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="block text-[9.5px] text-slate-400 font-bold uppercase">
                      Harga Eceran
                    </span>
                    <span className="text-[13.5px] font-bold text-emerald-700">
                      Rp {Number(item.estimated_price_idr).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="block text-[9.5px] text-slate-400 font-bold uppercase">
                      Energi
                    </span>
                    <span className="text-[12.5px] font-bold text-slate-800 inline-flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-500" />
                      {item.calories_kcal} kkal
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="block text-[9.5px] text-slate-400 font-bold uppercase">
                      Protein
                    </span>
                    <span className="text-[12.5px] font-bold text-[#2597d0]">
                      {Number(item.protein_grams).toFixed(1)} g
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Diperbarui: {item.updated_at}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Ubah Harga</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
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
            totalItems={filteredFoods.length}
            currentPage={safePage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[6, 9, 12]}
            itemLabel="komoditas pangan"
          />
        </div>
      )}

      {/* Modal Add/Edit Local Food */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div>
                <h3 className="text-[16px] font-bold text-slate-800">
                  {editingFood ? 'Perbarui Harga & Gizi Komoditas' : 'Tambah Komoditas Pangan Lokal'}
                </h3>
                <p className="text-[11.5px] text-slate-400">
                  Perubahan harga langsung menjadi acuan anggaran resep MPASI AI Nutri-Chef.
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
                    Nama Bahan Pangan Lokal *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Cth: Ikan Mujair Segar"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1e293b]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                    Kategori Gizi *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => {
                      const cat = e.target.value
                      setForm({
                        ...form,
                        category: cat,
                        is_animal_protein: cat === 'Protein Hewani',
                      })
                    }}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#1e293b]"
                  >
                    {CATEGORIES.filter((c) => c !== 'Semua').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                    Estimasi Harga Eceran (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    step="100"
                    value={form.estimated_price_idr}
                    onChange={(e) => setForm({ ...form, estimated_price_idr: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1e293b]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                    Label Takaran Rumah Tangga *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="1 ekor kecil (60 g) / 1 butir"
                    value={form.unit_label}
                    onChange={(e) => setForm({ ...form, unit_label: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1e293b]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                    Energi (kkal)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.calories_kcal}
                    onChange={(e) => setForm({ ...form, calories_kcal: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1e293b]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                    Protein (gram)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={form.protein_grams}
                    onChange={(e) => setForm({ ...form, protein_grams: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1e293b]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                    Tag Alergen
                  </label>
                  <input
                    type="text"
                    placeholder="telur / ikan / kedelai"
                    value={form.allergen_tag}
                    onChange={(e) => setForm({ ...form, allergen_tag: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1e293b]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="inline-flex items-center gap-2 text-[12px] font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_animal_protein}
                    onChange={(e) => setForm({ ...form, is_animal_protein: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  <span>Sumber Protein Hewani Prioritas Anti-Stunting</span>
                </label>
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
                  {saving ? 'Menyimpan...' : 'Simpan Harga Pangan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
