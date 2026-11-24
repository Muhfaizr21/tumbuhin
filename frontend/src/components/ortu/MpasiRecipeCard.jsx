import React, { useState, useEffect } from 'react'
import {
  ChefHat,
  Volume2,
  Square,
  ShieldCheck,
  Flame,
  Fish,
  Coins
} from 'lucide-react'

export default function MpasiRecipeCard({ recipe, isHighContrast, childName }) {
  const [isSpeaking, setIsSpeaking] = useState(false)

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  if (!recipe) return null

  const handleReadRecipe = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      alert('Perangkat Anda tidak mendukung fitur suara (Text-to-Speech).')
      return
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }

    window.speechSynthesis.cancel()

    const ingredientsText = (recipe.ingredients || [])
      .map((ing) => `${ing.name}, takaran ${ing.amount}`)
      .join('. ')

    const stepsText = (recipe.cooking_steps || [])
      .map((step, idx) => `Langkah ke ${idx + 1}: ${step}`)
      .join('. ')

    const fullSpeech = `Panduan memasak MPASI untuk Ananda ${childName || 'si kecil'}. Menu hari ini adalah: ${recipe.title}. 
      Target usia: ${recipe.target_age_range}, tekstur: ${recipe.texture}. 
      Bahan-bahan yang dibutuhkan: ${ingredientsText}. 
      Berikut adalah langkah-langkah memasaknya: ${stepsText}. 
      Tips penyajian: ${recipe.serving_tips || 'Sajikan selagi hangat dengan penuh kasih sayang'}.`

    const utterance = new SpeechSynthesisUtterance(fullSpeech)
    utterance.lang = 'id-ID'
    utterance.rate = 0.95
    utterance.pitch = 1.0

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }

  return (
    <div className="space-y-6">
      {/* Main Recipe Card (Letters Card Style) */}
      <div
        className={`p-6 sm:p-7 rounded-3xl border transition-all ${
          isHighContrast
            ? 'bg-black text-white border-white'
            : 'bg-white text-[#070709] border-black/8 shadow-2xs'
        }`}
      >
        {/* Header Resep */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-black/5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#f5f5f5] text-[#60606c] text-[11px] font-medium border border-black/5">
                Pangan Lokal Desa
              </span>
              <span className="px-3 py-1 rounded-full bg-[#2597d0]/10 text-[#2597d0] text-[11px] font-medium border border-[#2597d0]/20 font-runde">
                Usia {recipe.target_age_range || '12-23 Bulan'}
              </span>
              <span className="px-3 py-1 rounded-full bg-[#f5f5f5] text-[#60606c] text-[11px] font-medium border border-black/5">
                Tekstur: {recipe.texture || 'Makanan Keluarga'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#070709] font-runde">
              {recipe.title}
            </h2>

            <p className="text-xs sm:text-sm text-[#60606c] leading-relaxed max-w-xl font-inter">
              Resep gizi seimbang berbahan pangan lokal pasar desa dengan takaran kalori dan protein hewani yang telah disesuaikan dengan kebutuhan usia si kecil.
            </p>
          </div>

          {/* Tombol Audio / TTS Resep (Pill Button) */}
          <button
            type="button"
            onClick={handleReadRecipe}
            className={`px-5 py-2.5 rounded-full font-medium text-xs flex items-center justify-center gap-2 shrink-0 transition-all cursor-pointer ${
              isSpeaking
                ? 'bg-rose-600 text-white animate-pulse'
                : isHighContrast
                ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                : 'bg-[#070709] text-white hover:bg-[#151515] shadow-2xs'
            }`}
          >
            {isSpeaking ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" /> Hentikan Suara
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-[#2597d0]" /> Dengarkan Panduan Memasak
              </>
            )}
          </button>
        </div>

        {/* 3 Indikator Gizi & Biaya */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5">
          <div className="p-4 rounded-2xl bg-[#f8fafc] border border-black/5 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#2597d0]/10 text-[#2597d0] flex items-center justify-center shrink-0">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-[#8b8b8b] uppercase block">Biaya Harian</span>
              <span className="text-base font-bold text-[#070709] font-runde">
                Rp {recipe.daily_budget_idr?.toLocaleString('id-ID') || '13.500'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#f8fafc] border border-black/5 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/60">
              <Fish className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-[#8b8b8b] uppercase block">Protein Hewani</span>
              <span className="text-base font-bold text-[#070709] font-runde">
                {recipe.animal_protein_grams || 14.0} gram
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#f8fafc] border border-black/5 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200/60">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-[#8b8b8b] uppercase block">Energi Total</span>
              <span className="text-base font-bold text-[#070709] font-runde">
                {recipe.calories_kcal || 285} kkal
              </span>
            </div>
          </div>
        </div>

        {/* Daftar Bahan-Bahan */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-[#070709] uppercase tracking-wider flex items-center gap-2 font-runde">
            <span className="w-2 h-2 rounded-full bg-[#2597d0]" />
            Daftar Bahan & Takaran Rumah Tangga
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {(recipe.ingredients || []).map((ing, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-white border border-black/8 flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-semibold text-[#070709]">{ing.name}</h4>
                  <p className="text-[11px] text-[#60606c] mt-0.5">Takaran: {ing.amount}</p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#f5f5f5] border border-black/5 text-[10px] font-medium text-[#60606c]">
                    {ing.category}
                  </span>
                  {ing.estimated_price > 0 && (
                    <p className="text-[11px] font-semibold text-[#070709] mt-1 font-runde">
                      ± Rp {ing.estimated_price.toLocaleString('id-ID')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Langkah Memasak Berurutan */}
        <div className="space-y-3 pt-6 mt-6 border-t border-black/5">
          <h3 className="text-xs font-bold text-[#070709] uppercase tracking-wider flex items-center gap-2 font-runde">
            <span className="w-2 h-2 rounded-full bg-[#2597d0]" />
            Langkah-Langkah Memasak
          </h3>

          <div className="space-y-2.5">
            {(recipe.cooking_steps || []).map((step, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl border border-black/5 bg-[#f8fafc] text-[#60606c] flex items-start gap-3 text-xs sm:text-sm leading-relaxed"
              >
                <span className="w-6 h-6 rounded-full bg-[#070709] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 font-runde">
                  {idx + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tips Penyajian & Sitasi Resmi Kemenkes */}
        <div className="mt-6 pt-5 border-t border-black/5 space-y-3">
          {recipe.serving_tips && (
            <div className="p-4 rounded-2xl bg-[#f8fafc] border border-black/5 text-xs text-[#60606c] leading-relaxed">
              <strong className="text-[#070709]">Tips Kasih Sayang Bidan:</strong> {recipe.serving_tips}
            </div>
          )}

          <div className="flex items-center gap-2 text-[11px] font-medium text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{recipe.kemenkes_citation || '✓ Sesuai Pedoman Gizi Buku KIA Kemenkes RI'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
