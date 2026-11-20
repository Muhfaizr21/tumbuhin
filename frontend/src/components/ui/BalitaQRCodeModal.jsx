import { X, Download, Printer, Share2 } from 'lucide-react'

export default function BalitaQRCodeModal({ balita, onClose }) {
  if (!balita) return null

  // Simulasi URL Magic Link untuk QR
  const qrUrl = `https://tumbuhin.id/p/token_${balita.id}`

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl border border-white/20 animate-in fade-in zoom-in duration-200">
        <div className="p-6 text-center space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-gray-900 text-lg">QR Kartu Gizi</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="bg-gray-50 p-8 rounded-[24px] border border-gray-100 flex flex-col items-center justify-center space-y-4">
            {/* Mock QR Code UI */}
            <div className="w-48 h-48 bg-white p-3 rounded-2xl shadow-sm border border-black/5 relative group">
              <div className="w-full h-full bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://tumbuhin.id/p/temp')] bg-cover opacity-90 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-10 h-10 bg-white rounded-lg shadow-md border border-gray-100 flex items-center justify-center">
                    <div className="w-6 h-6 bg-[#2597d0] rounded-sm" />
                 </div>
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="font-bold text-[#070709]">{balita.nama}</p>
              <p className="text-[11px] text-gray-400 font-mono uppercase tracking-widest">{balita.id}</p>
            </div>
          </div>

          <p className="text-[11px] text-gray-500 px-4 leading-relaxed">
            Tempel QR Code ini di sampul depan **Buku KIA** fisik untuk mempermudah pencatatan bulan berikutnya.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-gray-100 text-gray-700 font-bold text-xs hover:bg-gray-200 transition-colors">
              <Download className="w-4 h-4" />
              Unduh PNG
            </button>
            <button className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#070709] text-white font-bold text-xs hover:bg-black transition-colors shadow-lg shadow-black/10">
              <Printer className="w-4 h-4" />
              Cetak Stiker
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
