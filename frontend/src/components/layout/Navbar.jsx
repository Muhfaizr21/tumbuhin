import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { BRAND_INFO, NAV_LINKS } from '../../constants/landingData'
import { SurgicalEnvelopeIcon } from '../ui/LettersIcons'

export default function Navbar({ onOpenSimulation }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-xs border-b border-black/8">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Wordmark + Surgical Blue Icon */}
        <a
          href="#top"
          className="inline-flex items-center gap-2.5 min-h-[44px] pr-2 group"
        >
          <span className="w-8 h-8 rounded-[10px] bg-[#f5f5f5] border border-black/10 flex items-center justify-center">
            <SurgicalEnvelopeIcon className="w-4 h-4" />
          </span>
          <span className="font-runde font-semibold text-[18px] tracking-[-0.02em] text-[#070709]">
            {BRAND_INFO.name}
          </span>
        </a>

        {/* Center: 4 Navigation Links in Inter 14px weight 500 (#070709) */}
        <nav aria-label="Navigasi Utama" className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="min-h-[44px] inline-flex items-center font-inter text-[14px] font-medium tracking-[-0.022em] text-[#070709] hover:text-[#60606c] transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right: Outlined Ghost Login Button + Filled Obsidian Pill Button (100% letters.app match) */}
        <div className="flex items-center gap-2.5">
          <a
            href="#letters"
            className="letters-ghost-btn min-h-[40px] px-4 py-2 text-[14px] hidden sm:inline-flex items-center"
          >
            Masuk Kader
          </a>

          <button
            type="button"
            onClick={onOpenSimulation}
            className="letters-pill-btn min-h-[40px] px-5 py-2 text-[14px] inline-flex items-center"
          >
            Mulai Gratis
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-controls="letters-mobile-menu"
            aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            className="md:hidden letters-ghost-btn min-h-[44px] px-3.5 py-2 text-[13px] inline-flex items-center gap-1.5"
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
          className="md:hidden bg-white border-b border-black/10 px-4 py-4 flex flex-col gap-1"
        >
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="min-h-[44px] flex items-center px-3 py-2 rounded-xl font-inter text-[14px] font-medium text-[#070709] hover:bg-[#f5f5f5]"
            >
              {item.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  )
}
