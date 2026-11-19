import { useState } from 'react'
import {
  AlertCircle,
  BookOpenCheck,
  FileSpreadsheet,
  FileText,
  Loader2,
  RotateCcw,
  Share2,
  Sliders,
  UploadCloud,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { LETTERS_DEEP_DIVE, SIMULATION_PRESETS } from '../../constants/landingData'
import {
  AfterEditIcon,
  BeforeFeatherIcon,
  SurgicalCheckIcon,
  SurgicalEnvelopeIcon,
} from '../ui/LettersIcons'

export default function InteractiveSimulationSection({ tts }) {
  const [viewState, setViewState] = useState('ready') // 'ready' | 'loading' | 'empty' | 'error'
  const [selectedId, setSelectedId] = useState(SIMULATION_PRESETS[0].id)
  const [customAge, setCustomAge] = useState(SIMULATION_PRESETS[0].ageMonths)
  const [customBudget, setCustomBudget] = useState(SIMULATION_PRESETS[0].budgetIdr)
  const [errorMessage, setErrorMessage] = useState('')

  const activeCase =
    SIMULATION_PRESETS.find((item) => item.id === selectedId) || SIMULATION_PRESETS[0]

  const isHighRisk = activeCase.riskLevel === 'TINGGI'

  const handleSelectPreset = (preset) => {
    setViewState('loading')
    setErrorMessage('')
    setTimeout(() => {
      setSelectedId(preset.id)
      setCustomAge(preset.ageMonths)
      setCustomBudget(preset.budgetIdr)
      setViewState('ready')
    }, 240)
  }

  const handleRunCalculation = (e) => {
    e.preventDefault()
    if (Number.isNaN(customAge) || customAge < 0 || customAge > 60) {
      setErrorMessage(
        'Usia balita harus berada dalam rentang standar antropometri WHO LMS (0 hingga 60 bulan sesuai Permenkes No. 2 Tahun 2020).'
      )
      setViewState('error')
      return
    }
    if (customBudget < 5000) {
      setErrorMessage(
        'Anggaran MPASI harian terlalu rendah untuk memenuhi kebutuhan minimal protein hewani. Masukkan anggaran minimal Rp 5.000.'
      )
      setViewState('error')
      return
    }
    setViewState('loading')
    setErrorMessage('')
    setTimeout(() => {
      setViewState('ready')
    }, 240)
  }

  const handleTriggerErrorDemo = () => {
    setCustomAge(72)
    setErrorMessage(
      'Usia 72 bulan melampaui batas tabel referensi balita WHO LMS (maksimal 60 bulan sesuai Permenkes No. 2 Tahun 2020). Koreksi usia ke rentang 0-60 bulan.'
    )
    setViewState('error')
  }

  const handleSpeakRecipe = () => {
    if (tts?.isSpeaking) {
      tts.stop()
      return
    }
    const textToRead = `Hasil analisis gizi untuk ${activeCase.childName}, usia ${customAge} bulan. Status gizi: ${activeCase.nutritionStatus}. Rekomendasi menu AI Nutri-Chef: ${activeCase.mpasiRecipe.menuName}, dengan estimasi biaya ${activeCase.mpasiRecipe.estimatedCost}. Langkah memasak: ${activeCase.mpasiRecipe.steps.join(' ')}`
    tts?.speak(textToRead)
  }

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(
      `*Kartu Gizi Digital Tumbuhin*\n\n` +
        `Nama Balita: *${activeCase.childName}* (${customAge} Bulan)\n` +
        `BB / TB: ${activeCase.weightKg} kg / ${activeCase.heightCm} cm\n` +
        `Z-Score TB/U: ${activeCase.zScoreHFA}\n` +
        `Status: *${activeCase.nutritionStatus}*\n\n` +
        `*Rekomendasi Resep MPASI Lokal (AI Nutri-Chef):*\n` +
        `Menu: ${activeCase.mpasiRecipe.menuName}\n` +
        `Estimasi Biaya: ${activeCase.mpasiRecipe.estimatedCost} (Anggaran Rp ${customBudget.toLocaleString('id-ID')})\n` +
        `Referensi: ${activeCase.mpasiRecipe.citation}`
    )
    window.open(`https://wa.me/?text=${message}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <section
      id="letters"
      className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-20 sm:py-28"
    >
      {/* Centered Section Heading Block (Matches letters.app 'Letters' section) */}
      <div className="max-w-[680px] mx-auto text-center mb-14 sm:mb-16">
        <div className="letters-pill-tag mb-5">
          <SurgicalEnvelopeIcon className="w-4 h-4" />
          <span>{LETTERS_DEEP_DIVE.tag}</span>
        </div>

        <h2 className="font-runde font-semibold text-[32px] sm:text-[44px] leading-[1.10] tracking-[-0.04em] text-[#070709]">
          {LETTERS_DEEP_DIVE.headingLine1}
          <br />
          {LETTERS_DEEP_DIVE.headingLine2}
        </h2>
      </div>

      {/* 2-Column Large Bento Cards (#f5f5f5 Cloud Gray surface, 32px radius, 40-48px padding) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* LEFT CARD (Cols 1-5): Upload Drop Zones & Input Parameters */}
        <div className="lg:col-span-5 letters-cloud-card p-7 sm:p-10 flex flex-col justify-between">
          <div>
            <h3 className="font-runde font-semibold text-[24px] sm:text-[28px] leading-[1.20] tracking-[-0.04em] text-[#070709]">
              {LETTERS_DEEP_DIVE.leftCard.title}
            </h3>
            <p className="mt-2 font-runde text-[15px] leading-[1.45] text-[#60606c]">
              {LETTERS_DEEP_DIVE.leftCard.subtitle}
            </p>

            {/* 2 Upload Drop Zones (Exact DESIGN.md spec: 12px radius, 1px dashed #bebecc, #2597d0 icon) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
              <button
                type="button"
                onClick={() => handleSelectPreset(SIMULATION_PRESETS[0])}
                className="letters-dropzone flex flex-col items-center justify-center text-center min-h-[120px]"
              >
                <UploadCloud
                  aria-hidden="true"
                  className="w-6 h-6 text-[#2597d0] mb-2 stroke-[1.8]"
                />
                <span className="font-runde text-[12px] font-medium text-[#070709] leading-snug">
                  {LETTERS_DEEP_DIVE.leftCard.dropzone1Label}
                </span>
                <span className="mt-1.5 font-inter text-[11px] text-[#60606c] underline">
                  Muat Kasus Faltering (14 Bln)
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset(SIMULATION_PRESETS[1])}
                className="letters-dropzone flex flex-col items-center justify-center text-center min-h-[120px]"
              >
                <SurgicalEnvelopeIcon className="w-6 h-6 mb-2" />
                <span className="font-runde text-[12px] font-medium text-[#070709] leading-snug">
                  {LETTERS_DEEP_DIVE.leftCard.dropzone2Label}
                </span>
                <span className="mt-1.5 font-inter text-[11px] text-[#60606c] underline">
                  Muat Kasus Optimal (9 Bln)
                </span>
              </button>
            </div>

            {/* Interactive Parameter Form with Explicit Labels (R-39) */}
            <form
              onSubmit={handleRunCalculation}
              className="mt-5 rounded-[18px] bg-white p-5 border border-black/6 space-y-4"
            >
              <div>
                <label
                  htmlFor="letters-age-input"
                  className="block font-runde text-[12px] font-medium text-[#070709] mb-1.5"
                >
                  Usia Balita Saat Timbang (0-60 Bulan):
                </label>
                <input
                  id="letters-age-input"
                  type="number"
                  value={customAge}
                  onChange={(e) => setCustomAge(Number(e.target.value))}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-[12px] border border-[#bebecc] font-runde text-[14px] font-medium text-[#070709]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-[12px] mb-1.5">
                  <label
                    htmlFor="letters-budget-input"
                    className="font-runde font-medium text-[#070709]"
                  >
                    Batas Anggaran MPASI Harian:
                  </label>
                  <span className="font-runde font-semibold text-[#070709]">
                    Rp {customBudget.toLocaleString('id-ID')}
                  </span>
                </div>
                <input
                  id="letters-budget-input"
                  type="range"
                  min={10000}
                  max={30000}
                  step={1500}
                  value={customBudget}
                  onChange={(e) => setCustomBudget(Number(e.target.value))}
                  className="w-full min-h-[44px] accent-[#2597d0]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="submit"
                  className="letters-pill-btn min-h-[42px] px-5 py-2 text-[13px] flex-1"
                >
                  Hitung Z-Score & Resep
                </button>
                <button
                  type="button"
                  onClick={handleTriggerErrorDemo}
                  className="letters-ghost-btn min-h-[42px] px-3.5 py-2 text-[12px]"
                >
                  Uji Error
                </button>
                <button
                  type="button"
                  onClick={() => setViewState('empty')}
                  className="letters-ghost-btn min-h-[42px] px-3.5 py-2 text-[12px]"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>

          <p className="mt-5 font-inter text-[12px] text-[#60606c]">
            Standar referensi: Permenkes RI No. 2 Tahun 2020 & Buku Resep MPASI Lokal Kemenkes.
          </p>
        </div>

        {/* RIGHT CARD (Cols 6-12): Before/After Clinical Transformation & RAG Output */}
        <div className="lg:col-span-7 letters-cloud-card p-7 sm:p-10 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
              <div>
                <h3 className="font-runde font-semibold text-[24px] sm:text-[28px] leading-[1.20] tracking-[-0.04em] text-[#070709]">
                  {LETTERS_DEEP_DIVE.rightCard.title}
                </h3>
                <p className="mt-1 font-runde text-[15px] leading-[1.45] text-[#60606c]">
                  {LETTERS_DEEP_DIVE.rightCard.subtitle}
                </p>
              </div>

              <button
                type="button"
                onClick={handleSpeakRecipe}
                aria-pressed={Boolean(tts?.isSpeaking)}
                className="letters-ghost-btn bg-white min-h-[42px] px-4 py-2 text-[13px] inline-flex items-center gap-1.5 shrink-0"
              >
                {tts?.isSpeaking ? (
                  <>
                    <VolumeX aria-hidden="true" className="w-4 h-4 text-[#2597d0]" />
                    <span>Hentikan Suara</span>
                  </>
                ) : (
                  <>
                    <Volume2 aria-hidden="true" className="w-4 h-4 text-[#2597d0]" />
                    <span>Bacakan Hasil</span>
                  </>
                )}
              </button>
            </div>

            {/* R-27 LOADING STATE */}
            {viewState === 'loading' && (
              <div
                role="status"
                aria-live="polite"
                className="rounded-[18px] bg-white border border-black/6 p-10 text-center flex flex-col items-center justify-center min-h-[340px]"
              >
                <Loader2
                  aria-hidden="true"
                  className="w-7 h-7 text-[#2597d0] animate-spin mb-3"
                />
                <p className="font-runde font-semibold text-[16px] text-[#070709]">
                  Menghitung parameter LMS WHO & mencocokkan vektor pgvector...
                </p>
                <p className="font-runde text-[13px] text-[#60606c] mt-1">
                  Mengevaluasi Z-Score (BB/U, TB/U, BB/TB) serta menyusun takaran bahan lokal.
                </p>
              </div>
            )}

            {/* R-27 EMPTY STATE */}
            {viewState === 'empty' && (
              <div className="rounded-[18px] bg-white border border-black/6 p-10 text-center flex flex-col items-center justify-center min-h-[340px]">
                <FileSpreadsheet
                  aria-hidden="true"
                  className="w-9 h-9 text-[#2597d0] mb-3"
                />
                <h4 className="font-runde font-semibold text-[17px] text-[#070709]">
                  Belum Ada Sumber Data Penimbangan
                </h4>
                <p className="font-runde text-[13px] text-[#60606c] max-w-sm mt-1">
                  Klik salah satu kotak unggah di sisi kiri untuk memuat data KMS balita dan
                  menyusun rekomendasi MPASI.
                </p>
                <button
                  type="button"
                  onClick={() => handleSelectPreset(SIMULATION_PRESETS[0])}
                  className="mt-5 letters-pill-btn min-h-[42px] px-5 py-2 text-[13px] inline-flex items-center gap-2"
                >
                  <RotateCcw aria-hidden="true" className="w-3.5 h-3.5" />
                  <span>Muat Contoh Data Balita</span>
                </button>
              </div>
            )}

            {/* R-27 ERROR STATE */}
            {viewState === 'error' && (
              <div
                role="alert"
                className="rounded-[18px] bg-white border-2 border-rose-500 p-8 flex flex-col justify-between min-h-[340px]"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle
                    aria-hidden="true"
                    className="w-6 h-6 text-rose-600 shrink-0 mt-0.5"
                  />
                  <div>
                    <h4 className="font-runde font-semibold text-[17px] text-[#070709]">
                      Rentang Parameter Antropometri Tidak Valid
                    </h4>
                    <p className="font-runde text-[14px] text-[#60606c] mt-1.5 leading-relaxed">
                      {errorMessage}
                    </p>
                  </div>
                </div>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => handleSelectPreset(SIMULATION_PRESETS[0])}
                    className="letters-pill-btn min-h-[42px] px-5 py-2 text-[13px]"
                  >
                    Kembalikan ke Usia Valid (14 Bulan)
                  </button>
                </div>
              </div>
            )}

            {/* READY VIEW: Before & After Document Cards + MPASI Steps */}
            {viewState === 'ready' && (
              <div className="space-y-4">
                {/* Top Before/After Row matching letters.app */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                  {/* BEFORE Card (Handwritten) */}
                  <div className="sm:col-span-5 rounded-[18px] bg-white p-4 border border-black/6">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#f5f5f5] mb-2">
                      <BeforeFeatherIcon className="w-3.5 h-3.5" />
                      <span className="font-runde text-[11px] font-semibold text-[#60606c]">
                        Before (KMS Fisik)
                      </span>
                    </div>
                    <p className="font-doctor text-[15px] leading-[1.35] text-[#8b8b8b]">
                      Catatan timbang meja Posyandu untuk {activeCase.childName} dengan bahan
                      dapur tersedia {activeCase.ingredients.slice(0, 3).join(' ')} perlu
                      evaluasi kurva dan takaran menu harian
                    </p>
                  </div>

                  {/* AFTER Card (Typed Clinical Summary) */}
                  <div className="sm:col-span-7 rounded-[18px] bg-white p-4 border border-[#2597d0]/30 shadow-2xs">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#f2f9fd]">
                        <AfterEditIcon className="w-3.5 h-3.5" />
                        <span className="font-runde text-[11px] font-semibold text-[#070709]">
                          After (Evaluasi Tumbuhin)
                        </span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-runde text-[11px] font-semibold ${
                          isHighRisk
                            ? 'bg-amber-100 text-amber-950'
                            : 'bg-emerald-100 text-emerald-950'
                        }`}
                      >
                        Risiko Faltering: {activeCase.riskScore}% ({activeCase.riskLevel})
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 my-2">
                      <div className="rounded-lg bg-[#f5f5f5] px-2.5 py-1.5">
                        <span className="block text-[10px] text-[#60606c]">BB/U</span>
                        <span className="font-runde font-semibold text-[13px] text-[#070709]">
                          {activeCase.zScoreWFA}
                        </span>
                      </div>
                      <div className="rounded-lg bg-[#f5f5f5] px-2.5 py-1.5">
                        <span className="block text-[10px] text-[#60606c]">TB/U</span>
                        <span className="font-runde font-semibold text-[13px] text-[#070709]">
                          {activeCase.zScoreHFA}
                        </span>
                      </div>
                      <div className="rounded-lg bg-[#f5f5f5] px-2.5 py-1.5">
                        <span className="block text-[10px] text-[#60606c]">BB/TB</span>
                        <span className="font-runde font-semibold text-[13px] text-[#070709]">
                          {activeCase.zScoreWFH}
                        </span>
                      </div>
                    </div>

                    <p className="font-runde text-[12px] text-[#60606c] leading-snug">
                      {activeCase.trajectoryInsight}
                    </p>
                  </div>
                </div>

                {/* Structured RAG MPASI Recipe Card */}
                <div className="rounded-[18px] bg-white p-5 border border-black/6">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-black/6">
                    <div>
                      <span className="font-runde text-[11px] font-semibold text-[#2597d0] uppercase tracking-wider">
                        {activeCase.mpasiRecipe.texture}
                      </span>
                      <h4 className="font-runde font-semibold text-[18px] text-[#070709] mt-0.5">
                        {activeCase.mpasiRecipe.menuName}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] font-runde">
                      <span className="px-3 py-1 rounded-full bg-[#f5f5f5] font-medium text-[#070709]">
                        {activeCase.mpasiRecipe.estimatedCost}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-[#f2f9fd] font-medium text-[#070709]">
                        {activeCase.mpasiRecipe.animalProtein}
                      </span>
                    </div>
                  </div>

                  <ul className="mt-3.5 space-y-2">
                    {activeCase.mpasiRecipe.steps.map((step) => (
                      <li
                        key={step}
                        className="flex items-start gap-2.5 font-runde text-[13px] text-[#60606c] leading-relaxed"
                      >
                        <SurgicalCheckIcon className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 pt-3 border-t border-black/6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 font-inter text-[11px] text-[#60606c]">
                      <BookOpenCheck
                        aria-hidden="true"
                        className="w-3.5 h-3.5 text-[#2597d0] shrink-0"
                      />
                      <span>{activeCase.mpasiRecipe.citation}</span>
                    </span>

                    <button
                      type="button"
                      onClick={handleShareWhatsApp}
                      className="letters-pill-btn min-h-[40px] px-4 py-2 text-[12px] inline-flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <Share2 aria-hidden="true" className="w-3.5 h-3.5" />
                      <span>Kirim Magic Link WhatsApp</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3-Column Feature Row Below Cards (Exact match to letters.app Request Edits / Intelligent Macros / Advanced Personalisation) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-14 pt-4">
        {LETTERS_DEEP_DIVE.subFeatures.map((feat, idx) => (
          <div key={feat.title} className="flex flex-col items-start">
            <div className="w-9 h-9 rounded-[10px] bg-[#f5f5f5] border border-black/6 flex items-center justify-center mb-3.5">
              {idx === 0 && <AfterEditIcon className="w-4 h-4" />}
              {idx === 1 && (
                <FileText aria-hidden="true" className="w-4 h-4 text-[#2597d0]" />
              )}
              {idx === 2 && (
                <Sliders aria-hidden="true" className="w-4 h-4 text-[#2597d0]" />
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
  )
}
