import React, { useState } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts'
import { LineChart, Info, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react'

// Standar WHO LMS simplified baseline for visualization (Umur 6-24 bulan)
const WHO_BBU_REFERENCE = [
  { age: 6, minus3SD: 5.7, minus2SD: 6.4, normal: 7.9, plus1SD: 8.8, plus2SD: 9.8 },
  { age: 7, minus3SD: 6.0, minus2SD: 6.7, normal: 8.3, plus1SD: 9.2, plus2SD: 10.3 },
  { age: 8, minus3SD: 6.3, minus2SD: 7.0, normal: 8.6, plus1SD: 9.6, plus2SD: 10.7 },
  { age: 9, minus3SD: 6.5, minus2SD: 7.2, normal: 8.9, plus1SD: 10.0, plus2SD: 11.0 },
  { age: 10, minus3SD: 6.7, minus2SD: 7.5, normal: 9.2, plus1SD: 10.3, plus2SD: 11.4 },
  { age: 11, minus3SD: 6.9, minus2SD: 7.7, normal: 9.4, plus1SD: 10.5, plus2SD: 11.7 },
  { age: 12, minus3SD: 7.1, minus2SD: 7.9, normal: 9.6, plus1SD: 10.8, plus2SD: 12.0 },
  { age: 13, minus3SD: 7.3, minus2SD: 8.1, normal: 9.9, plus1SD: 11.0, plus2SD: 12.3 },
  { age: 14, minus3SD: 7.5, minus2SD: 8.3, normal: 10.1, plus1SD: 11.3, plus2SD: 12.6 },
  { age: 15, minus3SD: 7.7, minus2SD: 8.5, normal: 10.3, plus1SD: 11.5, plus2SD: 12.8 },
  { age: 16, minus3SD: 7.8, minus2SD: 8.7, normal: 10.5, plus1SD: 11.8, plus2SD: 13.1 },
  { age: 17, minus3SD: 8.0, minus2SD: 8.9, normal: 10.7, plus1SD: 12.0, plus2SD: 13.4 },
  { age: 18, minus3SD: 8.2, minus2SD: 9.1, normal: 10.9, plus1SD: 12.2, plus2SD: 13.7 },
  { age: 19, minus3SD: 8.3, minus2SD: 9.2, normal: 11.1, plus1SD: 12.5, plus2SD: 13.9 },
  { age: 20, minus3SD: 8.5, minus2SD: 9.4, normal: 11.3, plus1SD: 12.7, plus2SD: 14.2 },
  { age: 21, minus3SD: 8.7, minus2SD: 9.6, normal: 11.5, plus1SD: 12.9, plus2SD: 14.5 },
  { age: 22, minus3SD: 8.8, minus2SD: 9.8, normal: 11.8, plus1SD: 13.2, plus2SD: 14.7 },
  { age: 23, minus3SD: 9.0, minus2SD: 10.0, normal: 12.0, plus1SD: 13.4, plus2SD: 15.0 },
  { age: 24, minus3SD: 9.2, minus2SD: 10.2, normal: 12.2, plus1SD: 13.6, plus2SD: 15.3 }
]

const WHO_TBU_REFERENCE = [
  { age: 6, minus3SD: 61.2, minus2SD: 63.3, normal: 67.6, plus1SD: 69.8, plus2SD: 71.9 },
  { age: 8, minus3SD: 64.5, minus2SD: 66.8, normal: 70.6, plus1SD: 72.8, plus2SD: 75.0 },
  { age: 10, minus3SD: 67.5, minus2SD: 69.9, normal: 73.3, plus1SD: 75.6, plus2SD: 77.9 },
  { age: 12, minus3SD: 70.0, minus2SD: 72.6, normal: 75.7, plus1SD: 78.1, plus2SD: 80.5 },
  { age: 14, minus3SD: 72.3, minus2SD: 75.0, normal: 78.0, plus1SD: 80.5, plus2SD: 83.0 },
  { age: 16, minus3SD: 74.4, minus2SD: 77.2, normal: 80.2, plus1SD: 82.8, plus2SD: 85.4 },
  { age: 18, minus3SD: 76.3, minus2SD: 79.2, normal: 82.3, plus1SD: 85.0, plus2SD: 87.7 },
  { age: 20, minus3SD: 78.1, minus2SD: 81.1, normal: 84.2, plus1SD: 87.0, plus2SD: 89.8 },
  { age: 22, minus3SD: 79.8, minus2SD: 82.9, normal: 86.0, plus1SD: 88.9, plus2SD: 91.9 },
  { age: 24, minus3SD: 81.4, minus2SD: 84.6, normal: 87.8, plus1SD: 90.7, plus2SD: 93.6 }
]

export default function KmsInteractiveChart({ data, isHighContrast }) {
  const [metric, setMetric] = useState('weight') // 'weight' (BB/U) or 'height' (TB/U)

  const historical = data?.historical_measurements || []
  const isBBU = metric === 'weight'

  const referenceData = isBBU ? WHO_BBU_REFERENCE : WHO_TBU_REFERENCE

  const minHistAge = historical.length > 0 ? Math.min(...historical.map(h => h.age_months)) : 6
  const maxHistAge = historical.length > 0 ? Math.max(...historical.map(h => h.age_months)) : 14

  const startAge = Math.max(0, minHistAge - 2)
  const endAge = Math.min(24, maxHistAge + 2)

  const chartData = referenceData
    .filter(ref => ref.age >= startAge && ref.age <= endAge)
    .map(ref => {
      const match = historical.find(h => h.age_months === ref.age)
      const isLatest = match && match.age_months === data?.age_months

      let childVal = match ? (isBBU ? match.weight_kg : match.height_cm) : null
      let targetVal = null

      if (ref.age === (data?.age_months || 0) + 1 && isBBU) {
        targetVal = data?.next_month_target_kg || null
      }

      return {
        age: `${ref.age} Bln`,
        ageNum: ref.age,
        zonaMerah: ref.minus3SD,
        zonaKuningBawah: ref.minus2SD - ref.minus3SD,
        zonaHijau: ref.plus1SD - ref.minus2SD,
        zonaKuningAtas: ref.plus2SD - ref.plus1SD,
        nilaiBalita: childVal,
        targetBulanDepan: targetVal,
        kbmStatus: match?.kbm_status || '',
        tanggalTimbang: match?.measured_at || '',
        isLatest
      }
    })

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const item = payload[0]?.payload
      const isTarget = item?.targetBulanDepan != null

      return (
        <div
          className={`p-3.5 rounded-2xl border text-xs shadow-xl space-y-1.5 font-inter ${
            isHighContrast
              ? 'bg-black text-white border-yellow-400'
              : 'bg-white/95 backdrop-blur-md text-[#070709] border-black/8'
          }`}
        >
          <div className="font-semibold flex items-center justify-between gap-4 border-b border-black/5 pb-1.5 font-runde">
            <span>Usia: {label}</span>
            {item?.isLatest && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[10px] border border-emerald-200">
                Timbangan Terakhir
              </span>
            )}
          </div>

          {item?.nilaiBalita != null && (
            <div className="pt-0.5 space-y-1">
              <p className="font-bold text-sm text-[#070709] font-runde">
                {data?.child_name}: {item.nilaiBalita} {isBBU ? 'kg' : 'cm'}
              </p>
              {item.tanggalTimbang && (
                <p className="text-[#60606c] text-[11px]">Tanggal: {item.tanggalTimbang}</p>
              )}
              {item.kbmStatus && item.kbmStatus !== '-' && (
                <p className="text-[11px] font-medium flex items-center gap-1.5">
                  {item.kbmStatus === 'N' ? (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Naik Sesuai Standar KBM (N)
                    </span>
                  ) : (
                    <span className="text-amber-700 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Kenaikan Melambat (T)
                    </span>
                  )}
                </p>
              )}
            </div>
          )}

          {isTarget && (
            <div className="pt-1 text-[#2597d0] font-semibold text-[11px]">
              Target KBM Bulan Depan: {item.targetBulanDepan} kg (Minimal naik +{data?.target_kbm_grams}g)
            </div>
          )}

          <div className="pt-1 text-[10px] text-[#8b8b8b] border-t border-black/5 mt-1">
            Zona Pita Hijau: {item?.zonaKuningBawah ? (item.zonaMerah + item.zonaKuningBawah).toFixed(1) : ''} - {(item.zonaMerah + item.zonaKuningBawah + item.zonaHijau).toFixed(1)} {isBBU ? 'kg' : 'cm'}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Container Grafik KMS (Letters Card Surface) */}
      <div
        className={`p-6 sm:p-7 rounded-3xl border transition-all ${
          isHighContrast
            ? 'bg-black text-white border-white'
            : 'bg-white text-[#070709] border-black/8 shadow-2xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-full bg-[#2597d0]/10 text-[#2597d0] flex items-center justify-center font-bold">
                <LineChart className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold tracking-tight text-[#070709] font-runde">
                Grafik KMS Buku KIA Digital
              </h2>
            </div>
            <p className="text-xs text-[#60606c] mt-1 font-inter">
              Visualisasi tren tumbuh kembang {data?.child_name} berdasarkan standar Permenkes RI.
            </p>
          </div>

          {/* Toggle Switch Metric (Pill Shape) */}
          <div className="inline-flex p-1 rounded-full bg-[#f5f5f5] border border-black/8 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setMetric('weight')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                isBBU
                  ? 'bg-[#070709] text-white shadow-2xs font-semibold'
                  : 'text-[#60606c] hover:text-[#070709]'
              }`}
            >
              Kurva Berat Badan (BB/U)
            </button>
            <button
              type="button"
              onClick={() => setMetric('height')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                !isBBU
                  ? 'bg-[#070709] text-white shadow-2xs font-semibold'
                  : 'text-[#60606c] hover:text-[#070709]'
              }`}
            >
              Kurva Tinggi Badan (TB/U)
            </button>
          </div>
        </div>

        {/* Canvas Recharts */}
        <div className="pt-6 h-80 sm:h-96 w-full font-inter">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="age"
                tick={{ fontSize: 11, fill: '#8b8b8b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                domain={isBBU ? [5, 14] : [60, 95]}
                tick={{ fontSize: 11, fill: '#8b8b8b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
                unit={isBBU ? 'kg' : 'cm'}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Area Pita Warna KMS */}
              <Area
                type="monotone"
                dataKey="zonaMerah"
                stackId="kms"
                stroke="none"
                fill="#fee2e2"
                fillOpacity={0.65}
                name="Pita Merah"
              />
              <Area
                type="monotone"
                dataKey="zonaKuningBawah"
                stackId="kms"
                stroke="none"
                fill="#fef3c7"
                fillOpacity={0.75}
                name="Pita Kuning Bawah"
              />
              <Area
                type="monotone"
                dataKey="zonaHijau"
                stackId="kms"
                stroke="none"
                fill="#dcfce7"
                fillOpacity={0.85}
                name="Pita Hijau (Aman)"
              />
              <Area
                type="monotone"
                dataKey="zonaKuningAtas"
                stackId="kms"
                stroke="none"
                fill="#fef3c7"
                fillOpacity={0.65}
                name="Pita Kuning Atas"
              />

              {/* Garis Riwayat Balita */}
              <Line
                type="monotone"
                dataKey="nilaiBalita"
                stroke="#070709"
                strokeWidth={3}
                dot={{ r: 4.5, fill: '#070709', stroke: '#ffffff', strokeWidth: 2 }}
                activeDot={{ r: 7, fill: '#2597d0', stroke: '#ffffff', strokeWidth: 2 }}
                connectNulls
                name={`Riwayat ${data?.child_name || 'Balita'}`}
              />

              {/* Garis Target KBM Proyeksi Bulan Depan */}
              {isBBU && (
                <Line
                  type="monotone"
                  dataKey="targetBulanDepan"
                  stroke="#2597d0"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 4.5, fill: '#2597d0', stroke: '#ffffff', strokeWidth: 2 }}
                  name="Target KBM Bulan Depan"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend Zona Pita Warna */}
        <div className="mt-4 pt-4 border-t border-black/5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 font-medium text-[#60606c]">
              <span className="w-3 h-3 rounded-full bg-[#dcfce7] border border-emerald-300 inline-block" />
              Pita Hijau: Tumbuh Normal
            </span>
            <span className="flex items-center gap-1.5 font-medium text-[#60606c]">
              <span className="w-3 h-3 rounded-full bg-[#fef3c7] border border-amber-300 inline-block" />
              Pita Kuning: Perlu Perhatian
            </span>
            <span className="flex items-center gap-1.5 font-medium text-[#60606c]">
              <span className="w-3 h-3 rounded-full bg-[#fee2e2] border border-rose-300 inline-block" />
              Pita Merah: Hubungi Kader/Bidan
            </span>
          </div>

          <div className="text-[#8b8b8b] flex items-center gap-1 text-[11px]">
            <Info className="w-3.5 h-3.5 text-[#2597d0]" />
            Sentuh titik timbang untuk membaca detail evaluasi
          </div>
        </div>
      </div>

      {/* Catatan Motivasi Target KBM */}
      <div
        className={`p-5 rounded-3xl border flex items-start gap-3.5 text-xs ${
          isHighContrast
            ? 'bg-black text-white border-yellow-400'
            : 'bg-white border-black/8 shadow-2xs text-[#070709]'
        }`}
      >
        <div className="w-9 h-9 rounded-full bg-[#2597d0]/10 text-[#2597d0] flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <p className="font-bold font-runde text-[#070709] text-sm">
            Target Kenaikan Berat Minimal (KBM) Bulan Depan: +{data?.target_kbm_grams || 200} gram
          </p>
          <p className="text-[#60606c] font-inter leading-relaxed">
            Standar Kemenkes RI menetapkan bahwa setiap balita harus terus mengalami tren kenaikan berat badan minimal (KBM) setiap bulan agar terhindar dari gagal tumbuh (*growth faltering*). Titik biru putus-putus pada grafik adalah target motivasi penimbangan bulan depan!
          </p>
        </div>
      </div>
    </div>
  )
}
