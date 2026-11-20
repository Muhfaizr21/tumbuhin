import {
  AlertTriangle,
  Baby,
  Calendar,
  ExternalLink,
  MessageSquare,
  Phone,
  Scale,
  Send,
  User,
  X,
} from 'lucide-react'

export default function ChildDetailPanel({
  balita,
  jadwalItem,
  onClose,
  onOpenProfil,
  onInputTimbang,
  onKirimWA,
  onJadwalUlang,
}) {
  if (!balita && !jadwalItem) {
    return (
      <div className="p-6 rounded-3xl bg-white border border-black/6 shadow-2xs h-full flex flex-col items-center justify-center text-center clinicflow-card">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
          <Baby className="w-7 h-7" />
        </div>
        <h2 className="text-[15px] font-bold text-gray-900">
          Detail Balita & Sesi
        </h2>
        <p className="text-[12.5px] text-gray-500 mt-1 max-w-xs">
          Klik salah satu agenda kegiatan di kalender atau daftar balita untuk melihat profil antropometri lengkap.
        </p>
      </div>
    )
  }

  // Fallback child data if only schedule is selected
  const child = balita || {
    id: 'BLT-001',
    nama: jadwalItem?.balitaTerkait?.[0] || 'Andi Pratama',
    usia: '14 bulan',
    jenisKelamin: 'L',
    namaOrtu: 'Dewi Lestari',
    noWA: '081288990044',
    rtRw: 'RT 02 / RW 04',
    statusGizi: 'Berisiko',
    statusTimbang: 'Sudah Ditimbang',
    zScore: { bbU: -1.8, tbU: -1.2, bbTb: -1.9 },
    skorRisiko: 'Tinggi',
    alergi: 'Susu Sapi',
    catatanBidan:
      'Pertambahan BB melambat 2 bulan berturut. Jadwalkan PMT pemulihan protein hewani.',
  }

  const riskBadgeStyles = {
    Tinggi: 'bg-rose-50 text-rose-700 border-rose-200',
    Sedang: 'bg-amber-50 text-amber-700 border-amber-200',
    Rendah: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white border border-black/6 shadow-2xs flex flex-col justify-between clinicflow-card relative animate-fade-in">
      {/* Header with Close Button */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-black/6 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
              Panel Detail Balita
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Tutup panel detail"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Card Header */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-[18px] flex items-center justify-center shadow-sm shrink-0">
            {child.nama
              .split(' ')
              .slice(0, 2)
              .map((n) => n[0])
              .join('')}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-[16px] font-bold text-gray-900 leading-snug">
                {child.nama}
              </h2>
              <span className="text-[11px] text-gray-400 font-medium">
                ({child.id})
              </span>
            </div>
            <p className="text-[12px] text-gray-600 mt-0.5">
              {child.usia} • {child.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'} • {child.rtRw}
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold border ${
                  riskBadgeStyles[child.skorRisiko] || riskBadgeStyles.Sedang
                }`}
              >
                Risiko: {child.skorRisiko}
              </span>
              <span className="text-[11px] text-gray-500 font-medium">
                {child.statusGizi}
              </span>
            </div>
          </div>
        </div>

        {/* Z-Scores Triple Tile (WHO LMS Standard) */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="p-2.5 rounded-xl bg-gray-50 border border-black/6 text-center">
            <span className="text-[10px] text-gray-500 uppercase font-semibold block">
              BB / U
            </span>
            <span
              className={`text-[14px] font-bold block mt-0.5 ${
                child.zScore.bbU < -2 ? 'text-rose-600' : 'text-gray-900'
              }`}
            >
              {child.zScore.bbU} SD
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-gray-50 border border-black/6 text-center">
            <span className="text-[10px] text-gray-500 uppercase font-semibold block">
              TB / U
            </span>
            <span
              className={`text-[14px] font-bold block mt-0.5 ${
                child.zScore.tbU < -2 ? 'text-rose-600' : 'text-gray-900'
              }`}
            >
              {child.zScore.tbU} SD
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-gray-50 border border-black/6 text-center">
            <span className="text-[10px] text-gray-500 uppercase font-semibold block">
              BB / TB
            </span>
            <span
              className={`text-[14px] font-bold block mt-0.5 ${
                child.zScore.bbTb < -2 ? 'text-rose-600' : 'text-gray-900'
              }`}
            >
              {child.zScore.bbTb} SD
            </span>
          </div>
        </div>

        {/* Info Rows */}
        <div className="space-y-2.5 text-[12px] text-gray-700 border-t border-black/6 pt-3 mb-4">
          {/* Parents & WA */}
          <div className="flex items-center justify-between">
            <span className="text-gray-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gray-400" />
              Orang Tua
            </span>
            <span className="font-medium text-gray-900">{child.namaOrtu}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-500 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              WhatsApp
            </span>
            <a
              href={`https://wa.me/62${child.noWA.replace(/^0/, '')}`}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-blue-600 hover:underline"
            >
              {child.noWA}
            </a>
          </div>

          {/* Allergies */}
          <div className="flex items-center justify-between">
            <span className="text-gray-500 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Pantangan Alergi
            </span>
            <span className="font-medium text-gray-900">
              {child.alergi || 'Tidak Ada'}
            </span>
          </div>
        </div>

        {/* Midwife Note Card */}
        {child.catatanBidan && (
          <div className="p-3 rounded-2xl bg-purple-50/80 border border-purple-200 text-purple-900 text-[11.5px] mb-4">
            <div className="flex items-center gap-1.5 font-semibold text-purple-800 mb-1">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Instruksi Bidan Desa:</span>
            </div>
            <p className="leading-relaxed text-purple-900/90">
              {child.catatanBidan}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons (ClinicFlow Padanan) */}
      <div className="space-y-2 pt-2 border-t border-black/6">
        {/* Primary Action */}
        <button
          type="button"
          onClick={() => onOpenProfil && onOpenProfil(child.id)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[13px] shadow-xs transition-colors cursor-pointer active:scale-98"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Buka Profil Balita</span>
        </button>

        {/* Secondary Action Grid */}
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => onInputTimbang && onInputTimbang(child.id)}
            className="flex items-center justify-center gap-1 py-2 px-1 rounded-xl bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 font-medium text-[11px] border border-black/8 transition-colors cursor-pointer"
            title="Input Hasil Pengukuran"
          >
            <Scale className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Timbang</span>
          </button>

          <button
            type="button"
            onClick={() => onKirimWA && onKirimWA(child)}
            className="flex items-center justify-center gap-1 py-2 px-1 rounded-xl bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 font-medium text-[11px] border border-black/8 transition-colors cursor-pointer"
            title="Kirim Hasil Timbang ke WhatsApp Ortu (FR-10)"
          >
            <Send className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Kirim WA</span>
          </button>

          <button
            type="button"
            onClick={() => onJadwalUlang && onJadwalUlang(child.id)}
            className="flex items-center justify-center gap-1 py-2 px-1 rounded-xl bg-gray-50 hover:bg-amber-50 text-gray-700 hover:text-amber-700 font-medium text-[11px] border border-black/8 transition-colors cursor-pointer"
            title="Jadwalkan Ulang Kunjungan"
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Jadwalkan</span>
          </button>
        </div>
      </div>
    </div>
  )
}
