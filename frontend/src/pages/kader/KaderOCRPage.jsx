import { useState, useRef, useEffect } from 'react'
import { 
  Camera, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  RefreshCw,
  Save,
  Trash2
} from 'lucide-react'
import { postRoleData, fetchRoleDashboardData } from '../../lib/authApi'
import { recognizeKmsImage } from '../../lib/kmsOcr'

export default function KaderOCRPage() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedData, setExtractedData] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [balitaList, setBalitaList] = useState([])
  const [selectedBalitaId, setSelectedBalitaId] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    const loadBalita = async () => {
      try {
        const data = await fetchRoleDashboardData('/kader/balita')
        setBalitaList(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Gagal memuat balita:', err)
      }
    }
    loadBalita()
  }, [])

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
      setExtractedData(null)
    }
  }

  const [ocrProgress, setOcrProgress] = useState(0)

  const simulateOCR = async () => {
    if (!selectedBalitaId) {
      alert('Pilih balita terlebih dahulu di dropdown')
      return
    }
    if (!preview) return

    setIsProcessing(true)
    setOcrProgress(0)
    try {
      const { text, rows } = await recognizeKmsImage(preview, (p) => setOcrProgress(p))
      console.log('OCR text:', text)
      if (!rows.length) {
        alert('Tidak berhasil membaca tabel KMS. Pastikan foto jelas dan tabel terlihat penuh. Coba foto ulang.')
        setIsProcessing(false)
        return
      }
      const withBalita = rows.map((r) => ({ ...r, balitaId: selectedBalitaId }))
      setExtractedData(withBalita)
    } catch (err) {
      console.error('OCR error:', err)
      alert('Gagal memproses gambar: ' + err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveData = async (data) => {
    setIsSaving(true)
    try {
      // Kirim setiap baris pengukuran ke API timbang
      for (const row of data) {
        await postRoleData('/kader/timbang', {
            balitaId: row.balitaId,
            tanggal: row.tanggal || new Date().toISOString().split('T')[0],
            berat: parseFloat(row.berat),
            tinggi: parseFloat(row.tinggi),
            posisi: 'berdiri',
            lingkarKepala: 0,
            lila: 0
        })
      }
      alert('Data berhasil disimpan ke database!')
      setExtractedData(null)
      setPreview(null)
      setFile(null)
      setSelectedBalitaId('')
    } catch (err) {
      alert('Gagal menyimpan: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-[1140px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#070709]">Smart KMS OCR</h1>
          <p className="text-sm text-gray-500">Scan tabel penimbangan Buku KIA fisik menjadi data digital.</p>
        </div>
      </div>

      {/* Selector Balita */}
      <div className="bg-white border border-black/8 rounded-2xl p-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <label className="text-[13px] font-semibold text-gray-700 whitespace-nowrap">Pilih Balita:</label>
          <select 
            value={selectedBalitaId}
            onChange={e => setSelectedBalitaId(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2597d0] outline-none text-sm bg-white"
          >
            <option value="">-- Pilih Balita untuk Data KIA --</option>
            {balitaList.map(b => (
              <option key={b.id} value={b.id}>{b.nama} ({b.usia})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-4">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-3xl bg-white p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#2597d0] transition-all min-h-[300px]"
          >
            {preview ? (
              <img src={preview} alt="Preview" className="max-h-[250px] rounded-xl shadow-sm" />
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-[#f5f8fc] flex items-center justify-center text-[#2597d0] mb-4">
                  <Camera className="w-8 h-8" />
                </div>
                <p className="font-bold text-[#070709]">Ambil Foto atau Unggah</p>
                <p className="text-xs text-gray-400 mt-1 px-10">Pastikan tabel di Buku KIA terlihat jelas dan tidak terpotong.</p>
              </>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
          </div>

          {file && !extractedData && !isProcessing && (
            <button 
              onClick={simulateOCR}
              disabled={!selectedBalitaId}
              className="w-full py-4 rounded-2xl bg-[#2597d0] text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#2597d0]/20 disabled:opacity-50"
            >
              <RefreshCw className="w-5 h-5" />
              Mulai Ekstraksi AI
            </button>
          )}

          {isProcessing && (
            <div className="w-full py-4 rounded-2xl bg-gray-100 text-gray-500 font-bold flex items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin" />
              Membaca Tabel... {ocrProgress}%
            </div>
          )}
        </div>

        <div className="lg:col-span-7">
          {extractedData ? (
            <div className="bg-white border border-black/8 rounded-3xl overflow-hidden shadow-2xs">
              <div className="bg-[#f5f8fc] p-5 border-b border-black/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#2597d0]" />
                  <h3 className="font-bold text-[#070709]">Hasil Ekstraksi AI</h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase">OCR Terbaca</span>
              </div>
               
              <div className="p-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-black/5">
                      <th className="pb-3 font-semibold">Bulan/Tahun</th>
                      <th className="pb-3 font-semibold">Usia</th>
                      <th className="pb-3 font-semibold text-right">BB (kg)</th>
                      <th className="pb-3 font-semibold text-right">TB (cm)</th>
                      <th className="pb-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {extractedData.map((row, idx) => (
                      <tr key={idx} className="group">
                        <td className="py-4 font-medium text-gray-700">{row.bulan}</td>
                        <td className="py-4 text-gray-500">{row.usia} bln</td>
                        <td className="py-4 text-right font-bold text-[#070709]">{row.berat}</td>
                        <td className="py-4 text-right font-bold text-[#070709]">{row.tinggi}</td>
                        <td className="py-4 text-right">
                          <button 
                            onClick={() => setExtractedData(extractedData.filter((_, i) => i !== idx))}
                            className="p-1.5 text-gray-300 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-8 grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => {
                      setExtractedData(null)
                      setPreview(null)
                      setFile(null)
                    }}
                    className="py-3 rounded-2xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50"
                  >
                    Ulangi Scan
                  </button>
                  <button 
                    onClick={() => handleSaveData(extractedData)}
                    disabled={isSaving || !extractedData.length}
                    className="py-3 rounded-2xl bg-[#070709] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-black/90 transition-all"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSaving ? 'Menyimpan...' : 'Simpan Riwayat'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-gray-50 border border-dashed border-gray-200 rounded-3xl text-gray-400">
              <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm italic">Belum ada data yang diekstrak. Silakan unggah foto lembar KMS dari Buku KIA.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}