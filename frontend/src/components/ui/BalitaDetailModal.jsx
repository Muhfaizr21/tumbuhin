import { useState } from 'react'
import { 
  X, 
  TrendingUp, 
  History, 
  Utensils, 
  MapPin, 
  Phone,
  ArrowUpRight,
  ChevronRight,
  Info
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

export default function BalitaDetailModal({ balita, onClose, onNavigate }) {
  if (!balita) return null

  const [chartMetric, setChartMetric] = useState('bb') // 'bb' | 'tb'

  // Data KMS yang lebih realistis
  const kmsData = chartMetric === 'bb' ? [
    { bulan: 0, val: 3.2 },
    { bulan: 3, val: 5.5 },
    { bulan: 6, val: 7.2 },
    { bulan: 9, val: 8.1 },
    { bulan: 12, val: 8.7 },
    { bulan: 15, val: 9.2 },
  ] : [
    { bulan: 0, val: 49.0 },
    { bulan: 3, val: 58.0 },
    { bulan: 6, val: 64.0 },
    { bulan: 9, val: 69.0 },
    { bulan: 12, val: 72.0 },
    { bulan: 15, val: 76.5 },
  ]

  // Mock Data Histori
  const history = [
    { bln: '15', tgl: '19 Nov 2026', bb: '9.2', tb: '76.5', status: 'Normal' },
    { bln: '12', tgl: '18 Okt 2026', bb: '8.7', tb: '75.2', status: 'Normal' },
    { bln: '9', tgl: '20 Sep 2026', bb: '8.1', tb: '74.0', status: 'Risiko' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-black/5 flex items-start justify-between bg-[#f5f8fc]">
          <div className="flex gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#2597d0] text-white flex items-center justify-center font-black text-2xl">
              {balita.nama[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#070709]">{balita.nama}</h2>
              <p className="text-sm text-gray-500">{balita.usia} • {balita.rtRw}</p>
              <div className="flex gap-2 mt-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase">Z-Score BB/U: {balita.zScore?.bbU || '-'}</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase">Token Aktif</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Kolom Kiri: Kurva & Tabel */}
          <div className="lg:col-span-8 space-y-6">
            {/* KMS Chart Mock */}
            <div className="bg-white border border-black/8 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#2597d0]" />
                  Kurva KMS Digital (BB/U)
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
                  <LineChart data={kmsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                      unit={chartMetric === 'bb' ? " kg" : " cm"}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="p-2 rounded-xl bg-gray-900 text-white text-xs shadow-lg">
                              <p className="font-semibold">Usia: {payload[0].payload.bulan} Bulan</p>
                              <p className="text-emerald-400 mt-0.5">
                                {chartMetric === 'bb' ? 'Berat' : 'Tinggi'}: {payload[0].value} {chartMetric === 'bb' ? 'kg' : 'cm'}
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
                      stroke="#2597d0" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#2597d0' }} 
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
                <History className="w-4 h-4 text-[#2597d0]" />
                Histori Penimbangan
              </h3>
              <div className="border border-black/5 rounded-2xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-black/5">
                    <tr className="text-left text-gray-400">
                      <th className="p-3">Bulan</th>
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
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            h.status === 'Normal' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                          }`}>{h.status}</span>
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
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Data Keluarga</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-black/5 flex items-center justify-center shadow-sm">
                      <Phone className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">WhatsApp Ibu</p>
                      <p className="text-xs font-bold text-[#070709]">{balita.noWA || '0812...'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-black/5 flex items-center justify-center shadow-sm">
                      <MapPin className="w-4 h-4 text-rose-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Lokasi Rumah</p>
                      <p className="text-xs font-bold text-[#070709]">{balita.rtRw}</p>
                    </div>
                  </div>
                </div>
             </div>

             <div className="p-5 rounded-2xl bg-orange-50 border border-orange-100 space-y-3">
                <h4 className="text-xs font-bold text-orange-700 flex items-center gap-2">
                  <Utensils className="w-4 h-4" />
                  Menu MPASI Terakhir
                </h4>
                <p className="text-xs text-orange-800 font-medium">Bubur Lumat Telur Bayam</p>
                <button 
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate('nutri-chef')
                    }
                  }}
                  className="w-full py-2 bg-white rounded-xl text-[11px] font-bold text-orange-600 border border-orange-200 hover:bg-orange-100 transition-colors cursor-pointer"
                >
                  Generate Ulang Resep (AI Nutri-Chef)
                </button>
             </div>

             <div className="p-5 rounded-2xl bg-[#070709] text-white">
                <div className="flex items-center gap-2 text-[#5cc0f0] mb-2">
                  <Info className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Magic Link Ortu</span>
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed mb-4">
                  Orang tua dapat melihat kurva ini secara mandiri melalui Magic Link tanpa login.
                </p>
                <button className="w-full py-2.5 bg-[#2597d0] rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#1a7eb3] transition-all shadow-lg shadow-[#2597d0]/20">
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
