import { useEffect, useState } from 'react'
import { AuthProvider } from './context/AuthContext'
import AuthPage from './components/auth/AuthPage'
import Footer from './components/layout/Footer'
import HeroSection from './components/sections/HeroSection'
import InteractiveSimulationSection from './components/sections/InteractiveSimulationSection'
import ManifestoSection from './components/sections/ManifestoSection'
import RoleEcosystemSection from './components/sections/RoleEcosystemSection'
import SaveHoursSection from './components/sections/SaveHoursSection'
import WhyChooseUsSection from './components/sections/WhyChooseUsSection'
import { useTextToSpeech } from './hooks/useTextToSpeech'
import {
  clearAuthSession,
  getRoleDashboardPath,
  getStoredUser,
  saveAuthSession,
} from './lib/authApi'
import AdminDashboard from './pages/admin/Dashboard'
import BidanDashboard from './pages/bidan/BidanDashboard'
import KaderDashboard from './pages/kader/KaderDashboard'
import OrtuDashboard from './pages/ortu/OrtuDashboard'

function parseViewFromHash(hash) {
  if (!hash) return { type: 'landing' }
  const clean = hash.replace(/^#\/?/, '')
  if (clean === 'login') return { type: 'auth', mode: 'login' }
  if (clean === 'register') return { type: 'auth', mode: 'register' }
  if (clean.startsWith('kader')) return { type: 'dashboard', role: 'kader' }
  if (clean.startsWith('bidan')) return { type: 'dashboard', role: 'bidan' }
  if (clean.startsWith('admin')) return { type: 'dashboard', role: 'admin' }
  if (clean.startsWith('ortu') || clean.startsWith('p/')) {
    return { type: 'dashboard', role: 'ortu' }
  }
  return { type: 'landing' }
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

function AppContent() {
  const tts = useTextToSpeech()
  const [currentUser, setCurrentUser] = useState(() => getStoredUser())
  const [viewState, setViewState] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseViewFromHash(window.location.hash)
    }
    return { type: 'landing' }
  })

  useEffect(() => {
    const handleHashChange = () => {
      setViewState(parseViewFromHash(window.location.hash))
      setCurrentUser(getStoredUser())
    }

    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const handleOpenAuth = (mode) => {
    window.location.hash = `#/${mode}`
    setViewState({ type: 'auth', mode })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCloseAuth = () => {
    window.history.pushState(null, '', window.location.pathname)
    setViewState({ type: 'landing' })
  }

  const handleAuthSuccess = (authData) => {
    if (authData?.user) {
      setCurrentUser(authData.user)
    }
    const targetPath = authData?.redirect_to || getRoleDashboardPath(authData?.user?.role)
    window.location.hash = `#${targetPath}`
    setViewState(parseViewFromHash(window.location.hash))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleLogout = () => {
    clearAuthSession()
    setCurrentUser(null)
    window.history.pushState(null, '', window.location.pathname)
    setViewState({ type: 'landing' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSwitchRole = (targetRole) => {
    const rolePresets = {
      kader: {
        id: 1,
        full_name: 'Siti Aminah (Petugas Posyandu Melati 04)',
        email: 'kader@tumbuhin.id',
        phone: '081288990011',
        role: 'kader',
        posyandu_name: 'Posyandu Melati 04',
        village_name: 'Desa Sukamaju',
      },
      bidan: {
        id: 2,
        full_name: 'Bidan Rina Kartika, A.Md.Keb',
        email: 'bidan@tumbuhin.id',
        phone: '081288990022',
        role: 'bidan',
        posyandu_name: 'Puskesmas Sukamaju',
        village_name: 'Desa Sukamaju',
      },
      admin: {
        id: 3,
        full_name: 'Hendra Wijaya (Super Admin Desa)',
        email: 'admin@tumbuhin.id',
        phone: '081288990033',
        role: 'admin',
        posyandu_name: 'Pusat Data Desa Sukamaju',
        village_name: 'Desa Sukamaju',
      },
      ortu: {
        id: 4,
        full_name: 'Ibu Dewi Lestari (Ortu Balita Andi)',
        email: 'ortu@tumbuhin.id',
        phone: '081288990044',
        role: 'ortu',
        posyandu_name: 'Posyandu Melati 04',
        village_name: 'Desa Sukamaju',
      },
    }

    const nextUser = rolePresets[targetRole] || rolePresets.kader
    saveAuthSession(null, nextUser)
    setCurrentUser(nextUser)
    const targetPath = getRoleDashboardPath(targetRole)
    window.location.hash = `#${targetPath}`
    setViewState({ type: 'dashboard', role: targetRole })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleScrollToSimulation = () => {
    const el = document.getElementById('letters')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  if (viewState.type === 'auth') {
    return (
      <AuthPage
        initialMode={viewState.mode}
        onClose={handleCloseAuth}
        onAuthSuccess={handleAuthSuccess}
      />
    )
  }

  if (viewState.type === 'dashboard') {
    if (viewState.role === 'bidan') {
      return (
        <BidanDashboard
          user={currentUser}
          onLogout={handleLogout}
          onSwitchRole={handleSwitchRole}
        />
      )
    }
    if (viewState.role === 'admin') {
      return (
        <AdminDashboard
          user={currentUser}
          onLogout={handleLogout}
          onSwitchRole={handleSwitchRole}
        />
      )
    }
    if (viewState.role === 'ortu') {
      return (
        <OrtuDashboard
          user={currentUser}
          onLogout={handleLogout}
          onSwitchRole={handleSwitchRole}
          tts={tts}
        />
      )
    }
    return (
      <KaderDashboard
        user={currentUser}
        onLogout={handleLogout}
        onSwitchRole={handleSwitchRole}
      />
    )
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
