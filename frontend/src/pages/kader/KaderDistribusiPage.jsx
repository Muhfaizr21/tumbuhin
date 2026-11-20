import { useState } from 'react'
import { 
  Send, 
  QrCode, 
  Copy, 
  CheckCircle2, 
  Share2, 
  MessageSquare,
  Smartphone
} from 'lucide-react'
import { MOCK_BALITA_LIST } from '../../services/mock/kaderMock'

export default function KaderDistribusiPage() {
  const [selectedBalita, setSelectedBalita] = useState(MOCK_BALITA_LIST[0])
  const [copied, setCopied] = useState(false)

  const magicLink = `https://tumbuhin.id/p/token_${selectedBalita.id}_998877`

  const handleCopy = () => {
    navigator.clipboard.writeText(magicLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-[1140px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#070709]">Distribusi WhatsApp & QR</h1>
          <p className="text-sm text-gray-500">Kirim hasil timbang & Magic Link ke orang tua tanpa login.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Pilih Balita */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-black/8 rounded-3xl p-6 shadow-2xs space-y-4">
            <h3 className="font-bold text-[#070709]">Pilih Kartu Gizi Balita</h3>
            
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {MOCK_BALITA_LIST.map(b => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBalita(b)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedBalita.id === b.id 
                      ? 'bg-blue-50/50 border-[#2597d0] shadow-xs' 
                      : 'bg-white border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-sm text-[#070709]">{b.nama}</h4>
                    <p className="text-xs text-gray-500">Ortu: {b.namaOrtu} ({b.noWA})</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    b.statusGizi === 'Normal' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {b.statusGizi}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Preview & Share */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-black/8 rounded-3xl p-6 shadow-2xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-black/5">
              <div>
                <h3 className="font-bold text-lg text-[#070709]">{selectedBalita.nama}</h3>
                <p className="text-xs text-gray-500">Nomor WhatsApp: {selectedBalita.noWA}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#2597d0]/10 flex items-center justify-center text-[#2597d0]">
                <Share2 className="w-6 h-6" />
              </div>
            </div>

            {/* Preview Pesan WA */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Pratinjau Pesan WhatsApp</label>
              <div className="p-4 rounded-2xl bg-[#f5f8fc] border border-black/5 font-mono text-xs text-gray-700 space-y-2 leading-relaxed">
                <p>Halo Ibu {selectedBalita.namaOrtu}, berikut ringkasan hasil posyandu <strong>{selectedBalita.nama}</strong> bulan ini:</p>
                <p>• Status Gizi: *{selectedBalita.statusGizi}*<br />• Berat Badan: *Sesuai Kurva KMS*<br />• Catatan: *{selectedBalita.catatanBidan}*</p>
                <p>Buka Kartu Gizi Digital & Resep MPASI pribadi tanpa login melalui tautan berikut:<br />
                <span className="text-[#2597d0] underline">{magicLink}</span></p>
              </div>
            </div>

            {/* Magic Link Box */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Magic Link Tautan Unik</label>
              <div className="flex gap-2">
                <input 
                  readOnly
                  value={magicLink}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono text-gray-600 outline-none"
                />
                <button 
                  onClick={handleCopy}
                  className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-black transition-all shrink-0"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Disalin!' : 'Salin'}</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <button className="py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20">
                <MessageSquare className="w-4 h-4" />
                Kirim ke WhatsApp Ibu
              </button>
              <button className="py-3.5 rounded-2xl bg-gray-100 text-gray-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200">
                <QrCode className="w-4 h-4" />
                Cetak QR Code Buku KIA
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
