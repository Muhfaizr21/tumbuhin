import { Lock, Server, Shield } from 'lucide-react'
import { DEPLOYMENT_TIERS, SAFETY_CONTENT } from '../../constants/landingData'
import { SurgicalCheckIcon } from '../ui/LettersIcons'

export default function WhyChooseUsSection() {
  return (
    <>
      {/* PART 1: Safety & Data Privacy Section (Matches letters.app 'Your data is safe' with 3D Glass Padlock) */}
      <section
        id="safety"
        className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-20 sm:py-28"
      >
        <div className="max-w-[640px] mx-auto text-center">
          <h2 className="font-runde font-semibold text-[32px] sm:text-[44px] leading-[1.10] tracking-[-0.04em] text-[#070709]">
            {SAFETY_CONTENT.heading}
          </h2>
        </div>

        {/* Center 3D Glass Padlock Illustration */}
        <div className="my-10 sm:my-12 flex justify-center">
          <div className="w-44 sm:w-52 h-auto select-none">
            <img
              src="/letters/security-padlock.png"
              alt="Enkripsi keamanan dan pelindungan privasi data medis balita"
              width={665}
              height={899}
              loading="lazy"
              className="w-full h-auto object-contain mx-auto drop-shadow-[0_18px_36px_rgba(16,55,132,0.08)]"
            />
          </div>
        </div>

        {/* 3-Column Security Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
          {SAFETY_CONTENT.pillars.map((pillar, idx) => (
            <div key={pillar.title} className="flex flex-col items-start">
              <div className="w-9 h-9 rounded-[10px] bg-[#f5f5f5] border border-black/6 flex items-center justify-center mb-3.5">
                {idx === 0 && (
                  <Lock aria-hidden="true" className="w-4 h-4 text-[#2597d0]" />
                )}
                {idx === 1 && (
                  <Server aria-hidden="true" className="w-4 h-4 text-[#2597d0]" />
                )}
                {idx === 2 && (
                  <Shield aria-hidden="true" className="w-4 h-4 text-[#2597d0]" />
                )}
              </div>
              <h3 className="font-runde font-semibold text-[18px] tracking-[-0.02em] text-[#070709]">
                {pillar.title}
              </h3>
              <p className="mt-1.5 font-runde text-[14px] leading-[1.48] text-[#60606c]">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* PART 2: Deployment Modules Section (Mirrors letters.app 'Flexible pricing' 3-card monochrome grid) */}
      <section
        id="pricing"
        className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-16 sm:py-24"
      >
        <div className="max-w-[640px] mx-auto text-center mb-14">
          <h2 className="font-runde font-semibold text-[32px] sm:text-[44px] leading-[1.10] tracking-[-0.04em] text-[#070709]">
            Skema implementasi fleksibel
          </h2>
          <p className="mt-3 font-runde text-[16px] text-[#60606c]">
            Dapat dijalankan mulai dari satu unit Posyandu RW hingga jaringan Puskesmas
            tingkat Kabupaten.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {DEPLOYMENT_TIERS.map((tier) => (
            <article
              key={tier.name}
              className={`rounded-[24px] p-8 sm:p-10 flex flex-col justify-between ${
                tier.highlighted
                  ? 'bg-white border-2 border-[#070709] shadow-[0_17px_37px_rgba(16,55,132,0.05)]'
                  : 'bg-[#f5f5f5] border border-black/6'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-runde font-semibold text-[20px] tracking-[-0.02em] text-[#070709]">
                    {tier.name}
                  </h3>
                  <span className="px-3 py-1 rounded-full bg-white border border-black/10 font-runde text-[11px] font-medium text-[#60606c]">
                    {tier.period}
                  </span>
                </div>

                <p className="mt-5 font-runde font-semibold text-[36px] tracking-[-0.04em] text-[#070709] leading-none">
                  {tier.price}
                </p>
                <p className="mt-3 font-runde text-[14px] leading-[1.45] text-[#60606c]">
                  {tier.description}
                </p>

                <ul className="mt-7 pt-6 border-t border-black/8 space-y-3">
                  {tier.features.map((feat) => (
                    <li
                      key={feat}
                      className="flex items-start gap-2.5 font-runde text-[13.5px] text-[#070709]"
                    >
                      <SurgicalCheckIcon className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-4">
                <a
                  href="#letters"
                  className={`w-full min-h-[46px] inline-flex items-center justify-center px-6 py-3 text-[14px] ${
                    tier.highlighted ? 'letters-pill-btn' : 'letters-ghost-btn bg-white'
                  }`}
                >
                  {tier.ctaLabel}
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
