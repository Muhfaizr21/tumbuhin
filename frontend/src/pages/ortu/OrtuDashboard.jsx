import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Baby,
  CalendarCheck,
  ChefHat,
  Eye,
  LineChart,
  RefreshCw,
  Scale,
  ShieldCheck,
  Volume2,
} from 'lucide-react'
import BidanNotesAndSchedule from '../../components/ortu/BidanNotesAndSchedule'
import FloatingAccessibilityBar from '../../components/ortu/FloatingAccessibilityBar'
import KmsInteractiveChart from '../../components/ortu/KmsInteractiveChart'
import MpasiRecipeCard from '../../components/ortu/MpasiRecipeCard'
import OrtuSummaryTab from '../../components/ortu/OrtuSummaryTab'
import {
  SmartDotProgressCard,
  SmartQuickActionsGrid,
  SmartSidebarShell,
  SmartSparkKpiCard,
  SmartTopHeader,
} from '../../components/ui/SmartDashboardWidgets'
import { getChildPortalByToken } from '../../services/ortuService'

const ORTU_MENUS = [
  {
    id: 'ringkasan',
    label: 'Ringkasan Tumbuh Kembang',
    shortLabel: 'Ringkasan Anak',
    icon: Baby,
    badge: 'KMS',
  },
  {
    id: 'kurva',
    label: 'Kurva Pertumbuhan KMS',
    shortLabel: 'Kurva KMS Digital',
    icon: LineChart,
    badge: 'WHO',
  },
  {
    id: 'resep',
    label: 'Resep MPASI Pangan Lokal',
    shortLabel: 'Resep AI MPASI',
    icon: ChefHat,
    badge: 'AI',
  },
  {
    id: 'pesan',
    label: 'Catatan Bidan & Jadwal',
    shortLabel: 'Pesan & Jadwal',
    icon: CalendarCheck,
  },
]

export default function OrtuDashboard({
  user,
  magicToken,
  tts,
  onLogout,
  onSwitchRole,
}) {
  const [activeTab, setActiveTab] = useState('ringkasan')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [childData, setChildData] = useState(null)
  const [isOffline, setIsOffline] = useState(false)

  // Accessibility State
  const [isHighContrast, setIsHighContrast] = useState(false)
  const [fontSizeScale, setFontSizeScale] = useState(100)

  const effectiveToken = magicToken || 'magic-balita-andi-2026-tumbuhin-sehat'

  const loadData = async (token) => {
    setLoading(true)
    setError(null)
    try {
      const res = await getChildPortalByToken(token)
      setChildData(res.data)
      setIsOffline(res.isOffline || false)
    } catch (err) {
      setError(err.message === 'NOT_FOUND' ? 'TOKEN_NOT_FOUND' : 'NETWORK_ERROR')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(effectiveToken)
  }, [effectiveToken])

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

  const handleSpeakNow = () => {
    const text = getContextualSpeechText()
    if (tts?.speak) {
      tts.speak(text)
      return
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utter = new SpeechSynthesisUtterance(text)
      utter.lang = 'id-ID'
      window.speechSynthesis.speak(utter)
    }
  }

  const handleSearchChange = (q) => {
    setSearchQuery(q)
    const lower = (q || '').toLowerCase()
    if (!lower) return
    if (lower.includes('kurva') || lower.includes('kms') || lower.includes('grafik') || lower.includes('berat') || lower.includes('tinggi')) {
      setActiveTab('kurva')
    } else if (lower.includes('resep') || lower.includes('mpasi') || lower.includes('makan') || lower.includes('protein')) {
      setActiveTab('resep')
    } else if (lower.includes('bidan') || lower.includes('jadwal') || lower.includes('pesan') || lower.includes('posyandu')) {
      setActiveTab('pesan')
    } else if (lower.includes('ringkasan') || lower.includes('status')) {
      setActiveTab('ringkasan')
    }
  }

  const handleSwitchDemoChild = (targetToken) => {
    window.location.hash = `#/p/${targetToken}`
  }

  const currentMenu = ORTU_MENUS.find((m) => m.id === activeTab) || ORTU_MENUS[0]
  const activeChildMode = effectiveToken.includes('siti')
    ? 'Siti (Pita Kuning)'
    : 'Andi (Pita Hijau)'

  const quickOrtuActions = [
    {
      id: 'o-act-1',
      label: 'Ringkasan Gizi Anak',
      icon: Baby,
      onClick: () => setActiveTab('ringkasan'),
    },
    {
      id: 'o-act-2',
      label: 'Kurva KMS Digital',
      icon: LineChart,
      onClick: () => setActiveTab('kurva'),
    },
    {
      id: 'o-act-3',
      label: 'Resep MPASI Lokal',
      icon: ChefHat,
      onClick: () => setActiveTab('resep'),
    },
    {
      id: 'o-act-4',
      label: 'Pesan Bidan & Jadwal',
      icon: CalendarCheck,
      onClick: () => setActiveTab('pesan'),
    },
    {
      id: 'o-act-5',
      label: 'Bacakan Suara (TTS)',
      icon: Volume2,
      onClick: handleSpeakNow,
    },
    {
      id: 'o-act-6',
      label: isHighContrast ? 'Mode Warna Normal' : 'Mode Kontras Tinggi',
      icon: Eye,
      onClick: () => setIsHighContrast((v) => !v),
    },
  ]

  return (
    <div
      style={{ fontSize: `${fontSizeScale}%` }}
      className={`min-h-dvh lg:h-dvh lg:overflow-hidden flex flex-col lg:flex-row font-sans transition-colors duration-200 pb-20 lg:pb-0 ${
        isHighContrast
          ? 'bg-black text-white selection:bg-yellow-400 selection:text-black'
          : 'bg-[#f5f6f8] text-slate-800 selection:bg-[#f26522] selection:text-white'
      }`}
    >
      {/* Mobile Sidebar Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex bg-slate-900/40 backdrop-blur-xs">
          <SmartSidebarShell
            brandSubtitle="KARTU GIZI DIGITAL ORTU"
            roleKey="ortu"
            roleTitle="Orang Tua Balita"
            menus={ORTU_MENUS}
            activeMenuId={activeTab}
            user={
              user || {
                full_name: childData?.parent_name || 'Ibu Dewi Lestari',
                posyandu_name: childData?.posyandu_name || 'Posyandu Melati 04',
              }
            }
            sidebarCollapsed={false}
            onToggleCollapse={() => setMobileMenuOpen(false)}
            onSelectMenu={(item) => {
              setActiveTab(item.id)
              setMobileMenuOpen(false)
            }}
            onOpenQuickAdd={handleSpeakNow}
            quickAddLabel="Bacakan Kartu Gizi (TTS)"
            onSwitchRole={onSwitchRole}
            onLogout={onLogout}
          />
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setMobileMenuOpen(false)}
            className="flex-1"
          />
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <SmartSidebarShell
          brandSubtitle="KARTU GIZI DIGITAL ORTU"
          roleKey="ortu"
          roleTitle="Orang Tua Balita"
          menus={ORTU_MENUS}
          activeMenuId={activeTab}
          user={
            user || {
              full_name: childData?.parent_name || 'Ibu Dewi Lestari',
              posyandu_name: childData?.posyandu_name || 'Posyandu Melati 04',
            }
          }
          sidebarCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          onSelectMenu={(item) => setActiveTab(item.id)}
          onOpenQuickAdd={handleSpeakNow}
          quickAddLabel="Bacakan Kartu Gizi (TTS)"
          onSwitchRole={onSwitchRole}
          onLogout={onLogout}
        />
      </div>

      {/* Main Content Workspace */}
      <main className="flex-1 min-w-0 lg:h-dvh p-4 sm:p-6 overflow-y-auto space-y-5">
        <SmartTopHeader
          user={
            user || {
              full_name: childData?.parent_name || 'Ibu Dewi Lestari',
              posyandu_name: childData?.posyandu_name || 'Posyandu Melati 04',
            }
          }
          roleLabel="Orang Tua / Wali Balita"
          pageTitle={
            childData
              ? `Kartu Gizi Digital — Ananda ${childData.child_name}`
              : 'Portal Kartu Gizi Digital Balita'
          }
          breadcrumbs={[
            'Dashboard',
            childData?.posyandu_name || 'Posyandu Melati 04',
            currentMenu.shortLabel || currentMenu.label,
          ]}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Cari panduan gizi, bahan MPASI, atau jadwal Posyandu..."
          greenBadgeText={
            childData
              ? `Usia ${childData.age_months} Bln • ${childData.last_weight_kg} kg`
              : 'Kartu Gizi Aktif'
          }
          redBadgeText={
            childData
              ? `Pita ${(childData.color_pita || 'Hijau').toUpperCase()} KMS`
              : 'Pita Hijau KMS'
          }
          modeTabs={['Andi (Pita Hijau)', 'Siti (Pita Kuning)']}
          activeModeTab={activeChildMode}
          onModeTabChange={(mode) => {
            if (mode.includes('Siti')) {
              handleSwitchDemoChild('magic-balita-siti-2026-tumbuhin-pantau')
            } else {
              handleSwitchDemoChild('magic-balita-andi-2026-tumbuhin-sehat')
            }
          }}
          onNotificationClick={() => setActiveTab('pesan')}
          unreadCount={1}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* Loading State */}
        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-28 rounded-2xl bg-white border border-slate-200/70" />
              ))}
            </div>
            <div className="h-64 rounded-2xl bg-white border border-slate-200/70" />
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-4 shadow-2xs">
            <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-800">
                {error === 'TOKEN_NOT_FOUND'
                  ? 'Tautan Magic Link Tidak Ditemukan'
                  : 'Gangguan Koneksi Jaringan'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                Pastikan tautan yang Anda buka sesuai dengan pesan WhatsApp dari Kader Posyandu desa Anda.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => loadData(effectiveToken)}
                className="px-5 py-2.5 rounded-xl bg-[#f26522] hover:bg-[#d94e0f] text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Muat Ulang Halaman
              </button>
              <button
                type="button"
                onClick={() => handleSwitchDemoChild('magic-balita-andi-2026-tumbuhin-sehat')}
                className="px-5 py-2.5 rounded-xl bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 text-xs font-bold cursor-pointer"
              >
                Buka Contoh Balita Andi
              </button>
            </div>
          </div>
        )}

        {/* Active Child Portal Content */}
        {!loading && !error && childData && (
          <div className="space-y-5">
            {/* Row 1: 4 SmartHR Sparkline KPI Cards for the Child */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <SmartSparkKpiCard
                title="Berat Badan Terakhir"
                value={`${childData.last_weight_kg} kg`}
                subtitle={`Selisih ${childData.delta_weight_grams >= 0 ? '+' : ''}${childData.delta_weight_grams}g dari bulan lalu`}
                icon={Scale}
                visualType="area"
                accentColor="#f26522"
                onClick={() => setActiveTab('kurva')}
              />
              <SmartSparkKpiCard
                title="Tinggi / Panjang Badan"
                value={`${childData.last_height_cm} cm`}
                subtitle={`Target BB bulan depan: ${childData.next_month_target_kg} kg`}
                icon={LineChart}
                visualType="equalizer"
                accentColor="#f26522"
                onClick={() => setActiveTab('kurva')}
              />
              <SmartSparkKpiCard
                title="Status Pita KMS WHO"
                value={`Pita ${(childData.color_pita || 'Hijau').toUpperCase()}`}
                subtitle={childData.friendly_status_title || 'Pertumbuhan Sesuai Usia'}
                icon={Baby}
                visualType="bars"
                accentColor="#0f4c5c"
                onClick={() => setActiveTab('ringkasan')}
              />
              <SmartSparkKpiCard
                title="Rekomendasi MPASI Lokal"
                value={`Rp ${Number(childData.mpasi_recipe?.daily_budget_idr || 12000).toLocaleString('id-ID')}`}
                subtitle={childData.mpasi_recipe?.title || 'Menu Pangan Lokal Desa'}
                icon={ChefHat}
                visualType="pulse"
                accentColor="#f26522"
                onClick={() => setActiveTab('resep')}
              />
            </div>

            {/* Row 2: Identity Banner + Quick Navigation Tabs + Right Dot Progress & Quick Actions */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
              {/* Left 8 Cols: Child Profile Header + Active Tab Content */}
              <div className="xl:col-span-8 space-y-5">
                {/* Child Profile Card */}
                <div
                  className={`p-5 rounded-2xl border transition-all ${
                    isHighContrast
                      ? 'bg-black text-white border-yellow-400'
                      : 'bg-white text-slate-800 border-slate-200/80 shadow-2xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#f26522] border border-orange-200 flex items-center justify-center font-extrabold text-base shrink-0">
                        {(childData.child_name || 'AN').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-[18px] font-extrabold text-[#1b2537]">
                            {childData.child_name}
                          </h2>
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600">
                            {childData.gender === 'L' ? 'Laki-Laki' : 'Perempuan'} •{' '}
                            {childData.age_months} Bulan
                          </span>
                        </div>
                        <p className="text-[12px] text-slate-500 mt-0.5">
                          Wali: <strong className="text-slate-800">{childData.parent_name}</strong> •{' '}
                          {childData.posyandu_name} ({childData.village_name}) • NIK:{' '}
                          <span className="font-mono">{childData.masked_nik}</span>
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs ${
                        childData.color_pita === 'hijau'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : childData.color_pita === 'kuning'
                            ? 'bg-amber-50 text-amber-900 border border-amber-200'
                            : 'bg-rose-50 text-rose-900 border border-rose-200'
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

                  {/* 4 Pill Tabs Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-100">
                    {ORTU_MENUS.map((tab) => {
                      const Icon = tab.icon
                      const isActive = activeTab === tab.id
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id)}
                          className={`py-2 px-3 rounded-xl font-bold text-[12px] flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            isActive
                              ? 'bg-[#f26522] text-white shadow-2xs'
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{tab.shortLabel}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Active Tab Body */}
                <div>
                  {activeTab === 'ringkasan' && (
                    <OrtuSummaryTab
                      data={childData}
                      isHighContrast={isHighContrast}
                      onSelectTab={(tabId) => setActiveTab(tabId)}
                    />
                  )}
                  {activeTab === 'kurva' && (
                    <KmsInteractiveChart data={childData} isHighContrast={isHighContrast} />
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
              </div>

              {/* Right 4 Cols: Compliance Dot Progress + Quick Actions + Next Posyandu Summary */}
              <div className="xl:col-span-4 space-y-5">
                <SmartDotProgressCard
                  title="Kepatuhan Timbang & Imunisasi"
                  icon={ShieldCheck}
                  subtitle={`Kehadiran rutin Ananda ${childData.child_name} di Posyandu`}
                  percentage={childData.color_pita === 'hijau' ? 94 : 82}
                  totalDots={16}
                />

                <SmartQuickActionsGrid
                  title="Aksi Cepat Kartu Gizi Ortu"
                  icon={Baby}
                  actions={quickOrtuActions}
                />

                {/* Next Posyandu Schedule Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[14.5px] font-extrabold text-[#1b2537] flex items-center gap-2">
                      <CalendarCheck className="w-4 h-4 text-[#f26522]" />
                      <span>Jadwal Posyandu Berikutnya</span>
                    </h3>
                    <span className="px-2 py-0.5 rounded-md bg-orange-50 text-[#f26522] text-[10.5px] font-bold">
                      Wajib Hadir
                    </span>
                  </div>
                  <p className="text-[13px] font-bold text-slate-800">
                    {childData.next_posyandu?.activity_date || 'Sabtu Minggu Ke-2 Bulan Depan'}
                  </p>
                  <p className="text-[12px] text-slate-500">
                    Lokasi: {childData.next_posyandu?.location || childData.posyandu_name}
                  </p>
                  <p className="text-[11.5px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {childData.bidan_note?.clinical_note ||
                      'Pastikan Ananda membawa Buku KIA dan hadir tepat waktu untuk penimbangan rutin.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Accessibility Bar */}
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
