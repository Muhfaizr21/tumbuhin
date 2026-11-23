import StatusTile from '../../components/ui/StatusTile'
import TrenPartisipasiCard from '../../components/ui/TrenPartisipasiCard'
import BalitaListCard from '../../components/ui/BalitaListCard'
import { Wifi, Database } from 'lucide-react'

export default function KaderHomePage({ onMenuChange, stats }) {
  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="p-8 rounded-2xl bg-white border border-slate-100 text-center text-slate-400">
          Memuat data dashboard...
        </div>
      </div>
    )
  }

  const totalBalita = stats.totalBalita || 0
  const sudahDitimbang = stats.sudahDitimbang || 0
  const persentaseDitimbang = stats.persentaseDitimbang || 0
  const risikoFalteringCount = stats.risikoFalteringCount || 0
  const deltaDitimbang = stats.deltaDitimbang || 0
  const trendPartisipasi = stats.trendPartisipasi || []

  return (
    <div className="space-y-6">
      {/* 1. Network & Sync Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold uppercase">
            <Wifi className="w-3.5 h-3.5" />
            <span>Online: Tersinkron ke Cloud</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200 text-[11px] font-bold uppercase">
            <Database className="w-3.5 h-3.5" />
            <span>{stats.pendingSync || 0} Antrean Offline</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 font-medium italic">
          Update otomatis setiap 30 detik via PWA Service Worker
        </p>
      </div>

      {/* 4. KPI Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusTile 
          label="Total Terdaftar" 
          count={totalBalita} 
          sublabel="Anak" 
          dotColor="bg-[#1e293b]"
          textColor="text-[#1e293b]"
          bgColor="bg-slate-50"
          borderColor="border-slate-200"
        />
        <StatusTile 
          label="Hadir Timbang" 
          count={sudahDitimbang} 
          sublabel={`${persentaseDitimbang}%`} 
          dotColor="bg-emerald-500"
          textColor="text-emerald-700"
          bgColor="bg-emerald-50/60"
          borderColor="border-emerald-200/70"
        />
        <StatusTile 
          label="Growth Faltering" 
          count={risikoFalteringCount} 
          sublabel="Perlu Atensi" 
          dotColor="bg-rose-500"
          textColor="text-rose-700"
          bgColor="bg-rose-50/60"
          borderColor="border-rose-200/70"
          onClick={() => onMenuChange('balita')}
        />
        <StatusTile 
          label="Belum Hadir" 
          count={totalBalita - sudahDitimbang} 
          sublabel="RT 01 - 05" 
          dotColor="bg-amber-500"
          textColor="text-amber-700"
          bgColor="bg-amber-50/60"
          borderColor="border-amber-200/70"
        />
      </div>

      {/* 5. Trend Partisipasi */}
      <div className="w-full">
        <TrenPartisipasiCard 
          persentase={persentaseDitimbang} 
          delta={`+${deltaDitimbang}%`}
          trendData={trendPartisipasi}
        />
      </div>

      {/* 6. Daftar Balita Posyandu (Full Width Section) */}
      <div className="w-full">
        <BalitaListCard 
          onSelectBalita={() => onMenuChange('balita')}
          onLihatSemua={() => onMenuChange('balita')}
        />
      </div>
    </div>
  )
}