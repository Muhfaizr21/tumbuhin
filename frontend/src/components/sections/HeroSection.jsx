import { ArrowRight, Play, ShieldCheck, Sparkles, Stethoscope } from 'lucide-react'
import { HERO_CONTENT } from '../../constants/landingData'
import Navbar from '../layout/Navbar'
import PillButton from '../ui/PillButton'

export default function HeroSection({ onOpenSimulation, tts }) {
  return (
    <section className="relative max-w-7xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6">
      {/* Main Hero Canvas Card (Matches Reference Split White/Blue Frame) */}
      <div className="a11y-card relative bg-white rounded-[32px] sm:rounded-[40px] p-4 sm:p-6 lg:p-8 shadow-[0_24px_60px_-15px_rgba(18,45,105,0.08)] border border-white overflow-hidden">
        {/* Right-Side Blue Panel Background (Desktop Split Layout) */}
        <div
          aria-hidden="true"
          className="hidden lg:block absolute top-3 bottom-3 right-3 w-[48%] rounded-[32px] bg-gradient-to-br from-[#2673FF] via-[#185EF2] to-[#0A41BA] overflow-hidden shadow-inner"
        >
          {/* Subtle Ambient Radial Glow & Medical Grid Rings inside Blue Panel */}
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-10 right-10 w-72 h-72 rounded-full bg-cyan-300/15 blur-2xl" />
          <div className="absolute top-1/3 left-10 w-64 h-64 rounded-full border border-white/10" />
          <div className="absolute top-1/4 left-4 w-80 h-80 rounded-full border border-white/5" />
        </div>

        {/* Embedded Top Navbar spanning across White & Blue halves */}
        <Navbar onOpenSimulation={onOpenSimulation} tts={tts} />

        {/* Main Hero Grid */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4 pt-6 sm:pt-10 items-end">
          {/* LEFT COLUMN: Display Typography, CTA Pill, & Stats Bar */}
          <div className="lg:col-span-5 flex flex-col justify-between z-20">
            <div>
              {/* Small Top Clinical Tag */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF2FF] text-[#1E6BFF] text-xs font-semibold mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                <span>SEVENT X • Smart Posyandu & Early-Warning AI</span>
              </div>

              {/* Giant Display Title with 3D Glossy Blue Orb Accent */}
              <h1 className="font-display font-bold tracking-[-0.04em] text-[#0B1426] leading-[0.94]">
                <span className="inline-flex items-center text-5xl sm:text-6xl xl:text-[68px]">
                  Posy
                  <span className="relative inline-flex items-center justify-center mx-0.5">
                    a
                    <span
                      aria-hidden="true"
                      className="orb-3d w-5 h-5 sm:w-6 sm:h-6 rounded-full inline-block -ml-2 -mt-4"
                    />
                  </span>
                  ndu
                </span>
                <br />
                <span className="inline-flex flex-wrap items-baseline gap-x-4 gap-y-2">
                  <span className="text-5xl sm:text-6xl xl:text-[68px]">
                    {HERO_CONTENT.titleLine2}
                  </span>
                  <span className="max-w-[230px] text-xs sm:text-[13px] font-normal text-[#5B677D] leading-snug tracking-normal">
                    <strong className="font-semibold text-[#0B1426]">
                      Kami tidak sekadar mencatat timbangan
                    </strong>{' '}
                    — kami mengawal tumbuh kembang setiap balita desa.
                  </span>
                </span>
              </h1>

              {/* Primary Signature Pill CTA */}
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <PillButton href="#simulasi" iconType="user">
                  {HERO_CONTENT.primaryCta}
                </PillButton>
                <a
                  href="#layanan"
                  className="text-xs font-semibold text-[#5B677D] hover:text-[#1E6BFF] underline underline-offset-4 transition-colors"
                >
                  Eksplorasi 4 Lapisan AI →
                </a>
              </div>
            </div>

            {/* Bottom-Left Media Preview & 3-Column Clinical Stats Card */}
            <div className="mt-10 lg:mt-14 pt-3">
              <div className="rounded-[24px] bg-[#F5F8FF] border border-[#E2ECFF] p-3 sm:p-4 flex flex-col sm:flex-row items-center gap-4 shadow-sm">
                {/* Mini Clinical Preview Card with Play/Simulate Badge */}
                <a
                  href="#simulasi"
                  className="group relative w-full sm:w-40 h-28 rounded-2xl bg-gradient-to-br from-[#0F296B] via-[#1B4FD8] to-[#38BDF8] p-3 flex flex-col justify-between overflow-hidden shrink-0 shadow-md"
                >
                  {/* Mini Simulated KMS Curve SVG */}
                  <svg
                    viewBox="0 0 120 50"
                    className="w-full h-12 stroke-emerald-300 fill-none opacity-90"
                  >
                    <path
                      d="M5 42 Q 35 38, 60 24 T 115 10"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <circle cx="60" cy="24" r="3.5" className="fill-white" />
                    <circle cx="115" cy="10" r="4" className="fill-amber-300" />
                  </svg>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 text-[#0B1426] text-[10px] font-bold shadow-sm group-hover:bg-[#1E6BFF] group-hover:text-white transition-colors">
                      <Play className="w-2.5 h-2.5 fill-current" />
                      Uji Kurva KMS
                    </span>
                    <span className="text-[10px] text-blue-100 font-semibold">WHO LMS</span>
                  </div>
                </a>

                {/* Stats Columns */}
                <div className="flex-1 w-full">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-semibold text-[#5B677D]">
                      Standar akurasi & dampak nyata:
                    </p>
                    <span className="w-4 h-1.5 rounded-full bg-[#1E6BFF]" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {HERO_CONTENT.stats.map((stat) => (
                      <div key={stat.value}>
                        <p className="font-display font-bold text-lg sm:text-xl text-[#1E6BFF] tracking-tight">
                          {stat.value}
                        </p>
                        <p className="text-[10px] sm:text-[11px] text-[#5B677D] leading-tight mt-0.5">
                          {stat.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CENTER COLUMN: Healthcare Professional Visual + Floating Frosted Pill Badges */}
          <div className="lg:col-span-4 relative flex justify-center items-end min-h-[370px] sm:min-h-[430px] z-20">
            {/* Soft Glow Behind Portrait */}
            <div
              aria-hidden="true"
              className="absolute bottom-4 w-72 h-72 rounded-full bg-gradient-to-tr from-[#1E6BFF]/20 to-cyan-300/30 blur-2xl"
            />

            {/* Floating Pill 1: Left ("Akurasi WHO LMS") */}
            <div className="absolute left-0 sm:left-2 top-1/2 -translate-y-4 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-md shadow-[0_10px_25px_rgba(11,20,38,0.1)] border border-slate-100">
              <span className="text-xs font-semibold text-[#0B1426]">Akurasi WHO LMS</span>
              <span className="w-2 h-2 rounded-full bg-[#0B1426]" />
            </div>

            {/* Floating Pill 2: Top Right ("Prediksi Dini ML") */}
            <div className="absolute right-0 sm:right-2 top-1/3 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-md shadow-[0_10px_25px_rgba(11,20,38,0.12)] border border-white">
              <span className="w-2 h-2 rounded-full bg-[#1E6BFF]" />
              <span className="text-xs font-semibold text-[#0B1426]">Prediksi Dini ML</span>
            </div>

            {/* Floating Pill 3: Bottom Right ("RAG Kemenkes RI") */}
            <div className="absolute right-1 sm:right-3 bottom-12 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 backdrop-blur-md shadow-[0_10px_25px_rgba(11,20,38,0.12)] border border-white">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-[#0B1426]">RAG Kemenkes RI</span>
            </div>

            {/* Central Clinical Bidan / Doctor Portrait Card with Clean Arch Backdrop */}
            <div className="relative w-64 sm:w-72 pt-4 flex flex-col items-center">
              <div className="relative w-60 sm:w-68 h-[360px] sm:h-[400px] rounded-t-full bg-gradient-to-b from-[#EBF2FF] via-[#DCE8FF] to-white/90 border-4 border-white shadow-[0_20px_50px_rgba(15,35,95,0.16)] overflow-hidden flex flex-col justify-end items-center">
                {/* High-craft Medical Professional Illustration & Clinical Avatar */}
                <img
                  src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=800&q=85"
                  alt="Bidan Desa & Tenaga Gizi Profesional Tumbuhin SigapGizi"
                  className="w-full h-full object-cover object-top transition-transform duration-700 hover:scale-105"
                  loading="eager"
                />
                {/* Bottom Gradient Fade & Clinical Verification Ribbon */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0B1426]/80 via-[#0B1426]/30 to-transparent flex items-end justify-center pb-3 px-4">
                  <div className="flex items-center gap-1.5 text-white text-[11px] font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Bidan & Kader Posyandu Terverifikasi</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Blue Panel Tech Description & Bottom Approach Footnote */}
          <div className="lg:col-span-3 rounded-[28px] lg:rounded-none bg-gradient-to-br from-[#2370FF] to-[#0A41BA] lg:bg-none p-6 lg:p-0 lg:pl-2 lg:pr-4 lg:pb-4 text-white flex flex-col justify-between min-h-[260px] lg:min-h-[390px] z-20">
            <div className="lg:mt-14">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm text-[11px] font-semibold text-blue-100 mb-3">
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Clinical Decision Support</span>
              </div>
              <h2 className="font-display text-2xl sm:text-[26px] font-semibold leading-snug tracking-tight text-white">
                {HERO_CONTENT.techHeading}
              </h2>
              <p className="mt-3 text-xs sm:text-[13px] text-blue-100/85 leading-relaxed">
                {HERO_CONTENT.techDescription}
              </p>
            </div>

            {/* Bottom-Right Approach Note + Team Pill (Matches Reference Bottom-Right) */}
            <div className="mt-8 pt-4 border-t border-white/15">
              <p className="text-[11px] sm:text-xs text-blue-100/90 leading-relaxed">
                <strong className="font-semibold text-white">
                  {HERO_CONTENT.approachTitle}
                </strong>{' '}
                {HERO_CONTENT.approachSubtitle}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <a
                  href="#keunggulan"
                  aria-label="Lihat Keunggulan"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-white hover:text-blue-200 transition-colors"
                >
                  <span>Lihat Dampak Klinis</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                {/* Overlapping Role Avatars Pill */}
                <div className="flex items-center -space-x-2 bg-white/15 backdrop-blur-md p-1 rounded-full border border-white/25">
                  <span className="w-7 h-7 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-[#185EF2]">
                    KD
                  </span>
                  <span className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center justify-center ring-2 ring-[#185EF2]">
                    BD
                  </span>
                  <span className="w-7 h-7 rounded-full bg-white text-[#0B1426] text-[10px] font-bold flex items-center justify-center ring-2 ring-[#185EF2]">
                    IBU
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
