import { useState } from 'react'
import { X, Download, Printer } from 'lucide-react'
import { buildMagicLink } from '../../lib/magicLink'

function qrImageUrl(data) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=8&data=${encodeURIComponent(data)}`
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export default function BalitaQRCodeModal({ balita, magicLink, onClose }) {
  const [downloading, setDownloading] = useState(false)
  if (!balita) return null

  const token = balita.magic_token || balita.magicToken
  const qrUrl = magicLink || buildMagicLink(token)
  const imageUrl = qrUrl ? qrImageUrl(qrUrl) : ''

  const handleDownload = async () => {
    if (!imageUrl) return
    setDownloading(true)
    try {
      const response = await fetch(imageUrl)
      if (!response.ok) throw new Error('Gagal mengunduh QR')
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `qr-kartu-gizi-${balita.nama || balita.id}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch {
      window.open(imageUrl, '_blank', 'noopener,noreferrer')
    } finally {
      setDownloading(false)
    }
  }

  const handlePrint = () => {
    if (!imageUrl) return
    const printWindow = window.open('', '_blank', 'width=480,height=640')
    if (!printWindow) return
    printWindow.document.write(`
      <!doctype html>
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <title>QR Kartu Gizi - ${escapeHtml(balita.nama)}</title>
          <style>
            @page { size: 80mm 80mm; margin: 4mm; }
            body { font-family: Arial, sans-serif; text-align: center; margin: 0; padding: 8px; }
            .sticker { border: 1px dashed #999; border-radius: 12px; padding: 10px; }
            img { width: 160px; height: 160px; }
            h1 { font-size: 14px; margin: 4px 0; }
            p { font-size: 10px; margin: 2px 0; color: #444; }
          </style>
        </head>
        <body>
          <div class="sticker">
            <h1>Kartu Gizi ${escapeHtml(balita.nama)}</h1>
            <img src="${imageUrl}" alt="QR Kartu Gizi" />
            <p>Tempel di sampul Buku KIA</p>
            <p>Scan saat penimbangan bulan berikutnya</p>
          </div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

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
            <div className="w-48 h-48 bg-white p-3 rounded-2xl shadow-sm border border-black/5 flex items-center justify-center">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={`QR Kartu Gizi ${balita.nama}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <p className="text-xs text-gray-400">Magic token belum tersedia</p>
              )}
            </div>

            <div className="space-y-1">
              <p className="font-bold text-[#070709]">{balita.nama}</p>
              <p className="text-[11px] text-gray-400 font-mono uppercase tracking-widest">{balita.id}</p>
            </div>
          </div>

          <p className="text-[11px] text-gray-500 px-4 leading-relaxed">
            Tempel QR Code ini di sampul depan <strong>Buku KIA</strong> fisik untuk mempermudah pencatatan bulan berikutnya.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleDownload}
              disabled={!imageUrl || downloading}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-gray-100 text-gray-700 font-bold text-xs hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {downloading ? 'Mengunduh...' : 'Unduh PNG'}
            </button>
            <button
              onClick={handlePrint}
              disabled={!imageUrl}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#070709] text-white font-bold text-xs hover:bg-black transition-colors shadow-lg shadow-black/10 disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              Cetak Stiker
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
