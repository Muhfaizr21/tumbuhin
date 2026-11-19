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

  const handleScrollToSimulation = () => {
    const el = document.getElementById('letters')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
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
        <HeroSection onOpenSimulation={handleScrollToSimulation} />
        <SaveHoursSection tts={tts} />
        <InteractiveSimulationSection tts={tts} />
        <ManifestoSection />
        <RoleEcosystemSection />
        <WhyChooseUsSection />
      </main>

      <Footer />
    </div>
  )
}
