import { useState, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import { fetchRoleDashboardData } from '../../lib/authApi'

export default function BalitaListCard({
  onSelectBalita,
  onLihatSemua,
}) {
  const [activeTab, setActiveTab] = useState('hari_ini')
  const [balitaList, setBalitaList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadBalita() {
      try {
        setLoading(true)
        const data = await fetchRoleDashboardData('/kader/balita')
        if (Array.isArray(data)) {
          setBalitaList(data)
        }
      } catch (err) {
        console.error('Failed to load balita:', err)
      } finally {
        setLoading(false)
      }
    }
    loadBalita()
  }, [])

  const filteredList = balitaList.filter((b) => {
    const statusTimbang = b.status_timbang || 'Belum Ditimbang'
    const statusGizi = b.status_gizi || 'Normal'
    
    if (activeTab === 'belum_timbang') {
      return statusTimbang === 'Belum Ditimbang'
    }
    if (activeTab === 'warning') {
      return statusGizi === 'Stunted' || statusGizi === 'Wasted' || statusGizi === 'Berisiko'
    }
    // 'hari_ini'
    return statusTimbang === 'Sudah Ditimbang'
  })

  const statusBadgeConfig = {
    'Sudah Ditimbang': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Belum Ditimbang': 'bg-amber-50 text-amber-700 border-amber-200',
    'Risiko Tinggi': 'bg-rose-50 text-rose-700 border-rose-200',
    Stunted: 'bg-rose-50 text-rose-700 border-rose-200',
    Wasted: 'bg-pink-50 text-pink-700 border-pink-200',
    Berisiko: 'bg-amber-50 text-amber-700 border-amber-200',
    Normal: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-100 shadow-2xs clinicflow-card flex flex-col justify-between">
      <div>
        {/* Header with Title & "Lihat Semua →" */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-[16px] font-bold text-slate-800 tracking-tight">
              Daftar Balita Posyandu
            </h2>
            <p className="text-[11.5px] text-slate-500">
              Presensi & status gizi balita Meja 3 RW 04
            </p>
          </div>

          <button
            type="button"
            onClick={onLihatSemua}
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
          >
            <span>Lihat Semua</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tab Filter (ClinicFlow-inspired) */}
        <div className="flex items-center gap-1 mt-3 p-1 rounded-xl bg-slate-50 text-[11.5px] font-medium text-slate-600">
          {[
            { id: 'hari_ini', label: 'Hari Ini' },
            { id: 'belum_timbang', label: 'Belum Ditimbang' },
            { id: 'warning', label: 'Early Warning' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 font-semibold shadow-2xs'
                  : 'hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List of Balita */}
        <div className="divide-y divide-slate-100 mt-4 space-y-1 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-[12px] italic">
              Memuat data dari server...
            </div>
          ) : filteredList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-[12px] italic">
              Tidak ada data balita pada filter ini
            </div>
          ) : (
            filteredList.map((item) => {
              const nama = item.nama || item.full_name || '-'
              const usia = item.usia || `${item.usia_bulan || 0} Bulan`
              const jk = item.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'
              const rtRw = item.rt_rw || '-'
              const statusGizi = item.status_gizi || 'Normal'

              const initials = nama
                .split(' ')
                .slice(0, 2)
                .map((n) => n[0])
                .join('')

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectBalita && onSelectBalita(item)}
                  className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50 rounded-2xl px-3 transition-all cursor-pointer group border border-transparent hover:border-slate-100"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 font-bold text-[11px] flex items-center justify-center shrink-0 border border-slate-200 group-hover:bg-[#1e293b] group-hover:text-white transition-colors">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-bold text-slate-800 truncate leading-snug group-hover:text-[#1e293b]">
                        {nama}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {usia} • {jk} • {rtRw}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                        statusBadgeConfig[statusGizi] ||
                        statusBadgeConfig['Sudah Ditimbang']
                      }`}
                    >
                      {statusGizi}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}