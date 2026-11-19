import { useState } from 'react'
import {
  Activity,
  LayoutGrid,
  MapPin,
  Menu,
  PhoneCall,
  User,
  Volume2,
  X,
} from 'lucide-react'
import { BRAND_INFO, NAV_LINKS } from '../../constants/landingData'

export default function Navbar({ onOpenSimulation, tts }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="relative z-30 flex items-center justify-between gap-4 py-2">
      {/* Left Side: Brand Logo + Pill Navigation Links */}
      <div className="flex items-center gap-4 lg:gap-8">
        <a
          href="#"
          className="flex items-center gap-2.5 group focus:outline-none"
          aria-label="Tumbuhin SigapGizi Home"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#1E6BFF] to-[#60A5FA] flex items-center justify-center text-white shadow-[0_6px_16px_rgba(30,107,255,0.35)] transition-transform duration-300 group-hover:scale-105">
            <Activity className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-base tracking-tight text-[#0B1426]">
                {BRAND_INFO.name}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-[#E8F0FF] text-[#1E6BFF]">
                {BRAND_INFO.productTag}
              </span>
            </div>
          </div>
        </a>

        {/* Desktop Pill Nav Cluster (Matches Reference Header Pills) */}
        <nav aria-label="Navigasi Utama" className="hidden md:flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="w-8 h-8 rounded-full border border-slate-200/90 bg-white flex items-center justify-center text-slate-500 mr-1"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </span>
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium text-[#0B1426] bg-white border border-slate-200/90 hover:border-[#1E6BFF] hover:text-[#1E6BFF] transition-all"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>

      {/* Right Side: Compliance Location Info + Circular Action Buttons (Sits over Blue Panel on Desktop) */}
      <div className="flex items-center gap-4 lg:gap-6">
        <div className="hidden xl:flex items-center gap-2 text-white/90">
          <MapPin className="w-4 h-4 text-blue-200 shrink-0" />
          <div className="text-[11px] leading-tight">
            <p className="font-semibold text-white">Permenkes No. 2 / 2020</p>
            <p className="text-blue-100/80">SDG 3 • Posyandu Digital</p>
          </div>
        </div>

        {/* 3 Circular Action Icons from Reference */}
        <div className="flex items-center gap-2">
          <a
            href="#simulasi"
            title="Coba WhatsApp Magic Link Orang Tua"
            className="w-9 h-9 rounded-full bg-[#0B1426] text-white flex items-center justify-center hover:bg-slate-800 transition-transform hover:scale-105 shadow-md"
          >
            <PhoneCall className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={() =>
              tts?.isSpeaking ? tts.stop() : tts?.speak(BRAND_INFO.speechOverview)
            }
            title="Dengarkan Penjelasan Sistem (TTS Bahasa Indonesia)"
            className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-[#0B1426] lg:text-white flex items-center justify-center hover:bg-white/30 transition-transform hover:scale-105 cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onOpenSimulation}
            title="Masuk Portal Kader / Bidan"
            className="w-9 h-9 rounded-full bg-[#0B1426] text-white flex items-center justify-center hover:bg-slate-800 transition-transform hover:scale-105 shadow-md cursor-pointer"
          >
            <User className="w-3.5 h-3.5" />
          </button>

          {/* Mobile Hamburger Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Buka Menu Navigasi"
            className="md:hidden w-9 h-9 rounded-full bg-slate-100 text-[#0B1426] flex items-center justify-center"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-14 left-0 right-0 md:hidden rounded-2xl bg-white p-4 shadow-xl border border-slate-100 flex flex-col gap-2 z-50">
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#0B1426] hover:bg-[#F2F6FF] hover:text-[#1E6BFF]"
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </header>
  )
}
