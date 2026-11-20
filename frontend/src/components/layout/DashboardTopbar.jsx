import { useState } from 'react'
import {
  Bell,
  Check,
  ChevronDown,
  Contrast,
  Menu,
  Search,
  Type,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
} from 'lucide-react'

export function OfflineBadge({ isOnline = true, antreanCount = 0 }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
        isOnline
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-amber-50 text-amber-700 border-amber-200'
      }`}
      title={
        isOnline
          ? 'Terhubung ke server cloud Tumbuhin'
          : `Mode Offline IndexedDB (${antreanCount} antrean menunggu sinkron)`
      }
    >
      {isOnline ? (
        <>
          <Wifi className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden sm:inline">Online</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3.5 h-3.5 text-amber-600" />
          <span>Offline ({antreanCount})</span>
        </>
      )}
    </div>
  )
}

export function AccessibilityBar({ tts, dashboardSummaryText = '' }) {
  const [isHighContrast, setIsHighContrast] = useState(false)
  const [isLargeText, setIsLargeText] = useState(false)

  const toggleHighContrast = () => {
    const root = document.documentElement
    const nextState = !isHighContrast
    setIsHighContrast(nextState)
    if (nextState) {
      root.classList.add('a11y-high-contrast')
    } else {
      root.classList.remove('a11y-high-contrast')
    }
  }

  const toggleLargeText = () => {
    const root = document.documentElement
    const nextState = !isLargeText
    setIsLargeText(nextState)
    if (nextState) {
      root.classList.add('a11y-large-text')
    } else {
      root.classList.remove('a11y-large-text')
    }
  }

  const handleToggleTTS = () => {
    if (!tts) return
    if (tts.isSpeaking) {
      tts.stop()
    } else {
      const textToRead =
        dashboardSummaryText ||
        'Ringkasan Dasbor Posyandu Melati 04. Total 48 balita terdaftar. 41 sudah ditimbang bulan ini, capaian 85,4 persen. Terdapat 4 balita dengan peringatan dini Growth Faltering yang membutuhkan tindak lanjut.'
      tts.speak(textToRead)
    }
  }

  return (
    <div
      className="inline-flex items-center gap-1 bg-gray-100/80 rounded-xl p-1 border border-black/5"
      role="group"
      aria-label="Aksesibilitas dan Bantuan"
    >
      {/* High Contrast Toggle */}
      <button
        type="button"
        onClick={toggleHighContrast}
        className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
          isHighContrast
            ? 'bg-blue-600 text-white shadow-xs'
            : 'text-gray-600 hover:text-gray-900 hover:bg-white'
        }`}
        title="Toggle Mode Kontras Tinggi (Aksesibilitas)"
        aria-label="Mode Kontras Tinggi"
        aria-pressed={isHighContrast}
      >
        <Contrast className="w-4 h-4" />
      </button>

      {/* Font Scaling Toggle */}
      <button
        type="button"
        onClick={toggleLargeText}
        className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
          isLargeText
            ? 'bg-blue-600 text-white shadow-xs'
            : 'text-gray-600 hover:text-gray-900 hover:bg-white'
        }`}
        title="Perbesar Ukuran Teks (A-/A+)"
        aria-label="Perbesar Ukuran Teks"
        aria-pressed={isLargeText}
      >
        <Type className="w-4 h-4" />
      </button>

      {/* Text To Speech Toggle */}
      {tts?.isSupported && (
        <button
          type="button"
          onClick={handleToggleTTS}
          className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            tts.isSpeaking
              ? 'bg-emerald-600 text-white shadow-xs animate-pulse'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white'
          }`}
          title={tts.isSpeaking ? 'Hentikan Pembacaan Suara' : 'Bacakan Ringkasan Dasbor (TTS Bahasa Indonesia)'}
          aria-label="Bacakan Ringkasan Dasbor"
          aria-pressed={tts.isSpeaking}
        >
          {tts.isSpeaking ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  )
}

export default function DashboardTopbar({
  user,
  onOpenMobileSidebar,
  isOnline = true,
  antreanCount = 0,
  tts,
  dashboardSummaryText,
  searchQuery = '',
  onSearchChange,
  notificationCount = 3,
}) {
  const [selectedPosyandu, setSelectedPosyandu] = useState('Posyandu Melati 04')
  const [isPosyanduDropdownOpen, setIsPosyanduDropdownOpen] = useState(false)

  const posyanduOptions = [
    'Posyandu Melati 04 (Utama)',
    'Posyandu Melati 01',
    'Posyandu Melati 02',
    'Posyandu Mawar 03',
  ]

  const userInitials = (user?.full_name || user?.name || 'Siti Aminah')
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-black/6 px-4 sm:px-6 py-3 transition-colors clinicflow-card">
      <div className="flex items-center justify-between gap-3 sm:gap-4 max-w-7xl mx-auto">
        {/* Left: Mobile Menu Toggle & Posyandu Selector */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-xl text-gray-700 hover:bg-black/5 cursor-pointer"
            aria-label="Buka navigasi sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Posyandu Wilayah Selector (ClinicFlow-inspired) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsPosyanduDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-black/8 text-left transition-colors cursor-pointer"
              aria-expanded={isPosyanduDropdownOpen}
              aria-label="Pilih Wilayah Posyandu"
            >
              <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-[12.5px] font-semibold text-gray-900 truncate leading-tight">
                  {selectedPosyandu}
                </p>
                <p className="text-[10px] text-gray-500 truncate leading-none">
                  Desa Sukamaju, RW 04
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500 shrink-0 ml-1" />
            </button>

            {isPosyanduDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-60 rounded-2xl bg-white border border-black/10 shadow-lg py-1.5 z-40">
                <div className="px-3 py-1 text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">
                  Daftar Posyandu Desa
                </div>
                {posyanduOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setSelectedPosyandu(opt)
                      setIsPosyanduDropdownOpen(false)
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-left text-[12.5px] hover:bg-blue-50 text-gray-700 cursor-pointer"
                  >
                    <span>{opt}</span>
                    {selectedPosyandu === opt && (
                      <Check className="w-3.5 h-3.5 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: Search Bar with ⌘K shortcut hint */}
        <div className="hidden md:flex flex-1 max-w-md mx-2">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              placeholder="Cari balita, nama orang tua, RT/RW…"
              className="w-full pl-9.5 pr-14 py-2 rounded-xl bg-gray-50 border border-black/8 text-[12.5px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-gray-400 bg-white px-1.5 py-0.5 rounded border border-black/10 shadow-2xs pointer-events-none">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right: Offline Status, Accessibility, Notifications, Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Online/Offline Status */}
          <OfflineBadge isOnline={isOnline} antreanCount={antreanCount} />

          {/* Accessibility Controls */}
          <AccessibilityBar tts={tts} dashboardSummaryText={dashboardSummaryText} />

          {/* Notification Icon */}
          <button
            type="button"
            className="relative p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            title="Pemberitahuan & Instruksi Bidan"
            aria-label="Pemberitahuan"
          >
            <Bell className="w-4 h-4" />
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </button>

          {/* User Profile Mini */}
          <div className="flex items-center gap-2 pl-2 border-l border-black/8">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shadow-xs shrink-0">
              {userInitials}
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-[12.5px] font-semibold text-gray-900 leading-tight">
                {user?.full_name || 'Siti Aminah'}
              </p>
              <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                Kader Posyandu
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
