import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  Download,
  Edit3,
  Mail,
  Phone,
  Plus,
  Power,
  ShieldCheck,
  Trash2,
  UserCheck,
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
 * Modul Khusus: Manajemen Data User (/admin/pengguna)
 * Fokus murni pada direktori & CRUD data profil pengguna (Petugas Kader, Bidan Desa, Super Admin, dan Orang Tua).
 * Pengaturan kebijakan RBAC, matriks hak akses, dan Magic Token dipisahkan ke AdminRbacPage (/admin/rbac).
 */
export default function AdminPenggunaPage({
  searchQuery = '',
  externalAddTrigger = 0,
  onDataChanged,
  onNavigateRbac,
}) {
  const [users, setUsers] = useState([])
  const [posyandus, setPosyandus] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [form, setForm] = useState(EMPTY_USER)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [userPage, setUserPage] = useState(1)
  const [userPageSize, setUserPageSize] = useState(5)

  const loadData = async () => {
    setLoading(true)
    try {
      const [res, posList] = await Promise.all([
        adminApi.listUsersAndTokens(),
        adminApi.listPosyandus().catch(() => []),
      ])
      setUsers(Array.isArray(res?.users) ? res.users : [])
      setPosyandus(Array.isArray(posList) ? posList : [])
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Gagal memuat daftar data user' })
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
        setNotice({ type: 'success', text: `Data user ${form.full_name} berhasil diperbarui.` })
      } else {
        await adminApi.createUser(form)
        setNotice({ type: 'success', text: `User baru ${form.full_name} berhasil ditambahkan.` })
      }
      setModalOpen(false)
      await loadData()
      if (onDataChanged) onDataChanged()
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Gagal menyimpan data user' })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleUser = async (u) => {
    try {
      await adminApi.toggleUserActive(u.id)
      setNotice({
        type: 'success',
        text: `Status akun user ${u.full_name} diubah menjadi ${u.is_active ? 'Nonaktif' : 'Aktif'}.`,
      })
      await loadData()
      if (onDataChanged) onDataChanged()
    } catch (err) {
      setNotice({ type: 'error', text: err.message })
    }
  }

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`Hapus data user ${u.full_name} (${u.email})?`)) return
    try {
      await adminApi.deleteUser(u.id)
      setNotice({ type: 'success', text: `Data user ${u.full_name} telah dihapus.` })
      await loadData()
      if (onDataChanged) onDataChanged()
    } catch (err) {
      setNotice({ type: 'error', text: err.message })
    }
  }

  const userCategoryLabel = (role) => {
    const r = String(role || '').toLowerCase()
    if (r === 'admin') return 'Super Admin Desa'
    if (r === 'bidan') return 'Bidan Desa / Nakes'
    if (r === 'kader') return 'Kader Posyandu'
    return 'Orang Tua Balita'
  }

  const userCategoryBadge = (role) => {
    const r = String(role || '').toLowerCase()
    if (r === 'admin') return 'bg-slate-900 text-white'
    if (r === 'bidan') return 'bg-sky-50 text-[#2597d0] border border-sky-200'
    if (r === 'kader') return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    return 'bg-amber-50 text-amber-700 border border-amber-200'
  }

  const filteredUsers = users.filter((u) => {
    if (categoryFilter === 'inactive') {
      if (u.is_active) return false
    } else if (categoryFilter !== 'all') {
      if (String(u.role || '').toLowerCase() !== categoryFilter) return false
    }
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q) ||
      (u.posyandu_name || '').toLowerCase().includes(q)
    )
  })

  const handleExportUsersCSV = () => {
    const headers = ['ID User', 'Nama Lengkap', 'Email', 'No HP / WhatsApp', 'Kategori Pengguna', 'Unit Posyandu / Instansi', 'Desa', 'Status Akun']
    const rows = filteredUsers.map((u) => [
      `"${u.id || ''}"`,
      `"${(u.full_name || '').replace(/"/g, '""')}"`,
      `"${u.email || ''}"`,
      `"${u.phone || ''}"`,
      `"${userCategoryLabel(u.role)}"`,
      `"${u.posyandu_name || ''}"`,
      `"${u.village_name || ''}"`,
      u.is_active ? 'AKTIF' : 'NONAKTIF',
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'Daftar_Data_User_Desa_Sukamaju.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const safeUserPage = Math.min(userPage, Math.max(1, Math.ceil(filteredUsers.length / userPageSize)))
  const paginatedUsers = filteredUsers.slice(
    (safeUserPage - 1) * userPageSize,
    safeUserPage * userPageSize,
  )

  const activeUsersCount = users.filter((u) => u.is_active).length
  const kaderUsersCount = users.filter((u) => String(u.role).toLowerCase() === 'kader').length
  const bidanUsersCount = users.filter((u) => String(u.role).toLowerCase() === 'bidan').length
  const ortuUsersCount = users.filter((u) => String(u.role).toLowerCase() === 'ortu').length

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">
              Manajemen Data User &amp; Direktori Pengguna Desa
            </h2>
            <p className="text-[12px] text-slate-500">
              Kelola profil lengkap pengguna, kontak email &amp; WhatsApp, penempatan unit instansi, serta status keaktifan akun.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigateRbac && (
            <button
              type="button"
              onClick={onNavigateRbac}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[12px] font-semibold cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-[#f26522]" />
              <span>Buka Pengaturan RBAC &amp; Token</span>
            </button>
          )}
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1e293b] hover:bg-[#0f172a] text-white text-[12.5px] font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Data User</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards for User Directory */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            TOTAL DATA USER
          </span>
          <p className="text-[22px] font-extrabold text-slate-800 mt-0.5">
            {users.length} <span className="text-[12px] font-semibold text-slate-500">Pengguna</span>
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
            <UserCheck className="w-3.5 h-3.5" />
            <span>{activeUsersCount} Akun Aktif Terverifikasi</span>
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            USER KADER POSYANDU
          </span>
          <p className="text-[22px] font-extrabold text-slate-800 mt-0.5">
            {kaderUsersCount} <span className="text-[12px] font-semibold text-slate-500">Petugas</span>
          </p>
          <span className="text-[11px] text-slate-500">
            Operator Meja 3 Posyandu RW
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            USER BIDAN DESA
          </span>
          <p className="text-[22px] font-extrabold text-slate-800 mt-0.5">
            {bidanUsersCount} <span className="text-[12px] font-semibold text-slate-500">Nakes</span>
          </p>
          <span className="text-[11px] text-slate-500">
            Supervisor Klinis Puskesmas
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            USER ORANG TUA BALITA
          </span>
          <p className="text-[22px] font-extrabold text-slate-800 mt-0.5">
            {ortuUsersCount} <span className="text-[12px] font-semibold text-slate-500">Wali Balita</span>
          </p>
          <span className="text-[11px] text-slate-500">
            Pemegang Akun Portal Kartu Gizi
          </span>
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

      {/* Main User Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
        <div className="p-4 px-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: `Semua User (${users.length})` },
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
                  setCategoryFilter(pill.id)
                  setUserPage(1)
                }}
                className={`px-3 py-1.5 rounded-xl text-[11.5px] font-semibold transition-colors cursor-pointer ${
                  categoryFilter === pill.id
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
            <span>Unduh Data User (.CSV)</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-5">Profil User</th>
                <th className="py-3.5 px-4">Kontak (Email &amp; WhatsApp)</th>
                <th className="py-3.5 px-4">Kategori Pengguna</th>
                <th className="py-3.5 px-4">Unit Posyandu / Instansi</th>
                <th className="py-3.5 px-4 text-center">Status Akun</th>
                <th className="py-3.5 px-5 text-right">Aksi Data User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Memuat direktori data user...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada data user yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-bold text-[12px] flex items-center justify-center shrink-0">
                          {(u.full_name || 'U').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-slate-800 font-bold">{u.full_name}</p>
                          <p className="text-[11px] text-slate-400">
                            ID #{u.id} • Terdaftar: {u.created_at || u.updated_at}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-700 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{u.email}</span>
                      </p>
                      <p className="text-[11.5px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{u.phone}</span>
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${userCategoryBadge(
                          u.role,
                        )}`}
                      >
                        {userCategoryLabel(u.role)}
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
                          <span>Edit Profil</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleUser(u)}
                          title={u.is_active ? 'Nonaktifkan User' : 'Aktifkan User'}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u)}
                          title="Hapus Data User"
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
            itemLabel="data user"
            compact={true}
          />
        </div>
      </div>

      {/* Modal Add/Edit Data User */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div>
                <h3 className="text-[16px] font-bold text-slate-800">
                  {editingUser ? 'Ubah Data Profil User' : 'Tambah Data User Baru'}
                </h3>
                <p className="text-[11.5px] text-slate-400">
                  Lengkapi identitas pengguna, kontak login, dan penempatan unit layanan desa.
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
                  Nama Lengkap User &amp; Gelar *
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
                    Kategori Pengguna *
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#1e293b]"
                  >
                    <option value="kader">Kader Posyandu RW</option>
                    <option value="bidan">Bidan Desa / Nakes</option>
                    <option value="admin">Super Admin Desa</option>
                    <option value="ortu">Orang Tua Balita</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                    Unit Posyandu / Instansi
                  </label>
                  <input
                    type="text"
                    list="admin-user-posyandu-options"
                    value={form.posyandu_name}
                    onChange={(e) => setForm({ ...form, posyandu_name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1e293b]"
                  />
                  <datalist id="admin-user-posyandu-options">
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
                    ? 'Kata Sandi Baru (Kosongkan jika tidak diubah)'
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
                  {saving ? 'Menyimpan...' : 'Simpan Data User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
