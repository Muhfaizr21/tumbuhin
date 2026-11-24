import { Suspense, lazy, useEffect, useState } from 'react'
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
  loginWithBackend,
  saveAuthSession,
} from './lib/authApi'

const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const BidanDashboard = lazy(() => import('./pages/bidan/BidanDashboard'))
const HomeVisitPage = lazy(() => import('./pages/bidan/HomeVisitPage'))
const PMTEvaluationPage = lazy(() => import('./pages/bidan/PMTEvaluationPage'))
const SupervisiPage = lazy(() => import('./pages/bidan/SupervisiPage'))
const LaporanExportPage = lazy(() => import('./pages/bidan/LaporanExportPage'))
const KaderDashboard = lazy(() => import('./pages/kader/KaderDashboard'))
const OrtuDashboard = lazy(() => import('./pages/ortu/OrtuDashboard'))

function parseQueryString(raw) {
  const query = {}
  if (!raw) return query
  new URLSearchParams(raw).forEach((value, key) => {
    query[key] = value
  })
  return query
}

function parseViewFromHash(hash) {
  if (!hash) return { type: 'landing' }
  const clean = hash.replace(/^#\/?/, '')
  if (clean === 'login') return { type: 'auth', mode: 'login' }
  if (clean === 'register') return { type: 'auth', mode: 'register' }
  if (clean.startsWith('kader')) return { type: 'dashboard', role: 'kader' }
  if (clean.startsWith('bidan')) {
    const [pathPart, queryPart] = clean.split('?')
    let sub = pathPart.replace(/^bidan\/?/, '')
    if (sub === 'gis') sub = 'peta-gis'
    return {
      type: 'dashboard',
      role: 'bidan',
      subPage: sub || 'dashboard',
      query: parseQueryString(queryPart),
    }
  }
  if (clean.startsWith('admin')) return { type: 'dashboard', role: 'admin' }
  if (clean.startsWith('ortu') || clean.startsWith('p/')) {
    const [pathPart, queryPart] = clean.split('?')
    let token = ''
    if (pathPart.startsWith('p/')) {
      token = pathPart.replace(/^p\/?/, '')
    } else {
      token = pathPart.replace(/^ortu\/?/, '')
    }
    if (token === 'dashboard') {
      token = ''
    }
    return {
      type: 'dashboard',
      role: 'ortu',
      magicToken: token || 'magic-balita-andi-2026-tumbuhin-sehat',
      query: parseQueryString(queryPart),
    }
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

    const rolePasswords = {
      kader: 'kadersehat2026',
      bidan: 'bidansiaga2026',
      admin: 'adminsehat2026',
      ortu: 'ortusehat2026',
    }

    const nextUser = rolePresets[targetRole] || rolePresets.kader
    saveAuthSession(null, nextUser)
    setCurrentUser(nextUser)
    const targetPath = getRoleDashboardPath(targetRole)
    window.location.hash = `#${targetPath}`
    setViewState(parseViewFromHash(`#${targetPath}`))
    window.scrollTo({ top: 0, behavior: 'smooth' })

    // Transparently obtain a matching JWT token from the backend for the switched role
    loginWithBackend({
      identifier: nextUser.email,
      email: nextUser.email,
      password: rolePasswords[targetRole] || 'kadersehat2026',
    })
      .then((authData) => {
        if (authData?.user) {
          setCurrentUser(authData.user)
        }
      })
      .catch(() => {
        // Offline or backend not running; keep preset user in state
      })
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
    const renderDashboardView = () => {
      if (viewState.role === 'bidan') {
        if (viewState.subPage === 'intervensi') {
          return (
            <HomeVisitPage
              key={viewState.query.child_id || 'home-visit'}
              user={currentUser}
              prefill={viewState.query}
              onLogout={handleLogout}
              onSwitchRole={handleSwitchRole}
            />
          )
        }
        if (viewState.subPage === 'pmt-evaluasi') {
          return (
            <PMTEvaluationPage
              user={currentUser}
              onLogout={handleLogout}
              onSwitchRole={handleSwitchRole}
            />
          )
        }
        if (viewState.subPage === 'supervisi') {
          return (
            <SupervisiPage
              user={currentUser}
              onLogout={handleLogout}
              onSwitchRole={handleSwitchRole}
            />
          )
        }
        if (viewState.subPage === 'laporan') {
          return (
            <LaporanExportPage
              user={currentUser}
              onLogout={handleLogout}
              onSwitchRole={handleSwitchRole}
            />
          )
        }
        return (
          <BidanDashboard
            user={currentUser}
            currentSubPage={viewState.subPage}
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
            magicToken={viewState.magicToken}
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
      <Suspense
        fallback={
          <div className="min-h-dvh bg-[#f6f9fc] flex items-center justify-center p-6">
            <div className="px-5 py-3.5 rounded-2xl bg-white border border-slate-100 shadow-xs text-[13px] font-semibold text-slate-600">
              Memuat ruang kerja modul...
            </div>
          </div>
        }
      >
        {renderDashboardView()}
      </Suspense>
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
