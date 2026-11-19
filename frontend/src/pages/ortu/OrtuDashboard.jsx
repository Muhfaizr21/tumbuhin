import {
  Baby,
  CalendarCheck,
  ChefHat,
  LineChart,
  Volume2,
} from 'lucide-react'
import RoleDashboardShell from '../../components/layout/RoleDashboardShell'

const ORTU_MENUS = [
  {
    id: 'ringkasan',
    label: 'Ringkasan Tumbuh Kembang',
    route: '/ortu/dashboard',
    icon: Baby,
    badge: 'Pita Hijau',
    backendPath: 'ortu/dashboard/dashboard_controller.go',
    description:
      'Kartu Gizi Digital anak yang dapat diakses orang tua via Magic Link WhatsApp tanpa perlu mengingat username atau kata sandi rumit.',
    features: [
      'Akses instan via Magic Token 64-karakter terenkripsi (Read-Only)',
      'Ringkasan Berat Badan (9.8 kg) & Tinggi Badan (76.5 cm) bulan berjalan',
      'Indikator selisih kenaikan berat (+450 gram) terhadap target KBM WHO',
      'Penjelasan status gizi dalam bahasa ramah keluarga yang tidak menghakimi',
    ],
  },
  {
    id: 'kurva-kms',
    label: 'Grafik KMS Digital',
    route: '/ortu/kurva-kms',
    icon: LineChart,
    badge: 'WHO KMS',
    backendPath: 'ortu/kurvakms/kurvakms_controller.go',
    description:
      'Visualisasi grafik pita warna KMS digital (BB/U dan TB/U) standar Buku KIA lengkap dengan proyeksi target berat minimal bulan depan.',
    features: [
      'Grafik pita warna hijau, kuning, dan garis merah standar Buku KIA',
      'Mode pindah kurva Berat Badan menurut Umur (BB/U) & Tinggi Badan (TB/U)',
      'Detail angka riwayat penimbangan sejak lahir hingga bulan ke-14',
      'Titik target berat badan minimal pada penimbangan bulan depan',
    ],
  },
  {
    id: 'resep-mpasi',
    label: 'Panduan Resep MPASI Harian',
    route: '/ortu/resep-mpasi',
    icon: ChefHat,
    badge: 'Rp 13.500',
    backendPath: 'ortu/resepmpasi/resepmpasi_controller.go',
    description:
      'Buku resep MPASI pangan lokal personal hasil AI Nutri-Chef lengkap dengan takaran sendok makan, rincian harga desa, dan sitasi Buku KIA.',
    features: [
      'Menu personal: Nasi Tim Ikan Lele & Sari Daun Kelor (Tekstur 12-23 bln)',
      'Takaran rumah tangga praktis (sendok makan / potong) & harga pasar desa',
      'Langkah memasak higienis dengan penekanan porsi Protein Hewani',
      'Lencana verifikasi sitasi resmi Buku KIA / Pedoman PMBA Kemenkes RI',
    ],
  },
  {
    id: 'pesan-jadwal',
    label: 'Pesan Bidan & Jadwal Posyandu',
    route: '/ortu/pesan-jadwal',
    icon: CalendarCheck,
    badge: '12 Des',
    backendPath: 'ortu/pesanjadwal/pesanjadwal_controller.go',
    description:
      'Catatan edukasi dari Bidan Desa, jadwal kunjungan rumah atau pembagian PMT, serta pengingat hari buka Posyandu bulan berikutnya.',
    features: [
      'Pesan langsung dari Bidan Rina Kartika, A.Md.Keb untuk orang tua',
      'Pengingat jadwal Posyandu Melati 04 bulan depan (12 Desember 2026)',
      'Checklist jadwal pemberian Vitamin A & imunisasi lanjutan',
      'Kontak darurat Bidan Desa & Kader Posyandu RW 04',
    ],
  },
  {
    id: 'aksesibilitas',
    label: 'Aksesibilitas & Suara (TTS)',
    route: '/ortu/aksesibilitas',
    icon: Volume2,
    badge: 'Suara ID',
    backendPath: 'ortu/aksesibilitas/aksesibilitas_controller.go',
    description:
      'Fitur pembaca suara otomatis (Text-to-Speech Bahasa Indonesia), mode kontras tinggi, pembesar huruf, dan penyimpanan cache offline.',
    features: [
      'Pembaca suara (Web Speech API id-ID) untuk membacakan hasil timbang & resep',
      'Mode Kontras Tinggi (High Contrast) agar jelas di bawah sinar matahari',
      'Pembesar ukuran teks (Font Scaling 125%) ramah lansia/nenek pengasuh',
      'Offline PWA Cache: Kartu gizi & resep tetap bisa dibuka meski kuota habis',
    ],
  },
]

const ORTU_STATS = [
  {
    label: 'Nama Balita & Usia',
    value: 'Andi (14 Bln)',
    badge: 'Laki-laki',
    sub: 'Posyandu Melati 04 • RW 04',
  },
  {
    label: 'Berat & Tinggi Terakhir',
    value: '9.8 kg / 76.5 cm',
    badge: '+450g',
    sub: 'Kenaikan BB mencapai target KBM',
  },
  {
    label: 'Status Pertumbuhan',
    value: 'Gizi Baik',
    badge: 'Pita Hijau',
    sub: 'Z-Score TB/U: -0.85 SD (Normal)',
  },
  {
    label: 'Menu MPASI Hari Ini',
    value: 'Rp 13.500',
    badge: 'Protein Hewani',
    sub: 'Nasi Tim Ikan Lele & Daun Kelor',
  },
]

export default function OrtuDashboard({ user, onLogout, onSwitchRole, tts }) {
  const handleReadAloud = () => {
    const sampleText =
      'Kartu Gizi Digital Ananda Andi Pratama, usia 14 bulan. Berat badan terakhir 9 koma 8 kilogram, tinggi badan 76 koma 5 sentimeter. Status gizi baik di pita hijau KMS. Menu MPASI hari ini: Nasi Tim Ikan Lele dan Sari Daun Kelor dengan estimasi biaya 13 ribu 500 rupiah.'
    if (tts && tts.speak) {
      tts.speak(sampleText)
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(sampleText)
      utterance.lang = 'id-ID'
      window.speechSynthesis.speak(utterance)
    }
  }

  return (
    <RoleDashboardShell
      roleBadge="Ortu"
      roleTitle="Portal Kartu Gizi Digital Orang Tua (Magic Link)"
      roleSubtitle="Akses mandiri tanpa ribet untuk memantau kurva KMS anak, resep MPASI harian, dan panduan suara."
      accentColor="#7c3aed"
      user={user}
      menuItems={ORTU_MENUS}
      statsCards={ORTU_STATS}
      backendEndpoint="GET /api/v1/ortu/dashboard"
      backendFolderHint="ortu/dashboard/dashboard_controller.go"
      onLogout={onLogout}
      onSwitchRole={onSwitchRole}
    >
      <div className="p-4 rounded-xl bg-violet-50 border border-violet-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <p className="font-bold text-[13.5px] text-violet-950">
            Fitur Pembaca Suara Otomatis (Text-to-Speech Bahasa Indonesia)
          </p>
          <p className="text-[12.5px] text-violet-800 mt-0.5">
            Bantu Ibu atau Nenek pengasuh mendengarkan ringkasan gizi & langkah memasak MPASI dengan satu sentuhan.
          </p>
        </div>
        <button
          type="button"
          onClick={handleReadAloud}
          className="px-4 py-2 rounded-xl bg-violet-700 hover:bg-violet-800 text-white font-semibold text-[12.5px] inline-flex items-center gap-2 shrink-0 cursor-pointer transition-colors"
        >
          <Volume2 className="w-4 h-4" />
          <span>Bacakan Kartu Gizi</span>
        </button>
      </div>
    </RoleDashboardShell>
  )
}
