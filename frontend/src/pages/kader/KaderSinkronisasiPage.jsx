import { useEffect, useState } from 'react'
import {
  RefreshCw,
  Wifi,
  WifiOff,
  Database,
  CheckCircle2,
  Clock,
  CloudUpload,
  AlertCircle,
  AlertTriangle
} from 'lucide-react'
import { kaderApi } from '../../lib/kaderApi'
import {
  countQueue,
  getLastSyncAt,
  isBrowserOffline,
  listQueue,
  removeQueueItems,
  setLastSyncAt,
  subscribeQueue,
  toSyncItem
} from '../../lib/offlineQueue'

const TYPE_LABEL = {
  timbang: 'Input Timbang',
  balita: 'Registrasi Balita',
  measurement: 'Input Timbang',
  child: 'Registrasi Balita'
}

function formatTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return `${date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta'
  })} WIB`
}

function itemTitle(item) {
  if (item.label) return item.label
  if (item.type === 'balita') return item.payload?.nama || 'Balita baru'
  return item.payload?.balitaName || 'Balita'
}

export default function KaderSinkronisasiPage() {
  const [queueItems, setQueueItems] = useState([])
  const [queueCount, setQueueCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [networkOnline, setNetworkOnline] = useState(!isBrowserOffline())
  const [simulateOffline, setSimulateOffline] = useState(false)
  const [lastSyncAt, setLastSyncAtState] = useState(getLastSyncAt())
  const [backendStatus, setBackendStatus] = useState(null)
  const [backendError, setBackendError] = useState('')
  const [syncSummary, setSyncSummary] = useState(null)
  const [syncError, setSyncError] = useState('')

  const isOnline = networkOnline && !simulateOffline

  const loadQueue = async () => {
    try {
      const items = await listQueue()
      setQueueItems(items)
      setQueueCount(items.length)
    } catch (err) {
      setSyncError(`Gagal membaca IndexedDB: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const loadBackendStatus = async () => {
    try {
      const data = await kaderApi.getSyncStatus(30)
      setBackendStatus(data)
      setBackendError('')
      if (data?.last_synced_at) {
        setLastSyncAtState(data.last_synced_at)
      }
    } catch (err) {
      setBackendError(err.message || 'Gagal memuat riwayat sinkronisasi dari server.')
    }
  }

  useEffect(() => {
    loadQueue()
    loadBackendStatus()

    const refreshCount = async () => {
      try {
        setQueueCount(await countQueue())
      } catch {
        setQueueCount(0)
      }
    }
    refreshCount()

    const unsubscribe = subscribeQueue(() => {
      loadQueue()
      refreshCount()
    })

    const handleOnline = () => setNetworkOnline(true)
    const handleOffline = () => setNetworkOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      unsubscribe()
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleSync = async () => {
    if (!isOnline || queueItems.length === 0 || isSyncing) return

    setIsSyncing(true)
    setSyncError('')
    setSyncSummary(null)

    try {
      const items = await Promise.all(queueItems.map(toSyncItem))
      const result = await kaderApi.postSyncBatch({
        batchId: `batch-${Date.now()}`,
        deviceId: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 120) : '',
        items
      })

      const results = Array.isArray(result?.results) ? result.results : []
      const finishedIds = results
        .filter((entry) => entry.status === 'SYNCED' || entry.status === 'CONFLICT')
        .map((entry) => entry.clientId)
        .filter(Boolean)

      if (finishedIds.length > 0) {
        await removeQueueItems(finishedIds)
      }

      setLastSyncAt()
      setLastSyncAtState(new Date().toISOString())
      setSyncSummary({
        synced: result?.synced || 0,
        conflict: result?.conflict || 0,
        failed: result?.failed || 0,
        total: result?.total || items.length
      })

      await loadQueue()
      await loadBackendStatus()
    } catch (err) {
      setSyncError(err.message || 'Sinkronisasi gagal. Data tetap aman di IndexedDB.')
      await loadQueue()
    } finally {
      setIsSyncing(false)
    }
  }

  const conflictItems = (backendStatus?.recent_items || []).filter((item) => item.status === 'CONFLICT')
  const totalConflict = backendStatus?.total_conflict || 0
  const totalSynced = backendStatus?.total_synced || 0

  return (
    <div className="max-w-[1140px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#070709]">Antrean Sinkronisasi Offline</h1>
          <p className="text-sm text-gray-500">Data asli dari IndexedDB browser dan riwayat sinkronisasi backend.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-bold ${
            isOnline ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span>{isOnline ? 'Online (Tersinkron ke Cloud)' : 'Mode Offline Aktif'}</span>
          </div>

          <button
            onClick={() => setSimulateOffline((value) => !value)}
            className="px-4 py-2 rounded-2xl bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50"
          >
            {simulateOffline ? 'Aktifkan Sinyal' : 'Simulasi Offline'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-black/8 rounded-3xl p-6 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase">Antrean Lokal</p>
            <h3 className="text-2xl font-black text-[#070709] mt-1">{queueCount} Data</h3>
            <p className="text-[11px] text-gray-400 mt-1">{totalSynced} item sudah tersinkron di server</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2597d0] flex items-center justify-center">
            <Database className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-black/8 rounded-3xl p-6 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase">Konflik di Server</p>
            <h3 className={`text-2xl font-black mt-1 ${totalConflict > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {totalConflict} Data
            </h3>
            <p className="text-[11px] text-gray-400 mt-1">Perlu tinjauan kader</p>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            totalConflict > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
          }`}>
            {totalConflict > 0 ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
          </div>
        </div>

        <div className="bg-white border border-black/8 rounded-3xl p-6 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase">Terakhir Sinkron</p>
            <h3 className="text-2xl font-black text-gray-700 mt-1">
              {lastSyncAt ? formatTime(lastSyncAt) : 'Belum Ada'}
            </h3>
            <p className="text-[11px] text-gray-400 mt-1">Waktu server backend</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {syncError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {syncError}
        </div>
      )}

      {backendError && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Backend belum memberi data riwayat: {backendError}
        </div>
      )}

      {syncSummary && (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-700">
          Batch {syncSummary.total} item diproses: {syncSummary.synced} berhasil, {syncSummary.conflict} konflik, {syncSummary.failed} gagal.
        </div>
      )}

      <div className="bg-white border border-black/8 rounded-3xl overflow-hidden shadow-2xs">
        <div className="bg-[#f5f8fc] p-5 border-b border-black/5 flex items-center justify-between gap-3">
          <h3 className="font-bold text-[#070709]">Daftar Transaksi Menunggu Pengiriman</h3>
          {queueCount > 0 && (
            <button
              onClick={handleSync}
              disabled={isSyncing || !isOnline}
              className="px-5 py-2.5 rounded-xl bg-[#2597d0] text-white text-xs font-bold flex items-center gap-2 hover:bg-[#1a7eb3] disabled:opacity-50 transition-all shadow-md shadow-[#2597d0]/20"
            >
              <CloudUpload className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
              <span>{isSyncing ? 'Mengirim ke Cloud...' : 'Sinkronkan Sekarang'}</span>
            </button>
          )}
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="py-12 flex items-center justify-center text-gray-400 gap-2 text-sm">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Membaca antrean IndexedDB...
            </div>
          ) : queueItems.length === 0 ? (
            <div className="py-16 text-center text-gray-400 flex flex-col items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
              <p className="text-sm font-bold text-gray-700">Tidak Ada Antrean Lokal</p>
              <p className="text-xs text-gray-400 mt-1">Semua transaksi offline sudah dikirim atau belum ada input baru.</p>
            </div>
          ) : (
            <div className="divide-y divide-black/5">
              {queueItems.map((item) => (
                <div key={item.clientId} className="py-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                      {(item.clientId || '').slice(0, 6).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-[#070709] truncate">
                        {TYPE_LABEL[item.type] || item.type}: {itemTitle(item)}
                      </h4>
                      <p className="text-xs text-gray-400 truncate">
                        Dicatat {formatTime(item.queuedAt)} • Tersimpan di IndexedDB
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold uppercase shrink-0">
                    Menunggu Jaringan
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {conflictItems.length > 0 && (
        <div className="bg-white border border-rose-200 rounded-3xl overflow-hidden shadow-2xs">
          <div className="bg-rose-50 p-5 border-b border-rose-100">
            <h3 className="font-bold text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Perlu Tinjauan Konflik
            </h3>
            <p className="text-xs text-rose-600 mt-1">
              Data ini sudah tercatat di server tetapi tidak otomatis ditimpa. Periksa isi pesan sebelum melakukan input ulang.
            </p>
          </div>
          <div className="divide-y divide-rose-100">
            {conflictItems.map((item) => (
              <div key={item.id} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-800">
                    {TYPE_LABEL[item.type] || item.type} • {formatTime(item.updatedAt)}
                  </p>
                  <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold uppercase">
                    {item.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{item.message || 'Tidak ada detail konflik.'}</p>
                <p className="text-[11px] text-slate-400 mt-1">clientId: {item.clientId}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
