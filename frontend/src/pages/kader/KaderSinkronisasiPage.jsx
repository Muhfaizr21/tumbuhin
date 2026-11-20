import { useState } from 'react'
import { 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Database, 
  CheckCircle2, 
  Clock, 
  CloudUpload,
  AlertCircle
} from 'lucide-react'

export default function KaderSinkronisasiPage() {
  const [isOnline, setIsOnline] = useState(true)
  const [queueCount, setQueueCount] = useState(3)
  const [isSyncing, setIsSyncing] = useState(false)

  const [queueItems, setQueueItems] = useState([
    { id: 'Q-01', type: 'Input Timbang', target: 'Rania Putri Kirana', timestamp: '10:15 WIB', status: 'Pending' },
    { id: 'Q-02', type: 'Registrasi Balita', target: 'Bayi Ny. Siska', timestamp: '10:22 WIB', status: 'Pending' },
    { id: 'Q-03', type: 'Input Timbang', target: 'Kenzo Alfarizi', timestamp: '10:40 WIB', status: 'Pending' },
  ])

  const handleSync = () => {
    setIsSyncing(true)
    setTimeout(() => {
      setQueueItems([])
      setQueueCount(0)
      setIsSyncing(false)
    }, 2000)
  }

  return (
    <div className="max-w-[1140px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#070709]">Antrean Sinkronisasi Offline</h1>
          <p className="text-sm text-gray-500">Manajemen data lokal (IndexedDB) saat Posyandu berjalan tanpa sinyal internet.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-bold ${
            isOnline ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span>{isOnline ? 'Online (Tersinkron ke Cloud)' : 'Mode Offline Aktif'}</span>
          </div>

          <button 
            onClick={() => setIsOnline(!isOnline)}
            className="px-4 py-2 rounded-2xl bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50"
          >
            Toggle Sinyal
          </button>
        </div>
      </div>

      {/* Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-black/8 rounded-3xl p-6 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase">Antrean Lokal</p>
            <h3 className="text-2xl font-black text-[#070709] mt-1">{queueCount} Data</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2597d0] flex items-center justify-center">
            <Database className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-black/8 rounded-3xl p-6 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase">Status Z-Score Lokal</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">Aktif</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-black/8 rounded-3xl p-6 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase">Terakhir Sinkron</p>
            <h3 className="text-2xl font-black text-gray-700 mt-1">Hari Ini</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Queue List */}
      <div className="bg-white border border-black/8 rounded-3xl overflow-hidden shadow-2xs">
        <div className="bg-[#f5f8fc] p-5 border-b border-black/5 flex items-center justify-between">
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
          {queueItems.length === 0 ? (
            <div className="py-16 text-center text-gray-400 flex flex-col items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
              <p className="text-sm font-bold text-gray-700">Semua Data Telah Tersinkron</p>
              <p className="text-xs text-gray-400 mt-1">Tidak ada antrean tertunda di IndexedDB browser.</p>
            </div>
          ) : (
            <div className="divide-y divide-black/5">
              {queueItems.map((item) => (
                <div key={item.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
                      {item.id}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#070709]">{item.type}: {item.target}</h4>
                      <p className="text-xs text-gray-400">Dicatat pukul {item.timestamp} • Tersimpan di IndexedDB</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold uppercase">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
