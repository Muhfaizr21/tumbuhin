import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { BRAND_INFO, NAV_LINKS } from '../../constants/landingData'
import { LettersStethoscopeIcon } from '../ui/LettersIcons'

export default function Navbar({ onOpenSimulation, onOpenAuth }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 300)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileMenuOpen])

  const handleLoginClick = (e) => {
    if (onOpenAuth) {
      e.preventDefault()
      onOpenAuth('login')
    }
  }

  const handleRegisterClick = (e) => {
    if (onOpenAuth) {
      e.preventDefault()
      onOpenAuth('register')
    } else if (onOpenSimulation) {
      onOpenSimulation()
    }
  }

  return (
    <>
      {/* 1. In-Hero Navbar (Static inside top of blue hero card, 100% matches letters.app reference screenshot) */}
      <header className="relative z-30 w-full max-w-[1200px] mx-auto px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-4">
        {/* Left: Bare Stethoscope Icon + Tumbuhin Wordmark (No background box) */}
        <a
          href="#top"
          className="inline-flex items-center gap-2 min-h-[44px] group"
        >
          <LettersStethoscopeIcon className="w-5 h-5 text-white" />
          <span className="font-runde font-semibold text-[17px] tracking-[-0.02em] text-white">
            {BRAND_INFO.name}
          </span>
        </a>

        {/* Center: Navigation Links in White with Chevron on dropdowns */}
        <nav aria-label="Navigasi Utama" className="hidden md:flex items-center gap-6 lg:gap-8">
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="min-h-[44px] inline-flex items-center gap-1.5 font-inter text-[14px] font-medium tracking-[-0.01em] text-white/90 hover:text-white transition-colors"
            >
              <span>{item.label}</span>
              {item.hasDropdown && (
                <svg
                  width="10"
                  height="6"
                  viewBox="0 0 10 6"
                  fill="none"
                  className="w-2.5 h-2.5 opacity-80"
                  aria-hidden="true"
                >
                  <path
                    d="M1 1L5 5L9 1"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </a>
          ))}
        </nav>

        {/* Right: Plain Text Login + White Capsule Sign-up Button */}
        <div className="flex items-center gap-4 sm:gap-6">
          <a
            href="#/login"
            onClick={handleLoginClick}
            className="text-white hover:text-white/80 font-runde font-medium text-[14px] min-h-[40px] hidden sm:inline-flex items-center transition-colors cursor-pointer"
          >
            Masuk Kader
          </a>

          <button
            type="button"
            onClick={handleRegisterClick}
            className="bg-white text-[#070709] min-h-[38px] px-5 py-2 rounded-full font-runde font-medium text-[14px] inline-flex items-center shadow-sm hover:bg-white/95 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            Mulai Gratis
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-controls="hero-mobile-menu"
            aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
            className="md:hidden text-white min-h-[44px] px-2 py-2 inline-flex items-center"
          >
            {mobileMenuOpen ? (
              <X aria-hidden="true" className="w-5 h-5" />
            ) : (
              <Menu aria-hidden="true" className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Dropdown Menu for In-Hero state */}
        {mobileMenuOpen && (
          <nav
            id="hero-mobile-menu"
            aria-label="Navigasi Seluler"
            className="absolute top-full left-2 right-2 mt-2 p-3 rounded-2xl bg-[#366088]/95 backdrop-blur-md border border-white/20 text-white shadow-xl flex flex-col gap-1 md:hidden z-40"
          >
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-[44px] flex items-center px-3.5 py-2 rounded-xl font-inter text-[14px] font-medium text-white hover:bg-white/10 transition-colors"
              >
                {item.label}
              </a>
            ))}
            <div className="pt-2 mt-1 border-t border-white/15 flex flex-col gap-2">
              <a
                href="#/login"
                onClick={(e) => {
                  setMobileMenuOpen(false)
                  handleLoginClick(e)
                }}
                className="min-h-[42px] flex items-center justify-center rounded-full text-[14px] font-runde font-medium border border-white/30 text-white"
              >
                Masuk Kader
              </a>
              <button
                type="button"
                onClick={(e) => {
                  setMobileMenuOpen(false)
                  handleRegisterClick(e)
                }}
                className="min-h-[42px] flex items-center justify-center rounded-full text-[14px] font-runde font-medium bg-white text-[#070709]"
              >
                Daftar Akun Baru
              </button>
            </div>
          </nav>
        )}
      </header>

      {/* 2. Floating Sticky Navbar (Appears smoothly when scrolled past hero) */}
      <header
        aria-hidden={!isScrolled}
        className={`fixed top-0 left-0 right-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-black/8 shadow-xs transition-transform duration-300 ${
          isScrolled ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <a
            href="#top"
            className="inline-flex items-center gap-2 min-h-[44px] group"
          >
            <LettersStethoscopeIcon className="w-5 h-5 text-[#2597d0]" />
            <span className="font-runde font-semibold text-[17px] tracking-[-0.02em] text-[#070709]">
              {BRAND_INFO.name}
            </span>
          </a>

          <nav aria-label="Navigasi Melayang" className="hidden md:flex items-center gap-6 lg:gap-8">
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="min-h-[44px] inline-flex items-center gap-1.5 font-inter text-[14px] font-medium tracking-[-0.01em] text-[#070709] hover:text-[#60606c] transition-colors"
              >
                <span>{item.label}</span>
                {item.hasDropdown && (
                  <svg
                    width="10"
                    height="6"
                    viewBox="0 0 10 6"
                    fill="none"
                    className="w-2.5 h-2.5 opacity-60"
                    aria-hidden="true"
                  >
                    <path
                      d="M1 1L5 5L9 1"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            <a
              href="#/login"
              onClick={handleLoginClick}
              className="text-[#070709] hover:text-[#60606c] font-runde font-medium text-[14px] min-h-[40px] hidden sm:inline-flex items-center transition-colors cursor-pointer"
            >
              Masuk Kader
            </a>

            <button
              type="button"
              onClick={handleRegisterClick}
              className="letters-pill-btn min-h-[40px] px-5 py-2 text-[14px] inline-flex items-center shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              Mulai Gratis
            </button>
          </div>
        </div>
      </header>
    </>
  )
}
