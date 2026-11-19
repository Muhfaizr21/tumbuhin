import Footer from './components/layout/Footer'
import HeroSection from './components/sections/HeroSection'
import InteractiveSimulationSection from './components/sections/InteractiveSimulationSection'
import ManifestoSection from './components/sections/ManifestoSection'
import RoleEcosystemSection from './components/sections/RoleEcosystemSection'
import ServicesBentoSection from './components/sections/ServicesBentoSection'
import WhyChooseUsSection from './components/sections/WhyChooseUsSection'
import AccessibilityToolbar from './components/ui/AccessibilityToolbar'
import { useTextToSpeech } from './hooks/useTextToSpeech'

export default function App() {
  const tts = useTextToSpeech()

  const handleScrollToSimulation = () => {
    const el = document.getElementById('simulasi')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-[#F2F6FF] text-[#0B1426] selection:bg-[#1E6BFF] selection:text-white">
      {/* Main Content Sections */}
      <main>
        <HeroSection onOpenSimulation={handleScrollToSimulation} tts={tts} />
        <ManifestoSection />
        <ServicesBentoSection />
        <InteractiveSimulationSection tts={tts} />
        <WhyChooseUsSection />
        <RoleEcosystemSection />
      </main>

      {/* Footer & Final CTA */}
      <Footer />

      {/* Floating Accessibility & Offline-First PWA Status Bar (PRD Modul F) */}
      <AccessibilityToolbar tts={tts} />
    </div>
  )
}
