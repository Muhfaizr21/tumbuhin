import { Clock, ShieldCheck, Zap } from 'lucide-react'
import { DICTIONARY_CONTENT, TRANSCRIBE_DEEP_DIVE } from '../../constants/landingData'
import { SurgicalCheckIcon, SurgicalMicIcon } from '../ui/LettersIcons'

const MINI_WAVE = [24, 48, 36, 70, 52, 84, 60, 32, 56, 78, 44, 64, 88, 50, 30, 62, 40, 26]

export default function ManifestoSection() {
  return (
    <>
      {/* PART 1: Dictionary / Clinical Knowledge Base Section (Matches letters.app 'Dictionary' section) */}
      <section
        id="manifesto"
        className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-20 sm:py-24"
      >
        <div className="max-w-[640px] mx-auto text-center mb-14">
          <h2 className="font-runde font-semibold text-[32px] sm:text-[44px] leading-[1.10] tracking-[-0.04em] text-[#070709]">
            {DICTIONARY_CONTENT.headingLine1}
            <br />
            {DICTIONARY_CONTENT.headingLine2}
          </h2>
          <p className="mt-4 font-runde text-[16px] leading-[1.49] tracking-[-0.01em] text-[#60606c]">
            {DICTIONARY_CONTENT.subtitle}
          </p>
        </div>

        {/* 3 Floating Clinical Term Cards over Subtle Sky-Tinted Envelope Surface */}
        <div className="relative rounded-[32px] bg-[#f5f5f5] p-6 sm:p-12 border border-black/5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {DICTIONARY_CONTENT.terms.map((item, idx) => (
              <article
                key={item.term}
                className="rounded-[18px] bg-white p-6 border border-black/6 flex flex-col justify-between transition-transform duration-300 hover:-translate-y-1"
                style={{
                  boxShadow:
                    'rgba(23, 107, 197, 0.08) 0px 1px 2px 0px, rgba(16, 55, 132, 0.04) 0px 14px 28px 0px',
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#f2f9fd] border border-[#2597d0]/30 font-runde text-[11px] font-semibold text-[#070709]">
                      <SurgicalCheckIcon className="w-3.5 h-3.5" />
                      <span>Lapisan 0{idx + 1}</span>
                    </span>
                    <span className="font-inter text-[11px] text-[#8b8b8b]">
                      Tervalidasi
                    </span>
                  </div>

                  <h3 className="font-runde font-semibold text-[18px] tracking-[-0.02em] text-[#070709]">
                    {item.term}
                  </h3>
                  <p className="mt-2 font-runde text-[13.5px] leading-[1.48] text-[#60606c]">
                    {item.definition}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* PART 2: Transcribe / Offline-First & Consultation Dialogue Section (Matches letters.app 'Transcribe' section) */}
      <section
        id="transcribe"
        className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-20 sm:py-24"
      >
        <div className="max-w-[640px] mx-auto text-center mb-14">
          <div className="letters-pill-tag mb-5">
            <SurgicalMicIcon className="w-4 h-4" />
            <span>{TRANSCRIBE_DEEP_DIVE.tag}</span>
          </div>

          <h2 className="font-runde font-semibold text-[32px] sm:text-[44px] leading-[1.10] tracking-[-0.04em] text-[#070709]">
            {TRANSCRIBE_DEEP_DIVE.heading}
          </h2>
          <p className="mt-3 font-runde text-[16px] sm:text-[18px] leading-[1.45] text-[#60606c]">
            {TRANSCRIBE_DEEP_DIVE.subtitle}
          </p>
        </div>

        {/* 2-Column Product Cards: Offline Timer/Waveform + Consultation Chat Bubbles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Card: Offline Queue & Recorder Timer */}
          <div className="letters-cloud-card p-8 sm:p-11 flex flex-col justify-between">
            <div>
              <h3 className="font-runde font-semibold text-[24px] sm:text-[28px] leading-[1.20] tracking-[-0.04em] text-[#070709]">
                {TRANSCRIBE_DEEP_DIVE.leftCard.title}
              </h3>
              <p className="mt-1.5 font-runde text-[15px] text-[#60606c]">
                {TRANSCRIBE_DEEP_DIVE.leftCard.subtitle}
              </p>
            </div>

            <div className="mt-8 rounded-[18px] bg-white p-6 border border-black/6 shadow-2xs space-y-5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 font-runde text-[13px] font-medium text-[#070709]">
                  <span
                    aria-hidden="true"
                    className="w-2.5 h-2.5 rounded-full bg-[#2597d0]"
                  />
                  <span>Sinkronisasi IndexedDB Aktif</span>
                </span>
                <span className="font-runde font-semibold text-[14px] text-[#60606c]">
                  {TRANSCRIBE_DEEP_DIVE.leftCard.timer}
                </span>
              </div>

              {/* Surgical Blue Waveform Bars */}
              <div
                aria-hidden="true"
                className="flex items-center justify-between gap-1.5 h-12 px-2 py-2 rounded-[12px] bg-[#f5f5f5]"
              >
                {MINI_WAVE.map((val, i) => (
                  <span
                    key={`mw-${i}-${val}`}
                    className="w-1.5 rounded-full bg-[#2597d0]"
                    style={{ height: `${val}%` }}
                  />
                ))}
              </div>

              <p className="font-runde text-[13px] text-[#60606c]">
                {TRANSCRIBE_DEEP_DIVE.leftCard.queueLabel}
              </p>
            </div>
          </div>

          {/* Right Card: Consultation Chat Bubbles (Matches letters.app 'You 00:12:50' / 'Patient 00:13:24') */}
          <div className="letters-cloud-card p-8 sm:p-11 flex flex-col justify-between">
            <div>
              <h3 className="font-runde font-semibold text-[24px] sm:text-[28px] leading-[1.20] tracking-[-0.04em] text-[#070709]">
                {TRANSCRIBE_DEEP_DIVE.rightCard.title}
              </h3>
              <p className="mt-1.5 font-runde text-[15px] text-[#60606c]">
                {TRANSCRIBE_DEEP_DIVE.rightCard.subtitle}
              </p>
            </div>

            <div className="mt-8 space-y-3.5">
              {TRANSCRIBE_DEEP_DIVE.rightCard.messages.map((msg) => (
                <div
                  key={msg.time}
                  className="rounded-[18px] bg-white p-5 border border-black/6 shadow-2xs"
                >
                  <p className="font-runde text-[13.5px] leading-[1.46] text-[#070709]">
                    {msg.text}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[12px]">
                    <span
                      className={`font-runde font-semibold px-2.5 py-0.5 rounded-full ${
                        msg.isClinician
                          ? 'bg-[#f2f9fd] text-[#2597d0]'
                          : 'bg-[#f5f5f5] text-[#60606c]'
                      }`}
                    >
                      {msg.role}
                    </span>
                    <span className="font-inter text-[#8b8b8b]">{msg.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3-Column Feature Row Below */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-14 pt-4">
          {TRANSCRIBE_DEEP_DIVE.subFeatures.map((feat, idx) => (
            <div key={feat.title} className="flex flex-col items-start">
              <div className="w-9 h-9 rounded-[10px] bg-[#f5f5f5] border border-black/6 flex items-center justify-center mb-3.5">
                {idx === 0 && (
                  <ShieldCheck aria-hidden="true" className="w-4 h-4 text-[#2597d0]" />
                )}
                {idx === 1 && (
                  <Zap aria-hidden="true" className="w-4 h-4 text-[#2597d0]" />
                )}
                {idx === 2 && (
                  <Clock aria-hidden="true" className="w-4 h-4 text-[#2597d0]" />
                )}
              </div>
              <h3 className="font-runde font-semibold text-[18px] tracking-[-0.02em] text-[#070709]">
                {feat.title}
              </h3>
              <p className="mt-1.5 font-runde text-[14px] leading-[1.45] text-[#60606c]">
                {feat.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
