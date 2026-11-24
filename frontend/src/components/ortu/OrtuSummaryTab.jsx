import React from 'react'
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ChefHat,
  Info,
  Scale,
  Ruler,
  CircleDot
} from 'lucide-react'

export default function OrtuSummaryTab({ data, isHighContrast, onSelectTab }) {
  if (!data) return null

  const isGreen = data.color_pita === 'hijau'
  const isYellow = data.color_pita === 'kuning'

  const pitaColorClass = isGreen
    ? 'bg-emerald-50/50 text-emerald-950 border-emerald-200/80'
    : isYellow
    ? 'bg-amber-50/50 text-amber-950 border-amber-200/80'
    : 'bg-rose-50/50 text-rose-950 border-rose-200/80'

  const pitaBadgeClass = isGreen
    ? 'bg-emerald-600 text-white'
    : isYellow
    ? 'bg-amber-600 text-white'
    : 'bg-rose-600 text-white'

  return (
    <div className="space-y-6">
      {/* Kartu Status Utama KMS & Penjelasan Empatik */}
      <div
        className={`p-6 sm:p-7 rounded-3xl border transition-all ${
          isHighContrast
            ? 'bg-black text-white border-yellow-400'
            : `${pitaColorClass} shadow-2xs`
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/8">
          <div className="flex items-center gap-2.5">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold tracking-tight uppercase ${
                isHighContrast ? 'bg-yellow-400 text-black' : pitaBadgeClass
              }`}
            >
              Pita {data.color_pita?.toUpperCase() || 'HIJAU'} KMS
            </span>
            <span className="text-xs text-[#60606c] font-medium">
              Penimbangan {data.last_measured_date}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold">
            {data.is_kbm_achieved ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-800 bg-emerald-100/90 px-3 py-1 rounded-full border border-emerald-200/70">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> KBM Tercapai (+{data.delta_weight_grams}g)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-amber-900 bg-amber-100/90 px-3 py-1 rounded-full border border-amber-200/70">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> KBM Perlu Atensi (+{data.delta_weight_grams}g / target {data.target_kbm_grams}g)
              </span>
            )}
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#070709] font-runde">
            {data.friendly_status_title}
          </h2>
          <p className="text-sm sm:text-base leading-relaxed text-[#60606c] font-inter">
            {data.friendly_explanation}
          </p>
        </div>

        {/* 3 Langkah Praktis untuk Ayah & Ibu di Rumah */}
        {data.daily_action_points && data.daily_action_points.length > 0 && (
          <div className="mt-6 pt-5 border-t border-black/8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#070709] mb-3 flex items-center gap-2 font-runde">
              <Info className="w-4 h-4 text-[#2597d0]" /> 3 Langkah Praktis Harian di Rumah:
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm text-[#60606c] font-inter">
              {data.daily_action_points.map((point, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span
                    className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center font-bold text-[11px] ${
                      isHighContrast
                        ? 'bg-yellow-400 text-black'
                        : 'bg-[#070709] text-white'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="leading-snug pt-0.5">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Grid 3 Kartu Metrik Antropometri */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Berat Badan */}
        <div
          className={`p-5 rounded-3xl border transition-all ${
            isHighContrast
              ? 'bg-black text-white border-white'
              : 'bg-white text-[#070709] border-black/8 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-[#8b8b8b] mb-3">
            <span className="text-xs font-medium flex items-center gap-1.5 text-[#60606c]">
              <Scale className="w-4 h-4 text-[#2597d0]" /> Berat Badan
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#2597d0]/10 text-[#2597d0] border border-[#2597d0]/20 font-runde">
              BB/U
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold tracking-tight text-[#070709] font-runde">
              {data.last_weight_kg || 0}
            </span>
            <span className="text-sm font-medium text-[#8b8b8b]">kg</span>
          </div>
          <p className="text-[12px] text-[#60606c] mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            {data.delta_weight_grams >= 0 ? `+${data.delta_weight_grams}` : data.delta_weight_grams} g dari bulan lalu
          </p>
        </div>

        {/* Tinggi Badan */}
        <div
          className={`p-5 rounded-3xl border transition-all ${
            isHighContrast
              ? 'bg-black text-white border-white'
              : 'bg-white text-[#070709] border-black/8 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-[#8b8b8b] mb-3">
            <span className="text-xs font-medium flex items-center gap-1.5 text-[#60606c]">
              <Ruler className="w-4 h-4 text-emerald-600" /> Tinggi Badan
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-runde">
              TB/U
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold tracking-tight text-[#070709] font-runde">
              {data.last_height_cm || 0}
            </span>
            <span className="text-sm font-medium text-[#8b8b8b]">cm</span>
          </div>
          <p className="text-[12px] text-[#60606c] mt-2">
            Status: {data.zscore_hfa >= -2 ? 'Normal / Sesuai Umur' : 'Perlu Ditingkatkan'}
          </p>
        </div>

        {/* Target KBM Bulan Depan */}
        <div
          className={`p-5 rounded-3xl border transition-all ${
            isHighContrast
              ? 'bg-black text-white border-white'
              : 'bg-white text-[#070709] border-black/8 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-[#8b8b8b] mb-3">
            <span className="text-xs font-medium flex items-center gap-1.5 text-[#60606c]">
              <CircleDot className="w-4 h-4 text-[#2597d0]" /> Target Bulan Depan
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#f5f5f5] text-[#60606c] border border-black/5 font-runde">
              KBM
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold tracking-tight text-[#2597d0] font-runde">
              {data.next_month_target_kg || (data.last_weight_kg + 0.2).toFixed(1)}
            </span>
            <span className="text-sm font-medium text-[#8b8b8b]">kg</span>
          </div>
          <p className="text-[12px] text-[#60606c] mt-2">
            Minimal naik +{data.target_kbm_grams || 200} gram
          </p>
        </div>
      </div>

      {/* Kartu Navigasi Cepat (Resep MPASI & Jadwal Posyandu) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Intip Resep MPASI */}
        <div
          onClick={() => onSelectTab && onSelectTab('resep')}
          className={`p-6 rounded-3xl border cursor-pointer transition-all hover:scale-[1.01] ${
            isHighContrast
              ? 'bg-black text-white border-yellow-400'
              : 'bg-white border-black/8 shadow-2xs hover:border-[#2597d0]/40'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-[#2597d0]/10 text-[#2597d0] border border-[#2597d0]/20 flex items-center justify-center shrink-0">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#2597d0] uppercase tracking-wide font-runde">
                Menu Rekomendasi Hari Ini
              </span>
              <h4 className="font-semibold text-[#070709] text-base line-clamp-1 font-runde">
                {data.mpasi_recipe?.title || 'Resep MPASI Bergizi'}
              </h4>
            </div>
          </div>
          <p className="text-xs text-[#60606c] mt-3 line-clamp-2 leading-relaxed">
            Estimasi anggaran hanya Rp {data.mpasi_recipe?.daily_budget_idr?.toLocaleString('id-ID') || '13.500'} per hari berbahan pangan lokal segar desa.
          </p>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[#2597d0]">
            <span>Buka Resep & Dengar Panduan Memasak →</span>
          </div>
        </div>

        {/* Intip Jadwal Posyandu */}
        <div
          onClick={() => onSelectTab && onSelectTab('pesan')}
          className={`p-6 rounded-3xl border cursor-pointer transition-all hover:scale-[1.01] ${
            isHighContrast
              ? 'bg-black text-white border-yellow-400'
              : 'bg-white border-black/8 shadow-2xs hover:border-[#2597d0]/40'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-[#070709]/5 text-[#070709] border border-black/8 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-[#2597d0]" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#2597d0] uppercase tracking-wide font-runde">
                Posyandu Bulan Depan
              </span>
              <h4 className="font-semibold text-[#070709] text-base font-runde">
                {data.next_posyandu?.activity_date || '12 Desember 2026'}
              </h4>
            </div>
          </div>
          <p className="text-xs text-[#60606c] mt-3 leading-relaxed">
            {data.next_posyandu?.days_remaining || 18} hari lagi di {data.next_posyandu?.location || 'Balai RW'}.
          </p>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[#2597d0]">
            <span>Lihat Catatan Bidan & Pengingat →</span>
          </div>
        </div>
      </div>
    </div>
  )
}
