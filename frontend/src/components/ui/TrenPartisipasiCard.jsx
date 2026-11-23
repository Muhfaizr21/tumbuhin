import { useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ArrowDownRight, ArrowUpRight, Minus, TrendingUp } from 'lucide-react'

const RANGE_LEN = { '6bulan': 6, '8bulan': 8, tahun: 12 }

export default function TrenPartisipasiCard({
  persentase = 0,
  delta = 0,
  sudahDitimbang = 0,
  totalBalita = 0,
  trendData = [],
}) {
  const [range, setRange] = useState('8bulan')

  const series = Array.isArray(trendData) ? trendData : []
  const chartData = series.slice(-RANGE_LEN[range])

  const deltaNum = Number(delta) || 0
  const isUp = deltaNum > 0
  const isFlat = deltaNum === 0
  const DeltaIcon = isUp ? ArrowUpRight : isFlat ? Minus : ArrowDownRight
  const deltaClass = isUp
    ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
    : isFlat
      ? 'text-slate-600 bg-slate-50 border-slate-200'
      : 'text-rose-600 bg-rose-50 border-rose-200'
  const deltaText = `${deltaNum > 0 ? '+' : ''}${deltaNum}%`

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white border border-black/6 shadow-2xs clinicflow-card flex flex-col justify-between">
      <div>
        {/* Header with Title & Range Dropdown */}
        <div className="flex items-center justify-between pb-3 border-b border-black/6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-gray-900 tracking-tight">
                Tren Partisipasi Penimbangan
              </h2>
              <p className="text-[11.5px] text-gray-500">
                Tingkat kehadiran vs target 85% bulanan
              </p>
            </div>
          </div>

          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="text-[11.5px] font-medium bg-gray-50 border border-black/10 rounded-xl px-2.5 py-1 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="6bulan">6 Bulan Terakhir</option>
            <option value="8bulan">8 Bulan Terakhir</option>
            <option value="tahun">12 Bulan Terakhir</option>
          </select>
        </div>

        {/* Big Number & Delta Trend */}
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-[32px] font-bold tracking-tight text-gray-900 leading-none">
            {persentase}%
          </span>
          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full border ${deltaClass}`}>
            <DeltaIcon className="w-3.5 h-3.5" />
            <span>{deltaText} vs bulan lalu</span>
          </span>
        </div>
        <p className="text-[11.5px] text-gray-400 mt-1">
          {sudahDitimbang} dari {totalBalita} balita tercatat aktif dalam pemantauan KMS bulan berjalan
        </p>

        {/* Recharts Area Chart */}
        <div className="mt-4 h-44 w-full">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[12px] text-gray-400">
              Belum ada data penimbangan
            </div>
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorPersen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f0f2f5"
              />
              <XAxis
                dataKey="bulan"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#8b8b8b' }}
              />
              <YAxis
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#8b8b8b' }}
                unit="%"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="p-2.5 rounded-xl bg-gray-900 text-white text-xs shadow-lg">
                        <p className="font-semibold">{payload[0].payload.bulan}</p>
                        <p className="text-blue-300 mt-0.5">
                          Kehadiran: {payload[0].value}%
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Area
                type="monotone"
                dataKey="persen"
                stroke="#2563EB"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorPersen)"
              />
            </AreaChart>
          </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
