import { useEffect, useState } from 'react'
import {
  BookOpen,
  CheckCircle2,
  Cpu,
  Edit3,
  FileUp,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import PaginationBar from '../../components/ui/PaginationBar'
import { adminApi } from '../../lib/adminApi'

const EMPTY_CHUNK = {
  source_doc: 'Buku KIA Kemenkes RI 2024 - Pedoman PMBA',
  chunk_index: 0,
  category: 'Standar Tekstur & Porsi',
  target_age: '6-24 Bulan',
  content: '',
}

const EMPTY_UPLOAD_DOC = {
  source_doc: 'Pedoman Gizi Seimbang & PMBA Kemenkes RI 2024',
  category: 'Standar Tekstur & Porsi',
  target_age: '6-24 Bulan',
  chunk_size_tokens: 350,
  document_text: '',
}

/**
 * Module 3.5: Knowledge Base AI (RAG) & Sandbox Playground (/admin/knowledge-base)
 * Manages Kemenkes clinical chunks indexed in PostgreSQL pgvector and provides a live RAG Retrieval Playground.
 */
export default function AdminKnowledgeBasePage({ searchQuery = '', onDataChanged }) {
  const [chunks, setChunks] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [reindexing, setReindexing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [notice, setNotice] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [editingChunk, setEditingChunk] = useState(null)
  const [form, setForm] = useState(EMPTY_CHUNK)
  const [uploadForm, setUploadForm] = useState(EMPTY_UPLOAD_DOC)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(4)

  // RAG Playground State
  const [pgQuery, setPgQuery] = useState(
    'Anak usia 9 bulan berat badan melambat, butuh tekstur MPASI padat protein hewani tanpa telur',
  )
  const [pgAge, setPgAge] = useState(9)
  const [pgBudget, setPgBudget] = useState(14000)
  const [pgAllergies, setPgAllergies] = useState('telur')
  const [pgRunning, setPgRunning] = useState(false)
  const [pgResult, setPgResult] = useState(null)

  const loadChunks = async () => {
    setLoading(true)
    try {
      const data = await adminApi.listKnowledgeChunks()
      setChunks(Array.isArray(data) ? data : [])
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Gagal memuat Knowledge Base RAG' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadChunks()
  }, [])

  const handleRunPlayground = async (e) => {
    if (e) e.preventDefault()
    setPgRunning(true)
    try {
      const res = await adminApi.runRAGPlayground({
        query: pgQuery,
        age_months: Number(pgAge),
        budget_idr: Number(pgBudget),
        allergies: pgAllergies,
      })
      setPgResult(res)
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Gagal menjalankan simulasi RAG' })
    } finally {
      setPgRunning(false)
    }
  }

  const openCreateModal = () => {
    setEditingChunk(null)
    setForm(EMPTY_CHUNK)
    setModalOpen(true)
  }

  const openEditModal = (ch) => {
    setEditingChunk(ch)
    setForm({
      source_doc: ch.source_doc || '',
      chunk_index: Number(ch.chunk_index ?? 0),
      category: ch.category || 'Standar Tekstur & Porsi',
      target_age: ch.target_age || '6-24 Bulan',
      content: ch.content || '',
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
        chunk_index: Number(form.chunk_index),
      }
      if (editingChunk) {
        await adminApi.updateKnowledgeChunk(editingChunk.id, payload)
        setNotice({ type: 'success', text: 'Potongan dokumen (chunk) Kemenkes berhasil diperbarui.' })
      } else {
        await adminApi.createKnowledgeChunk(payload)
        setNotice({ type: 'success', text: 'Potongan pedoman Kemenkes baru ditambahkan ke indeks RAG.' })
      }
      setModalOpen(false)
      await loadChunks()
      if (onDataChanged) onDataChanged()
    } catch (err) {
      setNotice({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (ch) => {
    if (!window.confirm(`Hapus chunk "${ch.source_doc}" dari Knowledge Base RAG?`)) return
    try {
      await adminApi.deleteKnowledgeChunk(ch.id)
      setNotice({ type: 'success', text: 'Chunk pedoman telah dihapus dari Knowledge Base.' })
      await loadChunks()
      if (onDataChanged) onDataChanged()
    } catch (err) {
      setNotice({ type: 'error', text: err.message })
    }
  }

  const handleReindexVectors = async () => {
    setReindexing(true)
    setNotice(null)
    try {
      const res = await adminApi.reindexKnowledgeVectors()
      setNotice({
        type: 'success',
        text: `Re-indeksasi Vector 768-dimensi berhasil untuk ${res?.reindexed_chunks ?? chunks.length} chunk pedoman di PostgreSQL pgvector.`,
      })
      await loadChunks()
      if (onDataChanged) onDataChanged()
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Gagal melakukan re-indeksasi vector' })
    } finally {
      setReindexing(false)
    }
  }

  const handleFileRead = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = String(ev.target?.result || '')
      setUploadForm((prev) => ({
        ...prev,
        source_doc: prev.source_doc || file.name.replace(/\.[^/.]+$/, ''),
        document_text: text,
      }))
    }
    reader.readAsText(file)
  }

  const handleUploadDocument = async (e) => {
    e.preventDefault()
    setUploading(true)
    setNotice(null)
    try {
      const created = await adminApi.uploadKnowledgeDocument({
        source_doc: uploadForm.source_doc,
        category: uploadForm.category,
        target_age: uploadForm.target_age,
        chunk_size_tokens: Number(uploadForm.chunk_size_tokens),
        document_text: uploadForm.document_text,
      })
      const count = Array.isArray(created) ? created.length : 1
      setNotice({
        type: 'success',
        text: `Dokumen "${uploadForm.source_doc}" otomatis dipecah menjadi ${count} chunk dan terindeks ke Vector 768-dim pgvector.`,
      })
      setUploadModalOpen(false)
      setUploadForm(EMPTY_UPLOAD_DOC)
      await loadChunks()
      if (onDataChanged) onDataChanged()
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Gagal mengunggah & memecah dokumen' })
    } finally {
      setUploading(false)
    }
  }

  const filteredChunks = chunks.filter((c) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      (c.source_doc || '').toLowerCase().includes(q) ||
      (c.category || '').toLowerCase().includes(q) ||
      (c.content || '').toLowerCase().includes(q)
    )
  })

  const totalPages = Math.max(1, Math.ceil(filteredChunks.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedChunks = filteredChunks.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">
              Knowledge Base AI (RAG Kemenkes) &amp; Sandbox Uji Retrieval
            </h2>
            <p className="text-[12px] text-slate-500">
              Kelola potongan pedoman resmi Buku KIA &amp; PMBA Kemenkes RI di PostgreSQL{' '}
              <code className="font-mono">pgvector</code> untuk mencegah halusinasi AI Nutri-Chef.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleReindexVectors}
            disabled={reindexing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[12px] font-semibold cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reindexing ? 'animate-spin' : ''}`} />
            <span>{reindexing ? 'Mengindeks Vector...' : 'Re-Index Vector 768-dim'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setUploadForm(EMPTY_UPLOAD_DOC)
              setUploadModalOpen(true)
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-semibold cursor-pointer"
          >
            <FileUp className="w-4 h-4" />
            <span>Unggah Dokumen &amp; Auto-Chunk</span>
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e293b] hover:bg-[#0f172a] text-white text-[12.5px] font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Chunk</span>
          </button>
        </div>
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

      {/* RAG Playground Sandbox */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#edf7fe] text-[#2597d0] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-slate-800">
                RAG Playground — Uji Kemiripan Sitasi Pedoman Kemenkes
              </h3>
              <p className="text-[11.5px] text-slate-400">
                Uji kasus klinis sebelum dirilis ke petugas Kader Posyandu untuk memverifikasi rujukan dokumen yang ditarik.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-sky-300 font-mono text-[10.5px]">
            Cosine Similarity (&lt;=&gt;) + Clinical Filter
          </span>
        </div>

        <form onSubmit={handleRunPlayground} className="space-y-3.5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-6">
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Simulasi Pertanyaan / Kasus Klinis Balita
              </label>
              <input
                type="text"
                value={pgQuery}
                onChange={(e) => setPgQuery(e.target.value)}
                placeholder="Ketik skenario kasus gizi balita..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-[#1e293b]"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Usia (Bulan)
              </label>
              <input
                type="number"
                min="6"
                max="59"
                value={pgAge}
                onChange={(e) => setPgAge(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-[13px]"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Budget (Rp)
              </label>
              <input
                type="number"
                step="1000"
                value={pgBudget}
                onChange={(e) => setPgBudget(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-[13px]"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Filter Alergi
              </label>
              <input
                type="text"
                value={pgAllergies}
                onChange={(e) => setPgAllergies(e.target.value)}
                placeholder="telur / ikan"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-[13px]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={pgRunning}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2597d0] hover:bg-[#1d7fae] text-white text-[12.5px] font-semibold cursor-pointer disabled:opacity-50"
            >
              <Cpu className="w-4 h-4" />
              <span>{pgRunning ? 'Mengeksekusi Retrieval...' : 'Jalankan Uji Retrieval RAG'}</span>
            </button>
          </div>
        </form>

        {pgResult && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
            <div className="p-4 rounded-2xl bg-[#edf7fe]/70 border border-sky-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#2597d0]">
                  Sintesis Grounded Output &amp; Aturan Tekstur
                </span>
                <span className="text-[11px] font-semibold text-slate-600">
                  Estimasi Belanja: Rp {Number(pgResult.estimated_budget_idr || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <p className="text-[13px] font-medium text-slate-800 leading-relaxed">
                {pgResult.synthesized_guidance}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {pgResult.matched_chunks?.map((mc, idx) => (
                <div
                  key={mc.id || idx}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-bold">
                      Top #{idx + 1} • Score {(Number(mc.score) * 100).toFixed(1)}%
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700">
                      {mc.target_age}
                    </span>
                  </div>
                  <p className="text-[12px] font-bold text-slate-800">{mc.source_doc}</p>
                  <p className="text-[11.5px] text-slate-600 leading-relaxed">{mc.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Indexed Knowledge Chunks Directory */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[15.5px] font-bold text-slate-800">
            Korpus Dokumen Pedoman Kemenkes Terindeks ({filteredChunks.length} Chunks)
          </h3>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-28 rounded-2xl bg-white border border-slate-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedChunks.map((ch) => (
              <div
                key={ch.id}
                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10.5px] font-bold">
                        {ch.category}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10.5px] font-semibold">
                        Usia: {ch.target_age}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                        ~{ch.token_count} token
                      </span>
                    </div>
                  </div>
                  <h4 className="text-[14px] font-bold text-slate-800">{ch.source_doc}</h4>
                  <p className="text-[12.5px] text-slate-600 leading-relaxed">{ch.content}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    Chunk #{ch.chunk_index} • {ch.has_embedding ? 'Vector 768-dim' : 'Hybrid Indexed'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(ch)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(ch)}
                      className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>

            <PaginationBar
              totalItems={filteredChunks.length}
              currentPage={safePage}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[4, 6, 10]}
              itemLabel="chunks pedoman"
            />
          </div>
        )}
      </div>

      {/* Modal Add/Edit Knowledge Chunk */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div>
                <h3 className="text-[16px] font-bold text-slate-800">
                  {editingChunk ? 'Ubah Chunk Pedoman Kemenkes' : 'Tambah Chunk Pedoman Gizi Baru'}
                </h3>
                <p className="text-[11.5px] text-slate-400">
                  Dokumen ini akan dijadikan sitasi wajib oleh generator resep AI Nutri-Chef.
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
              <div>
                <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                  Judul Dokumen &amp; Bab Rujukan Resmi Kemenkes *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Buku KIA Kemenkes RI 2024 - PMBA 9-11 Bulan"
                  value={form.source_doc}
                  onChange={(e) => setForm({ ...form, source_doc: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1e293b]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                    Kategori Aturan
                  </label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                    Kelompok Usia
                  </label>
                  <select
                    value={form.target_age}
                    onChange={(e) => setForm({ ...form, target_age: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="6-8 Bulan">6-8 Bulan</option>
                    <option value="9-11 Bulan">9-11 Bulan</option>
                    <option value="12-24 Bulan">12-24 Bulan</option>
                    <option value="6-24 Bulan">6-24 Bulan</option>
                    <option value="0-60 Bulan">0-60 Bulan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                    Indeks Chunk
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.chunk_index}
                    onChange={(e) => setForm({ ...form, chunk_index: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                  Isi Potongan Pedoman Klinis (Maks 500 Token) *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tuliskan isi aturan porsi, tekstur, frekuensi makan, atau kebutuhan protein hewani..."
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1e293b]"
                />
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
                  {saving ? 'Menyimpan...' : 'Simpan ke Knowledge Base'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Upload Full Document & Auto-Chunking (~500 tokens + 768-dim Vector Embedding) */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div>
                <h3 className="text-[16px] font-bold text-slate-800">
                  Unggah Dokumen Pedoman &amp; Auto-Chunking Vector 768-dim
                </h3>
                <p className="text-[11.5px] text-slate-400">
                  Unggah berkas dokumen (.txt / .md / .csv) atau tempelkan naskah pedoman lengkap untuk dipecah otomatis per batas token.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadDocument} className="space-y-3.5 text-[13px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                    Judul Dokumen Rujukan Kemenkes *
                  </label>
                  <input
                    type="text"
                    required
                    value={uploadForm.source_doc}
                    onChange={(e) => setUploadForm({ ...uploadForm, source_doc: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                    Pilih Berkas Dokumen (.txt / .md / .csv)
                  </label>
                  <input
                    type="file"
                    accept=".txt,.md,.csv,.json"
                    onChange={handleFileRead}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-[12px] bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                    Kategori Aturan
                  </label>
                  <input
                    type="text"
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                    Kelompok Usia Sasaran
                  </label>
                  <select
                    value={uploadForm.target_age}
                    onChange={(e) => setUploadForm({ ...uploadForm, target_age: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="6-8 Bulan">6-8 Bulan</option>
                    <option value="9-11 Bulan">9-11 Bulan</option>
                    <option value="12-24 Bulan">12-24 Bulan</option>
                    <option value="6-24 Bulan">6-24 Bulan</option>
                    <option value="0-60 Bulan">0-60 Bulan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                    Ukuran Auto-Chunk
                  </label>
                  <select
                    value={uploadForm.chunk_size_tokens}
                    onChange={(e) =>
                      setUploadForm({ ...uploadForm, chunk_size_tokens: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value={250}>~250 Token / Chunk</option>
                    <option value={350}>~350 Token / Chunk</option>
                    <option value={500}>~500 Token / Chunk</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                  Naskah Lengkap Dokumen Pedoman (Otomatis Dipecah &amp; Di-Embed ke 768-Dimensi) *
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Tempelkan beberapa paragraf atau bab pedoman Buku KIA / PMBA Kemenkes RI di sini..."
                  value={uploadForm.document_text}
                  onChange={(e) => setUploadForm({ ...uploadForm, document_text: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1e293b]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer disabled:opacity-50"
                >
                  {uploading ? 'Memecah & Mengindeks...' : 'Proses Auto-Chunk & Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
