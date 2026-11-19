import { Pause, Play } from 'lucide-react'
import { SAVE_HOURS_CONTENT } from '../../constants/landingData'
import {
  AfterEditIcon,
  BeforeFeatherIcon,
  FloatingPaperBadge,
  SurgicalEnvelopeIcon,
  SurgicalMicIcon,
} from '../ui/LettersIcons'

const WAVEFORM_BARS = [
  18, 32, 24, 44, 60, 38, 22, 52, 74, 48, 30, 64, 82, 54, 28, 42, 68, 90, 62, 36, 50,
  76, 44, 26, 58, 72, 40, 24, 48, 64, 34, 20,
]

export default function SaveHoursSection({ tts }) {
  const handleToggleAudio = () => {
    if (tts?.isSpeaking) {
      tts.stop()
    } else {
      tts?.speak(SAVE_HOURS_CONTENT.cardRight.audioTranscript)
    }
  }

  return (
    <section
      id="save-hours"
      className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-12"
    >
      {/* Section Heading Block: Centered 44px Open Runde Semibold with Inline Paper Graphic */}
      <div className="max-w-[680px] mx-auto text-center mb-14 sm:mb-16">
        <h2 className="font-runde font-semibold text-[32px] sm:text-[44px] leading-[1.10] tracking-[-0.04em] text-[#070709]">
          Hemat <FloatingPaperBadge /> 5+ jam setiap minggu bersama Tumbuhin
        </h2>
      </div>

      {/* 2-Column Large Feature Cards (18-32px radius, 40-48px padding, blue-tinted atmospheric shadow) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT CARD: Letters / Antropometri & RAG */}
        <article className="letters-feature-card p-8 sm:p-11 flex flex-col justify-between">
          <div>
            <div className="letters-pill-tag mb-5">
              <SurgicalEnvelopeIcon className="w-4 h-4" />
              <span>{SAVE_HOURS_CONTENT.cardLeft.tag}</span>
            </div>

            <h3 className="font-runde font-semibold text-[26px] sm:text-[28px] leading-[1.20] tracking-[-0.04em] text-[#070709] max-w-[380px]">
              {SAVE_HOURS_CONTENT.cardLeft.title}
            </h3>
          </div>

          {/* Embedded Before/After Mini Document Stack Graphic */}
          <div className="mt-8 pt-6 px-4 pb-2 rounded-[18px] bg-[#f5f5f5] border border-black/5 relative overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Mini Before Card */}
              <div className="rounded-[14px] bg-white p-4 border border-black/6 shadow-2xs">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#f5f5f5] mb-2">
                  <BeforeFeatherIcon className="w-3.5 h-3.5" />
                  <span className="font-runde text-[11px] font-semibold text-[#60606c]">
                    Before
                  </span>
                </div>
                <p className="font-doctor text-[14px] leading-[1.35] text-[#8b8b8b]">
                  {SAVE_HOURS_CONTENT.cardLeft.beforePreview}
                </p>
              </div>

              {/* Mini After Card */}
              <div className="rounded-[14px] bg-white p-4 border border-[#2597d0]/25 shadow-xs">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#f2f9fd] mb-2">
                  <AfterEditIcon className="w-3.5 h-3.5" />
                  <span className="font-runde text-[11px] font-semibold text-[#070709]">
                    After
                  </span>
                </div>
                <p className="font-runde text-[12px] leading-[1.45] text-[#070709]">
                  {SAVE_HOURS_CONTENT.cardLeft.afterPreview}
                </p>
              </div>
            </div>
          </div>
        </article>

        {/* RIGHT CARD: Transcribe / Smart KMS OCR & Waveform Audio Player */}
        <article className="letters-feature-card p-8 sm:p-11 flex flex-col justify-between">
          <div>
            <div className="letters-pill-tag mb-5">
              <SurgicalMicIcon className="w-4 h-4" />
              <span>{SAVE_HOURS_CONTENT.cardRight.tag}</span>
            </div>

            <h3 className="font-runde font-semibold text-[26px] sm:text-[28px] leading-[1.20] tracking-[-0.04em] text-[#070709] max-w-[400px]">
              {SAVE_HOURS_CONTENT.cardRight.title}
            </h3>
          </div>

          {/* Embedded Waveform Audio Player Component (DESIGN.md spec: #2597d0 Surgical Blue) */}
          <div className="mt-8 p-5 rounded-[18px] bg-[#f5f5f5] border border-black/5 space-y-3.5">
            {/* White 12px-radius Waveform Player Card */}
            <div className="rounded-[12px] bg-white p-4 border border-black/6 flex items-center gap-3.5 shadow-2xs">
              <button
                type="button"
                onClick={handleToggleAudio}
                aria-pressed={Boolean(tts?.isSpeaking)}
                aria-label={
                  tts?.isSpeaking
                    ? 'Hentikan pemutaran suara konsultasi gizi'
                    : 'Putar contoh suara panduan gizi Bahasa Indonesia'
                }
                className="w-10 h-10 rounded-full bg-[#2597d0] text-white flex items-center justify-center shrink-0 hover:bg-[#1e82b5] transition-colors"
              >
                {tts?.isSpeaking ? (
                  <Pause aria-hidden="true" className="w-4 h-4 fill-current" />
                ) : (
                  <Play aria-hidden="true" className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              {/* Surgical Blue Horizontal Waveform Bars */}
              <div
                aria-hidden="true"
                className="flex-1 flex items-center justify-between gap-[3px] h-9 px-1"
              >
                {WAVEFORM_BARS.map((heightPct, idx) => (
                  <span
                    key={`bar-${idx}-${heightPct}`}
                    className="w-1 rounded-full bg-[#2597d0] transition-all duration-200"
                    style={{
                      height: `${heightPct}%`,
                      opacity: idx < 22 ? 1 : 0.38,
                    }}
                  />
                ))}
              </div>

              <span className="font-runde text-[12px] font-medium text-[#60606c] shrink-0">
                {SAVE_HOURS_CONTENT.cardRight.audioDuration}
              </span>
            </div>

            {/* Transcribed Clinical Note Box */}
            <div className="rounded-[12px] bg-white p-4 border border-black/6">
              <p className="font-runde text-[13px] leading-[1.45] text-[#60606c]">
                <strong className="font-semibold text-[#070709]">
                  Transkripsi & Panduan TTS:{' '}
                </strong>
                {SAVE_HOURS_CONTENT.cardRight.audioTranscript}
              </p>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}
