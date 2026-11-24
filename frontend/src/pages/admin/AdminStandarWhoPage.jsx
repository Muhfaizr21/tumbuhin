import { useEffect, useState } from 'react'
import {
  Calculator,
  CheckCircle2,
  Database,
  Plus,
  Scale,
  X,
} from 'lucide-react'
import PaginationBar from '../../components/ui/PaginationBar'
import { adminApi } from '../../lib/adminApi'

/**
 * Module 3.6: Standar Antropometri WHO (/admin/standar-who)
 * Inspects WHO LMS reference tables (WFA, HFA) and provides a Clinical Z-Score Calibration Simulator.
 */
export default function AdminStandarWhoPage({ onDataChanged }) {
  const [standards, setStandards] = useState([])
  const [filterIndicator, setFilterIndicator] = useState('HFA')
  const [filterGender, setFilterGender] = useState('L')
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  // Simulator State
  const [simForm, setSimForm] = useState({
    gender: 'L',
    age_months: 12,
    weight_kg: 8.9,
    height_cm: 72.4,
    measurement_pos: 'terlentang',
  })
  const [simResult, setSimResult] = useState(null)
  const [simLoading, setSimLoading] = useState(false)

  // Modal Upsert LMS
  const [modalOpen, setModalOpen] = useState(false)
  const [lmsForm, setLmsForm] = useState({
    indicator: 'HFA',
    gender: 'L',
    age_months: 15,
    l_val: 1.0,
    m_val: 79.1,
    s_val: 0.034,
  })

  const loadStandards = async (ind = filterIndicator, gen = filterGender) => {
    setLoading(true)
    try {
      const data = await adminApi.listWhoStandards(ind, gen)
      setStandards(Array.isArray(data) ? data : [])
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Gagal memuat tabel WHO LMS' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStandards(filterIndicator, filterGender)
  }, [filterIndicator, filterGender])

  const handleRunSimulation = async (e) => {
    if (e) e.preventDefault()
    setSimLoading(true)
    try {
      const res = await adminApi.simulateWhoZScore({
        gender: simForm.gender,
        age_months: Number(simForm.age_months),
        weight_kg: Number(simForm.weight_kg),
        height_cm: Number(simForm.height_cm),
        measurement_pos: simForm.measurement_pos,
      })
      setSimResult(res)
    } catch (err) {
      setNotice({ type: 'error', text: err.message })
    } finally {
      setSimLoading(false)
    }
  }

  const handleSaveLMS = async (e) => {
    e.preventDefault()
    try {
      await adminApi.upsertWhoStandard({
        indicator: lmsForm.indicator,
        gender: lmsForm.gender,
        age_months: Number(lmsForm.age_months),
        l_val: Number(lmsForm.l_val),
        m_val: Number(lmsForm.m_val),
        s_val: Number(lmsForm.s_val),
      })
      setNotice({
        type: 'success',
        text: `Parameter referensi WHO LMS (${lmsForm.indicator} • ${lmsForm.gender} • ${lmsForm.age_months} bln) berhasil disimpan.`,
      })
      setModalOpen(false)
      await loadStandards(filterIndicator, filterGender)
      if (onDataChanged) onDataChanged()
    } catch (err) {
      setNotice({ type: 'error', text: err.message })
    }
  }

  const zBadgeColor = (z) => {
    const val = Number(z || 0)
    if (val < -3) return 'bg-rose-100 text-rose-800 border-rose-200'
    if (val < -2) return 'bg-amber-100 text-amber-800 border-amber-200'
    return 'bg-emerald-100 text-emerald-800 border-emerald-200'
  }

  const totalPages = Math.max(1, Math.ceil(standards.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedStandards = standards.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">
              Standar Antropometri WHO LMS &amp; Simulator Kalibrasi Klinis
            </h2>
            <p className="text-[12px] text-slate-500">
              Inspeksi parameter Box-Cox (L, M, S) dan verifikasi presisi rumus deterministik sesuai Permenkes RI No. 2 Tahun 2020.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e293b] hover:bg-[#0f172a] text-white text-[12.5px] font-semibold cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah / Kalibrasi Baris LMS</span>
        </button>
      </div>

      {notice && (
        <div
          className={`p-3.5 px-4 rounded-2xl border text-[12.5px] font-medium flex items-center justify-between ${
            notice.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notice.text}</span>
          </span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-xs font-bold underline cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Clinical Z-Score Calibration Simulator */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-slate-800">
                Simulator &amp; Verifikator Kalkulator Klinis Z-Score WHO
              </h3>
              <p className="text-[11.5px] text-slate-400">
                Uji akurasi perhitungan Z-Score (BB/U, TB/U, BB/TB) beserta koreksi posisi ukur (± 0.7 cm).
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono text-[11px] font-semibold">
            Z = ((y / M)^L - 1) / (L × S)
          </span>
        </div>

        <form onSubmit={handleRunSimulation} className="grid grid-cols-2 sm:grid-cols-6 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Jenis Kelamin
            </label>
            <select
              value={simForm.gender}
              onChange={(e) => setSimForm({ ...simForm, gender: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-[13px]"
            >
              <option value="L">Laki-laki (L)</option>
              <option value="P">Perempuan (P)</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Usia (0-60 Bln)
            </label>
            <input
              type="number"
              min="0"
              max="60"
              value={simForm.age_months}
              onChange={(e) => setSimForm({ ...simForm, age_months: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[13px]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Berat Badan (kg)
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={simForm.weight_kg}
              onChange={(e) => setSimForm({ ...simForm, weight_kg: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[13px]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Tinggi / Panjang (cm)
            </label>
            <input
              type="number"
              step="0.1"
              min="30"
              value={simForm.height_cm}
              onChange={(e) => setSimForm({ ...simForm, height_cm: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[13px]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Posisi Ukur
            </label>
            <select
              value={simForm.measurement_pos}
              onChange={(e) => setSimForm({ ...simForm, measurement_pos: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-[13px]"
            >
              <option value="terlentang">Terlentang (Recumbent)</option>
              <option value="berdiri">Berdiri (Standing)</option>
            </select>
          </div>
          <div>
            <button
              type="submit"
              disabled={simLoading}
              className="w-full py-2 px-4 rounded-xl bg-[#1e293b] hover:bg-[#0f172a] text-white text-[12.5px] font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Scale className="w-4 h-4" />
              <span>{simLoading ? 'Menghitung...' : 'Uji Z-Score'}</span>
            </button>
          </div>
        </form>

        {simResult && (
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500">INDEKS BB/U (WFA)</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${zBadgeColor(
                      simResult.zscore_wfa,
                    )}`}
                  >
                    {simResult.zscore_wfa} SD
                  </span>
                </div>
                <p className="text-[12.5px] font-bold text-slate-800">
                  {simResult.classification_wfa}
                </p>
                <p className="text-[10.5px] font-mono text-slate-400">LMS: {simResult.wfa_lms}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500">INDEKS TB/U (HFA)</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${zBadgeColor(
                      simResult.zscore_hfa,
                    )}`}
                  >
                    {simResult.zscore_hfa} SD
                  </span>
                </div>
                <p className="text-[12.5px] font-bold text-slate-800">
                  {simResult.classification_hfa}
                </p>
                <p className="text-[10.5px] font-mono text-slate-400">
                  TB Koreksi: {simResult.adjusted_height_cm} cm ({simResult.hfa_lms})
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500">INDEKS BB/TB (WFH)</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${zBadgeColor(
                      simResult.zscore_wfh,
                    )}`}
                  >
                    {simResult.zscore_wfh} SD
                  </span>
                </div>
                <p className="text-[12.5px] font-bold text-slate-800">
                  {simResult.classification_wfh}
                </p>
                <p className="text-[10.5px] text-slate-500">{simResult.overall_status}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reference Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-[15.5px] font-bold text-slate-800">
              Tabel Referensi Parameter WHO LMS (Permenkes No. 2 Tahun 2020)
            </h3>
            <p className="text-[12px] text-slate-500">
              Menampilkan koefisien L (Box-Cox Power), M (Median), S (Koefisien Variasi), serta batas ambang SD.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterIndicator}
              onChange={(e) => {
                setFilterIndicator(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-[12px] font-semibold"
            >
              <option value="HFA">Indikator TB/U (HFA - Stunting)</option>
              <option value="WFA">Indikator BB/U (WFA - Underweight)</option>
              <option value="WFH">Indikator BB/TB (WFH - Wasting)</option>
            </select>
            <select
              value={filterGender}
              onChange={(e) => {
                setFilterGender(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-[12px] font-semibold"
            >
              <option value="L">Laki-Laki (L)</option>
              <option value="P">Perempuan (P)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-5">Indikator</th>
                <th className="py-3 px-4">JK</th>
                <th className="py-3 px-4">Usia (Bulan)</th>
                <th className="py-3 px-4 font-mono">L (Box-Cox)</th>
                <th className="py-3 px-4 font-mono">M (Median)</th>
                <th className="py-3 px-4 font-mono">S (Variasi)</th>
                <th className="py-3 px-4 text-rose-600">-3 SD (Buruk/Sangat Pendek)</th>
                <th className="py-3 px-4 text-amber-600">-2 SD (Batas Stunted/Kurang)</th>
                <th className="py-3 px-5 text-emerald-700">+2 SD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[12.5px]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Memuat parameter referensi WHO LMS...
                  </td>
                </tr>
              ) : (
                paginatedStandards.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-5 font-bold text-slate-800">{row.indicator}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          row.gender === 'L'
                            ? 'bg-sky-50 text-[#2597d0]'
                            : 'bg-pink-50 text-pink-600'
                        }`}
                      >
                        {row.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {row.age_months} Bulan
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {Number(row.l_val).toFixed(4)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {Number(row.m_val).toFixed(3)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {Number(row.s_val).toFixed(4)}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-rose-600">
                      {row.sd3_neg} {row.indicator === 'HFA' ? 'cm' : 'kg'}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-amber-600">
                      {row.sd2_neg} {row.indicator === 'HFA' ? 'cm' : 'kg'}
                    </td>
                    <td className="py-3 px-5 font-mono font-semibold text-emerald-700">
                      {row.sd2_pos} {row.indicator === 'HFA' ? 'cm' : 'kg'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 pb-4">
          <PaginationBar
            totalItems={standards.length}
            currentPage={safePage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 20]}
            itemLabel="baris referensi WHO LMS"
            compact={true}
          />
        </div>
      </div>

      {/* Modal Upsert WHO LMS Row */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-[16px] font-bold text-slate-800">
                Tambah / Perbarui Parameter WHO LMS
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLMS} className="space-y-3 text-[13px]">
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Indikator
                  </label>
                  <select
                    value={lmsForm.indicator}
                    onChange={(e) => setLmsForm({ ...lmsForm, indicator: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="HFA">HFA (TB/U)</option>
                    <option value="WFA">WFA (BB/U)</option>
                    <option value="WFH">WFH (BB/TB)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Gender
                  </label>
                  <select
                    value={lmsForm.gender}
                    onChange={(e) => setLmsForm({ ...lmsForm, gender: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="L">L</option>
                    <option value="P">P</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Usia (Bln)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={lmsForm.age_months}
                    onChange={(e) => setLmsForm({ ...lmsForm, age_months: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Nilai L
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={lmsForm.l_val}
                    onChange={(e) => setLmsForm({ ...lmsForm, l_val: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Nilai M (Median)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={lmsForm.m_val}
                    onChange={(e) => setLmsForm({ ...lmsForm, m_val: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Nilai S (Variasi)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={lmsForm.s_val}
                    onChange={(e) => setLmsForm({ ...lmsForm, s_val: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1e293b] text-white font-semibold cursor-pointer"
                >
                  Simpan Parameter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
