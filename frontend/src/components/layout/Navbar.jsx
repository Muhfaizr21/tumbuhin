import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { BRAND_INFO, NAV_LINKS } from '../../constants/landingData'
import { SurgicalEnvelopeIcon } from '../ui/LettersIcons'

export default function Navbar({ onOpenSimulation }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
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

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-white/85 backdrop-blur-md border-b border-black/8 shadow-xs'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-18 sm:h-20 flex items-center justify-between gap-4 transition-all duration-300">
        {/* Left: Brand Wordmark + Surgical Icon Tile */}
        <a
          href="#top"
          className="inline-flex items-center gap-2.5 min-h-[44px] pr-2 group"
        >
          <span
            className={`w-8 h-8 rounded-[10px] flex items-center justify-center transition-colors duration-300 ${
              isScrolled
                ? 'bg-[#f5f5f5] border border-black/10'
                : 'bg-white/95 border border-white/40 shadow-xs'
            }`}
          >
            <SurgicalEnvelopeIcon className="w-4 h-4" />
          </span>
          <span
            className={`font-runde font-semibold text-[18px] tracking-[-0.02em] transition-colors duration-300 ${
              isScrolled ? 'text-[#070709]' : 'text-white'
            }`}
          >
            {BRAND_INFO.name}
          </span>
        </a>

        {/* Center: 4 Navigation Links */}
        <nav aria-label="Navigasi Utama" className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`min-h-[44px] inline-flex items-center font-inter text-[14px] font-medium tracking-[-0.022em] transition-colors duration-300 ${
                isScrolled
                  ? 'text-[#070709] hover:text-[#60606c]'
                  : 'text-white/85 hover:text-white'
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right: Outlined Ghost Login Button + Filled Obsidian Pill Button */}
        <div className="flex items-center gap-2.5">
          <a
            href="#letters"
            className={`min-h-[40px] px-4 py-2 text-[14px] font-runde font-medium rounded-full hidden sm:inline-flex items-center transition-all duration-300 ${
              isScrolled
                ? 'letters-ghost-btn'
                : 'border border-white/40 text-white hover:bg-white/10 hover:border-white/70'
            }`}
          >
            Masuk Kader
          </a>

          <button
            type="button"
            onClick={onOpenSimulation}
            className="letters-pill-btn min-h-[40px] px-5 py-2 text-[14px] inline-flex items-center shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            Mulai Gratis
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-controls="letters-mobile-menu"
            aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            className={`md:hidden min-h-[44px] px-3.5 py-2 text-[13px] rounded-full inline-flex items-center gap-1.5 transition-colors duration-300 ${
              isScrolled
                ? 'letters-ghost-btn'
                : 'border border-white/40 text-white hover:bg-white/10'
            }`}
          >
            {mobileMenuOpen ? (
              <>
                <X aria-hidden="true" className="w-4 h-4" />
                <span>Tutup</span>
              </>
            ) : (
              <>
                <Menu aria-hidden="true" className="w-4 h-4" />
                <span>Menu</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Sheet */}
      {mobileMenuOpen && (
        <nav
          id="letters-mobile-menu"
          aria-label="Navigasi Seluler"
          className={`md:hidden mx-4 mb-3 p-3 rounded-2xl flex flex-col gap-1 shadow-xl transition-all duration-300 ${
            isScrolled
              ? 'bg-white/95 backdrop-blur-md border border-black/10 text-[#070709]'
              : 'bg-[#406a92]/95 backdrop-blur-md border border-white/20 text-white'
          }`}
        >
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`min-h-[44px] flex items-center px-3.5 py-2 rounded-xl font-inter text-[14px] font-medium transition-colors ${
                isScrolled
                  ? 'text-[#070709] hover:bg-[#f5f5f5]'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              {item.label}
            </a>
          ))}
          <div className="pt-2 mt-1 border-t border-black/5 flex flex-col gap-2">
            <a
              href="#letters"
              onClick={() => setMobileMenuOpen(false)}
              className={`min-h-[42px] flex items-center justify-center rounded-full text-[14px] font-runde font-medium ${
                isScrolled
                  ? 'border border-black/20 text-[#070709]'
                  : 'border border-white/40 text-white'
              }`}
            >
              Masuk Kader
            </a>
          </div>
        </nav>
      )}
    </header>
  )
}
