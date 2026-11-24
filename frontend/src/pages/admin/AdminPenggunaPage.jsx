import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  Copy,
  Download,
  Edit3,
  KeyRound,
  Lock,
  Plus,
  Power,
  Shield,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import PaginationBar from '../../components/ui/PaginationBar'
import { adminApi } from '../../lib/adminApi'

const EMPTY_USER = {
  full_name: '',
  email: '',
  phone: '',
  password: '',
  role: 'kader',
  posyandu_name: 'Posyandu Melati 04',
  village_name: 'Desa Sukamaju',
  is_active: true,
}

/**
 * Module 3.3: Manajemen Akun & RBAC (/admin/pengguna)
 * Manages officer accounts (Kader, Bidan, Admin, Ortu), Row-Level Scoping, and Magic Token security regeneration.
 */
export default function AdminPenggunaPage({
  searchQuery = '',
  externalAddTrigger = 0,
  onDataChanged,
}) {
  const [subTab, setSubTab] = useState('users') // 'users' | 'tokens'
  const [users, setUsers] = useState([])
  const [childrenTokens, setChildrenTokens] = useState([])
  const [posyandus, setPosyandus] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [form, setForm] = useState(EMPTY_USER)
  const [roleFilter, setRoleFilter] = useState('all')
  const [userPage, setUserPage] = useState(1)
  const [userPageSize, setUserPageSize] = useState(5)
  const [tokenPage, setTokenPage] = useState(1)
  const [tokenPageSize, setTokenPageSize] = useState(5)

  const loadData = async () => {
    setLoading(true)
    try {
      const [res, posList] = await Promise.all([
        adminApi.listUsersAndTokens(),
        adminApi.listPosyandus().catch(() => []),
      ])
      setUsers(Array.isArray(res?.users) ? res.users : [])
      setChildrenTokens(Array.isArray(res?.children) ? res.children : [])
      setPosyandus(Array.isArray(posList) ? posList : [])
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Gagal memuat daftar akun & RBAC' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (externalAddTrigger > 0) {
      setEditingUser(null)
      setForm(EMPTY_USER)
      setModalOpen(true)
    }
  }, [externalAddTrigger])

  const openCreateModal = () => {
    setEditingUser(null)
    setForm(EMPTY_USER)
    setModalOpen(true)
  }

  const openEditModal = (u) => {
    setEditingUser(u)
    setForm({
      full_name: u.full_name || '',
      email: u.email || '',
      phone: u.phone || '',
      password: '',
      role: u.role || 'kader',
      posyandu_name: u.posyandu_name || 'Posyandu Melati 04',
      village_name: u.village_name || 'Desa Sukamaju',
      is_active: Boolean(u.is_active),
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setNotice(null)
    try {
      if (editingUser) {
        await adminApi.updateUser(editingUser.id, form)
        setNotice({ type: 'success', text: `Akun ${form.full_name} berhasil diperbarui.` })
      } else {
        await adminApi.createUser(form)
        setNotice({ type: 'success', text: `Akun petugas ${form.full_name} berhasil dibuat.` })
      }
      setModalOpen(false)
      await loadData()
      if (onDataChanged) onDataChanged()
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Gagal menyimpan akun pengguna' })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleUser = async (u) => {
    try {
      await adminApi.toggleUserActive(u.id)
      setNotice({
        type: 'success',
        text: `Status akses ${u.full_name} diubah menjadi ${u.is_active ? 'Nonaktif' : 'Aktif'}.`,
      })
      await loadData()
      if (onDataChanged) onDataChanged()
    } catch (err) {
      setNotice({ type: 'error', text: err.message })
    }
  }

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`Hapus akun ${u.full_name} (${u.email})?`)) return
    try {
      await adminApi.deleteUser(u.id)
      setNotice({ type: 'success', text: `Akun ${u.full_name} telah dihapus.` })
      await loadData()
      if (onDataChanged) onDataChanged()
    } catch (err) {
      setNotice({ type: 'error', text: err.message })
    }
  }

  const handleRegenerateToken = async (child) => {
    try {
      const updated = await adminApi.regenerateChildToken(child.id)
      setNotice({
        type: 'success',
        text: `Magic Token baru untuk Ananda ${child.full_name} berhasil diterbitkan: ${updated.magic_token}`,
      })
      await loadData()
    } catch (err) {
      setNotice({ type: 'error', text: err.message })
    }
  }

  const handleCopyMagicLink = (token, childName) => {
    const url = `${window.location.origin}${window.location.pathname}#/p/${token}`
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
    }
    setNotice({
      type: 'success',
      text: `Tautan Kartu Gizi Digital Ananda ${childName} disalin ke papan klip.`,
    })
  }

  const roleBadge = (role) => {
    const r = String(role || '').toLowerCase()
    if (r === 'admin') return 'bg-slate-900 text-white'
    if (r === 'bidan') return 'bg-sky-50 text-[#2597d0] border border-sky-200'
    if (r === 'kader') return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    return 'bg-amber-50 text-amber-700 border border-amber-200'
  }

  const filteredUsers = users.filter((u) => {
    if (roleFilter === 'inactive') {
      if (u.is_active) return false
    } else if (roleFilter !== 'all') {
      if (String(u.role || '').toLowerCase() !== roleFilter) return false
    }
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q) ||
      (u.posyandu_name || '').toLowerCase().includes(q)
    )
  })

  const handleExportUsersCSV = () => {
    const headers = ['Nama Lengkap', 'Email', 'No HP', 'Role RBAC', 'Unit Posyandu', 'Desa', 'Status']
    const rows = filteredUsers.map((u) => [
      `"${(u.full_name || '').replace(/"/g, '""')}"`,
      `"${u.email || ''}"`,
      `"${u.phone || ''}"`,
      `"${u.role || ''}"`,
      `"${u.posyandu_name || ''}"`,
      `"${u.village_name || ''}"`,
      u.is_active ? 'AKTIF' : 'NONAKTIF',
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'Daftar_Akun_RBAC_Desa_Sukamaju.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const filteredTokens = childrenTokens.filter((c) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      (c.full_name || '').toLowerCase().includes(q) ||
      (c.parent_name || '').toLowerCase().includes(q) ||
      (c.magic_token || '').toLowerCase().includes(q)
    )
  })

  const safeUserPage = Math.min(userPage, Math.max(1, Math.ceil(filteredUsers.length / userPageSize)))
  const paginatedUsers = filteredUsers.slice(
    (safeUserPage - 1) * userPageSize,
    safeUserPage * userPageSize,
  )

  const safeTokenPage = Math.min(
    tokenPage,
    Math.max(1, Math.ceil(filteredTokens.length / tokenPageSize)),
  )
  const paginatedTokens = filteredTokens.slice(
    (safeTokenPage - 1) * tokenPageSize,
    safeTokenPage * tokenPageSize,
  )

  return (
    <div className="space-y-5">
      {/* Top Banner + Sub-Tab Switcher */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">
              Manajemen Akun Petugas, Isolasi Wilayah (RBAC) &amp; Keamanan Token
            </h2>
            <p className="text-[12px] text-slate-500">
              Atur cakupan akses kader per unit Posyandu RW, otorisasi Bidan Desa, serta rotasi Magic Token Kartu Gizi orang tua.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-1 rounded-xl bg-slate-100 flex items-center gap-1 text-[12px] font-semibold">
            <button
              type="button"
              onClick={() => setSubTab('users')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                subTab === 'users' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Akun RBAC ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setSubTab('tokens')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                subTab === 'tokens' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Magic Token &amp; NIK Hash ({childrenTokens.length})
            </button>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1e293b] hover:bg-[#0f172a] text-white text-[12.5px] font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Akun</span>
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

      {subTab === 'users' ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
          <div className="p-4 px-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'Semua Role' },
                { id: 'kader', label: 'Kader Posyandu' },
                { id: 'bidan', label: 'Bidan Desa' },
                { id: 'admin', label: 'Super Admin' },
                { id: 'ortu', label: 'Orang Tua' },
                { id: 'inactive', label: 'Nonaktif' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => {
                    setRoleFilter(pill.id)
                    setUserPage(1)
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[11.5px] font-semibold transition-colors cursor-pointer ${
                    roleFilter === pill.id
                      ? 'bg-[#1e293b] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleExportUsersCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11.5px] font-semibold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Daftar Akun (.CSV)</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-5">Nama Petugas / Pengguna</th>
                  <th className="py-3.5 px-4">Kontak (Email &amp; HP)</th>
                  <th className="py-3.5 px-4">Role RBAC</th>
                  <th className="py-3.5 px-4">Cakupan Wilayah (Row-Level Scope)</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[13px]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Memuat daftar akun RBAC...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Tidak ada akun yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-bold text-[11.5px] flex items-center justify-center shrink-0">
                            {(u.full_name || 'U').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-slate-800 font-semibold">{u.full_name}</p>
                            <p className="text-[11px] text-slate-400">Update: {u.updated_at}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-700">{u.email}</p>
                        <p className="text-[11.5px] text-slate-400">{u.phone}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${roleBadge(
                            u.role,
                          )}`}
                        >
                          <Shield className="w-3 h-3" />
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-700">{u.posyandu_name || '-'}</p>
                        <p className="text-[11px] text-slate-400">{u.village_name}</p>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold ${
                            u.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {u.is_active ? 'AKTIF' : 'NONAKTIF'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11.5px] font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Ubah</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleUser(u)}
                            title={u.is_active ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            title="Hapus Akun"
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 pb-4">
            <PaginationBar
              totalItems={filteredUsers.length}
              currentPage={safeUserPage}
              pageSize={userPageSize}
              onPageChange={setUserPage}
              onPageSizeChange={setUserPageSize}
              pageSizeOptions={[5, 10, 20]}
              itemLabel="akun RBAC"
              compact={true}
            />
          </div>
        </div>
      ) : (
        /* Sub-Tab 2: Magic Token Security & SHA-256 NIK Verification */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
          <div className="p-4 px-5 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[12px] text-slate-600">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>
                Apabila tautan Kartu Gizi Digital orang tua dilaporkan hilang atau bocor, tekan{' '}
                <strong>Terbitkan Ulang Token</strong> untuk mencabut token lama.
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/40 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-5">Nama Balita &amp; Orang Tua</th>
                  <th className="py-3.5 px-4">Unit Posyandu</th>
                  <th className="py-3.5 px-4">Hash NIK (SHA-256 Anonymized)</th>
                  <th className="py-3.5 px-4">Magic Token Aktif</th>
                  <th className="py-3.5 px-5 text-right">Kontrol Keamanan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[12.5px]">
                {paginatedTokens.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-5">
                      <p className="font-bold text-slate-800">{c.full_name}</p>
                      <p className="text-[11px] text-slate-500">
                        Wali: {c.parent_name} ({c.parent_phone})
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {c.posyandu_name} (RW {c.rw_code})
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-emerald-700">
                      <span className="px-2 py-1 rounded bg-emerald-50 border border-emerald-200">
                        {c.nik_hash.slice(0, 22)}...
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11.5px] text-slate-700">
                      {c.magic_token}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyMagicLink(c.magic_token, c.full_name)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Link</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRegenerateToken(c)}
                          className="px-3 py-1.5 rounded-lg bg-[#1e293b] hover:bg-[#0f172a] text-white text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Terbitkan Ulang Token</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 pb-4">
            <PaginationBar
              totalItems={filteredTokens.length}
              currentPage={safeTokenPage}
              pageSize={tokenPageSize}
              onPageChange={setTokenPage}
              onPageSizeChange={setTokenPageSize}
              pageSizeOptions={[5, 10, 20]}
              itemLabel="token balita"
              compact={true}
            />
          </div>
        </div>
      )}

      {/* Modal Add/Edit User */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div>
                <h3 className="text-[16px] font-bold text-slate-800">
                  {editingUser ? 'Ubah Hak Akses & Profil Akun' : 'Tambah Akun Petugas Baru'}
                </h3>
                <p className="text-[11.5px] text-slate-400">
                  Konfigurasi Role-Based Access Control (RBAC) dan isolasi wilayah Posyandu.
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
                  Nama Lengkap Petugas &amp; Gelar *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Cth: Kader Sri Wahyuni (RW 02)"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1e293b]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                    Alamat Email Login *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="sri.kader@tumbuhin.id"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1e293b]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                    Nomor HP / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="081288991122"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1e293b]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                    Peran Sistem (Role RBAC) *
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#1e293b]"
                  >
                    <option value="kader">kader — Petugas Posyandu RW</option>
                    <option value="bidan">bidan — Bidan Desa / Nakes</option>
                    <option value="admin">admin — Super Admin Desa</option>
                    <option value="ortu">ortu — Orang Tua Balita</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                    Unit Posyandu / Instansi (Scoping)
                  </label>
                  <input
                    type="text"
                    list="admin-posyandu-options"
                    value={form.posyandu_name}
                    onChange={(e) => setForm({ ...form, posyandu_name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1e293b]"
                  />
                  <datalist id="admin-posyandu-options">
                    {posyandus.map((p) => (
                      <option key={p.id} value={p.name} />
                    ))}
                    <option value="Puskesmas Sukamaju" />
                    <option value="Pusat Data Desa Sukamaju" />
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                  {editingUser
                    ? 'Kata Sandi Baru (Kosongkan jika tidak ingin mengubah)'
                    : 'Kata Sandi Awal (Bcrypt Hashed) *'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  placeholder={editingUser ? '••••••••••••' : 'Minimal 6 karakter'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
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
                  {saving ? 'Menyimpan...' : 'Simpan Akun RBAC'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
