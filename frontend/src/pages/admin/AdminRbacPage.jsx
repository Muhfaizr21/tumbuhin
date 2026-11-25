import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  Copy,
  KeyRound,
  Lock,
  MapPin,
  RefreshCw,
  Save,
  Shield,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'
import PaginationBar from '../../components/ui/PaginationBar'
import { adminApi } from '../../lib/adminApi'

const RBAC_POLICY_MATRIX = [
  {
    capability: 'Master Wilayah Posyandu & Koordinat GIS',
    module: 'Modul Wilayah (/admin/wilayah)',
    admin: { label: 'FULL CRUD', tone: 'emerald' },
    bidan: { label: 'READ GIS CLUSTER', tone: 'sky' },
    kader: { label: 'READ UNIT SENDIRI', tone: 'amber' },
    ortu: { label: 'JADWAL POSYANDU', tone: 'slate' },
  },
  {
    capability: 'Manajemen Data User & Otorisasi RBAC',
    module: 'Modul User & RBAC (/admin/pengguna & /admin/rbac)',
    admin: { label: 'FULL CRUD & ROTASI', tone: 'emerald' },
    bidan: { label: 'NO ACCESS', tone: 'rose' },
    kader: { label: 'NO ACCESS', tone: 'rose' },
    ortu: { label: 'NO ACCESS', tone: 'rose' },
  },
  {
    capability: 'Katalog Harga Pangan Lokal & Knowledge Base RAG',
    module: 'Modul Pangan & RAG (/admin/pangan-lokal & /admin/knowledge-base)',
    admin: { label: 'FULL CRUD & RE-INDEX', tone: 'emerald' },
    bidan: { label: 'READ REFERENSI KLINIS', tone: 'sky' },
    kader: { label: 'KONSUMSI AI NUTRI-CHEF', tone: 'amber' },
    ortu: { label: 'TERIMA RESEP MPASI', tone: 'slate' },
  },
  {
    capability: 'Peta Spasial Klaster, Triase Stunting & Home Visit SOAP',
    module: 'Workspace Bidan (/bidan/*)',
    admin: { label: 'AUDIT & MONITORING', tone: 'sky' },
    bidan: { label: 'FULL CLINICAL CRUD', tone: 'emerald' },
    kader: { label: 'TERIMA INSTRUKSI BIDAN', tone: 'amber' },
    ortu: { label: 'BACA CATATAN BIDAN', tone: 'slate' },
  },
  {
    capability: 'Supervisi Kunci Data Bulanan & Export e-PPGBM',
    module: 'Modul Supervisi (/bidan/supervisi & /bidan/laporan)',
    admin: { label: 'AUDIT LOG SINKRONISASI', tone: 'sky' },
    bidan: { label: 'LOCK/UNLOCK & EXPORT', tone: 'emerald' },
    kader: { label: 'TERKUNCI SAAT VALIDASI', tone: 'amber' },
    ortu: { label: 'NO ACCESS', tone: 'rose' },
  },
  {
    capability: 'Input Antropometri Meja 3 & Offline Sync IndexedDB',
    module: 'Workspace Kader (/kader/*)',
    admin: { label: 'RESOLVE SYNC CONFLICT', tone: 'sky' },
    bidan: { label: 'VERIFIKASI Z-SCORE WHO', tone: 'sky' },
    kader: { label: 'FULL CRUD (SCOPED RW)', tone: 'emerald' },
    ortu: { label: 'NO ACCESS', tone: 'rose' },
  },
  {
    capability: 'Portal Kartu Gizi Digital & Kurva KMS Ananda',
    module: 'Portal Orang Tua (/ortu/* & /p/:token)',
    admin: { label: 'ROTASI MAGIC TOKEN', tone: 'emerald' },
    bidan: { label: 'KIRIM PESAN EDUKASI', tone: 'sky' },
    kader: { label: 'BAGIKAN MAGIC LINK WA', tone: 'amber' },
    ortu: { label: 'READ ANAK SENDIRI', tone: 'emerald' },
  },
]

function policyBadgeClass(tone) {
  switch (tone) {
    case 'emerald':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    case 'sky':
      return 'bg-sky-50 text-[#2597d0] border border-sky-200'
    case 'amber':
      return 'bg-amber-50 text-amber-700 border border-amber-200'
    case 'rose':
      return 'bg-rose-50 text-rose-600 border border-rose-200'
    default:
      return 'bg-slate-100 text-slate-600 border border-slate-200'
  }
}

/**
 * Modul Khusus: Manajemen Role, Hak Akses (RBAC) & Keamanan Token (/admin/rbac)
 * Dipisahkan secara tegas dari Manajemen Data User (/admin/pengguna).
 */
export default function AdminRbacPage({ searchQuery = '', onDataChanged }) {
  const [subTab, setSubTab] = useState('assignment') // 'assignment' | 'matrix' | 'tokens'
  const [users, setUsers] = useState([])
  const [childrenTokens, setChildrenTokens] = useState([])
  const [posyandus, setPosyandus] = useState([])
  const [draftScopes, setDraftScopes] = useState({})
  const [loading, setLoading] = useState(true)
  const [savingUserId, setSavingUserId] = useState(null)
  const [notice, setNotice] = useState(null)
  const [roleFilter, setRoleFilter] = useState('all')
  const [scopePage, setScopePage] = useState(1)
  const [scopePageSize, setScopePageSize] = useState(5)
  const [tokenPage, setTokenPage] = useState(1)
  const [tokenPageSize, setTokenPageSize] = useState(5)

  const loadRbacData = async () => {
    setLoading(true)
    try {
      const [res, posList] = await Promise.all([
        adminApi.listUsersAndTokens(),
        adminApi.listPosyandus().catch(() => []),
      ])
      const loadedUsers = Array.isArray(res?.users) ? res.users : []
      setUsers(loadedUsers)
      setChildrenTokens(Array.isArray(res?.children) ? res.children : [])
      setPosyandus(Array.isArray(posList) ? posList : [])

      const initialDrafts = {}
      loadedUsers.forEach((u) => {
        initialDrafts[u.id] = {
          role: String(u.role || 'kader').toLowerCase(),
          posyandu_name: u.posyandu_name || 'Posyandu Melati 04',
        }
      })
      setDraftScopes(initialDrafts)
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Gagal memuat konfigurasi RBAC & Token' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRbacData()
  }, [])

  const handleDraftChange = (userId, field, value) => {
    setDraftScopes((prev) => ({
      ...prev,
      [userId]: {
        ...(prev[userId] || {}),
        [field]: value,
      },
    }))
  }

  const handleSaveUserRbac = async (userRecord) => {
    const draft = draftScopes[userRecord.id]
    if (!draft) return
    setSavingUserId(userRecord.id)
    setNotice(null)
    try {
      await adminApi.updateUser(userRecord.id, {
        full_name: userRecord.full_name,
        email: userRecord.email,
        phone: userRecord.phone,
        password: '',
        role: draft.role,
        posyandu_name: draft.posyandu_name,
        village_name: userRecord.village_name || 'Desa Sukamaju',
        is_active: Boolean(userRecord.is_active),
      })
      setNotice({
        type: 'success',
        text: `Otorisasi RBAC & cakupan wilayah untuk ${userRecord.full_name} berhasil diperbarui menjadi Role ${draft.role.toUpperCase()} (${draft.posyandu_name}).`,
      })
      await loadRbacData()
      if (onDataChanged) onDataChanged()
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Gagal memperbarui hak akses RBAC' })
    } finally {
      setSavingUserId(null)
    }
  }

  const handleRegenerateToken = async (child) => {
    try {
      const updated = await adminApi.regenerateChildToken(child.id)
      setNotice({
        type: 'success',
        text: `Magic Token baru untuk Ananda ${child.full_name} berhasil diterbitkan: ${updated.magic_token}`,
      })
      await loadRbacData()
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
    if (roleFilter !== 'all' && String(u.role || '').toLowerCase() !== roleFilter) {
      return false
    }
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q) ||
      (u.posyandu_name || '').toLowerCase().includes(q)
    )
  })

  const filteredTokens = childrenTokens.filter((c) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      (c.full_name || '').toLowerCase().includes(q) ||
      (c.parent_name || '').toLowerCase().includes(q) ||
      (c.magic_token || '').toLowerCase().includes(q)
    )
  })

  const safeScopePage = Math.min(
    scopePage,
    Math.max(1, Math.ceil(filteredUsers.length / scopePageSize)),
  )
  const paginatedScopeUsers = filteredUsers.slice(
    (safeScopePage - 1) * scopePageSize,
    safeScopePage * scopePageSize,
  )

  const safeTokenPage = Math.min(
    tokenPage,
    Math.max(1, Math.ceil(filteredTokens.length / tokenPageSize)),
  )
  const paginatedTokens = filteredTokens.slice(
    (safeTokenPage - 1) * tokenPageSize,
    safeTokenPage * tokenPageSize,
  )

  const roleCounts = {
    admin: users.filter((u) => String(u.role).toLowerCase() === 'admin').length,
    bidan: users.filter((u) => String(u.role).toLowerCase() === 'bidan').length,
    kader: users.filter((u) => String(u.role).toLowerCase() === 'kader').length,
    ortu: users.filter((u) => String(u.role).toLowerCase() === 'ortu').length,
  }

  return (
    <div className="space-y-5">
      {/* Top Banner + Sub-Tab Switcher */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-orange-50 text-[#f26522] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">
              Manajemen Role-Based Access Control (RBAC) &amp; Isolasi Wilayah
            </h2>
            <p className="text-[12px] text-slate-500">
              Konfigurasi matriks hak akses 4 role, penugasan cakupan wilayah Posyandu RW (Row-Level Scoping), serta keamanan Magic Token &amp; SHA-256 NIK.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="p-1 rounded-xl bg-slate-100 flex flex-wrap items-center gap-1 text-[12px] font-semibold">
            <button
              type="button"
              onClick={() => setSubTab('assignment')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                subTab === 'assignment' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Otorisasi Role &amp; Wilayah ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setSubTab('matrix')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                subTab === 'matrix' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Matriks Hak Akses (4 Role)
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
            onClick={loadRbacData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-[12px] font-semibold cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* Role Distribution Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              ROLE: SUPER ADMIN
            </span>
            <p className="text-[20px] font-extrabold text-slate-800 mt-0.5">
              {roleCounts.admin} <span className="text-[12px] font-semibold text-slate-500">Pemegang</span>
            </p>
            <span className="text-[11px] text-emerald-600 font-semibold">
              Cakupan: Seluruh Desa (Global)
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-slate-900 text-white">
            ADMIN
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              ROLE: BIDAN DESA
            </span>
            <p className="text-[20px] font-extrabold text-slate-800 mt-0.5">
              {roleCounts.bidan} <span className="text-[12px] font-semibold text-slate-500">Pemegang</span>
            </p>
            <span className="text-[11px] text-[#2597d0] font-semibold">
              Cakupan: Lintas RW &amp; Puskesmas
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-sky-50 text-[#2597d0] border border-sky-200">
            BIDAN
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              ROLE: KADER POSYANDU
            </span>
            <p className="text-[20px] font-extrabold text-slate-800 mt-0.5">
              {roleCounts.kader} <span className="text-[12px] font-semibold text-slate-500">Pemegang</span>
            </p>
            <span className="text-[11px] text-emerald-700 font-semibold">
              Cakupan: Terisolasi per Unit RW
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            KADER
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              ROLE: ORANG TUA &amp; TOKEN
            </span>
            <p className="text-[20px] font-extrabold text-slate-800 mt-0.5">
              {roleCounts.ortu} <span className="text-[12px] font-semibold text-slate-500">Akun</span> •{' '}
              {childrenTokens.length} <span className="text-[12px] font-semibold text-slate-500">Token</span>
            </p>
            <span className="text-[11px] text-amber-700 font-semibold">
              Cakupan: Hanya Kartu Gizi Anak Sendiri
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            ORTU
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

      {subTab === 'assignment' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
          <div className="p-4 px-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'Semua Otorisasi Role' },
                { id: 'admin', label: 'Role Admin' },
                { id: 'bidan', label: 'Role Bidan' },
                { id: 'kader', label: 'Role Kader' },
                { id: 'ortu', label: 'Role Ortu' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => {
                    setRoleFilter(pill.id)
                    setScopePage(1)
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
            <span className="text-[11.5px] text-slate-500 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-[#f26522]" />
              <span>Ubah Role atau Cakupan Posyandu lalu klik <strong>Simpan Otorisasi</strong></span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-5">Subjek Pengguna</th>
                  <th className="py-3.5 px-4">Role Saat Ini</th>
                  <th className="py-3.5 px-4">Tetapkan Role RBAC Baru</th>
                  <th className="py-3.5 px-4">Isolasi Wilayah (Row-Level Scope Posyandu)</th>
                  <th className="py-3.5 px-5 text-right">Tindakan Otorisasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[13px]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Memuat kebijakan RBAC &amp; cakupan wilayah...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Tidak ada subjek pengguna pada filter role ini.
                    </td>
                  </tr>
                ) : (
                  paginatedScopeUsers.map((u) => {
                    const draft = draftScopes[u.id] || {
                      role: u.role,
                      posyandu_name: u.posyandu_name,
                    }
                    const isModified =
                      String(draft.role).toLowerCase() !== String(u.role).toLowerCase() ||
                      (draft.posyandu_name || '') !== (u.posyandu_name || '')

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-5">
                          <p className="font-bold text-slate-800">{u.full_name}</p>
                          <p className="text-[11.5px] text-slate-400">{u.email}</p>
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
                          <select
                            value={draft.role}
                            onChange={(e) => handleDraftChange(u.id, 'role', e.target.value)}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-[12.5px] font-semibold text-slate-700 focus:outline-none focus:border-[#1e293b]"
                          >
                            <option value="kader">kader — Petugas Posyandu RW</option>
                            <option value="bidan">bidan — Bidan Desa / Nakes</option>
                            <option value="admin">admin — Super Admin Desa</option>
                            <option value="ortu">ortu — Orang Tua Balita</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <input
                              type="text"
                              list={`rbac-posyandu-list-${u.id}`}
                              value={draft.posyandu_name}
                              onChange={(e) =>
                                handleDraftChange(u.id, 'posyandu_name', e.target.value)
                              }
                              className="w-full max-w-[230px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-[12.5px] font-medium text-slate-700 focus:outline-none focus:border-[#1e293b]"
                            />
                            <datalist id={`rbac-posyandu-list-${u.id}`}>
                              {posyandus.map((p) => (
                                <option key={p.id} value={p.name} />
                              ))}
                              <option value="Puskesmas Sukamaju" />
                              <option value="Pusat Data Desa Sukamaju" />
                            </datalist>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <button
                            type="button"
                            disabled={!isModified || savingUserId === u.id}
                            onClick={() => handleSaveUserRbac(u)}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[11.5px] font-bold transition-all cursor-pointer ${
                              isModified
                                ? 'bg-[#f26522] hover:bg-[#d94e0f] text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>
                              {savingUserId === u.id
                                ? 'Menyimpan...'
                                : isModified
                                  ? 'Simpan Otorisasi'
                                  : 'Tersinkron'}
                            </span>
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 pb-4">
            <PaginationBar
              totalItems={filteredUsers.length}
              currentPage={safeScopePage}
              pageSize={scopePageSize}
              onPageChange={setScopePage}
              onPageSizeChange={setScopePageSize}
              pageSizeOptions={[5, 10, 20]}
              itemLabel="otorisasi akun"
              compact={true}
            />
          </div>
        </div>
      )}

      {subTab === 'matrix' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
          <div className="p-4 px-5 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[12px] text-slate-600">
              <ShieldCheck className="w-4 h-4 text-[#f26522]" />
              <span>
                <strong>Matriks Kebijakan RBAC &amp; Row-Level Security (RLS)</strong> — Mengatur batas otorisasi JWT Middleware dan isolasi cakupan wilayah RW.
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/40 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-5">Kapabilitas &amp; Fitur Sistem</th>
                  <th className="py-3.5 px-4 text-center">Super Admin</th>
                  <th className="py-3.5 px-4 text-center">Bidan Desa</th>
                  <th className="py-3.5 px-4 text-center">Kader Posyandu</th>
                  <th className="py-3.5 px-5 text-center">Orang Tua Balita</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[12.5px]">
                {RBAC_POLICY_MATRIX.map((row) => (
                  <tr key={row.capability} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-5">
                      <p className="font-bold text-slate-800">{row.capability}</p>
                      <p className="text-[11px] text-slate-400">{row.module}</p>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10.5px] font-bold ${policyBadgeClass(
                          row.admin.tone,
                        )}`}
                      >
                        {row.admin.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10.5px] font-bold ${policyBadgeClass(
                          row.bidan.tone,
                        )}`}
                      >
                        {row.bidan.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10.5px] font-bold ${policyBadgeClass(
                          row.kader.tone,
                        )}`}
                      >
                        {row.kader.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10.5px] font-bold ${policyBadgeClass(
                          row.ortu.tone,
                        )}`}
                      >
                        {row.ortu.label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'tokens' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
          <div className="p-4 px-5 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[12px] text-slate-600">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>
                Apabila tautan Kartu Gizi Digital orang tua dilaporkan hilang atau bocor, tekan{' '}
                <strong>Terbitkan Ulang Token</strong> untuk mencabut akses token lama secara instan.
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/40 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-5">Nama Balita &amp; Wali Orang Tua</th>
                  <th className="py-3.5 px-4">Cakupan Posyandu</th>
                  <th className="py-3.5 px-4">Hash NIK (SHA-256 Anonymized)</th>
                  <th className="py-3.5 px-4">Magic Token Aktif</th>
                  <th className="py-3.5 px-5 text-right">Kontrol Otorisasi Token</th>
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
    </div>
  )
}
