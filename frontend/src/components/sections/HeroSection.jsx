import { HERO_CONTENT } from '../../constants/landingData'
import {
  AfterEditIcon,
  SurgicalCheckIcon,
  SurgicalEnvelopeIcon,
} from '../ui/LettersIcons'

export default function HeroSection() {
  return (
    <section id="top" className="w-full">
      {/* Exact letters.app Sky Gradient Hero Container (.framer-1xinbaf) with seamless top bleed */}
      <div className="letters-sky-hero relative w-full rounded-b-[44px] sm:rounded-b-[56px] pt-24 sm:pt-32 lg:pt-36 px-4 sm:px-6 overflow-hidden flex flex-col items-center justify-between min-h-[720px] sm:min-h-[840px]">
        {/* Centered Headline, Subtext & Obsidian Pill Button */}
        <div className="relative z-20 max-w-[780px] mx-auto flex flex-col items-center text-center gap-6">
          <h1 className="font-runde font-semibold text-[48px] sm:text-[68px] lg:text-[80px] leading-[0.90] tracking-[-0.04em] text-white">
            {HERO_CONTENT.headlineLine1}
            <br />
            {HERO_CONTENT.headlineLine2}
          </h1>

          <p className="font-runde font-normal text-[16px] sm:text-[18px] leading-[1.40] tracking-[-0.01em] text-white max-w-[540px]">
            Hitung Z-Score antropometri instan yang{' '}
            <strong className="font-semibold text-white">100% akurat sesuai WHO</strong>.
            <br className="hidden sm:inline" /> Nikmati deteksi dini{' '}
            <strong className="font-semibold text-white">tanpa batas</strong>, resep MPASI{' '}
            <strong className="font-semibold text-white">standar Kemenkes</strong>.{' '}
            <strong className="font-semibold text-white">Hemat 5+ jam mingguan</strong> dari
            rekapitulasi manual.
          </p>

          <div>
            <a
              href="#letters"
              className="letters-pill-btn min-h-[48px] inline-flex items-center justify-center px-7 py-3.5 text-[15px]"
            >
              {HERO_CONTENT.primaryCta}
            </a>
          </div>
        </div>

        {/* Bottom Center Cutout Doctor Portrait Flanked by Clinical Evaluation Cards */}
        <div className="relative z-10 w-full max-w-[920px] mx-auto mt-8 sm:mt-10 flex justify-center items-end">
          {/* Left Floating Clinical Card: WHO LMS Anthropometry */}
          <div
            className="hidden md:flex flex-col gap-2 absolute left-4 lg:left-8 bottom-16 z-20 w-[250px] rounded-[18px] bg-white p-4 border border-[#f0f0f4] -rotate-2"
            style={{
              boxShadow:
                '0px 4px 12px rgba(22, 107, 197, 0.08), 0px 17px 37px rgba(16, 55, 132, 0.05)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#f5f5f5] border border-black/8 font-runde text-[11px] font-semibold text-[#070709]">
                <SurgicalEnvelopeIcon className="w-3.5 h-3.5" />
                <span>Antropometri WHO</span>
              </span>
              <span className="font-inter text-[11px] text-[#60606c]">14 Bulan</span>
            </div>
            <p className="font-runde font-semibold text-[14px] text-[#070709] leading-snug">
              Ananda Bima Saputra
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] font-runde">
              <div className="rounded-lg bg-[#f5f5f5] px-2.5 py-1.5">
                <span className="text-[#60606c] block">TB/U</span>
                <strong className="text-[#070709]">-1.92 SD</strong>
              </div>
              <div className="rounded-lg bg-[#f5f5f5] px-2.5 py-1.5">
                <span className="text-[#60606c] block">BB/U</span>
                <strong className="text-[#070709]">-1.85 SD</strong>
              </div>
            </div>
          </div>

          {/* Center Studio Doctor Cutout Image */}
          <div className="relative z-10 w-[260px] sm:w-[320px] lg:w-[350px] flex items-end justify-center select-none">
            <img
              src="/doctor-hero.png"
              alt="Dokter dan Bidan Koordinator Gizi SigapGizi"
              width={687}
              height={1146}
              fetchpriority="high"
              loading="eager"
              className="w-full h-auto object-contain drop-shadow-[0_16px_32px_rgba(16,55,132,0.18)]"
            />
          </div>

          {/* Right Floating Clinical Card: RAG MPASI Kemenkes */}
          <div
            className="hidden md:flex flex-col gap-2 absolute right-4 lg:right-8 bottom-14 z-20 w-[260px] rounded-[18px] bg-white p-4 border border-[#f0f0f4] rotate-2"
            style={{
              boxShadow:
                '0px 4px 12px rgba(22, 107, 197, 0.08), 0px 17px 37px rgba(16, 55, 132, 0.05)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#f2f9fd] border border-[#2597d0]/30 font-runde text-[11px] font-semibold text-[#070709]">
                <AfterEditIcon className="w-3.5 h-3.5" />
                <span>AI Nutri-Chef RAG</span>
              </span>
              <span className="font-runde text-[11px] font-semibold text-[#2597d0]">
                Rp 13.500
              </span>
            </div>
            <p className="font-runde font-semibold text-[13.5px] text-[#070709] leading-snug">
              Nasi Tim Ikan Lele Sari Kelor
            </p>
            <p className="font-runde text-[11.5px] text-[#60606c] leading-normal flex items-center gap-1.5">
              <SurgicalCheckIcon className="w-3.5 h-3.5 shrink-0" />
              <span>24.6g Protein Hewani • Pedoman Kemenkes</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
