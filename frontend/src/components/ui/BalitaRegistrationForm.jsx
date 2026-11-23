import { useState, useEffect } from 'react'
import { 
  X, 
  User, 
  Calendar, 
  Scale, 
  Ruler, 
  MapPin, 
  AlertCircle,
  ShieldCheck,
  Save
} from 'lucide-react'
import { postRoleData, putRoleData } from '../../lib/authApi'
import { enqueueItem, isBrowserOffline, isOfflineError } from '../../lib/offlineQueue'

export default function BalitaRegistrationForm({ onClose, onSuccess, initialBalita }) {
  const [formData, setFormData] = useState({
    nik: '',
    nama: '',
    jenisKelamin: 'L',
    tanggalLahir: '',
    beratLahir: '',
    panjangLahir: '',
    namaIbu: '',
    namaAyah: '',
    noWA: '',
    rt: '',
    rw: '04',
    alergi: '',
    koordinat: null
  })

  useEffect(() => {
    if (initialBalita) {
      setFormData(prev => ({
        ...prev,
        ...initialBalita,
        // Ensure some fields are strings for input value
        beratLahir: initialBalita.beratLahir?.toString() || '',
        panjangLahir: initialBalita.panjangLahir?.toString() || '',
      }))
    }
  }, [initialBalita])

  const [isHashing, setIsHashing] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [geoStatus, setGeoStatus] = useState('idle')
  const [geoError, setGeoError] = useState('')

  const handleAmbilLokasi = () => {
    setGeoError('')
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoStatus('error')
      setGeoError('Browser ini tidak mendukung Geolocation API.')
      return
    }
    setGeoStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          koordinat: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          },
        }))
        setGeoStatus('success')
      },
      (err) => {
        const map = {
          1: 'Izin lokasi ditolak. Aktifkan izin lokasi di pengaturan browser.',
          2: 'Lokasi tidak tersedia. Pastikan GPS aktif.',
          3: 'Waktu pengambilan lokasi habis. Coba lagi.',
        }
        setGeoStatus('error')
        setGeoError(map[err.code] || 'Gagal mengambil lokasi.')
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsHashing(true)
    setErrorMsg('')
    
    try {
      // Map frontend keys to backend database column names
      const payload = {
        nik: formData.nik,
        nama: formData.nama,
        jenis_kelamin: formData.jenisKelamin,
        tanggal_lahir: formData.tanggalLahir,
        berat_lahir: parseFloat(formData.beratLahir),
        panjang_lahir: parseFloat(formData.panjangLahir),
        nama_ibu: formData.namaIbu,
        nama_ayah: formData.namaAyah,
        no_wa: formData.noWA,
        rt_rw: `RT ${formData.rt} / RW ${formData.rw}`,
        alergi: formData.alergi,
        latitude: formData.koordinat?.lat || 0,
        longitude: formData.koordinat?.lng || 0
      }

      let result
      if (initialBalita?.id) {
        // Update existing
        result = await putRoleData(`/kader/balita/${initialBalita.id}`, payload)
      } else if (isBrowserOffline()) {
        const queued = await enqueueItem({
          type: 'balita',
          payload,
          label: formData.nama,
          subtitle: `NIK ${formData.nik}`
        })
        result = { ...payload, nama: formData.nama, offline: true, clientId: queued.clientId }
      } else {
        // Create new
        result = await postRoleData('/kader/balita', payload)
      }

      onSuccess(result)
    } catch (err) {
      if (!initialBalita?.id && isOfflineError(err)) {
        try {
          const queued = await enqueueItem({
            type: 'balita',
            payload,
            label: formData.nama,
            subtitle: `NIK ${formData.nik}`
          })
          onSuccess({ ...payload, nama: formData.nama, offline: true, clientId: queued.clientId })
          return
        } catch (queueErr) {
          setErrorMsg(queueErr.message || 'Gagal menyimpan ke antrean offline')
          setIsHashing(false)
          return
        }
      }
      setErrorMsg(err.message || 'Gagal menyimpan data ke database')
      setIsHashing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-black/5">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-black/5 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-[#070709]">
              {initialBalita ? 'Edit Profil Balita' : 'Registrasi Balita Baru'}
            </h2>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              NIK dienkripsi otomatis (SHA-256) demi privasi medis
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {errorMsg}
            </div>
          )}
          {/* Section 1: Identitas Vital */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-full md:col-span-1">
              <label className="text-[13px] font-semibold text-gray-700">NIK Anak (16 Digit)</label>
              <div className="relative">
                <input 
                  required
                  maxLength={16}
                  value={formData.nik}
                  onChange={e => setFormData({...formData, nik: e.target.value.replace(/\D/g, '')})}
                  placeholder="3201..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2597d0] focus:ring-2 focus:ring-[#2597d0]/10 outline-none transition-all text-sm pl-10"
                />
                <ShieldCheck className="w-4 h-4 absolute left-3.5 top-3 text-emerald-500" />
              </div>
            </div>

            <div className="space-y-1.5 col-span-full md:col-span-1">
              <label className="text-[13px] font-semibold text-gray-700">Nama Lengkap Balita</label>
              <div className="relative">
                <input 
                  required
                  value={formData.nama}
                  onChange={e => setFormData({...formData, nama: e.target.value})}
                  placeholder="Contoh: Andi Pratama"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2597d0] focus:ring-2 focus:ring-[#2597d0]/10 outline-none transition-all text-sm pl-10"
                />
                <User className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-gray-700">Tanggal Lahir</label>
              <div className="relative">
                <input 
                  required
                  type="date"
                  value={formData.tanggalLahir}
                  onChange={e => setFormData({...formData, tanggalLahir: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2597d0] focus:ring-2 focus:ring-[#2597d0]/10 outline-none transition-all text-sm pl-10"
                />
                <Calendar className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-gray-700">Jenis Kelamin</label>
              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                {['L', 'P'].map(jk => (
                  <button
                    key={jk}
                    type="button"
                    onClick={() => setFormData({...formData, jenisKelamin: jk})}
                    className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-all ${
                      formData.jenisKelamin === jk 
                        ? 'bg-white text-[#2597d0] shadow-sm' 
                        : 'text-gray-500'
                    }`}
                  >
                    {jk === 'L' ? 'Laki-laki' : 'Perempuan'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Data Kelahiran */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-[#f5f8fc] rounded-2xl border border-[#2597d0]/10">
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-[#2597d0] uppercase tracking-wider">Berat Lahir (kg)</label>
              <div className="relative">
                <input 
                  type="number" step="0.01" required
                  value={formData.beratLahir}
                  onChange={e => setFormData({...formData, beratLahir: e.target.value})}
                  placeholder="3.20"
                  className="w-full px-4 py-2 rounded-xl border border-white focus:border-[#2597d0] outline-none transition-all text-sm pl-9"
                />
                <Scale className="w-4 h-4 absolute left-3 top-2.5 text-[#2597d0]" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-[#2597d0] uppercase tracking-wider">Panjang Lahir (cm)</label>
              <div className="relative">
                <input 
                  type="number" step="0.1" required
                  value={formData.panjangLahir}
                  onChange={e => setFormData({...formData, panjangLahir: e.target.value})}
                  placeholder="49.5"
                  className="w-full px-4 py-2 rounded-xl border border-white focus:border-[#2597d0] outline-none transition-all text-sm pl-9"
                />
                <Ruler className="w-4 h-4 absolute left-3 top-2.5 text-[#2597d0]" />
              </div>
            </div>
          </div>

          {/* Section 3: Orang Tua & Lokasi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-gray-700">Nama Ibu Kandung</label>
              <input 
                required
                value={formData.namaIbu}
                onChange={e => setFormData({...formData, namaIbu: e.target.value})}
                placeholder="Nama lengkap ibu"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-gray-700">WhatsApp Orang Tua</label>
              <input 
                required
                type="tel"
                value={formData.noWA}
                onChange={e => setFormData({...formData, noWA: e.target.value})}
                placeholder="0812..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-gray-700">RT (RW 04)</label>
              <select 
                value={formData.rt}
                onChange={e => setFormData({...formData, rt: e.target.value})}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none"
              >
                <option value="">Pilih RT</option>
                {[1,2,3,4,5].map(n => <option key={n} value={`0${n}`}>RT 0{n}</option>)}
              </select>
            </div>
            <div className="space-y-1.5 flex flex-col justify-end">
              <button
                type="button"
                onClick={handleAmbilLokasi}
                disabled={geoStatus === 'loading'}
                className="w-full px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors disabled:opacity-60 disabled:cursor-wait"
              >
                {geoStatus === 'loading' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-emerald-300 border-t-emerald-700 rounded-full animate-spin" />
                    Mengambil Lokasi...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4" />
                    {formData.koordinat ? 'Perbarui Pin Lokasi' : 'Ambil GPS Rumah (Pin Lokasi)'}
                  </>
                )}
              </button>
              {formData.koordinat && geoStatus !== 'error' && (
                <p className="text-[11px] text-emerald-700 flex items-start gap-1">
                  <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>
                    {formData.koordinat.lat.toFixed(6)}, {formData.koordinat.lng.toFixed(6)}
                    {formData.koordinat.accuracy
                      ? ` (±${Math.round(formData.koordinat.accuracy)} m)`
                      : ''}
                  </span>
                </p>
              )}
              {geoError && (
                <p className="text-[11px] text-rose-600 flex items-start gap-1">
                  <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>{geoError}</span>
                </p>
              )}
            </div>
          </div>

          {/* Section 4: Catatan Medis */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-gray-700">Alergi & Pantangan Makan</label>
            <div className="relative">
              <textarea 
                value={formData.alergi}
                onChange={e => setFormData({...formData, alergi: e.target.value})}
                placeholder="Contoh: Alergi telur ayam, ikan laut, atau kacang-kacangan..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none min-h-[80px]"
              />
              <AlertCircle className="w-4 h-4 absolute right-3 bottom-3 text-amber-500" />
            </div>
            <p className="text-[11px] text-gray-500">Data ini akan digunakan AI Nutri-Chef untuk memfilter resep MPASI.</p>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all"
            >
              Batal
            </button>
            <button
              disabled={isHashing}
              className="flex-[2] py-3 rounded-2xl bg-[#070709] text-white font-bold text-sm hover:bg-black/90 shadow-lg shadow-black/10 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isHashing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {initialBalita ? 'Memperbarui...' : 'Mengenkripsi & Menyimpan...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {initialBalita ? 'Simpan Perubahan' : 'Simpan & Generate Magic Token'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
