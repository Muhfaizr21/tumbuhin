import { useState } from 'react'
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  UserPlus, 
  MapPin, 
  Calendar, 
  Baby,
  ChevronRight,
  ShieldCheck,
  QrCode
} from 'lucide-react'
import BalitaRegistrationForm from '../../components/ui/BalitaRegistrationForm'
import BalitaDetailModal from '../../components/ui/BalitaDetailModal'
import BalitaQRCodeModal from '../../components/ui/BalitaQRCodeModal'
import { MOCK_BALITA_LIST } from '../../services/mock/kaderMock'

export default function KaderBalitaPage({ user, onLogout, onNavigate }) {
  const [balitaList, setBalitaList] = useState(MOCK_BALITA_LIST)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('Semua')
  const [showRegForm, setShowRegForm] = useState(false)
  const [selectedBalita, setSelectedBalita] = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showQR, setShowQR] = useState(false)

  // Filter Logic (Sesuai fitur.md 1.2)
  const filteredList = balitaList.filter(b => {
    const matchesSearch = b.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         b.namaOrtu.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (activeFilter === 'Semua') return matchesSearch
    if (activeFilter === 'RT 02') return matchesSearch && b.rtRw.includes('RT 02')
    if (activeFilter === 'Risiko') return matchesSearch && (b.statusGizi === 'Stunted' || b.statusGizi === 'Berisiko' || b.statusGizi === 'Wasted')
    if (activeFilter === 'Belum Timbang') return matchesSearch && b.statusTimbang === 'Belum Ditimbang'
    
    return matchesSearch
  })

  const handleRegSuccess = (newBalita) => {
    setBalitaList([newBalita, ...balitaList])
    setShowRegForm(false)
    alert(`Berhasil mendaftarkan ${newBalita.nama}. Magic Token telah diterbitkan.`)
  }

  return (
    <div className="max-w-[1140px] mx-auto space-y-6">
      {/* Header & Stats Dashboard */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#2597d0] mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Manajemen Data Balita RW 04</span>
            <span>•</span>
            <span className="text-emerald-600">Database Aktif</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#070709]">
            Direktori Profil Balita
          </h1>
          <p className="text-sm text-[#60606c] mt-1">
            {balitaList.length} Anak Terdaftar • Enkripsi SHA-256 Aktif • 100% Data Medis Terproteksi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowRegForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#070709] text-white text-sm font-bold hover:bg-black/90 transition-all shadow-lg shadow-black/5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Balita Baru</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 relative">
          <input 
            type="text"
            placeholder="Cari Nama Balita atau Nama Orang Tua..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-black/8 shadow-2xs text-sm focus:outline-none focus:border-[#2597d0] transition-all"
          />
          <Search className="w-4 h-4 absolute left-4 top-3.5 text-gray-400" />
        </div>
        <div className="lg:col-span-4 flex gap-2">
          <div className="flex-1 relative">
            <select 
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-black/8 shadow-2xs text-sm appearance-none focus:outline-none"
            >
              <option value="Semua">Semua Balita</option>
              <option value="RT 02">RT 02 Saja</option>
              <option value="Risiko">Risiko Gizi (Early Warning)</option>
              <option value="Belum Timbang">Belum Ditimbang</option>
            </select>
            <Filter className="w-4 h-4 absolute left-4 top-3.5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Balita Grid/List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredList.map((balita) => (
          <div 
            key={balita.id}
            onClick={() => {
              setSelectedBalita(balita)
              setShowDetail(true)
            }}
            className="group relative bg-white border border-black/8 rounded-3xl p-5 hover:border-[#2597d0] hover:shadow-xl hover:shadow-[#2597d0]/5 transition-all cursor-pointer overflow-hidden"
          >
            {/* Status Indicator */}
            <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-[10px] font-bold uppercase tracking-wider ${
              balita.statusGizi === 'Normal' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              {balita.statusGizi}
            </div>

            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f5f8fc] to-[#eef5fc] border border-black/5 flex items-center justify-center text-[#2597d0] shrink-0 group-hover:from-[#2597d0] group-hover:to-[#1a7eb3] group-hover:text-white transition-all">
                <Baby className="w-7 h-7" />
              </div>
              <div className="min-w-0 pr-10">
                <h3 className="font-bold text-[#070709] truncate text-[15px]">{balita.nama}</h3>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  {balita.usia} • {balita.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                </p>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  {balita.rtRw}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Orang Tua</span>
                <span className="text-xs font-semibold text-gray-700">{balita.namaOrtu}</span>
              </div>
              <div className="flex gap-1.5">
                <div 
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedBalita(balita)
                    setShowQR(true)
                  }}
                  className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:text-[#2597d0] transition-colors cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                </div>
                <div className="p-2 rounded-xl bg-gray-50 text-gray-400 group-hover:text-[#2597d0] transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredList.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400">
            <Baby className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm italic">Tidak menemukan balita dengan kriteria tersebut.</p>
          </div>
        )}
      </div>

      {/* Registration Modal */}
      {showRegForm && (
        <BalitaRegistrationForm 
          onClose={() => setShowRegForm(false)} 
          onSuccess={handleRegSuccess}
        />
      )}

      {/* Detail Modal */}
      {showDetail && (
        <BalitaDetailModal 
          balita={selectedBalita}
          onClose={() => {
            setShowDetail(false)
            setSelectedBalita(null)
          }}
          onNavigate={(path) => {
            setShowDetail(false)
            if (onNavigate) onNavigate(path)
          }}
        />
      )}

      {/* QR Code Modal */}
      {showQR && (
        <BalitaQRCodeModal 
          balita={selectedBalita}
          onClose={() => {
            setShowQR(false)
            setSelectedBalita(null)
          }}
        />
      )}

      {/* Quick Access Footer Hint */}
      <div className="p-4 rounded-2xl bg-[#f5f8fc] border border-[#2597d0]/10 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
        </div>
        <p className="text-[11px] text-[#60606c] leading-tight">
          <strong>Keamanan Data:</strong> NIK diproses dengan SHA-256 + Salt di level API. 
          Hanya Kader RW 04 dan Bidan Desa yang memiliki hak akses dekripsi visual untuk keperluan rujukan.
        </p>
      </div>
    </div>
  )
}
