import { useState } from 'react'
import {
  Baby, CalendarCheck, ChefHat, LineChart, Volume2, Search, Bell, Menu, X, CheckCircle2, Stethoscope, Sparkles, ArrowRight
} from 'lucide-react'
import KaderNavigationShell from '../kader/components/KaderNavigationShell'
import CircularProgressRing from '../bidan/components/CircularProgressRing'

const ORTU_MENUS = [
  { 
    id: 'ringkasan', 
    label: 'Ringkasan Tumbuh Kembang', 
    shortLabel: 'Ringkasan Gizi',
    route: '/ortu/dashboard', 
    icon: Baby,
    description: 'Kartu Gizi Digital anak yang dapat diakses orang tua via Magic Link.'
  },
  { 
    id: 'kurva-kms', 
    label: 'Grafik KMS Digital', 
    shortLabel: 'Kurva KMS',
    route: '/ortu/kurva-kms', 
    icon: LineChart,
    description: 'Visualisasi grafik pita warna KMS standar Buku KIA (BB/U & TB/U).'
  },
  { 
    id: 'resep-mpasi', 
    label: 'Panduan Resep MPASI Harian', 
    shortLabel: 'Resep MPASI',
    route: '/ortu/resep-mpasi', 
    icon: ChefHat,
    badge: 'AI',
    description: 'Rekomendasi resep MPASI pangan lokal sesuai anggaran dan usia anak.'
  },
  { 
    id: 'pesan-jadwal', 
    label: 'Pesan Bidan & Jadwal Posyandu', 
    shortLabel: 'Pesan Bidan',
    route: '/ortu/pesan-jadwal', 
    icon: CalendarCheck,
    description: 'Catatan edukasi dari Bidan Desa dan pengingat jadwal Posyandu.'
  },
  { 
    id: 'aksesibilitas', 
    label: 'Aksesibilitas & Suara (TTS)', 
    shortLabel: 'Suara & TTS',
    route: '/ortu/aksesibilitas', 
    icon: Volume2,
    description: 'Fitur pembaca suara otomatis Bahasa Indonesia untuk kemudahan baca.'
  },
]

export default function OrtuDashboard({ user, onLogout, onSwitchRole, tts }) {
  const [activeMenuId, setActiveMenuId] = useState('ringkasan')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')

  const currentMenu = ORTU_MENUS.find((m) => m.id === activeMenuId) || ORTU_MENUS[0]

  const handleReadAloud = (text) => {
    const sampleText = text || 'Kartu Gizi Digital Ananda Andi Pratama, usia 14 bulan. Berat badan terakhir 9 koma 8 kilogram, tinggi badan 76 koma 5 sentimeter. Status gizi baik di pita hijau KMS.'
    if (tts?.speak) tts.speak(sampleText)
    else if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(sampleText)
        utterance.lang = 'id-ID'
        window.speechSynthesis.speak(utterance)
    }
  }

  const renderTabContent = () => {
    switch (activeMenuId) {
      case 'ringkasan':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-[#1e293b] text-white flex items-center justify-between shadow-sm">
                <div>
                  <span className="px-2.5 py-1 rounded-lg bg-white/20 text-[11px] font-bold">Ananda Andi Pratama (14 Bln)</span>
                  <h3 className="text-2xl font-bold mt-2">9.8 kg / 76.5 cm</h3>
                  <p className="text-xs text-white/80 mt-1">Selisih kenaikan: +450 gram (Target KBM Tercapai)</p>
                </div>
                <CircularProgressRing percentage={88} isPrimaryCard={true} accentColor="white" />
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[11px] font-bold">Status Gizi Baik</span>
                  <h3 className="text-lg font-bold text-slate-800 mt-2">Pita Hijau KMS</h3>
                  <p className="text-xs text-slate-500 mt-1">Z-Score TB/U: -0.85 SD (Normal)</p>
                </div>
                <CircularProgressRing percentage={95} isPrimaryCard={false} accentColor="#10b981" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-slate-800">Catatan & Pesan Khusus Bidan Desa</h3>
                <button onClick={() => handleReadAloud("Catatan Bidan Desa: Pertumbuhan Ananda Andi sangat baik. Pertahankan pemberian ASI dan protein hewani.")} className="text-xs font-semibold text-[#1e293b] flex items-center gap-1.5 hover:underline">
                  <Volume2 className="w-4 h-4"/> Bacakan Pesan
                </button>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                "Pertumbuhan tinggi dan berat badan Ananda Andi sangat baik bulan ini. Lanjutkan pemberian menu MPASI kaya protein hewani seperti ikan lele dan telur." — Bidan Rina Kartika, A.Md.Keb.
              </p>
            </div>
          </div>
        )

      case 'kurva-kms':
        return (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800">Kurva Berat Badan Menurut Umur (BB/U)</h3>
            <p className="text-xs text-slate-500">Visualisasi pita warna standar Buku KIA untuk memantau tren tumbuh kembang anak.</p>
            <div className="h-64 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-6">
              <LineChart className="w-10 h-10 text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-700">Grafik KMS Interaktif Aktif</p>
              <p className="text-xs text-slate-400 mt-1">Titik penimbangan terakhir berada di zona aman (Pita Hijau).</p>
            </div>
          </div>
        )

      case 'resep-mpasi':
        return (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-[11px] font-bold">Rekomendasi AI Nutri-Chef</span>
                <h3 className="text-lg font-bold text-slate-800 mt-1">Nasi Tim Ikan Lele & Sari Daun Kelor</h3>
              </div>
              <button onClick={() => handleReadAloud("Menu MPASI hari ini: Nasi Tim Ikan Lele dan Sari Daun Kelor. Estimasi biaya 13 ribu 500 rupiah.")} className="px-3 py-1.5 rounded-xl bg-[#1e293b] text-white text-xs font-semibold flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5"/> Dengar Resep
              </button>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border space-y-2 text-sm text-slate-700">
              <p><strong>Target Usia:</strong> 12-23 Bulan (Tekstur Makanan Keluarga)</p>
              <p><strong>Estimasi Biaya:</strong> Rp 13.500 (Sesuai anggaran harian)</p>
              <p><strong>Bahan Utama:</strong> Beras, Ikan Lele segar, Daun kelor, Bawang putih, Minyak kelapa.</p>
            </div>
          </div>
        )

      case 'pesan-jadwal':
        return (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800">Pengingat Jadwal Posyandu Bulan Depan</h3>
            <div className="p-4 rounded-xl bg-slate-50 border flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-800">Posyandu Melati 04 (RW 04)</p>
                <p className="text-xs text-slate-500 mt-0.5">Senin, 12 Desember 2026 • Pukul 08.00 WIB</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">Akan Datang</span>
            </div>
          </div>
        )

      case 'aksesibilitas':
        return (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800">Pengaturan Suara & Tampilan (TTS)</h3>
            <p className="text-xs text-slate-500">Gunakan tombol di bawah untuk membacakan seluruh ringkasan gizi secara otomatis.</p>
            <button onClick={() => handleReadAloud()} className="w-full py-3 rounded-xl bg-[#1e293b] text-white text-sm font-semibold flex items-center justify-center gap-2">
              <Volume2 className="w-4 h-4"/> Bacakan Seluruh Kartu Gizi (TTS Bahasa Indonesia)
            </button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-dvh bg-[#f6f9fc] text-slate-800 flex flex-col lg:flex-row font-sans selection:bg-[#1e293b] selection:text-white">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b sticky top-0 z-40">
        <span className="font-bold">Kartu Gizi Digital</span>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2"><Menu /></button>
      </header>

      {/* Desktop Navigation */}
      <div className="hidden lg:flex">
        <KaderNavigationShell
          menus={ORTU_MENUS}
          activeMenuId={activeMenuId}
          user={{...user, role: 'ortu'}}
          onSelectMenu={(item) => setActiveMenuId(item.id)}
          onLogout={onLogout}
        />
      </div>

      {/* Main Workspace */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-7 overflow-y-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari menu MPASI, kurva KMS, atau pesan bidan..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white border border-slate-100 text-[13px] shadow-2xs focus:outline-none focus:border-[#1e293b]"
            />
          </div>

          <div className="flex items-center gap-3 bg-white px-3.5 py-1.5 rounded-2xl border shadow-2xs">
            <span className="text-[13.5px] font-bold text-slate-800">Halo, Ibu Andi</span>
            <div className="w-8 h-8 rounded-full bg-[#1e293b] text-white font-bold text-[12px] flex items-center justify-center shrink-0">
              IA
            </div>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{currentMenu.label}</h1>
          <p className="text-slate-500 text-sm mt-1">{currentMenu.description}</p>
        </div>

        {renderTabContent()}
      </main>
    </div>
  )
}
