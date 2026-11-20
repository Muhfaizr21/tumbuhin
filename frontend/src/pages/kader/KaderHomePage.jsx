import { 
  getGreetingByHour, 
  MOCK_DASHBOARD_DATA, 
  MOCK_INSTRUKSI_BIDAN 
} from '../../services/mock/kaderMock'
import HeroBanner from '../../components/ui/HeroBanner'
import InstruksiBidanCard from '../../components/ui/InstruksiBidanCard'
import StatusTile from '../../components/ui/StatusTile'
import TrenPartisipasiCard from '../../components/ui/TrenPartisipasiCard'
import BalitaListCard from '../../components/ui/BalitaListCard'
import { MOCK_BALITA_LIST } from '../../services/mock/kaderMock'
import { Wifi, Database, PlusCircle, ChefHat } from 'lucide-react'

export default function KaderHomePage({ user, onMenuChange }) {
  const data = MOCK_DASHBOARD_DATA
  const greeting = getGreetingByHour()

  return (
    <div className="space-y-6">
      {/* 1. Network & Sync Status (Fitur 1.1 - PWA Indicator) */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-black/8 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold uppercase">
            <Wifi className="w-3.5 h-3.5" />
            <span>Online: Tersinkron ke Cloud</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 text-gray-500 border border-gray-200 text-[11px] font-bold uppercase">
            <Database className="w-3.5 h-3.5" />
            <span>0 Antrean Offline</span>
          </div>
        </div>
        <p className="text-[11px] text-gray-400 font-medium italic">
          Update otomatis setiap 30 detik via PWA Service Worker
        </p>
      </div>

      {/* 2. Hero Banner (Fitur 1.1 - Quick Actions) */}
      <HeroBanner 
        greeting={greeting}
        userName={user?.full_name || 'Kader Posyandu'}
        posyanduName={user?.posyandu_name || 'Posyandu Melati 04'}
        villageName={user?.village_name || 'Desa Sukamaju'}
        onInputTimbang={() => onMenuChange('timbang')}
        onScanKIA={() => onMenuChange('ocr-kms')}
        onTambahBalita={() => onMenuChange('balita')}
      />

      {/* 3. Instruksi Bidan (Fitur 1.1 - Notifikasi Bidan) */}
      <InstruksiBidanCard instruksiList={MOCK_INSTRUKSI_BIDAN} />

      {/* 4. KPI Stats Summary (Fitur 1.1 - Ringkasan Hari Buka) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusTile 
          label="Total Terdaftar" 
          count={data.totalBalita} 
          sublabel="Anak" 
          dotColor="bg-blue-500"
          textColor="text-blue-700"
          bgColor="bg-blue-50/60"
          borderColor="border-blue-200/70"
        />
        <StatusTile 
          label="Hadir Timbang" 
          count={data.sudahDitimbang} 
          sublabel={`${data.persentaseDitimbang}%`} 
          dotColor="bg-emerald-500"
          textColor="text-emerald-700"
        />
        <StatusTile 
          label="Growth Faltering" 
          count={data.earlyWarning} 
          sublabel="Perlu Atensi" 
          dotColor="bg-rose-500"
          textColor="text-rose-700"
          bgColor="bg-rose-50/60"
          borderColor="border-rose-200/70"
          onClick={() => onMenuChange('balita')}
        />
        <StatusTile 
          label="Belum Hadir" 
          count={data.totalBalita - data.sudahDitimbang} 
          sublabel="RT 01 - 05" 
          dotColor="bg-amber-500"
          textColor="text-amber-700"
          bgColor="bg-amber-50/60"
          borderColor="border-amber-200/70"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 5. Trend Partisipasi (Clean Code: Reusable Chart) */}
        <div className="lg:col-span-8">
          <TrenPartisipasiCard 
            persentase={data.persentaseDitimbang} 
            delta={`+${data.deltaDitimbang}%`}
            trendData={data.trendPartisipasi}
          />
          
          {/* Quick Shortcuts */}
          <div className="mt-6 grid grid-cols-2 gap-4">
             <button 
               onClick={() => onMenuChange('nutri-chef')}
               className="p-5 rounded-3xl bg-white border border-black/8 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/5 transition-all text-left group"
             >
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  <ChefHat className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-[#070709]">AI Nutri-Chef</h4>
                <p className="text-xs text-gray-500 mt-1">Buat resep MPASI lokal kaya protein hewani.</p>
             </button>
             <button 
               onClick={() => onMenuChange('balita')}
               className="p-5 rounded-3xl bg-white border border-black/8 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all text-left group"
             >
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-[#070709]">Registrasi Anak</h4>
                <p className="text-xs text-gray-500 mt-1">Tambah data balita baru dengan enkripsi NIK.</p>
             </button>
          </div>
        </div>

        {/* 6. Mini List Balita (Fitur 1.1 - Ringkasan Kehadiran) */}
        <div className="lg:col-span-4">
          <BalitaListCard 
            balitaList={MOCK_BALITA_LIST} 
            onSelectBalita={() => onMenuChange('balita')}
            onLihatSemua={() => onMenuChange('balita')}
          />
        </div>
      </div>
    </div>
  )
}
