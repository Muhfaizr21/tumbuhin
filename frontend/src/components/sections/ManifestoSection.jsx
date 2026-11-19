import { Cpu, HeartHandshake, Sparkles } from 'lucide-react'
import { MANIFESTO_CONTENT } from '../../constants/landingData'
import PillButton from '../ui/PillButton'

export default function ManifestoSection() {
  return (
    <section id="manifesto" className="max-w-7xl mx-auto px-3 sm:px-6 mt-5 sm:mt-7">
      <div className="a11y-card relative bg-white rounded-[32px] sm:rounded-[40px] py-14 sm:py-20 px-6 sm:px-12 lg:px-20 shadow-[0_20px_50px_-15px_rgba(18,45,105,0.06)] border border-white overflow-hidden">
        {/* Subtle Medical Hex Pattern Watermark on Edges */}
        <div
          aria-hidden="true"
          className="hex-pattern absolute inset-y-0 left-0 w-48 opacity-55 pointer-events-none mask-r-from-20%"
        />
        <div
          aria-hidden="true"
          className="hex-pattern absolute inset-y-0 right-0 w-48 opacity-55 pointer-events-none"
        />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Top Centered Eyebrow Rule */}
          <div className="flex items-center justify-center gap-3 text-xs font-medium text-[#7A88A1] mb-7">
            <span className="w-10 h-px bg-slate-200" />
            <span>{MANIFESTO_CONTENT.sectionLabel}</span>
            <span className="w-10 h-px bg-slate-200" />
          </div>

          {/* Editorial Manifesto Headline with Inline Visual Badges (Matches Reference Section 2) */}
          <h2 className="font-display text-2xl sm:text-4xl lg:text-[42px] leading-[1.25] tracking-[-0.025em]">
            <span className="font-semibold text-[#0B1426]">{MANIFESTO_CONTENT.part1} </span>

            {/* Inline Blue Clinical Icon Pill */}
            <span
              aria-hidden="true"
              className="inline-flex items-center justify-center align-middle mx-1.5 px-3 py-1.5 rounded-full bg-[#E8F0FF] text-[#1E6BFF] shadow-xs border border-[#CFE0FF]"
            >
              <Cpu className="w-5 h-5 sm:w-6 sm:h-6" />
            </span>

            <span className="font-normal text-[#68768F]">
              {MANIFESTO_CONTENT.highlight1} {MANIFESTO_CONTENT.part2}{' '}
            </span>

            <span className="font-medium text-[#3B485E]">{MANIFESTO_CONTENT.highlight2} </span>

            {/* Inline Overlapping Community Avatar Cluster Pill */}
            <span
              aria-hidden="true"
              className="inline-flex items-center align-middle -space-x-2 mx-1.5 px-2 py-1 rounded-full bg-[#F2F6FF] border border-[#DCE6F7]"
            >
              <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#1E6BFF] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                <HeartHandshake className="w-3.5 h-3.5" />
              </span>
              <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
            </span>

            <span className="font-semibold text-[#0B1426]">
              {MANIFESTO_CONTENT.part3} {MANIFESTO_CONTENT.highlight3}
            </span>
          </h2>

          {/* Supporting Narrative Paragraph */}
          <p className="mt-7 max-w-2xl mx-auto text-xs sm:text-sm text-[#5B677D] leading-relaxed">
            Platform kami adalah{' '}
            <strong className="font-semibold text-[#0B1426]">
              ruang kolaborasi gizi tingkat desa
            </strong>
            , di mana akurasi rumus klinis WHO LMS bertemu dengan kearifan bahan pangan lokal
            dan empati pelayanan Posyandu.
          </p>

          {/* Centered Signature Pill Button */}
          <div className="mt-8 flex justify-center">
            <PillButton href="#layanan" iconType="arrow">
              {MANIFESTO_CONTENT.ctaLabel}
            </PillButton>
          </div>
        </div>
      </div>
    </section>
  )
}
