import { useState, useEffect } from 'react'
import { 
  QrCode, 
  Copy, 
  CheckCircle2, 
  Share2, 
  MessageSquare,
  RefreshCw,
  Search
} from 'lucide-react'
import { kaderApi } from '../../lib/kaderApi'
import {
  buildMagicLink,
  buildWhatsAppMessage,
  normalizeWhatsAppNumber,
} from '../../lib/magicLink'
import BalitaQRCodeModal from '../../components/ui/BalitaQRCodeModal'
import PaginationBar from '../../components/ui/PaginationBar'

export default function KaderDistribusiPage({ searchQuery = '' }) {
  const [balitaList, setBalitaList] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBalita, setSelectedBalita] = useState(null)
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [waTemplate, setWaTemplate] = useState('')
  const pageSize = 5

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [data, settingsData] = await Promise.all([
          kaderApi.getBalitaList(),
          kaderApi.getSettings().catch(() => null),
        ])
        if (Array.isArray(data) && data.length > 0) {
          setBalitaList(data)
          setSelectedBalita(data[0])
        }
        if (settingsData?.settings?.wa_template) {
          setWaTemplate(settingsData.settings.wa_template)
        }
      } catch (err) {
        console.error('Failed to load balita for distribution:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const magicLink = selectedBalita ? buildMagicLink(selectedBalita.magic_token) : ''
  const waMessage = selectedBalita ? buildWhatsAppMessage(selectedBalita, magicLink, waTemplate) : ''

  const effectiveQuery = (searchTerm || searchQuery || '').trim().toLowerCase()
  const filteredBalita = balitaList.filter((b) => {
    if (!effectiveQuery) return true
    return (
      (b.nama || '').toLowerCase().includes(effectiveQuery) ||
      (b.nama_ibu || b.namaOrtu || '').toLowerCase().includes(effectiveQuery)
    )
  })
  const safePage = Math.min(currentPage, Math.max(1, Math.ceil(filteredBalita.length / pageSize)))
  const paginatedBalita = filteredBalita.slice((safePage - 1) * pageSize, safePage * pageSize)

  const handleCopy = async () => {
    if (!magicLink) {
      alert('Magic token belum tersedia. Muat ulang data balita terlebih dahulu.')
      return
    }
    try {
      await navigator.clipboard.writeText(magicLink)
    } catch {
      const input = document.createElement('textarea')
      input.value = magicLink
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSendWhatsApp = () => {
    if (!selectedBalita) return
    if (!magicLink) {
      alert('Magic token belum tersedia. Muat ulang data balita terlebih dahulu.')
      return
    }
    const phone = normalizeWhatsAppNumber(selectedBalita.no_wa || selectedBalita.noWA)
    if (!phone) {
      alert('Nomor WhatsApp orang tua belum terisi. Lengkapi data balita dulu.')
      return
    }
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(waMessage)}`,
      '_blank',
      'noopener,noreferrer',
    )
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

            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama balita atau ibu..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#2597d0]"
              />
            </div>
            
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                <RefreshCw className="w-6 h-6 mb-2 animate-spin text-[#2597d0]" />
                <p className="text-xs">Memuat data dari database...</p>
              </div>
            ) : filteredBalita.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400 italic">
                Belum ada data balita yang sesuai.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2 pr-1">
                  {paginatedBalita.map(b => (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBalita(b)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      selectedBalita?.id === b.id 
                        ? 'bg-blue-50/50 border-[#2597d0] shadow-xs' 
                        : 'bg-white border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-sm text-[#070709]">{b.nama}</h4>
                      <p className="text-xs text-gray-500">Ortu: {b.nama_ibu || b.namaOrtu || '-'} ({b.no_wa || b.noWA || '-'})</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      (b.status_gizi || b.statusGizi) === 'Normal' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {b.status_gizi || b.statusGizi || 'Normal'}
                    </span>
                  </div>
                ))}
                </div>
                <PaginationBar
                  totalItems={filteredBalita.length}
                  currentPage={safePage}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  itemLabel="balita"
                  compact={true}
                />
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Preview & Share */}
        <div className="lg:col-span-7 space-y-6">
          {selectedBalita ? (
            <div className="bg-white border border-black/8 rounded-3xl p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-black/5">
                <div>
                  <h3 className="font-bold text-lg text-[#070709]">{selectedBalita.nama}</h3>
                  <p className="text-xs text-gray-500">Nomor WhatsApp: {selectedBalita.no_wa || selectedBalita.noWA || '-'}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#2597d0]/10 flex items-center justify-center text-[#2597d0]">
                  <Share2 className="w-6 h-6" />
                </div>
              </div>

              {/* Preview Pesan WA */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Pratinjau Pesan WhatsApp</label>
                <div className="p-4 rounded-2xl bg-[#f5f8fc] border border-black/5 font-mono text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                  {waMessage || 'Magic token belum tersedia untuk balita ini. Muat ulang data balita.'}
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
                <button 
                  onClick={handleSendWhatsApp}
                  disabled={!magicLink}
                  className="py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageSquare className="w-4 h-4" />
                  Kirim ke WhatsApp Ibu
                </button>
                <button
                  onClick={() => setShowQR(true)}
                  disabled={!magicLink}
                  className="py-3.5 rounded-2xl bg-gray-100 text-gray-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <QrCode className="w-4 h-4" />
                  Cetak QR Code Buku KIA
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-black/8 rounded-3xl p-12 text-center text-gray-400">
              Pilih balita dari daftar di sebelah kiri untuk melihat pratinjau pesan.
            </div>
          )}
        </div>
      </div>

      {showQR && selectedBalita && (
        <BalitaQRCodeModal
          balita={selectedBalita}
          magicLink={magicLink}
          onClose={() => setShowQR(false)}
        />
      )}
    </div>
  )
}
