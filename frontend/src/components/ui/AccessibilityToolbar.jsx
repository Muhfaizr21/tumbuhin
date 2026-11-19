import { useEffect, useState } from 'react'
import { Contrast, Type, Volume2, VolumeX, Wifi } from 'lucide-react'
import { BRAND_INFO } from '../../constants/landingData'

export default function AccessibilityToolbar({ tts }) {
  const [highContrast, setHighContrast] = useState(false)
  const [largeText, setLargeText] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    if (highContrast) {
      root.classList.add('a11y-high-contrast')
    } else {
      root.classList.remove('a11y-high-contrast')
    }
  }, [highContrast])

  useEffect(() => {
    const root = document.documentElement
    if (largeText) {
      root.classList.add('a11y-large-text')
    } else {
      root.classList.remove('a11y-large-text')
    }
  }, [largeText])

  const handleToggleSpeech = () => {
    if (tts.isSpeaking) {
      tts.stop()
    } else {
      tts.speak(BRAND_INFO.speechOverview)
    }
  }

  return (
    <div
      aria-label="Bar Aksesibilitas dan Status PWA"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-1.5 rounded-full bg-[#0B1426]/95 backdrop-blur-md text-white px-3 py-2 shadow-[0_16px_40px_-8px_rgba(11,20,38,0.45)] border border-white/15"
    >
      {/* Offline-First PWA Status Pill */}
      <div
        title="Arsitektur Offline-First PWA dengan IndexedDB"
        className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/25 text-[11px] font-medium mr-1"
      >
        <Wifi className="w-3 h-3 text-emerald-400" />
        <span>PWA Offline-Ready</span>
      </div>

      {/* Text-to-Speech Bahasa Indonesia */}
      <button
        type="button"
        onClick={handleToggleSpeech}
        title="Bacakan Ringkasan Halaman (Text-to-Speech Bahasa Indonesia)"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
          tts.isSpeaking
            ? 'bg-[#1E6BFF] text-white shadow-sm'
            : 'bg-white/10 hover:bg-white/20 text-slate-200'
        }`}
      >
        {tts.isSpeaking ? (
          <>
            <VolumeX className="w-3.5 h-3.5 animate-pulse" />
            <span>Stop Suara</span>
          </>
        ) : (
          <>
            <Volume2 className="w-3.5 h-3.5" />
            <span>Suara (TTS)</span>
          </>
        )}
      </button>

      {/* Large Text Toggle */}
      <button
        type="button"
        onClick={() => setLargeText((prev) => !prev)}
        title="Perbesar Ukuran Huruf"
        className={`p-2 rounded-full transition-colors cursor-pointer ${
          largeText ? 'bg-[#1E6BFF] text-white' : 'bg-white/10 hover:bg-white/20 text-slate-200'
        }`}
      >
        <Type className="w-3.5 h-3.5" />
      </button>

      {/* High Contrast Toggle */}
      <button
        type="button"
        onClick={() => setHighContrast((prev) => !prev)}
        title="Mode Kontras Tinggi"
        className={`p-2 rounded-full transition-colors cursor-pointer ${
          highContrast
            ? 'bg-amber-400 text-slate-950'
            : 'bg-white/10 hover:bg-white/20 text-slate-200'
        }`}
      >
        <Contrast className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
