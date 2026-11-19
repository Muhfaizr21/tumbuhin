import { useState } from 'react'
import {
  AlertTriangle,
  BookOpenCheck,
  CheckCircle2,
  ChefHat,
  Share2,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { SIMULATION_PRESETS } from '../../constants/landingData'

export default function InteractiveSimulationSection({ tts }) {
  const [selectedId, setSelectedId] = useState(SIMULATION_PRESETS[0].id)
  const [customBudget, setCustomBudget] = useState(15000)

  const activeCase =
    SIMULATION_PRESETS.find((item) => item.id === selectedId) || SIMULATION_PRESETS[0]

  const isHighRisk = activeCase.riskLevel === 'HIGH'

  const handleSpeakRecipe = () => {
    if (tts?.isSpeaking) {
      tts.stop()
      return
    }
    const textToRead = `Hasil analisis gizi untuk ${activeCase.childName}, usia ${activeCase.ageMonths} bulan. Status gizi: ${activeCase.nutritionStatus}. Rekomendasi menu AI Nutri-Chef: ${activeCase.mpasiRecipe.menuName}, dengan estimasi biaya ${activeCase.mpasiRecipe.estimatedCost}. Langkah memasak: ${activeCase.mpasiRecipe.steps.join(' ')}`
    tts?.speak(textToRead)
  }

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(
      `*Kartu Gizi Digital Tumbuhin (SigapGizi)* 🌱\n\n` +
        `Nama Balita: *${activeCase.childName}* (${activeCase.ageMonths} Bulan)\n` +
        `BB / TB: ${activeCase.weightKg} kg / ${activeCase.heightCm} cm\n` +
        `Z-Score TB/U: ${activeCase.zScoreHFA}\n` +
        `Status: *${activeCase.nutritionStatus}*\n\n` +
        `*Rekomendasi Resep MPASI Lokal (AI Nutri-Chef):*\n` +
        `🍲 ${activeCase.mpasiRecipe.menuName}\n` +
        `💰 Estimasi Biaya: ${activeCase.mpasiRecipe.estimatedCost}\n` +
        `📖 Referensi: ${activeCase.mpasiRecipe.citation}`
    )
    window.open(`https://wa.me/?text=${message}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <section id="simulasi" className="max-w-7xl mx-auto px-3 sm:px-6 mt-10 sm:mt-14">
      <div className="a11y-card bg-white rounded-[32px] sm:rounded-[40px] p-5 sm:p-8 lg:p-10 shadow-[0_20px_50px_-15px_rgba(18,45,105,0.07)] border border-white">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-7 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F0FF] text-[#1E6BFF] text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Hybrid AI Sandbox • Live Preview</span>
            </div>
            <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#0B1426]">
              Simulasi Deteksi Dini & AI Nutri-Chef
            </h2>
          </div>

          {/* Case Switcher Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {SIMULATION_PRESETS.map((preset) => {
              const active = preset.id === selectedId
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(preset.id)
                    setCustomBudget(preset.budgetIdr)
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-[#1E6BFF] text-white shadow-[0_8px_20px_-4px_rgba(30,107,255,0.5)]'
                      : 'bg-[#F2F6FF] text-[#5B677D] hover:text-[#0B1426]'
                  }`}
                >
                  {preset.id === 'faltering-case'
                    ? '⚠️ Skenario Peringatan Dini (Faltering)'
                    : '✅ Skenario Pertumbuhan Optimal'}
                </button>
              )
            })}
          </div>
        </div>

        {/* Main Simulation Grid: Left Anthropometry & ML + Right RAG Nutri-Chef & Mobile Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 mt-8 items-start">
          {/* LEFT 6 COLS: Layer 1 (WHO LMS) & Layer 2 (Predictive Growth Trajectory ML) */}
          <div className="lg:col-span-6 flex flex-col gap-5">
            {/* Child Profile & Anthropometry Input Card */}
            <div className="rounded-[24px] bg-[#F5F8FF] border border-[#DCE8FF] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#1E6BFF]">
                    Layer 1 • Deterministic WHO LMS Engine
                  </span>
                  <h3 className="font-display text-lg font-bold text-[#0B1426] mt-0.5">
                    {activeCase.childName} ({activeCase.ageMonths} Bulan)
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-white text-[#0B1426] text-xs font-semibold border border-slate-200">
                  {activeCase.gender}
                </span>
              </div>

              {/* Measurement Metric Pills */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="rounded-2xl bg-white p-3.5 border border-slate-100">
                  <p className="text-[11px] text-[#7A88A1]">Berat Badan</p>
                  <p className="font-display text-xl font-bold text-[#0B1426] mt-0.5">
                    {activeCase.weightKg} <span className="text-xs font-normal">kg</span>
                  </p>
                  <p className="text-[11px] font-semibold text-[#1E6BFF] mt-1">
                    BB/U: {activeCase.zScoreWFA}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-3.5 border border-slate-100">
                  <p className="text-[11px] text-[#7A88A1]">Tinggi Badan</p>
                  <p className="font-display text-xl font-bold text-[#0B1426] mt-0.5">
                    {activeCase.heightCm} <span className="text-xs font-normal">cm</span>
                  </p>
                  <p className="text-[11px] font-semibold text-[#1E6BFF] mt-1">
                    TB/U: {activeCase.zScoreHFA}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-3.5 border border-slate-100">
                  <p className="text-[11px] text-[#7A88A1]">Proporsi Gizi</p>
                  <p className="font-display text-xl font-bold text-[#0B1426] mt-0.5">
                    LMS <span className="text-xs font-normal">WHO</span>
                  </p>
                  <p className="text-[11px] font-semibold text-[#1E6BFF] mt-1">
                    BB/TB: {activeCase.zScoreWFH}
                  </p>
                </div>
              </div>

              {/* Daily Family Budget Slider */}
              <div className="rounded-2xl bg-white p-4 border border-slate-100">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-[#0B1426]">
                    Parameter Anggaran MPASI Harian Keluarga:
                  </span>
                  <span className="font-display font-bold text-[#1E6BFF] text-sm">
                    Rp {customBudget.toLocaleString('id-ID')} / hari
                  </span>
                </div>
                <input
                  type="range"
                  min={10000}
                  max={30000}
                  step={1500}
                  value={customBudget}
                  onChange={(e) => setCustomBudget(Number(e.target.value))}
                  aria-label="Anggaran MPASI Harian"
                  className="w-full accent-[#1E6BFF] cursor-pointer"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {activeCase.ingredients.map((ing) => (
                    <span
                      key={ing}
                      className="px-2.5 py-0.5 rounded-full bg-[#F2F6FF] text-[#1E6BFF] text-[11px] font-medium"
                    >
                      • {ing}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Layer 2: Predictive Growth Trajectory ML Card */}
            <div
              className={`rounded-[24px] p-5 sm:p-6 border ${
                isHighRisk
                  ? 'bg-amber-50/70 border-amber-200'
                  : 'bg-emerald-50/70 border-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  {isHighRisk ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0B1426]">
                    Layer 2 • Predictive Growth Trajectory (gonum ML)
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    isHighRisk
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  Risiko Faltering: {activeCase.riskScore}% ({activeCase.riskLevel})
                </span>
              </div>

              <p className="font-display font-bold text-sm text-[#0B1426]">
                Status: {activeCase.nutritionStatus}
              </p>
              <p className="mt-2 text-xs text-[#4A5568] leading-relaxed">
                {activeCase.trajectoryInsight}
              </p>

              {/* Progress Bar Indicator */}
              <div className="mt-4 w-full h-2.5 rounded-full bg-white overflow-hidden p-0.5 border border-slate-200/70">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isHighRisk
                      ? 'bg-gradient-to-r from-amber-400 to-rose-500'
                      : 'bg-gradient-to-r from-emerald-400 to-teal-500'
                  }`}
                  style={{ width: `${activeCase.riskScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* RIGHT 6 COLS: Layer 3 (AI Nutri-Chef RAG Kemenkes Output & Parent Magic Link Action) */}
          <div className="lg:col-span-6 rounded-[28px] bg-gradient-to-br from-[#0F1E3C] via-[#132952] to-[#1A3B7A] p-6 sm:p-7 text-white shadow-xl flex flex-col justify-between">
            <div>
              {/* Top Badge Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-[#1E6BFF] flex items-center justify-center">
                    <ChefHat className="w-4 h-4 text-white" />
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold text-blue-200">
                      Layer 3 • Knowledge-Grounded RAG (pgvector)
                    </p>
                    <h3 className="font-display text-base font-bold text-white">
                      AI Nutri-Chef • Resep Pangan Lokal
                    </h3>
                  </div>
                </div>

                {/* TTS Audio Button for Mothers/Cadres */}
                <button
                  type="button"
                  onClick={handleSpeakRecipe}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-xs font-semibold text-white border border-white/20 transition-colors cursor-pointer"
                >
                  {tts?.isSpeaking ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                      <span>Hentikan Suara</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Bacakan Resep (TTS)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Recipe Title & Macros */}
              <div className="mt-5">
                <span className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-400/15 text-emerald-300 border border-emerald-400/25 text-[11px] font-semibold">
                  {activeCase.mpasiRecipe.texture}
                </span>
                <h4 className="font-display text-xl sm:text-2xl font-bold text-white mt-2">
                  {activeCase.mpasiRecipe.menuName}
                </h4>

                <div className="grid grid-cols-3 gap-2.5 mt-4">
                  <div className="rounded-xl bg-white/10 p-3 border border-white/10">
                    <p className="text-[10px] text-blue-200">Estimasi Biaya</p>
                    <p className="font-display text-xs sm:text-sm font-bold text-emerald-300 mt-0.5">
                      {activeCase.mpasiRecipe.estimatedCost}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/10 p-3 border border-white/10">
                    <p className="text-[10px] text-blue-200">Energi Total</p>
                    <p className="font-display text-xs sm:text-sm font-bold text-white mt-0.5">
                      {activeCase.mpasiRecipe.calories}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/10 p-3 border border-white/10">
                    <p className="text-[10px] text-blue-200">Protein Hewani</p>
                    <p className="font-display text-xs sm:text-sm font-bold text-amber-300 mt-0.5">
                      {activeCase.mpasiRecipe.animalProtein}
                    </p>
                  </div>
                </div>

                {/* Cooking Steps */}
                <div className="mt-5 space-y-2.5">
                  <p className="text-xs font-semibold text-blue-200">
                    Panduan Memasak Terstandar:
                  </p>
                  {activeCase.mpasiRecipe.steps.map((step, idx) => (
                    <div
                      key={step}
                      className="flex items-start gap-2.5 text-xs text-slate-200 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5"
                    >
                      <span className="w-5 h-5 rounded-full bg-[#1E6BFF] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Citation & One-Click WhatsApp Magic Link */}
            <div className="mt-6 pt-4 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[11px] text-blue-200">
                <BookOpenCheck className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>Sitasi RAG: {activeCase.mpasiRecipe.citation}</span>
              </div>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg cursor-pointer shrink-0"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Kirim Magic Link ke WhatsApp Ibu</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
