import { useCallback, useEffect, useState } from 'react'

/**
 * Custom Hook for Bahasa Indonesia Text-to-Speech (PRD FR-16 Accessibility)
 */
export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isSupported] = useState(
    () => typeof window !== 'undefined' && 'speechSynthesis' in window
  )

  const stop = useCallback(() => {
    if (!isSupported) return
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [isSupported])

  const speak = useCallback(
    (text) => {
      if (!isSupported || !text) return

      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'id-ID'
      utterance.rate = 0.98
      utterance.pitch = 1.0

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      window.speechSynthesis.speak(utterance)
    },
    [isSupported]
  )

  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel()
      }
    }
  }, [isSupported])

  return { speak, stop, isSpeaking, isSupported }
}
