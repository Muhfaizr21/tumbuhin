import { useState } from 'react'
import { ArrowRight, MoreVertical } from 'lucide-react'

export default function BalitaListCard({
  balitaList = [],
  onSelectBalita,
  onLihatSemua,
}) {
  const [activeTab, setActiveTab] = useState('hari_ini') // 'hari_ini' | 'belum_timbang' | 'warning'

  const filteredList = balitaList.filter((b) => {
    if (activeTab === 'belum_timbang') {
      return b.statusTimbang === 'Belum Ditimbang'
    }
    if (activeTab === 'warning') {
      return b.skorRisiko === 'Tinggi' || b.statusGizi === 'Stunted' || b.statusGizi === 'Wasted'
    }
    // 'hari_ini'
    return b.statusTimbang === 'Sudah Ditimbang'
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
    <div className="p-5 sm:p-6 rounded-3xl bg-white border border-black/6 shadow-2xs clinicflow-card flex flex-col justify-between">
      <div>
        {/* Header with Title & "Lihat Semua →" */}
        <div className="flex items-center justify-between pb-3 border-b border-black/6">
          <div>
            <h2 className="text-[16px] font-bold text-gray-900 tracking-tight">
              Daftar Balita Posyandu
            </h2>
            <p className="text-[11.5px] text-gray-500">
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
        <div className="flex items-center gap-1 mt-3 p-1 rounded-xl bg-gray-100 text-[11.5px] font-medium text-gray-600">
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
                  : 'hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List of Balita */}
        <div className="divide-y divide-black/6 mt-3 max-h-[310px] overflow-y-auto pr-1">
          {filteredList.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-[12px] italic">
              Tidak ada data balita pada filter ini
            </div>
          ) : (
            filteredList.slice(0, 6).map((item) => {
              const initials = item.nama
                .split(' ')
                .slice(0, 2)
                .map((n) => n[0])
                .join('')

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectBalita && onSelectBalita(item)}
                  className="py-2.5 flex items-center justify-between gap-3 hover:bg-gray-50/80 rounded-xl px-2 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-100/70 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200/50 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900 truncate leading-snug">
                        {item.nama}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">
                        {item.usia} • {item.jenisKelamin === 'L' ? 'L' : 'P'} • {item.rtRw}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold border ${
                        statusBadgeConfig[item.statusGizi] ||
                        statusBadgeConfig['Sudah Ditimbang']
                      }`}
                    >
                      {item.statusGizi}
                    </span>

                    <button
                      type="button"
                      className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
                      aria-label={`Aksi untuk ${item.nama}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (onSelectBalita) onSelectBalita(item)
                      }}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
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
