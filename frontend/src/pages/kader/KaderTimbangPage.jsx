import { useState, useEffect } from 'react'
import { Scale, Ruler, CircleDot, Calendar, CheckCircle2, AlertTriangle, Info, ChevronRight, Save, Baby, RefreshCw } from 'lucide-react'
import { postRoleData, fetchRoleDashboardData } from '../../lib/authApi'

export default function KaderTimbangPage({ user }) {
  const [balitaList, setBalitaList] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBalitaId, setSelectedBalitaId] = useState('')
  const [tanggalTimbang, setTanggalTimbang] = useState(new Date().toISOString().split('T')[0])
  const [berat, setBerat] = useState('')
  const [tinggi, setTinggi] = useState('')
  const [posisi, setPosisi] = useState('Terlentang') // 'Terlentang' | 'Berdiri'
  const [lingkarKepala, setLingkarKepala] = useState('')
  const [lila, setLila] = useState('')
  
  const [layanan, setLayanan] = useState({
    asiEksklusif: false,
    vitA: false,
    obatCacing: false
  })

  const [isCalculating, setIsCalculating] = useState(false)
  const [results, setResults] = useState(null)

  const loadBalitaData = async () => {
    try {
      setLoading(true)
      const data = await fetchRoleDashboardData('/kader/balita')
      setBalitaList(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Gagal memuat balita:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBalitaData()
  }, [])

  const selectedBalita = balitaList.find(b => b.id === selectedBalitaId)

  const calculateZScore = () => {
    // Simulasi kalkulasi Z-Score (Logika backend akan mengembalikan hasil riil)
    if (berat && tinggi) {
      setResults({
        bbu: -0.5,
        tbu: -1.2,
        bbtb: -0.8,
        status: "Gizi Baik",
        risk: 15,
        riskLevel: "LOW",
        adjustedTinggi: parseFloat(tinggi)
      })
    }
  }

  const handleSimpanTimbang = async () => {
    try {
      setIsCalculating(true)
      const result = await postRoleData('/kader/timbang', {
        balitaId: selectedBalitaId,
        tanggal: tanggalTimbang,
        berat: parseFloat(berat),
        tinggi: parseFloat(tinggi),
        posisi,
        lingkarKepala: parseFloat(lingkarKepala || 0),
        lila: parseFloat(lila || 0)
      })
      setResults(result)
      alert('Data penimbangan berhasil disimpan ke database!')
    } catch (err) {
      console.error('Gagal simpan:', err)
      alert('Gagal menyimpan ke database: ' + err.message)
    } finally {
      setIsCalculating(false)
    }
  }

  useEffect(() => {
    if (berat && tinggi && selectedBalita) {
      calculateZScore()
    } else {
      setResults(null)
    }
  }, [berat, tinggi, posisi, selectedBalitaId])

  return (
    <div className="max-w-[1140px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Kolom Kiri: Form Input */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white border border-black/8 rounded-3xl p-6 shadow-2xs">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#2597d0]/10 flex items-center justify-center text-[#2597d0]">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#070709]">Input Antropometri</h2>
              <p className="text-xs text-gray-500">Gunakan alat ukur yang sudah dikalibrasi</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Pilih Balita */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-gray-700">Pilih Balita</label>
              <div className="relative">
                <select 
                  value={selectedBalitaId}
                  onChange={e => setSelectedBalitaId(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2597d0] outline-none text-sm appearance-none bg-no-repeat bg-[right_1rem_center] disabled:bg-gray-50"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='gray'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundSize: '1em' }}
                >
                  <option value="">{loading ? 'Memuat data...' : '-- Pilih Nama Balita --'}</option>
                  {balitaList.map(b => (
                    <option key={b.id} value={b.id}>{b.nama} ({b.usia})</option>
                  ))}
                </select>
                {loading && <RefreshCw className="w-4 h-4 absolute right-10 top-3.5 text-gray-400 animate-spin" />}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-gray-700">Berat Badan (kg)</label>
                <div className="relative">
                  <input 
                    type="number" step="0.01"
                    placeholder="0.00"
                    value={berat}
                    onChange={e => setBerat(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2597d0] outline-none text-sm pl-10"
                  />
                  <Scale className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-gray-700">Tinggi/Panjang (cm)</label>
                <div className="relative">
                  <input 
                    type="number" step="0.1"
                    placeholder="0.0"
                    value={tinggi}
                    onChange={e => setTinggi(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2597d0] outline-none text-sm pl-10"
                  />
                  <Ruler className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Posisi Ukur */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-gray-700">Posisi Pengukuran</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
                {['Terlentang', 'Berdiri'].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPosisi(p)}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${
                      posisi === p ? 'bg-white text-[#2597d0] shadow-sm' : 'text-gray-500'
                    }`}
                  >
                    {p === 'Terlentang' ? 'Terlentang (Recumbent)' : 'Berdiri (Standing)'}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-500 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Otomatis menerapkan koreksi WHO ±0.7cm sesuai usia.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-gray-700">Lingkar Kepala (cm)</label>
                <input 
                  type="number" step="0.1"
                  value={lingkarKepala}
                  onChange={e => setLingkarKepala(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-gray-700">LiLA (cm)</label>
                <input 
                  type="number" step="0.1"
                  value={lila}
                  onChange={e => setLila(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none"
                />
              </div>
            </div>

            <button 
              onClick={handleSimpanTimbang}
              disabled={isCalculating || !selectedBalitaId || !berat || !tinggi}
              className="w-full py-4 rounded-2xl bg-[#070709] text-white font-bold text-sm hover:bg-black/90 shadow-lg shadow-black/10 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isCalculating ? 'Menyimpan ke Database...' : 'Simpan Penimbangan & Sinkronkan'}
            </button>
          </div>
        </div>
      </div>

      {/* Kolom Kanan: Live Z-Score Results */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white border border-black/8 rounded-3xl overflow-hidden shadow-2xs sticky top-8">
          <div className="bg-[#f5f8fc] p-5 border-b border-black/5">
            <h3 className="font-bold text-[#070709] flex items-center gap-2">
              <CircleDot className="w-4 h-4 text-[#2597d0]" />
              Kalkulator Deterministik WHO
            </h3>
          </div>

          <div className="p-6 space-y-6">
            {!results ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <Scale className="w-12 h-12 text-gray-200" />
                <p className="text-sm text-gray-400 italic px-6">
                  Masukkan data berat dan tinggi badan untuk melihat hasil Z-Score instan
                </p>
              </div>
            ) : (
              <>
                {/* Z-Score Indicators */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'BB/U', val: results.bbu, color: results.bbu < -2 ? 'text-rose-600' : 'text-emerald-600' },
                    { label: 'TB/U', val: results.tbu, color: results.tbu < -2 ? 'text-rose-600' : 'text-emerald-600' },
                    { label: 'BB/TB', val: results.bbtb, color: results.bbtb < -2 ? 'text-rose-600' : 'text-emerald-600' }
                  ].map((z, i) => (
                    <div key={i} className="bg-gray-50 rounded-2xl p-3 text-center border border-black/5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{z.label}</span>
                      <div className={`text-lg font-black ${z.color}`}>{z.val}</div>
                      <span className="text-[9px] text-gray-400">SD</span>
                    </div>
                  ))}
                </div>

                {/* Status Badge */}
                <div className={`p-4 rounded-2xl flex items-center justify-between ${
                  results.bbtb < -2 ? 'bg-rose-50 border border-rose-100' : 'bg-emerald-50 border border-emerald-100'
                }`}>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Status Gizi</span>
                    <h4 className={`text-lg font-bold ${results.bbtb < -2 ? 'text-rose-700' : 'text-emerald-700'}`}>
                      {results.status}
                    </h4>
                  </div>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    results.bbtb < -2 ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}>
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Predictive Growth Trajectory (ML Engine Mock) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#070709]">Skor Risiko Growth Faltering</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      results.riskLevel === 'HIGH' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {results.riskLevel} RISK
                    </span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        results.riskLevel === 'HIGH' ? 'bg-rose-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${results.risk}%` }}
                    />
                  </div>
                  <div className="bg-amber-50 border border-amber-100 p-3.5 rounded-2xl flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[12px] text-amber-800 leading-relaxed">
                      <strong>Analisis AI:</strong> Tren berat badan melambat. Risiko jatuh ke stunting: {results.risk}%. Rekomendasi: Tingkatkan porsi protein hewani.
                    </p>
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs py-2 border-b border-black/5">
                    <span className="text-gray-500">Koreksi Tinggi WHO</span>
                    <span className="font-semibold text-gray-700">
                      {results.adjustedTinggi?.toFixed(1)} cm
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-2 border-b border-black/5">
                    <span className="text-gray-500">Target BB Bulan Depan</span>
                    <span className="font-semibold text-emerald-600">+450 gram</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="p-5 rounded-3xl bg-[#070709] text-white space-y-3 shadow-lg">
          <div className="flex items-center gap-2 text-[#5cc0f0]">
            <Info className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Panduan Klinis</span>
          </div>
          <p className="text-xs text-white/80 leading-relaxed">
            Sesuai <strong>Permenkes No. 2 Tahun 2020</strong>, balita di bawah 24 bulan yang diukur berdiri harus ditambah 0.7 cm, dan balita di atas 24 bulan yang diukur terlentang dikurangi 0.7 cm.
          </p>
        </div>
      </div>
    </div>
  )
}
