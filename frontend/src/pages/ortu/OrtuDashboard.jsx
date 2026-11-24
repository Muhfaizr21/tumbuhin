import React, { useState, useEffect } from 'react'
import {
  Baby,
  CalendarCheck,
  ChefHat,
  LineChart,
  RefreshCw,
  WifiOff,
  AlertTriangle
} from 'lucide-react'
import { getChildPortalByToken } from '../../services/ortuService'
import OrtuSummaryTab from '../../components/ortu/OrtuSummaryTab'
import KmsInteractiveChart from '../../components/ortu/KmsInteractiveChart'
import MpasiRecipeCard from '../../components/ortu/MpasiRecipeCard'
import BidanNotesAndSchedule from '../../components/ortu/BidanNotesAndSchedule'
import FloatingAccessibilityBar from '../../components/ortu/FloatingAccessibilityBar'

const TABS = [
  { id: 'ringkasan', label: 'Ringkasan', icon: Baby },
  { id: 'kurva', label: 'Kurva KMS', icon: LineChart },
  { id: 'resep', label: 'Resep MPASI', icon: ChefHat },
  { id: 'pesan', label: 'Pesan & Jadwal', icon: CalendarCheck }
]

export default function OrtuDashboard({ user, magicToken, onSwitchRole }) {
  const [activeTab, setActiveTab] = useState('ringkasan')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [childData, setChildData] = useState(null)
  const [isOffline, setIsOffline] = useState(false)

  // Accessibility State
  const [isHighContrast, setIsHighContrast] = useState(false)
  const [fontSizeScale, setFontSizeScale] = useState(100) // 100%, 125%, 150%

  // Current token to fetch
  const effectiveToken = magicToken || 'magic-balita-andi-2026-tumbuhin-sehat'

  const loadData = async (token) => {
    setLoading(true)
    setError(null)
    try {
      const res = await getChildPortalByToken(token)
      setChildData(res.data)
      setIsOffline(res.isOffline || false)
    } catch (err) {
      console.error('Error loading child portal:', err)
      setError(err.message === 'NOT_FOUND' ? 'TOKEN_NOT_FOUND' : 'NETWORK_ERROR')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(effectiveToken)
  }, [effectiveToken])

  // Contextual text for Text-to-Speech
  const getContextualSpeechText = () => {
    if (!childData) return 'Kartu Gizi Digital SigapGizi Tumbuhin.'
    if (activeTab === 'ringkasan') {
      return `Ringkasan Tumbuh Kembang Ananda ${childData.child_name}, usia ${childData.age_months} bulan. ${childData.friendly_status_title}. Berat badan terakhir ${childData.last_weight_kg} kilogram, tinggi badan ${childData.last_height_cm} sentimeter. Selisih kenaikan ${childData.delta_weight_grams} gram dari bulan lalu. ${childData.friendly_explanation}`
    }
    if (activeTab === 'kurva') {
      return `Grafik KMS Digital Ananda ${childData.child_name}. Posisi penimbangan terakhir berada di ${childData.color_pita === 'hijau' ? 'pita hijau aman' : 'pita kuning waspada'}. Target berat badan minimal bulan depan adalah ${childData.next_month_target_kg} kilogram.`
    }
    if (activeTab === 'resep') {
      return `Rekomendasi resep MPASI pangan lokal: ${childData.mpasi_recipe?.title}. Biaya belanja harian sekitar ${childData.mpasi_recipe?.daily_budget_idr} rupiah. Tekstur ${childData.mpasi_recipe?.texture}.`
    }
    if (activeTab === 'pesan') {
      return `Catatan dari Bidan Desa: ${childData.bidan_note?.clinical_note}. Jadwal Posyandu berikutnya adalah tanggal ${childData.next_posyandu?.activity_date} di ${childData.next_posyandu?.location}.`
    }
    return childData.friendly_explanation
  }

  const handleSwitchDemoChild = (targetToken) => {
    window.location.hash = `#/p/${targetToken}`
  }

  return (
    <div
      style={{ fontSize: `${fontSizeScale}%` }}
      className={`min-h-screen transition-colors duration-200 pb-28 font-inter ${
        isHighContrast
          ? 'bg-black text-white selection:bg-yellow-400 selection:text-black'
          : 'bg-[#f8fafc] text-[#070709] selection:bg-[#2597d0] selection:text-white'
      }`}
    >
      {/* Top Bar Navigation (Clean Medical Instrument Header) */}
      <header
        className={`w-full border-b sticky top-0 z-40 backdrop-blur-md transition-all ${
          isHighContrast
            ? 'bg-black/95 border-yellow-400 text-white'
            : 'bg-white/95 border-black/8 text-[#070709]'
        }`}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#070709] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              <Baby className="w-4 h-4 text-[#2597d0]" />
            </div>
            <div>
              <span className="text-[11px] font-bold tracking-tight text-[#2597d0] block uppercase font-runde">
                SigapGizi • Tumbuhin
              </span>
              <h1 className="text-sm font-semibold tracking-tight text-[#070709] font-runde">
                Kartu Gizi Digital
              </h1>
            </div>
          </div>

          {/* Quick Demo Switcher & Mode Badge */}
          <div className="flex items-center gap-2">
            {isOffline && (
              <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold flex items-center gap-1.5 uppercase tracking-wide">
                <WifiOff className="w-3 h-3" /> Offline
              </span>
            )}

            {/* Quick Demo Selector for Examiners */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs">
              <span className="text-[11px] text-[#8b8b8b]">Contoh:</span>
              <button
                type="button"
                onClick={() => handleSwitchDemoChild('magic-balita-andi-2026-tumbuhin-sehat')}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                  effectiveToken.includes('andi')
                    ? 'bg-[#070709] text-white'
                    : 'bg-[#f5f5f5] text-[#60606c] hover:bg-[#e8e8e8] border border-black/5'
                }`}
              >
                Andi (Pita Hijau)
              </button>
              <button
                type="button"
                onClick={() => handleSwitchDemoChild('magic-balita-siti-2026-tumbuhin-pantau')}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                  effectiveToken.includes('siti')
                    ? 'bg-[#070709] text-white'
                    : 'bg-[#f5f5f5] text-[#60606c] hover:bg-[#e8e8e8] border border-black/5'
                }`}
              >
                Siti (Pita Kuning/PMT)
              </button>
            </div>

            {user && onSwitchRole && (
              <button
                type="button"
                onClick={() => onSwitchRole('kader')}
                className="text-[11px] font-medium px-3 py-1 rounded-full bg-[#f5f5f5] hover:bg-[#e8e8e8] text-[#070709] border border-black/8 transition-all"
              >
                Kembali ke Petugas
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-32 rounded-3xl bg-white border border-black/8" />
            <div className="h-12 rounded-full bg-[#f5f5f5]" />
            <div className="h-64 rounded-3xl bg-white border border-black/8" />
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-8 rounded-3xl bg-white border border-black/8 text-center space-y-4 shadow-2xs">
            <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-[#070709] font-runde">
                {error === 'TOKEN_NOT_FOUND' ? 'Tautan Magic Link Tidak Ditemukan' : 'Gangguan Koneksi Jaringan'}
              </h2>
              <p className="text-xs sm:text-sm text-[#60606c] max-w-md mx-auto leading-relaxed">
                {error === 'TOKEN_NOT_FOUND'
                  ? 'Pastikan tautan yang Anda buka sesuai dengan pesan WhatsApp dari Kader Posyandu desa Anda.'
                  : 'Gagal memuat data dari server. Periksa koneksi internet Anda atau coba muat kembali.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => loadData(effectiveToken)}
                className="px-5 py-2.5 rounded-full bg-[#070709] hover:bg-[#151515] text-white text-xs font-medium flex items-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Muat Ulang Halaman
              </button>
              <button
                type="button"
                onClick={() => handleSwitchDemoChild('magic-balita-andi-2026-tumbuhin-sehat')}
                className="px-5 py-2.5 rounded-full bg-white text-[#070709] border border-black/15 hover:bg-[#f5f5f5] text-xs font-medium transition-all cursor-pointer"
              >
                Buka Contoh Balita Andi
              </button>
            </div>
          </div>
        )}

        {/* Content State */}
        {!loading && !error && childData && (
          <>
            {/* Header Profil Balita (Kartu Identitas - 18/24px rounded card floating on hairline shadow) */}
            <div
              className={`p-6 sm:p-7 rounded-3xl border transition-all ${
                isHighContrast
                  ? 'bg-black text-white border-yellow-400'
                  : 'bg-white text-[#070709] border-black/8 shadow-2xs'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#2597d0]/10 text-[#2597d0] border border-[#2597d0]/20 flex items-center justify-center font-bold text-lg font-runde shrink-0">
                    {childData.child_name ? childData.child_name.slice(0, 2).toUpperCase() : 'BL'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl sm:text-2xl font-semibold text-[#070709] tracking-tight font-runde">
                        {childData.child_name}
                      </h2>
                      <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#f5f5f5] text-[#60606c] border border-black/5">
                        {childData.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}
                      </span>
                    </div>

                    <p className="text-xs text-[#60606c] mt-1 flex flex-wrap items-center gap-2">
                      <span>Usia: <strong className="text-[#070709]">{childData.age_months} Bulan</strong></span>
                      <span className="text-[#8b8b8b]">•</span>
                      <span>Lahir: {childData.birth_date}</span>
                      <span className="text-[#8b8b8b]">•</span>
                      <span>NIK: {childData.masked_nik}</span>
                    </p>

                    <p className="text-xs text-[#60606c] mt-0.5">
                      Ibu/Wali: <strong className="text-[#070709]">{childData.parent_name || 'Ibu Balita'}</strong> • {childData.posyandu_name} ({childData.village_name})
                    </p>
                  </div>
                </div>

                {/* Status Pita KMS Badge */}
                <div className="self-start sm:self-auto shrink-0">
                  <span
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full font-medium text-xs tracking-tight ${
                      childData.color_pita === 'hijau'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                        : childData.color_pita === 'kuning'
                        ? 'bg-amber-50 text-amber-900 border border-amber-200/80'
                        : 'bg-rose-50 text-rose-900 border border-rose-200/80'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        childData.color_pita === 'hijau'
                          ? 'bg-emerald-500'
                          : childData.color_pita === 'kuning'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                    />
                    Pita {childData.color_pita?.toUpperCase() || 'HIJAU'} KMS
                  </span>
                </div>
              </div>

              {/* Mobile Demo Selector Pills */}
              <div className="mt-4 pt-3 border-t border-black/5 flex sm:hidden items-center justify-between text-[11px]">
                <span className="text-[#8b8b8b]">Pilih data contoh:</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSwitchDemoChild('magic-balita-andi-2026-tumbuhin-sehat')}
                    className={`px-3 py-1 rounded-full text-[10px] font-medium ${
                      effectiveToken.includes('andi') ? 'bg-[#070709] text-white' : 'bg-[#f5f5f5] text-[#60606c]'
                    }`}
                  >
                    Andi (Hijau)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchDemoChild('magic-balita-siti-2026-tumbuhin-pantau')}
                    className={`px-3 py-1 rounded-full text-[10px] font-medium ${
                      effectiveToken.includes('siti') ? 'bg-[#070709] text-white' : 'bg-[#f5f5f5] text-[#60606c]'
                    }`}
                  >
                    Siti (Kuning)
                  </button>
                </div>
              </div>
            </div>

            {/* Sticky Navigation Tabs (Pill Segmented Navigation Bar) */}
            <nav aria-label="Navigasi Menu Orang Tua" className="sticky top-14 z-30 py-2 backdrop-blur-md bg-transparent">
              <div
                className={`p-1.5 rounded-full border flex items-center justify-between gap-1 shadow-2xs transition-all ${
                  isHighContrast
                    ? 'bg-black text-white border-yellow-400'
                    : 'bg-white/95 border-black/8'
                }`}
              >
                {TABS.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      type="button"
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 py-2 sm:py-2.5 px-3 rounded-full font-medium text-xs sm:text-[13px] flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isActive
                          ? isHighContrast
                            ? 'bg-yellow-400 text-black shadow-xs font-semibold'
                            : 'bg-[#070709] text-white shadow-2xs font-semibold'
                          : isHighContrast
                          ? 'text-white hover:bg-white/10'
                          : 'text-[#60606c] hover:text-[#070709] hover:bg-[#f5f5f5]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#2597d0]' : 'text-current'}`} />
                      <span className="truncate">{tab.label}</span>
                    </button>
                  )
                })}
              </div>
            </nav>

            {/* Tab Views */}
            <div className="pt-2">
              {activeTab === 'ringkasan' && (
                <OrtuSummaryTab
                  data={childData}
                  isHighContrast={isHighContrast}
                  onSelectTab={(tabId) => setActiveTab(tabId)}
                />
              )}

              {activeTab === 'kurva' && (
                <KmsInteractiveChart
                  data={childData}
                  isHighContrast={isHighContrast}
                />
              )}

              {activeTab === 'resep' && (
                <MpasiRecipeCard
                  recipe={childData.mpasi_recipe}
                  isHighContrast={isHighContrast}
                  childName={childData.child_name}
                />
              )}

              {activeTab === 'pesan' && (
                <BidanNotesAndSchedule
                  bidanNote={childData.bidan_note}
                  nextPosyandu={childData.next_posyandu}
                  isHighContrast={isHighContrast}
                  childName={childData.child_name}
                />
              )}
            </div>
          </>
        )}
      </main>

      {/* Floating Accessibility Bar (Pill Bar Floating on Hairline Shadow) */}
      <FloatingAccessibilityBar
        isHighContrast={isHighContrast}
        onToggleHighContrast={() => setIsHighContrast(!isHighContrast)}
        fontSizeScale={fontSizeScale}
        onChangeFontSizeScale={(scale) => setFontSizeScale(scale)}
        speechText={getContextualSpeechText()}
        isOffline={isOffline}
      />
    </div>
  )
}
