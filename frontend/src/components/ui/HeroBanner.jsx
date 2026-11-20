import { Camera, PlusCircle, Scale } from 'lucide-react'

export default function HeroBanner({
  greeting = 'Selamat pagi',
  userName = 'Siti Aminah',
  posyanduName = 'Posyandu Melati 04',
  villageName = 'Desa Sukamaju',
  onInputTimbang,
  onScanKIA,
  onTambahBalita,
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#17387a] via-[#1f4da0] to-[#2563EB] text-white p-6 sm:p-8 shadow-md">
      {/* Background Decorative Circles & Grid (ClinicFlow style) */}
      <div
        className="absolute -right-12 -bottom-20 w-80 h-80 rounded-full bg-white/8 blur-2xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute right-32 -top-12 w-48 h-48 rounded-full bg-blue-400/15 blur-xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Subtle Stethoscope / Pulse Waveform SVG on the right */}
      <svg
        viewBox="0 0 400 200"
        fill="none"
        aria-hidden="true"
        className="absolute right-0 top-1/2 -translate-y-1/2 w-80 sm:w-96 h-auto opacity-15 pointer-events-none select-none"
      >
        <path
          d="M10 100 Q 50 100 80 100 L 110 40 L 130 160 L 150 70 L 170 120 L 190 100 Q 230 100 390 100"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="280" cy="100" r="45" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" />
        <circle cx="280" cy="100" r="25" fill="currentColor" fillOpacity="0.2" />
      </svg>

      {/* Main Banner Content */}
      <div className="relative z-10 max-w-2xl">
        {/* Dynamic Greeting */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
          {greeting}, {userName} <span className="inline-block animate-bounce">👋</span>
        </h1>

        {/* Subtext */}
        <p className="mt-2 text-sm sm:text-base text-blue-100/90 leading-relaxed">
          {posyanduName} • {villageName} • Bersama pantau pertumbuhan balita dan cegah risiko stunting sedini mungkin.
        </p>

        {/* Action Button Row */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {/* Primary CTA */}
          <button
            type="button"
            onClick={onInputTimbang}
            className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-white text-blue-800 hover:bg-blue-50 font-semibold text-xs sm:text-sm shadow-sm hover:shadow transition-all duration-150 cursor-pointer active:scale-98"
          >
            <Scale className="w-4 h-4 text-blue-600" />
            <span>Input Timbang</span>
          </button>

          {/* Secondary CTA */}
          <button
            type="button"
            onClick={onScanKIA}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/20 text-white font-medium text-xs sm:text-sm border border-white/25 backdrop-blur-xs transition-all duration-150 cursor-pointer active:scale-98"
          >
            <Camera className="w-4 h-4 text-blue-200" />
            <span>Scan Buku KIA (OCR)</span>
          </button>

          {/* Ghost CTA */}
          <button
            type="button"
            onClick={onTambahBalita}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-blue-100 hover:text-white hover:bg-white/10 font-medium text-xs sm:text-sm transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Tambah Balita</span>
          </button>
        </div>
      </div>
    </div>
  )
}
