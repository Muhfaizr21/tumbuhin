import { useEffect, useState } from 'react'
import AuthPage from './components/auth/AuthPage'
import Footer from './components/layout/Footer'
import HeroSection from './components/sections/HeroSection'
import InteractiveSimulationSection from './components/sections/InteractiveSimulationSection'
import ManifestoSection from './components/sections/ManifestoSection'
import RoleEcosystemSection from './components/sections/RoleEcosystemSection'
import SaveHoursSection from './components/sections/SaveHoursSection'
import WhyChooseUsSection from './components/sections/WhyChooseUsSection'
import { useTextToSpeech } from './hooks/useTextToSpeech'

export default function App() {
  const tts = useTextToSpeech()
  const [authMode, setAuthMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash
      if (hash === '#/login' || hash === '#login') return 'login'
      if (hash === '#/register' || hash === '#register') return 'register'
    }
    return null
  })

  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash
      if (hash === '#/login' || hash === '#login') {
        setAuthMode('login')
      } else if (hash === '#/register' || hash === '#register') {
        setAuthMode('register')
      } else if (hash === '' || hash === '#top' || hash === '#letters' || hash === '#for-practice' || hash === '#save-hours' || hash === '#safety') {
        setAuthMode(null)
      }
    }

    checkHash()
    window.addEventListener('hashchange', checkHash)
    return () => window.removeEventListener('hashchange', checkHash)
  }, [])

  const handleOpenAuth = (mode) => {
    setAuthMode(mode)
    window.location.hash = `#/${mode}`
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCloseAuth = () => {
    setAuthMode(null)
    window.history.pushState(null, '', window.location.pathname)
  }

  const handleScrollToSimulation = () => {
    const el = document.getElementById('letters')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  if (authMode) {
    return <AuthPage initialMode={authMode} onClose={handleCloseAuth} />
  }

  return (
    <div className="min-h-screen bg-white text-[#070709] selection:bg-[#2597d0] selection:text-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-full focus:bg-[#070709] focus:text-white focus:text-xs focus:font-semibold"
      >
        Lewati ke konten utama
      </a>

      <main id="main-content">
        <HeroSection
          onOpenSimulation={handleScrollToSimulation}
          onOpenAuth={handleOpenAuth}
        />
        <SaveHoursSection tts={tts} />
        <InteractiveSimulationSection tts={tts} />
        <ManifestoSection />
        <RoleEcosystemSection />
        <WhyChooseUsSection />
      </main>

      <Footer onOpenAuth={handleOpenAuth} />
    </div>
  )
}
