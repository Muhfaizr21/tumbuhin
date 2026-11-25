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
import { SmartTopHeader } from '../../components/ui/SmartDashboardWidgets'
import { bidanApi } from '../../lib/bidanApi'
import BidanNavigationShell from './components/BidanNavigationShell'
import { BIDAN_MENUS } from './bidanMenuItems'

const EMPTY_FORM = {
  full_name: '',
  email: '',
  phone: '',
  password: '',
  child_ids: [],
}

export default function BidanParentsPage({ user, onLogout, onSwitchRole }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [parents, setParents] = useState([])
  const [unlinkedChildren, setUnlinkedChildren] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [notice, setNotice] = useState(null)

  // Modal edit linked children for existing parent
  const [editingParent, setEditingParent] = useState(null)
  const [editChildIds, setEditChildIds] = useState([])
  const [savingChildren, setSavingChildren] = useState(false)
  const [copiedToken, setCopiedToken] = useState('')

  const loadParents = async () => {
    setLoading(true)
    try {
      const data = await bidanApi.listParents()
      setParents(Array.isArray(data?.parents) ? data.parents : [])
      setUnlinkedChildren(Array.isArray(data?.unlinked_children) ? data.unlinked_children : [])
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Gagal memuat data akun orang tua' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadParents()
  }, [])

  const handleSelectMenu = (item) => {
    if (item?.route) {
      window.location.hash = `#${item.route}`
    }
  }

  const toggleFormChild = (childId) => {
    setForm((prev) => {
      const exists = prev.child_ids.includes(childId)
      return {
        ...prev,
        child_ids: exists
          ? prev.child_ids.filter((id) => id !== childId)
          : [...prev.child_ids, childId],
      }
    })
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!form.full_name.trim() || (!form.email.trim() && !form.phone.trim())) {
      setNotice({ type: 'error', text: 'Nama lengkap serta email atau nomor HP wajib diisi.' })
      return
    }

    setSubmitting(true)
    setNotice(null)
    try {
      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password.trim() || 'ortusehat2026',
        posyandu_name: user?.posyandu_name || 'Posyandu Melati 04',
        village_name: user?.village_name || 'Desa Sukamaju',
        child_ids: form.child_ids,
      }
      const created = await bidanApi.registerParent(payload)
      setNotice({
        type: 'success',
        text: `Akun orang tua "${created.full_name}" berhasil dibuat & ditautkan ke ${created.children?.length || 0} balita.`,
      })
      setForm(EMPTY_FORM)
      await loadParents()
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Gagal mendaftarkan akun orang tua' })
    } finally {
      setSubmitting(false)
    }
  }

  const openEditChildrenModal = (parent) => {
    setEditingParent(parent)
    setEditChildIds((parent.children || []).map((c) => c.id))
  }

  const toggleEditChild = (childId) => {
    setEditChildIds((prev) =>
      prev.includes(childId) ? prev.filter((id) => id !== childId) : [...prev, childId]
    )
  }

  const handleSaveParentChildren = async () => {
    if (!editingParent) return
    setSavingChildren(true)
    setNotice(null)
    try {
      await bidanApi.updateParentChildren(editingParent.id, editChildIds)
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

  const handleCopyMagicLink = (token) => {
    if (!token) return
    const url = `${window.location.origin}/#/p/${token}`
    navigator.clipboard?.writeText(url)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(''), 2000)
  }

  const filteredParents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return parents
    return parents.filter((p) => {
      const matchParent =
        p.full_name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.phone?.toLowerCase().includes(q)
      const matchChild = (p.children || []).some((c) => c.full_name?.toLowerCase().includes(q))
      return matchParent || matchChild
    })
  }, [parents, searchQuery])

  // Pool of available children for edit modal: current parent's children + unlinked children
  const editableChildrenPool = useMemo(() => {
    if (!editingParent) return []
    const current = editingParent.children || []
    const seen = new Set(current.map((c) => c.id))
    return [...current, ...unlinkedChildren.filter((c) => !seen.has(c.id))]
  }, [editingParent, unlinkedChildren])

  const currentMenu = BIDAN_MENUS.find((m) => m.id === 'orang-tua') || BIDAN_MENUS[0]

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#070709] flex font-inter">
      <div className="hidden lg:flex">
        <BidanNavigationShell
          menus={BIDAN_MENUS}
          activeMenuId="orang-tua"
          user={user}
          sidebarCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onSelectMenu={handleSelectMenu}
          onSwitchRole={onSwitchRole}
          onLogout={onLogout}
        />
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative z-10 flex">
            <BidanNavigationShell
              menus={BIDAN_MENUS}
              activeMenuId="orang-tua"
              user={user}
              onSelectMenu={(item) => {
                setMobileMenuOpen(false)
                handleSelectMenu(item)
              }}
              onSwitchRole={onSwitchRole}
              onLogout={onLogout}
            />
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <SmartTopHeader
          title={currentMenu.label}
          subtitle={currentMenu.description}
          user={user}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Cari nama ibu, nomor WA, atau nama balita..."
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {notice && (
            <div
              className={`p-4 rounded-2xl border text-xs sm:text-sm font-medium flex items-center justify-between gap-3 ${
                notice.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <span>{notice.text}</span>
              <button onClick={() => setNotice(null)} className="p-1 rounded-full hover:bg-black/5">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Form Registrasi Akun Orang Tua */}
            <section className="lg:col-span-5 bg-white border border-black/8 rounded-3xl p-6 shadow-2xs space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-black/5">
                <div className="w-10 h-10 rounded-full bg-[#2597d0]/10 text-[#2597d0] flex items-center justify-center shrink-0">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#070709] font-runde">
                    Daftarkan Akun Orang Tua Baru
                  </h2>
                  <p className="text-xs text-[#60606c]">
                    Role otomatis <span className="font-semibold text-[#070709]">ortu</span> & kompatibel dengan Superadmin.
                  </p>
                </div>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#070709] mb-1.5">
                    Nama Lengkap Ibu / Wali *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    placeholder="Contoh: Ibu Rahmawati"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/12 text-xs sm:text-sm focus:outline-none focus:border-[#2597d0]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#070709] mb-1.5">
                      No. WhatsApp *
                    </label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="081234567890"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-black/12 text-xs sm:text-sm focus:outline-none focus:border-[#2597d0]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#070709] mb-1.5">
                      Email (Opsional)
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="ibu@tumbuhin.id"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-black/12 text-xs sm:text-sm focus:outline-none focus:border-[#2597d0]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#070709] mb-1.5">
                    Kata Sandi Awal
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Kosongkan untuk default: ortusehat2026"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/12 text-xs sm:text-sm focus:outline-none focus:border-[#2597d0]"
                  />
                </div>

                {/* Checklist Pilih Balita */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#070709]">
                      Tautkan ke Balita (Bisa lebih dari 1)
                    </label>
                    <span className="text-[11px] font-medium text-[#2597d0]">
                      {form.child_ids.length} dipilih
                    </span>
                  </div>

                  {unlinkedChildren.length === 0 ? (
                    <div className="p-3 rounded-xl bg-[#f8fafc] border border-black/5 text-xs text-[#60606c]">
                      Semua balita aktif di desa sudah tertaut ke akun orang tua.
                    </div>
                  ) : (
                    <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                      {unlinkedChildren.map((child) => {
                        const checked = form.child_ids.includes(child.id)
                        return (
                          <label
                            key={child.id}
                            className={`p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                              checked
                                ? 'bg-[#2597d0]/5 border-[#2597d0]'
                                : 'bg-[#f8fafc] border-black/5 hover:border-black/15'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleFormChild(child.id)}
                                className="rounded accent-[#070709]"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-[#070709] truncate">
                                  {child.full_name}
                                </p>
                                <p className="text-[11px] text-[#60606c] truncate">
                                  {child.age_months} bln • {child.posyandu_name}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-black/8 text-[#60606c]">
                              {child.gender === 'L' ? 'L' : 'P'}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-full bg-[#070709] hover:bg-[#151515] disabled:opacity-60 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#2597d0]" />
                  {submitting ? 'Mendaftarkan...' : 'Daftarkan & Tautkan Akun Orang Tua'}
                </button>
              </form>
            </section>

            {/* Right Column: Daftar Akun Orang Tua Terdaftar */}
            <section className="lg:col-span-7 bg-white border border-black/8 rounded-3xl p-6 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#070709]/5 text-[#070709] flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-[#2597d0]" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#070709] font-runde">
                      Daftar Akun Orang Tua ({filteredParents.length})
                    </h2>
                    <p className="text-xs text-[#60606c]">
                      Akun yang terdaftar dapat login langsung dan berpindah antar-anak.
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/70 text-[11px] font-semibold self-start">
                  <ShieldCheck className="w-3.5 h-3.5" /> Sinkron Superadmin
                </span>
              </div>

              {loading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-24 rounded-2xl bg-[#f5f5f5]" />
                  <div className="h-24 rounded-2xl bg-[#f5f5f5]" />
                </div>
              ) : filteredParents.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-[#f8fafc] border border-black/5 text-xs text-[#60606c]">
                  Belum ada akun orang tua yang cocok dengan pencarian Anda.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {filteredParents.map((parent) => (
                    <div
                      key={parent.id}
                      className="p-4 sm:p-5 rounded-2xl border border-black/8 bg-[#f8fafc]/60 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-[#070709] font-runde">
                              {parent.full_name}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full bg-[#2597d0]/10 text-[#2597d0] text-[10px] font-bold uppercase">
                              {parent.role}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-[#60606c]">
                            <span className="inline-flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5 text-[#8b8b8b]" /> {parent.email}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-[#8b8b8b]" /> {parent.phone}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => openEditChildrenModal(parent)}
                          className="px-3.5 py-1.5 rounded-full bg-white border border-black/12 hover:bg-[#f5f5f5] text-xs font-semibold text-[#070709] inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#2597d0]" /> Kelola Anak ({parent.children?.length || 0})
                        </button>
                      </div>

                      {/* Linked Children Chips */}
                      <div className="pt-2 border-t border-black/5 flex flex-wrap gap-2">
                        {(parent.children || []).length === 0 ? (
                          <span className="text-[11px] text-[#8b8b8b] italic">
                            Belum ada balita tertaut — klik "Kelola Anak" untuk menautkan.
                          </span>
                        ) : (
                          parent.children.map((child) => (
                            <div
                              key={child.id}
                              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-black/8 text-xs"
                            >
                              <Baby className="w-3.5 h-3.5 text-[#2597d0]" />
                              <span className="font-semibold text-[#070709]">{child.full_name}</span>
                              <span className="text-[11px] text-[#60606c]">({child.age_months} bln)</span>
                              {child.magic_token && (
                                <button
                                  type="button"
                                  onClick={() => handleCopyMagicLink(child.magic_token)}
                                  title="Salin Magic Link anak"
                                  className="ml-1 text-[10px] font-semibold text-[#2597d0] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                                >
                                  {copiedToken === child.magic_token ? (
                                    <>
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Disalin
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" /> Link
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      {/* Modal Kelola Anak untuk Akun Orang Tua */}
      {editingParent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl border border-black/10 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/5">
              <div>
                <h3 className="font-bold text-base text-[#070709] font-runde">
                  Kelola Balita Tertaut
                </h3>
                <p className="text-xs text-[#60606c]">{editingParent.full_name}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingParent(null)}
                className="p-1.5 rounded-full hover:bg-[#f5f5f5]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {editableChildrenPool.length === 0 ? (
                <p className="text-xs text-[#60606c] py-4 text-center">
                  Tidak ada balita tersedia untuk ditautkan.
                </p>
              ) : (
                editableChildrenPool.map((child) => {
                  const checked = editChildIds.includes(child.id)
                  return (
                    <label
                      key={child.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer ${
                        checked
                          ? 'bg-[#2597d0]/5 border-[#2597d0]'
                          : 'bg-[#f8fafc] border-black/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleEditChild(child.id)}
                          className="rounded accent-[#070709]"
                        />
                        <div>
                          <p className="text-xs font-bold text-[#070709]">{child.full_name}</p>
                          <p className="text-[11px] text-[#60606c]">
                            {child.age_months} bulan • {child.posyandu_name}
                          </p>
                        </div>
                      </div>
                      <Link2 className={`w-3.5 h-3.5 ${checked ? 'text-[#2597d0]' : 'text-[#8b8b8b]'}`} />
                    </label>
                  )
                })
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/5">
              <button
                type="button"
                onClick={() => setEditingParent(null)}
                className="px-4 py-2 rounded-full border border-black/12 text-xs font-medium text-[#60606c] hover:bg-[#f5f5f5]"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={savingChildren}
                onClick={handleSaveParentChildren}
                className="px-5 py-2 rounded-full bg-[#070709] text-white text-xs font-semibold hover:bg-[#151515] disabled:opacity-60 cursor-pointer"
              >
                {savingChildren ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
