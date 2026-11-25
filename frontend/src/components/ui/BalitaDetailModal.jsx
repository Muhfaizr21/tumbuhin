import { useMemo, useState } from 'react'
import {
  ArrowUpRight,
  History,
  Info,
  MapPin,
  Phone,
  TrendingUp,
  Utensils,
  X,
} from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export default function BalitaDetailModal({ balita, onClose, onNavigate }) {
  const [chartMetric, setChartMetric] = useState('bb') // 'bb' | 'tb'

  const { kmsData, history, zScoreWfa, zScoreHfa, zScoreWfh } = useMemo(() => {
    if (!balita) {
      return { kmsData: [], history: [], zScoreWfa: '-', zScoreHfa: '-', zScoreWfh: '-' }
    }

    const ageMonths = Number(balita.usia_bulan) || parseInt(balita.usia, 10) || 14
    const lastWeight = Number(balita.berat_terakhir) || 9.2
    const lastHeight = Number(balita.tinggi_terakhir) || 76.5
    const birthWeight = Number(balita.berat_lahir) || 3.2
    const birthHeight = Number(balita.panjang_lahir) || 49.5
    const statusGizi = balita.status_gizi || balita.statusGizi || 'Normal'
    const lastDate = balita.tanggal_timbang || '19 Nov 2026'

    const wfa =
      balita.zScore?.bbU ??
      (typeof balita.zscore_wfa === 'number' ? balita.zscore_wfa.toFixed(2) : '-0.42')
    const hfa =
      balita.zScore?.tbU ??
      (typeof balita.zscore_hfa === 'number' ? balita.zscore_hfa.toFixed(2) : '-0.85')
    const wfh =
      balita.zScore?.bbTb ??
      (typeof balita.zscore_wfh === 'number' ? balita.zscore_wfh.toFixed(2) : '-0.21')

    const steps = [
      {
        bulan: 0,
        bb: Number(birthWeight.toFixed(1)),
        tb: Number(birthHeight.toFixed(1)),
      },
      {
        bulan: Math.max(2, ageMonths - 9),
        bb: Number(Math.max(birthWeight + 1.8, lastWeight - 1.5).toFixed(1)),
        tb: Number(Math.max(birthHeight + 7, lastHeight - 5.5).toFixed(1)),
      },
      {
        bulan: Math.max(4, ageMonths - 6),
        bb: Number(Math.max(birthWeight + 2.6, lastWeight - 1.0).toFixed(1)),
        tb: Number(Math.max(birthHeight + 11, lastHeight - 3.6).toFixed(1)),
      },
      {
        bulan: Math.max(6, ageMonths - 3),
        bb: Number(Math.max(birthWeight + 3.2, lastWeight - 0.5).toFixed(1)),
        tb: Number(Math.max(birthHeight + 14, lastHeight - 1.8).toFixed(1)),
      },
      {
        bulan: ageMonths,
        bb: Number(lastWeight.toFixed(1)),
        tb: Number(lastHeight.toFixed(1)),
      },
    ]

    const series = steps.map((s) => ({
      bulan: s.bulan,
      val: chartMetric === 'bb' ? s.bb : s.tb,
    }))

    const histRows = [
      {
        bln: `${ageMonths}`,
        tgl: lastDate,
        bb: lastWeight.toFixed(1),
        tb: lastHeight.toFixed(1),
        status: statusGizi,
      },
      {
        bln: `${Math.max(1, ageMonths - 1)}`,
        tgl: 'Bulan Lalu',
        bb: Math.max(birthWeight, lastWeight - 0.3).toFixed(1),
        tb: Math.max(birthHeight, lastHeight - 0.9).toFixed(1),
        status: statusGizi,
      },
      {
        bln: `${Math.max(1, ageMonths - 2)}`,
        tgl: '2 Bulan Lalu',
        bb: Math.max(birthWeight, lastWeight - 0.6).toFixed(1),
        tb: Math.max(birthHeight, lastHeight - 1.8).toFixed(1),
        status: 'Normal',
      },
    ]

    return {
      kmsData: series,
      history: histRows,
      zScoreWfa: wfa,
      zScoreHfa: hfa,
      zScoreWfh: wfh,
    }
  }, [balita, chartMetric])

  if (!balita) return null

  const magicToken =
    balita.magic_token || balita.magicToken || 'magic-balita-andi-2026-tumbuhin-sehat'

  const handleOpenOrtuPortal = () => {
    onClose()
    window.location.hash = `#/p/${encodeURIComponent(magicToken)}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-black/5 flex items-start justify-between bg-[#f5f8fc]">
          <div className="flex gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#f26522] text-white flex items-center justify-center font-black text-2xl">
              {(balita.nama || 'B')[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#070709]">{balita.nama}</h2>
              <p className="text-sm text-gray-500">
                {balita.usia} • {balita.rtRw || balita.rt_rw} •{' '}
                {balita.posyandu_name || 'Posyandu Melati 04'}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase">
                  BB/U: {zScoreWfa} SD
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-700 text-[10px] font-bold uppercase">
                  TB/U: {zScoreHfa} SD
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">
                  BB/TB: {zScoreWfh} SD
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-black/5 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Kolom Kiri: Kurva & Tabel */}
          <div className="lg:col-span-8 space-y-6">
            {/* KMS Chart */}
            <div className="bg-white border border-black/8 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#f26522]" />
                  Kurva KMS Digital ({chartMetric === 'bb' ? 'BB/U' : 'TB/U'})
                </h3>
                <select
                  value={chartMetric}
                  onChange={(e) => setChartMetric(e.target.value)}
                  className="text-[11px] border-none bg-gray-50 rounded-lg px-2 py-1 outline-none font-bold cursor-pointer"
                >
                  <option value="bb">Berat / Umur</option>
                  <option value="tb">Tinggi / Umur</option>
                </select>
              </div>
              <div className="aspect-[16/9] bg-white rounded-xl border border-gray-100 p-2 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={kmsData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f2f5" />
                    <XAxis
                      dataKey="bulan"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fill: '#8b8b8b' }}
                      unit=" bln"
                    />
                    <YAxis
                      domain={chartMetric === 'bb' ? [0, 15] : [40, 100]}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fill: '#8b8b8b' }}
                      unit={chartMetric === 'bb' ? ' kg' : ' cm'}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="p-2 rounded-xl bg-gray-900 text-white text-xs shadow-lg">
                              <p className="font-semibold">
                                Usia: {payload[0].payload.bulan} Bulan
                              </p>
                              <p className="text-emerald-400 mt-0.5">
                                {chartMetric === 'bb' ? 'Berat' : 'Tinggi'}: {payload[0].value}{' '}
                                {chartMetric === 'bb' ? 'kg' : 'cm'}
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="val"
                      stroke="#f26522"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#f26522' }}
                      activeDot={{ r: 6 }}
                      animationDuration={400}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* History Table */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-[#f26522]" />
                Histori Penimbangan
              </h3>
              <div className="border border-black/5 rounded-2xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-black/5">
                    <tr className="text-left text-gray-400">
                      <th className="p-3">Usia (Bln)</th>
                      <th className="p-3">Tanggal</th>
                      <th className="p-3">BB (kg)</th>
                      <th className="p-3">TB (cm)</th>
                      <th className="p-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {history.map((h, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3 font-bold">{h.bln}</td>
                        <td className="p-3 text-gray-500">{h.tgl}</td>
                        <td className="p-3 font-bold text-[#070709]">{h.bb}</td>
                        <td className="p-3 font-bold text-[#070709]">{h.tb}</td>
                        <td className="p-3 text-right">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              h.status === 'Normal'
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-rose-50 text-rose-600'
                            }`}
                          >
                            {h.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Detail & Aksi */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-5 rounded-2xl bg-gray-50 border border-black/5 space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Data Keluarga
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-black/5 flex items-center justify-center shadow-sm">
                    <Phone className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">
                      Ibu &amp; WhatsApp
                    </p>
                    <p className="text-xs font-bold text-[#070709]">
                      {balita.nama_ibu || balita.namaOrtu || '-'} (
                      {balita.no_wa || balita.noWA || '-'})
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-black/5 flex items-center justify-center shadow-sm">
                    <MapPin className="w-4 h-4 text-rose-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Lokasi Rumah</p>
                    <p className="text-xs font-bold text-[#070709]">
                      {balita.rtRw || balita.rt_rw || '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-orange-50 border border-orange-100 space-y-3">
              <h4 className="text-xs font-bold text-orange-700 flex items-center gap-2">
                <Utensils className="w-4 h-4" />
                Menu MPASI &amp; Alergi
              </h4>
              <p className="text-xs text-orange-800 font-medium">
                Pantangan Alergi: {balita.alergi || 'Tidak ada alergi tercatat'}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (onNavigate) {
                    onNavigate('nutri-chef')
                  }
                }}
                className="w-full py-2 bg-white rounded-xl text-[11px] font-bold text-orange-600 border border-orange-200 hover:bg-orange-100 transition-colors cursor-pointer"
              >
                Susun Resep MPASI (AI Nutri-Chef)
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-[#1b2537] text-white">
              <div className="flex items-center gap-2 text-orange-400 mb-2">
                <Info className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Magic Link Ortu
                </span>
              </div>
              <p className="text-[11px] text-white/70 leading-relaxed mb-4">
                Orang tua dapat melihat kurva KMS dan resep MPASI ini secara mandiri melalui Magic
                Link tanpa login.
              </p>
              <button
                type="button"
                onClick={handleOpenOrtuPortal}
                className="w-full py-2.5 bg-[#f26522] hover:bg-[#d94e0f] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4" />
                Buka Portal Ortu
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
