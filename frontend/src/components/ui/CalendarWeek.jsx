import { useState } from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Users,
} from 'lucide-react'

export default function CalendarWeek({
  jadwalList = [],
  selectedJadwalId,
  onSelectJadwal,
  onTambahJadwal,
}) {
  const [viewMode, setViewMode] = useState('minggu') // 'hari' | 'minggu' | 'bulan'

  // Days of week (Senin - Sabtu, 16-21 Nov 2026)
  const weekDays = [
    { dayName: 'Sen', fullDate: '2026-11-16', dateNum: 16 },
    { dayName: 'Sel', fullDate: '2026-11-17', dateNum: 17 },
    { dayName: 'Rab', fullDate: '2026-11-18', dateNum: 18 },
    { dayName: 'Kam', fullDate: '2026-11-19', dateNum: 19 },
    { dayName: 'Jum', fullDate: '2026-11-20', dateNum: 20, isToday: true },
    { dayName: 'Sab', fullDate: '2026-11-21', dateNum: 21 },
  ]

  const typeConfig = {
    penimbangan: {
      bg: 'bg-blue-50 hover:bg-blue-100/80 border-blue-200 text-blue-900',
      badge: 'bg-blue-600 text-white',
      accent: 'border-l-blue-600',
      label: 'Penimbangan',
    },
    kunjungan: {
      bg: 'bg-purple-50 hover:bg-purple-100/80 border-purple-200 text-purple-900',
      badge: 'bg-purple-600 text-white',
      accent: 'border-l-purple-600',
      label: 'Kunjungan Bidan',
    },
    edukasi: {
      bg: 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200 text-emerald-900',
      badge: 'bg-emerald-600 text-white',
      accent: 'border-l-emerald-600',
      label: 'Edukasi MPASI',
    },
    jadwal_ulang: {
      bg: 'bg-amber-50 hover:bg-amber-100/80 border-amber-200 text-amber-900',
      badge: 'bg-amber-600 text-white',
      accent: 'border-l-amber-600',
      label: 'Jadwal Ulang',
    },
  }

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white border border-black/6 shadow-2xs clinicflow-card">
      {/* Header: Title, View Toggles & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-black/6">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            <h2 className="text-[17px] font-bold text-gray-900 tracking-tight">
              Kalender Kegiatan Posyandu
            </h2>
          </div>
          <p className="text-[12px] text-gray-500 mt-0.5">
            Jadwal meja ukur, kunjungan rumah Bidan, dan edukasi PMT RW 04
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {/* View Toggles (ClinicFlow style) */}
          <div className="flex items-center p-1 rounded-xl bg-gray-100 text-[11.5px] font-medium text-gray-600">
            {['hari', 'minggu', 'bulan'].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-lg capitalize transition-colors cursor-pointer ${
                  viewMode === mode
                    ? 'bg-white text-blue-600 font-semibold shadow-2xs'
                    : 'hover:text-gray-900'
                }`}
              >
                {mode === 'hari' ? 'Hari' : mode === 'minggu' ? 'Minggu' : 'Bulan'}
              </button>
            ))}
          </div>

          {/* Add Schedule Button */}
          <button
            type="button"
            onClick={onTambahJadwal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold transition-colors cursor-pointer shadow-xs active:scale-98"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Tambah Jadwal</span>
          </button>
        </div>
      </div>

      {/* Week Navigator */}
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-2">
          <span className="text-[13.5px] font-bold text-gray-900">
            16 – 21 November 2026
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Pekan ke-3
          </span>
        </div>

        <div className="flex items-center gap-1 text-gray-600">
          <button
            type="button"
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 cursor-pointer"
            aria-label="Pekan sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 cursor-pointer"
            aria-label="Pekan berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekly Grid (Columns for each day) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-2">
        {weekDays.map((day) => {
          const dayJadwal = jadwalList.filter((j) => j.tanggal === day.fullDate)
          const isToday = day.isToday

          return (
            <div
              key={day.fullDate}
              className={`rounded-2xl p-2.5 flex flex-col min-h-[220px] transition-all border ${
                isToday
                  ? 'bg-blue-50/40 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                  : 'bg-gray-50/70 border-black/6'
              }`}
            >
              {/* Day Column Header */}
              <div
                className={`text-center pb-2 mb-2 border-b ${
                  isToday ? 'border-blue-200' : 'border-black/6'
                }`}
              >
                <p
                  className={`text-[11px] font-medium uppercase tracking-wider ${
                    isToday ? 'text-blue-700 font-bold' : 'text-gray-500'
                  }`}
                >
                  {day.dayName}
                </p>
                <div className="flex items-center justify-center mt-0.5">
                  <span
                    className={`w-7 h-7 rounded-full text-[13px] font-bold flex items-center justify-center ${
                      isToday
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-gray-900'
                    }`}
                  >
                    {day.dateNum}
                  </span>
                </div>
                {isToday && (
                  <span className="mt-1 inline-block px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-blue-100 text-blue-700">
                    Hari Ini
                  </span>
                )}
              </div>

              {/* Day Events Stack */}
              <div className="space-y-2 flex-1">
                {dayJadwal.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center p-2">
                    <span className="text-[11px] text-gray-400 italic">
                      Tidak ada agenda
                    </span>
                  </div>
                ) : (
                  dayJadwal.map((item) => {
                    const cfg = typeConfig[item.tipe] || typeConfig.penimbangan
                    const isSelected = selectedJadwalId === item.id

                    return (
                      <div
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => onSelectJadwal && onSelectJadwal(item)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            if (onSelectJadwal) onSelectJadwal(item)
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer border-l-4 ${
                          cfg.accent
                        } ${cfg.bg} ${
                          isSelected
                            ? 'ring-2 ring-blue-600 shadow-sm scale-101'
                            : 'shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[9.5px] font-bold uppercase tracking-wider text-gray-500">
                            {cfg.label}
                          </span>
                        </div>

                        <p className="text-[11.5px] font-semibold text-gray-900 leading-snug line-clamp-2">
                          {item.judul}
                        </p>

                        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-gray-600">
                          <Clock className="w-3 h-3 shrink-0 text-gray-400" />
                          <span>
                            {item.jamMulai} - {item.jamSelesai}
                          </span>
                        </div>

                        {item.balitaTerkait && item.balitaTerkait.length > 0 && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-600 truncate">
                            <Users className="w-3 h-3 shrink-0 text-gray-400" />
                            <span className="truncate">
                              {item.balitaTerkait.length} balita
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
