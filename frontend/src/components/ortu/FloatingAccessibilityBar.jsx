import React, { useState, useEffect } from 'react'
import {
  Volume2,
  Play,
  Square,
  Sun,
  Moon,
  Type,
  WifiOff,
  Radio
} from 'lucide-react'

export default function FloatingAccessibilityBar({
  isHighContrast,
  onToggleHighContrast,
  fontSizeScale,
  onChangeFontSizeScale,
  speechText,
  isOffline
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const handlePlayTTS = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      alert('Perangkat Anda tidak mendukung fitur suara (Text-to-Speech).')
      return
    }

    if (isPlaying && !isPaused) {
      window.speechSynthesis.pause()
      setIsPaused(true)
      return
    }

    if (isPlaying && isPaused) {
      window.speechSynthesis.resume()
      setIsPaused(false)
      return
    }

    window.speechSynthesis.cancel()

    const textToSpeak = speechText || 'Selamat datang di Kartu Gizi Digital Tumbuhin.'
    const utterance = new SpeechSynthesisUtterance(textToSpeak)
    utterance.lang = 'id-ID'
    utterance.rate = 0.95
    utterance.pitch = 1.0

    utterance.onstart = () => {
      setIsPlaying(true)
      setIsPaused(false)
    }

    utterance.onend = () => {
      setIsPlaying(false)
      setIsPaused(false)
    }

    utterance.onerror = () => {
      setIsPlaying(false)
      setIsPaused(false)
    }

    window.speechSynthesis.speak(utterance)
  }

  const handleStopTTS = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setIsPlaying(false)
    setIsPaused(false)
  }

  const cycleFontSize = () => {
    if (fontSizeScale === 100) onChangeFontSizeScale(125)
    else if (fontSizeScale === 125) onChangeFontSizeScale(150)
    else onChangeFontSizeScale(100)
  }

  return (
    <aside
      aria-label="Aksesibilitas dan Suara"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-xl font-inter"
    >
      <div
        className={`px-4 py-2 rounded-full border shadow-xl backdrop-blur-md flex items-center justify-between gap-2 transition-all ${
          isHighContrast
            ? 'bg-black text-white border-yellow-400 ring-2 ring-yellow-400'
            : 'bg-[#070709]/95 text-white border-white/10'
        }`}
      >
        {/* Kontrol TTS (Suara) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handlePlayTTS}
            title={isPlaying && !isPaused ? 'Jeda Suara' : 'Putar Pembaca Suara'}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              isPlaying
                ? 'bg-[#2597d0] text-white animate-pulse'
                : isHighContrast
                ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                : 'bg-white text-[#070709] hover:bg-[#f5f5f5]'
            }`}
          >
            {isPlaying && !isPaused ? (
              <>
                <Radio className="w-3.5 h-3.5 animate-spin" /> Jeda
              </>
            ) : isPlaying && isPaused ? (
              <>
                <Play className="w-3.5 h-3.5 fill-current" /> Lanjut
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-[#2597d0]" /> Bacakan
              </>
            )}
          </button>

          {isPlaying && (
            <button
              type="button"
              onClick={handleStopTTS}
              title="Hentikan Pembacaan"
              className="p-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition-all cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          )}
        </div>

        {/* Status Indikator Suara atau Offline */}
        <div className="hidden sm:flex items-center gap-2 text-[11px] truncate px-1 text-[#8b8b8b]">
          {isPlaying ? (
            <span className="flex items-center gap-1 text-[#2597d0] font-medium truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2597d0] animate-ping inline-block" />
              Sedang membacakan...
            </span>
          ) : isOffline ? (
            <span className="flex items-center gap-1 text-amber-400 font-medium truncate">
              <WifiOff className="w-3.5 h-3.5" /> Mode Offline (Data Tersimpan)
            </span>
          ) : (
            <span className="truncate opacity-75">Bilah Aksesibilitas Suara & Tampilan</span>
          )}
        </div>

        {/* Kontrol Tampilan: Ukuran Font & Kontras */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Font Scaler */}
          <button
            type="button"
            onClick={cycleFontSize}
            title={`Ubah Ukuran Teks (${fontSizeScale}%)`}
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              isHighContrast
                ? 'bg-slate-900 text-yellow-300 border border-yellow-400'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/5'
            }`}
          >
            <Type className="w-3.5 h-3.5 text-[#2597d0]" />
            <span className="font-runde">{fontSizeScale}%</span>
          </button>

          {/* High Contrast Toggle */}
          <button
            type="button"
            onClick={onToggleHighContrast}
            title={isHighContrast ? 'Mode Tampilan Normal' : 'Mode Kontras Tinggi (Di bawah Terik Matahari)'}
            className={`p-1.5 rounded-full text-xs font-medium flex items-center transition-all cursor-pointer ${
              isHighContrast
                ? 'bg-yellow-400 text-black'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/5'
            }`}
          >
            {isHighContrast ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-[#2597d0]" />}
          </button>
        </div>
      </div>
    </aside>
  )
}
