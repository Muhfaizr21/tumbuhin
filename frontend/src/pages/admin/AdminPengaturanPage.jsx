import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  Download,
  Lock,
  MessageSquare,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
} from 'lucide-react'
import PaginationBar from '../../components/ui/PaginationBar'
import { adminApi } from '../../lib/adminApi'

/**
 * Module 3.7: Log Sinkronisasi & Pengaturan Desa (/admin/pengaturan)
 * Manages village government metadata, WhatsApp broadcast templates, SHA-256 privacy enforcement, and offline sync logs.
 */
export default function AdminPengaturanPage({ onDataChanged }) {
  const [settings, setSettings] = useState({
    village_name: 'Desa Sukamaju',
    district_name: 'Kecamatan Cibinong',
    regency_name: 'Kabupaten Bogor',
    province_name: 'Jawa Barat',
    village_head_name: 'H. Suryadi Pratama, S.AP',
    puskesmas_name: 'UPTD Puskesmas Sukamaju',
    default_posyandu_schedule: 'Sabtu Minggu Ke-2 Setiap Bulan (08.30 - 11.30 WIB)',
    wa_template:
      'Halo Ibu/Bapak {parent_name}, berikut ringkasan tumbuh kembang Ananda {child_name} bulan ini: BB {weight_kg} kg, TB {height_cm} cm ({nutrition_status}). Pantau kurva KMS & resep MPASI harian di Kartu Gizi Digital: {magic_link}',
    stunting_target_percent: 14.0,
    auto_sync_enabled: true,
    sha256_enforced: true,
  })
  const [syncLogs, setSyncLogs] = useState([])
  const [auditMetrics, setAuditMetrics] = useState({
    totalAnonymizedNIK: 2,
    activeMagicTokens: 2,
    supervisionLocksCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const [syncPage, setSyncPage] = useState(1)
  const [syncPageSize, setSyncPageSize] = useState(5)

  const loadSettings = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getSettingsAndAudit()
      if (data?.settings) {
        setSettings(data.settings)
      }
      setSyncLogs(Array.isArray(data?.sync_logs) ? data.sync_logs : [])
      setAuditMetrics({
        totalAnonymizedNIK: data?.total_anonymized_nik ?? 2,
        activeMagicTokens: data?.active_magic_tokens ?? 2,
        supervisionLocksCount: data?.supervision_locks_count ?? 0,
      })
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Gagal memuat pengaturan desa' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setNotice(null)
    try {
      const updated = await adminApi.updateVillageSettings({
        ...settings,
        stunting_target_percent: Number(settings.stunting_target_percent),
      })
      if (updated) setSettings(updated)
      setNotice({
        type: 'success',
        text: 'Konfigurasi pemerintahan desa, target prevalensi, dan template WhatsApp berhasil disimpan ke PostgreSQL.',
      })
      if (onDataChanged) onDataChanged()
    } catch (err) {
      setNotice({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  const previewWaMessage = (settings.wa_template || '')
    .replace('{parent_name}', 'Ibu Dewi Lestari')
    .replace('{child_name}', 'Andi Pratama')
    .replace('{weight_kg}', '9.8')
    .replace('{height_cm}', '76.5')
    .replace('{nutrition_status}', 'Gizi Baik - Pita Hijau KMS')
    .replace('{magic_link}', 'https://tumbuhin.id/#/p/magic-balita-andi-2026-tumbuhin-sehat')

  const handleResolveSyncLog = async (log) => {
    try {
      await adminApi.resolveSyncLog(log.id)
      setNotice({
        type: 'success',
        text: `Log sinkronisasi ${log.client_id} berhasil diverifikasi dan ditandai SYNCED.`,
      })
      await loadSettings()
    } catch (err) {
      setNotice({ type: 'error', text: err.message })
    }
  }

  const handleExportSyncLogsCSV = () => {
    const headers = ['Waktu Sinkronisasi', 'Petugas Kader', 'Tipe Item', 'Client Queue ID', 'Pesan Server', 'Status']
    const rows = syncLogs.map((l) => [
      `"${l.updated_at || ''}"`,
      `"${l.kader_name || ''}"`,
      `"${l.item_type || ''}"`,
      `"${l.client_id || ''}"`,
      `"${(l.message || '').replace(/"/g, '""')}"`,
      `"${l.status || ''}"`,
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'Audit_Log_Sinkronisasi_Offline_PWA.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const safeSyncPage = Math.min(syncPage, Math.max(1, Math.ceil(syncLogs.length / syncPageSize)))
  const paginatedSyncLogs = syncLogs.slice(
    (safeSyncPage - 1) * syncPageSize,
    safeSyncPage * syncPageSize,
  )

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">
              Log Sinkronisasi Offline, Privasi SHA-256 &amp; Pengaturan Pemerintahan Desa
            </h2>
            <p className="text-[12px] text-slate-500">
              Atur identitas instansi kop laporan PDF e-PPGBM Bidan, template pesan WhatsApp Kader, dan audit antrean sinkronisasi PWA.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={loadSettings}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-[12px] font-semibold cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Muat Ulang</span>
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

      {/* 3 Security & Compliance Summary Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-400">
              Anonimisasi NIK (SHA-256)
            </span>
            <p className="text-[19px] font-bold text-slate-800 mt-0.5">
              {auditMetrics.totalAnonymizedNIK} Profil Terenkripsi
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              0 NIK mentah tersimpan di database
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-400">
              Magic Link Token Aktif
            </span>
            <p className="text-[19px] font-bold text-slate-800 mt-0.5">
              {auditMetrics.activeMagicTokens} Portal Ortu
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Akses Kartu Gizi Digital Read-Only
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#2597d0] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-400">
              Periode Terkunci Bidan
            </span>
            <p className="text-[19px] font-bold text-slate-800 mt-0.5">
              {auditMetrics.supervisionLocksCount} Unit Tervalidasi
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Supervisi laporan bulanan e-PPGBM
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Governance & WhatsApp Template Form */}
      <form
        onSubmit={handleSave}
        className="bg-white rounded-2xl border border-slate-100 p-6 shadow-2xs space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-[16px] font-bold text-slate-800">
              Profil Pemerintahan Desa &amp; Template Pesan WhatsApp Orang Tua
            </h3>
            <p className="text-[12px] text-slate-500">
              Digunakan secara otomatis pada kop laporan PDF Bidan Desa dan fitur One-Click WhatsApp Kader.
            </p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1e293b] hover:bg-[#0f172a] text-white text-[12.5px] font-semibold cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan Desa'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-[13px]">
          <div>
            <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
              Nama Desa / Kelurahan
            </label>
            <input
              type="text"
              value={settings.village_name}
              onChange={(e) => setSettings({ ...settings, village_name: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
            />
          </div>
          <div>
            <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
              Kecamatan
            </label>
            <input
              type="text"
              value={settings.district_name}
              onChange={(e) => setSettings({ ...settings, district_name: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
            />
          </div>
          <div>
            <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
              Kabupaten / Kota
            </label>
            <input
              type="text"
              value={settings.regency_name}
              onChange={(e) => setSettings({ ...settings, regency_name: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
            />
          </div>
          <div>
            <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
              Provinsi
            </label>
            <input
              type="text"
              value={settings.province_name}
              onChange={(e) => setSettings({ ...settings, province_name: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[13px]">
          <div>
            <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
              Kepala Desa / Penanggung Jawab
            </label>
            <input
              type="text"
              value={settings.village_head_name}
              onChange={(e) => setSettings({ ...settings, village_head_name: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
            />
          </div>
          <div>
            <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
              Puskesmas Pembina
            </label>
            <input
              type="text"
              value={settings.puskesmas_name}
              onChange={(e) => setSettings({ ...settings, puskesmas_name: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
            />
          </div>
          <div>
            <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
              Target Maksimal Stunting Desa (%)
            </label>
            <input
              type="number"
              step="0.5"
              value={settings.stunting_target_percent}
              onChange={(e) =>
                setSettings({ ...settings, stunting_target_percent: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-2">
          <div className="lg:col-span-7 space-y-1.5">
            <label className="block text-[11.5px] font-bold text-slate-600">
              Template Pengantar WhatsApp Kartu Gizi Digital Orang Tua
            </label>
            <textarea
              rows={3}
              value={settings.wa_template}
              onChange={(e) => setSettings({ ...settings, wa_template: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-[12.5px]"
            />
            <p className="text-[11px] text-slate-400">
              Variabel tersedia: <code>{'{parent_name}'}</code>, <code>{'{child_name}'}</code>,{' '}
              <code>{'{weight_kg}'}</code>, <code>{'{height_cm}'}</code>,{' '}
              <code>{'{nutrition_status}'}</code>, <code>{'{magic_link}'}</code>
            </p>
          </div>

          <div className="lg:col-span-5 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-emerald-800">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Pratinjau Pesan WhatsApp Orang Tua</span>
            </div>
            <p className="text-[12px] text-emerald-950 leading-relaxed">{previewWaMessage}</p>
          </div>
        </div>
      </form>

      {/* Offline Batch Sync Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-[15.5px] font-bold text-slate-800">
              Audit Log Sinkronisasi Antrean Offline Kader (IndexedDB → PostgreSQL)
            </h3>
            <p className="text-[12px] text-slate-500">
              Rekam jejak idempotensi pengiriman batch data timbangan saat kader kembali mendapatkan sinyal internet.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportSyncLogsCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11.5px] font-semibold cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh Log Audit (.CSV)</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-5">Waktu Sinkronisasi</th>
                <th className="py-3 px-4">Petugas Kader</th>
                <th className="py-3 px-4">Tipe Item</th>
                <th className="py-3 px-4">Client Queue ID</th>
                <th className="py-3 px-4">Pesan Server</th>
                <th className="py-3 px-5 text-right">Status &amp; Resolusi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[12.5px]">
              {syncLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-7 text-center text-slate-400">
                    Seluruh antrean IndexedDB bersih. Tidak ada konflik sinkronisasi offline.
                  </td>
                </tr>
              ) : (
                paginatedSyncLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-5 text-slate-600">{log.updated_at}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{log.kader_name}</td>
                    <td className="py-3 px-4 uppercase font-mono text-[11px] text-slate-600">
                      {log.item_type}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {log.client_id}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{log.message}</td>
                    <td className="py-3 px-5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10.5px] font-bold">
                          {log.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleResolveSyncLog(log)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-semibold cursor-pointer"
                        >
                          Verifikasi
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {syncLogs.length > 0 && (
          <div className="px-5 pb-4">
            <PaginationBar
              totalItems={syncLogs.length}
              currentPage={safeSyncPage}
              pageSize={syncPageSize}
              onPageChange={setSyncPage}
              onPageSizeChange={setSyncPageSize}
              pageSizeOptions={[5, 10, 20]}
              itemLabel="log sinkronisasi"
              compact={true}
            />
          </div>
        )}
      </div>
    </div>
  )
}
