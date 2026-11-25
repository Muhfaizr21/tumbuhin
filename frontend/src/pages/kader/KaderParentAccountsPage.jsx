import { useEffect, useMemo, useState } from 'react'
import {
  Baby,
  CheckCircle2,
  Copy,
  Edit3,
  Link2,
  Mail,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { kaderApi } from '../../lib/kaderApi'

const EMPTY_FORM = {
  full_name: '',
  email: '',
  phone: '',
  password: '',
  child_ids: [],
}

function generatePassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const values = new Uint32Array(10)
    crypto.getRandomValues(values)
    return Array.from(values, (value) => chars[value % chars.length]).join('')
  }
  return 'ortu' + Math.random().toString(36).slice(2, 8)
}

function credentialText(credentials) {
  if (!credentials) return ''
  const identifier = credentials.email || credentials.phone
  return `Halo Ibu/Bapak ${credentials.full_name},\n\nAkun Tumbuhin Anda sudah dibuat oleh Kader Posyandu.\n\nEmail/No. HP: ${identifier}\nPassword: ${credentials.password}\n\nSilakan login di aplikasi Tumbuhin untuk melihat kartu gizi anak.`
}

export default function KaderParentAccountsPage({ user, searchQuery = '' }) {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [parents, setParents] = useState([])
  const [unlinkedChildren, setUnlinkedChildren] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [notice, setNotice] = useState(null)
  const [credentials, setCredentials] = useState(null)
  const [copied, setCopied] = useState(false)
  const [localSearch, setLocalSearch] = useState(searchQuery)
  const [editingParent, setEditingParent] = useState(null)
  const [editChildIds, setEditChildIds] = useState([])
  const [savingChildren, setSavingChildren] = useState(false)

  useEffect(() => {
    setLocalSearch(searchQuery)
  }, [searchQuery])

  const loadParents = async () => {
    setLoading(true)
    try {
      const data = await kaderApi.listParents()
      setParents(Array.isArray(data?.parents) ? data.parents : [])
      setUnlinkedChildren(
        Array.isArray(data?.unlinked_children) ? data.unlinked_children : [],
      )
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Gagal memuat data akun orang tua' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadParents()
  }, [])

  const toggleFormChild = (childId) => {
    setForm((prev) => ({
      ...prev,
      child_ids: prev.child_ids.includes(childId)
        ? prev.child_ids.filter((id) => id !== childId)
        : [...prev.child_ids, childId],
    }))
  }

  const handleRegister = async (event) => {
    event.preventDefault()
    if (!form.full_name.trim() || (!form.email.trim() && !form.phone.trim())) {
      setNotice({ type: 'error', text: 'Nama lengkap serta email atau nomor HP wajib diisi.' })
      return
    }
    if (form.child_ids.length === 0) {
      setNotice({ type: 'error', text: 'Pilih minimal satu balita yang akan ditautkan.' })
      return
    }

    setSubmitting(true)
    setNotice(null)
    const password = form.password.trim() || generatePassword()
    try {
      const created = await kaderApi.registerParent({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password,
        child_ids: form.child_ids,
      })
      setCredentials({
        full_name: created?.full_name || form.full_name.trim(),
        email: created?.email || form.email.trim(),
        phone: created?.phone || form.phone.trim(),
        password,
      })
      setCopied(false)
      setNotice({
        type: 'success',
        text: `Akun orang tua berhasil dibuat dan ditautkan ke ${created?.children?.length || form.child_ids.length} balita.`,
      })
      setForm(EMPTY_FORM)
      await loadParents()
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Gagal mendaftarkan akun orang tua' })
    } finally {
      setSubmitting(false)
    }
  }

  const copyCredentials = async () => {
    const text = credentialText(credentials)
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      setNotice({ type: 'error', text: 'Browser tidak mengizinkan akses clipboard.' })
    }
  }

  const openEditChildrenModal = (parent) => {
    setEditingParent(parent)
    setEditChildIds((parent.children || []).map((child) => child.id))
  }

  const toggleEditChild = (childId) => {
    setEditChildIds((prev) =>
      prev.includes(childId) ? prev.filter((id) => id !== childId) : [...prev, childId],
    )
  }

  const handleSaveParentChildren = async () => {
    if (!editingParent) return
    setSavingChildren(true)
    setNotice(null)
    try {
      await kaderApi.updateParentChildren(editingParent.id, editChildIds)
      setNotice({
        type: 'success',
        text: `Daftar anak untuk akun ${editingParent.full_name} berhasil diperbarui.`,
      })
      setEditingParent(null)
      await loadParents()
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Gagal memperbarui tautan anak' })
    } finally {
      setSavingChildren(false)
    }
  }

  const filteredParents = useMemo(() => {
    const query = localSearch.trim().toLowerCase()
    if (!query) return parents
    return parents.filter((parent) => {
      const matchParent =
        parent.full_name?.toLowerCase().includes(query) ||
        parent.email?.toLowerCase().includes(query) ||
        parent.phone?.toLowerCase().includes(query)
      const matchChild = (parent.children || []).some((child) =>
        child.full_name?.toLowerCase().includes(query),
      )
      return matchParent || matchChild
    })
  }, [parents, localSearch])

  const editableChildrenPool = useMemo(() => {
    if (!editingParent) return []
    const linked = editingParent.children || []
    const seen = new Set(linked.map((child) => child.id))
    return [...linked, ...unlinkedChildren.filter((child) => !seen.has(child.id))]
  }, [editingParent, unlinkedChildren])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900">Akun Orang Tua</h2>
          <p className="text-[13px] text-slate-500">
            Daftarkan akun login orang tua dan tautkan balita di posyandu {user?.posyandu_name || 'Anda'}.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-500">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          Role ortu dikunci di backend
        </div>
      </div>

      {notice && (
        <div
          className={`rounded-2xl border px-4 py-3 text-[13px] font-semibold ${
            notice.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          {notice.text}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <form
          onSubmit={handleRegister}
          className="h-fit rounded-3xl border border-slate-100 bg-white p-5 shadow-2xs"
        >
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#fff1e9] text-[#f26522]">
              <UserPlus className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-[15px] font-black text-slate-900">Daftar Akun Baru</h3>
              <p className="text-[12px] text-slate-500">Kredensial bisa langsung dibagikan via WhatsApp.</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-bold text-slate-600">
                Nama Lengkap Ibu/Wali
              </span>
              <input
                value={form.full_name}
                onChange={(event) => setForm({ ...form, full_name: event.target.value })}
                placeholder="Contoh: Dewi Lestari"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#f26522]"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold text-slate-600">
                  <Mail className="h-3.5 w-3.5" /> Email
                </span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  placeholder="opsional"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#f26522]"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold text-slate-600">
                  <Phone className="h-3.5 w-3.5" /> No. HP
                </span>
                <input
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  placeholder="08xxxxxxxxxx"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#f26522]"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-[12px] font-bold text-slate-600">
                Password Awal
              </span>
              <div className="flex gap-2">
                <input
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  placeholder="Minimal 6 karakter"
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#f26522]"
                />
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, password: generatePassword() }))}
                  className="shrink-0 rounded-xl border border-[#f26522]/20 bg-[#fff7f2] px-3 text-[12px] font-bold text-[#f26522] hover:bg-[#ffeddf]"
                >
                  Generate
                </button>
              </div>
            </label>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[12px] font-bold text-slate-600">Balita yang Ditautkan</span>
                <span className="text-[11px] font-semibold text-slate-400">
                  {form.child_ids.length} dipilih
                </span>
              </div>
              {unlinkedChildren.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-[12px] text-slate-500">
                  Belum ada balita tanpa akun orang tua di posyandu ini.
                </div>
              ) : (
                <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                  {unlinkedChildren.map((child) => {
                    const checked = form.child_ids.includes(child.id)
                    return (
                      <label
                        key={child.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                          checked
                            ? 'border-[#f26522]/40 bg-[#fff7f2]'
                            : 'border-slate-100 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleFormChild(child.id)}
                          className="h-4 w-4 accent-[#f26522]"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-bold text-slate-800">
                            {child.full_name}
                          </span>
                          <span className="block truncate text-[11px] text-slate-500">
                            {child.parent_name || 'Belum ada nama ibu'} · {child.posyandu_name || '-'}
                          </span>
                        </span>
                        <Baby className="h-4 w-4 shrink-0 text-slate-300" />
                      </label>
                    )
                  })}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#f26522] px-4 py-3 text-[13px] font-black text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              {submitting ? 'Mendaftarkan...' : 'Daftarkan & Tautkan Akun'}
            </button>
          </div>
        </form>

        <div className="space-y-5">
          {credentials && (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5">
              <div className="mb-3 flex items-center gap-2 text-[13px] font-black text-emerald-800">
                <CheckCircle2 className="h-4 w-4" />
                Info Login Siap Dibagikan
              </div>
              <div className="grid gap-2 rounded-2xl bg-white p-4 text-[13px] text-slate-700 shadow-2xs sm:grid-cols-2">
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Email / No. HP
                  </span>
                  <span className="font-bold">{credentials.email || credentials.phone}</span>
                </div>
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Password
                  </span>
                  <span className="font-mono font-bold">{credentials.password}</span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={copyCredentials}
                  className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-[12px] font-bold text-white hover:bg-emerald-800"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? 'Tersalin' : 'Salin Info Login untuk WhatsApp'}
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(credentialText(credentials))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-[12px] font-bold text-emerald-800 hover:bg-emerald-50"
                >
                  Buka WhatsApp
                </a>
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-2xs">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#2597d0]" />
                <h3 className="text-[15px] font-black text-slate-900">
                  Daftar Akun Orang Tua ({filteredParents.length})
                </h3>
              </div>
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={localSearch}
                  onChange={(event) => setLocalSearch(event.target.value)}
                  placeholder="Cari orang tua atau anak..."
                  className="w-44 bg-transparent text-[12px] outline-none"
                />
              </label>
            </div>

            {loading ? (
              <div className="py-12 text-center text-[13px] text-slate-500">Memuat data...</div>
            ) : filteredParents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-[13px] text-slate-500">
                Belum ada akun orang tua terdaftar di posyandu ini.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredParents.map((parent) => (
                  <div
                    key={parent.id}
                    className="rounded-2xl border border-slate-100 p-4 transition-colors hover:bg-slate-50/60"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[14px] font-black text-slate-900">
                            {parent.full_name}
                          </span>
                          <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">
                            ortu
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" /> {parent.email || '-'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" /> {parent.phone || '-'}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {(parent.children || []).length === 0 ? (
                            <span className="text-[11px] text-slate-400">Belum ada anak tertaut</span>
                          ) : (
                            parent.children.map((child) => (
                              <span
                                key={child.id}
                                className="rounded-lg bg-[#e9f6fd] px-2 py-1 text-[11px] font-bold text-[#1c77a3]"
                              >
                                {child.full_name}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openEditChildrenModal(parent)}
                        className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-[12px] font-bold text-slate-700 hover:border-[#2597d0]/40 hover:text-[#2597d0]"
                      >
                        <Edit3 className="h-4 w-4" />
                        Kelola Anak
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {editingParent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-[16px] font-black text-slate-900">Kelola Anak Tertaut</h3>
                <p className="text-[12px] text-slate-500">
                  Akun: {editingParent.full_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingParent(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
                aria-label="Tutup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {editableChildrenPool.map((child) => {
                const checked = editChildIds.includes(child.id)
                return (
                  <label
                    key={child.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 ${
                      checked ? 'border-[#f26522]/40 bg-[#fff7f2]' : 'border-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleEditChild(child.id)}
                      className="h-4 w-4 accent-[#f26522]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-bold text-slate-800">
                        {child.full_name}
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        {child.posyandu_name || '-'}
                      </span>
                    </span>
                    {checked && <Link2 className="h-4 w-4 text-[#f26522]" />}
                  </label>
                )
              })}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingParent(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-[12px] font-bold text-slate-600"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveParentChildren}
                disabled={savingChildren}
                className="rounded-xl bg-[#f26522] px-4 py-2.5 text-[12px] font-bold text-white disabled:opacity-60"
              >
                {savingChildren ? 'Menyimpan...' : 'Simpan Tautan Anak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
