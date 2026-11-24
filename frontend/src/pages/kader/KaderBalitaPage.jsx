import { useState, useEffect } from 'react'
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
  QrCode,
  Edit,
  Trash2,
  Eye,
  RefreshCw
} from 'lucide-react'
import BalitaRegistrationForm from '../../components/ui/BalitaRegistrationForm'
import BalitaDetailModal from '../../components/ui/BalitaDetailModal'
import BalitaQRCodeModal from '../../components/ui/BalitaQRCodeModal'
import { fetchRoleDashboardData, deleteRoleData } from '../../lib/authApi'

export default function KaderBalitaPage({ user, onLogout, onNavigate }) {
  const [balitaList, setBalitaList] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('Semua')
  const [showRegForm, setShowRegForm] = useState(false)
  const [selectedBalita, setSelectedBalita] = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const loadBalitaData = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const data = await fetchRoleDashboardData('/kader/balita')
      if (Array.isArray(data)) {
        setBalitaList(data)
      } else {
        setBalitaList([])
      }
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memuat data dari server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBalitaData()
  }, [])

  // Filter Logic (Sesuai fitur.md 1.2)
  const filteredList = balitaList.filter(b => {
    const nameMatch = b.nama?.toLowerCase().includes(searchTerm.toLowerCase()) || false
    const parentMatch = b.nama_ibu?.toLowerCase().includes(searchTerm.toLowerCase()) || false
    const matchesSearch = nameMatch || parentMatch
    
    if (activeFilter === 'Semua') return matchesSearch
    if (activeFilter === 'RT 02') return matchesSearch && b.rt_rw?.includes('RT 02')
    if (activeFilter === 'Risiko') return matchesSearch && (b.status_gizi === 'Stunted' || b.status_gizi === 'Berisiko' || b.status_gizi === 'Wasted')
    if (activeFilter === 'Belum Timbang') return matchesSearch && b.status_timbang === 'Belum Ditimbang'
    
    return matchesSearch
  })

  const handleRegSuccess = (result) => {
    setShowRegForm(false)
    setSelectedBalita(null)
    const name = result?.nama || selectedBalita?.nama || 'Balita'
    if (result?.offline) {
      alert(`Data ${name} masuk antrean offline. Buka menu Sinkronisasi setelah sinyal tersedia.`)
      return
    }
    loadBalitaData() // Refresh from database
    const msg = selectedBalita?.id ? 'diperbarui' : 'didaftarkan'
    alert(`Berhasil ${msg} data ${name}.`)
  }

  const handleDeleteBalita = async () => {
    if (!selectedBalita) return
    try {
      setLoading(true)
      await deleteRoleData(`/kader/balita/${selectedBalita.id}`)
      setBalitaList(prev => prev.filter(b => b.id !== selectedBalita.id))
      setShowDeleteConfirm(false)
      setSelectedBalita(null)
      alert('Data balita berhasil dihapus dari database.')
    } catch (err) {
      alert('Gagal menghapus data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Keep raw API fields (magic_token, berat_terakhir, ...) while exposing camelCase aliases.
  const toSelected = (balita) => ({
    ...balita,
    jenisKelamin: balita.jenis_kelamin,
    namaOrtu: balita.nama_ibu,
    rtRw: balita.rt_rw,
    statusGizi: balita.status_gizi,
    statusTimbang: balita.status_timbang,
    magicToken: balita.magic_token,
  })

  const handleEditBalita = (balita) => {
    // Map list data to form data format
    const rtRw = balita.rt_rw || balita.rtRw || ''
    const hasCoord = Number(balita.latitude) !== 0 && Number(balita.longitude) !== 0
    const editData = {
      id: balita.id,
      nik: '', // NIK usually not returned or hidden
      nama: balita.nama,
      jenisKelamin: balita.jenis_kelamin || balita.jenisKelamin || 'L',
      tanggalLahir: balita.tanggal_lahir || balita.tanggalLahir || '',
      beratLahir: balita.berat_lahir || balita.beratLahir || '',
      panjangLahir: balita.panjang_lahir || balita.panjangLahir || '',
      namaIbu: balita.nama_ibu || balita.namaOrtu || '',
      namaAyah: balita.nama_ayah || balita.namaAyah || '',
      noWA: balita.no_wa || balita.noWA || '',
      rt: rtRw ? rtRw.split('/')[0].replace('RT ', '').trim() : '',
      rw: rtRw ? rtRw.split('/')[1]?.replace('RW ', '').trim() : '04',
      alergi: balita.alergi || '',
      koordinat: hasCoord
        ? { lat: Number(balita.latitude), lng: Number(balita.longitude), accuracy: 0 }
        : null
    }
    setSelectedBalita(editData)
    setShowRegForm(true)
  }

  return (
    <div className="max-w-[1140px] mx-auto space-y-6">
      {/* Header & Stats Dashboard */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#2597d0] mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Manajemen Data Balita RW 04</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#070709]">
            Direktori Profil Balita
          </h1>
          <p className="text-sm text-[#60606c] mt-1">
            {balitaList.length} Anak Terdaftar • Enkripsi SHA-256 Aktif
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={loadBalitaData}
            className="p-2.5 rounded-2xl bg-white border border-black/8 text-gray-600 hover:bg-gray-50 transition-all shadow-2xs"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
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

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Balita Table View */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Nama Balita</th>
                <th className="px-6 py-4">Usia / JK</th>
                <th className="px-6 py-4">Orang Tua</th>
                <th className="px-6 py-4">RT / RW</th>
                <th className="px-6 py-4">Status Gizi</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!loading && filteredList.map((balita) => (
                <tr 
                  key={balita.id}
                  onClick={() => {
                    setSelectedBalita(toSelected(balita))
                    setShowDetail(true)
                  }}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 font-bold text-slate-800">{balita.nama}</td>
                  <td className="px-6 py-4 text-slate-600">{balita.usia} • {balita.jenis_kelamin}</td>
                  <td className="px-6 py-4 text-slate-600">{balita.nama_ibu}</td>
                  <td className="px-6 py-4 text-slate-600">{balita.rt_rw}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                      balita.status_gizi === 'Normal' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {balita.status_gizi}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedBalita(toSelected(balita))
                          setShowDetail(true)
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#2597d0] hover:bg-slate-100 transition-colors"
                        title="Liat Detail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditBalita(toSelected(balita))
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 transition-colors"
                        title="Edit Data"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedBalita(toSelected(balita))
                          setShowQR(true)
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#2597d0] hover:bg-slate-100 transition-colors"
                        title="QR Code"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedBalita({
                            id: balita.id,
                            nama: balita.nama
                          })
                          setShowDeleteConfirm(true)
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                        title="Hapus Data"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-8 h-8 mb-3 animate-spin text-[#2597d0]" />
            <p className="text-sm">Memuat data balita dari database server...</p>
          </div>
        )}

        {!loading && filteredList.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Baby className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm italic">Tidak menemukan balita dengan kriteria tersebut di database.</p>
          </div>
        )}
      </div>

      {/* Registration Modal */}
      {showRegForm && (
        <BalitaRegistrationForm 
          onClose={() => {
            setShowRegForm(false)
            setSelectedBalita(null)
          }} 
          onSuccess={handleRegSuccess}
          initialBalita={selectedBalita}
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-[#070709] mb-2">Hapus Data Balita?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Anda akan menghapus data <strong>{selectedBalita?.nama}</strong>. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-2xl border border-black/8 text-sm font-bold hover:bg-gray-50 transition-all"
              >
                Batal
              </button>
              <button 
                onClick={handleDeleteBalita}
                className="flex-1 py-3 rounded-2xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Access Footer Hint */}
      <div className="p-4 rounded-2xl bg-[#f5f8fc] border border-[#2597d0]/10 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
        </div>
        <p className="text-[11px] text-[#60606c] leading-tight">
          <strong>Keamanan Data:</strong> NIK diproses dengan SHA-256 + Salt di level API. 
          Data balita kini terhubung langsung dengan tabel terpusat PostgreSQL (sama dengan Bidan).
        </p>
      </div>
    </div>
  )
}
