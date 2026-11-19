import { Activity, ArrowUpRight, Database, ShieldCheck, Sparkles } from 'lucide-react'
import { BRAND_INFO, NAV_LINKS } from '../../constants/landingData'
import PillButton from '../ui/PillButton'

const CURRENT_YEAR = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="max-w-7xl mx-auto px-3 sm:px-6 mt-10 sm:mt-14 pb-20">
      <div className="rounded-[32px] sm:rounded-[40px] bg-gradient-to-br from-[#1C64F2] via-[#1351D8] to-[#09329E] p-8 sm:p-12 text-white shadow-[0_24px_60px_-15px_rgba(19,81,216,0.45)] relative overflow-hidden">
        {/* Decorative 3D Orbs */}
        <div
          aria-hidden="true"
          className="orb-3d absolute -top-12 -right-10 w-36 h-36 rounded-full opacity-80"
        />
        <div
          aria-hidden="true"
          className="orb-3d absolute bottom-8 right-1/3 w-12 h-12 rounded-full opacity-50"
        />

        {/* Top Call-to-Action Banner */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-10 border-b border-white/15">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-blue-100 mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generasi Desa Bebas Stunting • SDG 3 Indonesia</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight leading-[1.12]">
              Siap Modernisasi Posyandu & Cegah Stunting Sejak Dini?
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-blue-100/85 leading-relaxed">
              Mulai transformasi layanan gizi desa dengan perhitungan Z-Score WHO LMS yang
              presisi, prediksi ML, dan rekomendasi resep MPASI lokal Kemenkes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <PillButton href="#simulasi" variant="secondary" iconType="arrow">
              Coba Simulasi Sekarang
            </PillButton>
            <a
              href="http://localhost:8080/api/v1/health"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 text-xs font-semibold text-white transition-all"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Cek Golang API Health</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Bottom Footer Info Grid */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 pt-8 text-xs text-blue-100/85">
          <div className="md:col-span-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-full bg-white text-[#1E6BFF] flex items-center justify-center font-bold">
                <Activity className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="font-display font-bold text-lg text-white">
                {BRAND_INFO.name} ({BRAND_INFO.productTag})
              </span>
            </div>
            <p className="leading-relaxed max-w-sm">
              Platform Smart Posyandu & Stunting Early-Warning System berbasis React Vite
              PWA, Golang Clean Architecture, PostgreSQL pgvector, dan Google Gemini
              Multimodal AI.
            </p>
          </div>

          <div className="md:col-span-3">
            <p className="font-semibold text-white mb-3 uppercase tracking-wider text-[11px]">
              Navigasi Sistem
            </p>
            <ul className="space-y-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4">
            <p className="font-semibold text-white mb-3 uppercase tracking-wider text-[11px]">
              Standar & Kepatuhan Klinis
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>Permenkes RI No. 2 Tahun 2020 (Antropometri Anak)</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>WHO Multicentre Growth Reference Study (LMS)</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>Pedoman MPASI Pangan Lokal Kemenkes RI</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>Enkripsi Privasi NIK Balita (SHA-256 Hash)</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="relative z-10 mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-blue-200/75">
          <p>
            &copy; {CURRENT_YEAR} Tumbuhin (SigapGizi) — SEVENT X Software
            Development Competition.
          </p>
          <p>React 19 + Tailwind CSS v4 + Golang Clean Code MVC</p>
        </div>
      </div>
    </footer>
  )
}
