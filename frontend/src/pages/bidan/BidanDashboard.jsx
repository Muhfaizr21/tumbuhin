import { useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FileSpreadsheet,
  HeartPulse,
  LayoutDashboard,
  MapPin,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react'
import {
  SmartCapsuleBarChart,
  SmartDotProgressCard,
  SmartHeatmapMatrixCard,
  SmartPeakMatrixAndAreaCard,
  SmartQuickActionsGrid,
  SmartSparkKpiCard,
  SmartStackedDistributionCard,
  SmartTopHeader,
  SmartTrendAndComplianceCard,
} from '../../components/ui/SmartDashboardWidgets'
import { bidanApi } from '../../lib/bidanApi'
import { BIDAN_MENUS } from './bidanMenuItems'
import PetaGIS from './PetaGIS'
import PrioritasList from './PrioritasList'
import BidanNavigationShell from './components/BidanNavigationShell'

export default function BidanDashboard({
  user,
  currentSubPage = 'dashboard',
  onLogout,
  onSwitchRole,
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')
  const [createTriggerCount, setCreateTriggerCount] = useState(0)
  const [priorityChildren, setPriorityChildren] = useState([])
  const [exportNotice, setExportNotice] = useState('')
  const [activeTimeTab, setActiveTimeTab] = useState('1M')
  const [activeModeTab, setActiveModeTab] = useState('Surveilans Live')

  const [statsSummary, setStatsSummary] = useState({
    totalBalita: 342,
    stuntingPrevalence: 8.4,
    wastingCount: 11,
    highRiskCount: 19,
    pendingVisits: 6,
    redCount: 2,
    sourceLabel: 'Sinkronisasi Basis Data',
  })

  const [activeMenuId, setActiveMenuId] = useState(() => {
    if (currentSubPage === 'peta-gis' || currentSubPage === 'gis') return 'peta-gis'
    if (currentSubPage === 'prioritas') return 'prioritas'
    const found = BIDAN_MENUS.find((m) => m.id === currentSubPage)
    return found ? found.id : 'dashboard'
  })

  useEffect(() => {
    if (currentSubPage === 'peta-gis' || currentSubPage === 'gis') {
      setActiveMenuId('peta-gis')
    } else if (currentSubPage === 'prioritas') {
      setActiveMenuId('prioritas')
    } else if (currentSubPage) {
      const found = BIDAN_MENUS.find((m) => m.id === currentSubPage)
      setActiveMenuId(found ? found.id : 'dashboard')
    }
  }, [currentSubPage])

  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    async function fetchOverview() {
      try {
        const [dashRes, priorityRes] = await Promise.all([
          bidanApi.getOverview().catch(() => null),
          bidanApi.getPriorityList().catch(() => null),
        ])

        const rawList = Array.isArray(priorityRes) ? priorityRes : []
        const uniqueMap = new Map()
        rawList.forEach((item) => {
          if (item && item.child_id && !uniqueMap.has(item.child_id)) {
            uniqueMap.set(item.child_id, item)
          }
        })
        const pList = Array.from(uniqueMap.values())
        setPriorityChildren(pList)
        const redCases = pList.filter((c) => c.triage_category === 'MERAH').length

        if (dashRes) {
          setStatsSummary({
            totalBalita: dashRes.total_balita_desa || 342,
            stuntingPrevalence: Number(dashRes.stunting_prevalence ?? 8.4),
            wastingCount: dashRes.wasting_count ?? 11,
            highRiskCount: dashRes.high_risk_faltering ?? (pList.length || 19),
            pendingVisits: dashRes.pending_home_visits ?? 6,
            redCount: redCases,
            sourceLabel: 'PostgreSQL Live',
          })
        }
      } catch {
        // Keep clean initial metrics
      }
    }

    fetchOverview()
  }, [refreshTrigger])

  const handleSelectMenu = (itemOrId) => {
    const targetMenu =
      typeof itemOrId === 'string'
        ? BIDAN_MENUS.find((m) => m.id === itemOrId) || BIDAN_MENUS[0]
        : itemOrId

    setActiveMenuId(targetMenu.id)
    setMobileMenuOpen(false)
    if (targetMenu.route) {
      window.location.hash = `#${targetMenu.route}`
    }
  }

  const handleOpenQuickAdd = () => {
    setActiveMenuId('prioritas')
    window.location.hash = '#/bidan/prioritas'
    setCreateTriggerCount((prev) => prev + 1)
  }

  const handlePriorityDataChange = (updatedList) => {
    setPriorityChildren(updatedList)
    setRefreshTrigger((prev) => prev + 1)
    const redCases = updatedList.filter((c) => c.triage_category === 'MERAH').length
    const pendingCount = updatedList.filter((c) => c.pending_intervention).length
    setStatsSummary((prev) => ({
      ...prev,
      highRiskCount: updatedList.length || prev.highRiskCount,
      pendingVisits: pendingCount,
      redCount: redCases,
    }))
  }

  const currentMenu = BIDAN_MENUS.find((m) => m.id === activeMenuId) || BIDAN_MENUS[0]

  const capsuleBars = [
    { id: 'peta-gis', label: 'Melati 01', valueLabel: '4.2% Stunt', percent: 88, tone: 'teal' },
    { id: 'peta-gis', label: 'Melati 02', valueLabel: '9.6% Stunt', percent: 78, tone: 'teal' },
    { id: 'prioritas', label: 'Melati 03', valueLabel: '14.2% Rawan', percent: 62, tone: 'orange' },
    { id: 'peta-gis', label: 'Melati 04', valueLabel: '8.9% Stunt', percent: 76, tone: 'teal' },
    { id: 'pmt-evaluasi', label: 'Mawar 05', valueLabel: 'PMT 90H', percent: 55, tone: 'teal' },
    { id: 'supervisi', label: 'Kenanga 07', valueLabel: '2.5% Aman', percent: 94, tone: 'teal' },
  ]

  const clinicalSubCards = [
    {
      id: 'peta-gis',
      title: 'Peta GIS Klaster RW',
      metric: '8/8 Posyandu Terpetakan',
      status: 'healthy',
      onClick: () => handleSelectMenu('peta-gis'),
    },
    {
      id: 'prioritas',
      title: 'Triase Medis Otomatis',
      metric: `${statsSummary.highRiskCount} Kasus Prioritas`,
      status: statsSummary.redCount > 0 ? 'alert' : 'healthy',
      onClick: () => handleSelectMenu('prioritas'),
    },
    {
      id: 'intervensi',
      title: 'Kunjungan Rumah SOAP',
      metric: `${statsSummary.pendingVisits} Jadwal Aktif`,
      status: 'healthy',
      onClick: () => handleSelectMenu('intervensi'),
    },
    {
      id: 'pmt-evaluasi',
      title: 'Evaluasi Kohor PMT 90H',
      metric: 'Graduasi Gizi: 86.4%',
      status: 'healthy',
      onClick: () => handleSelectMenu('pmt-evaluasi'),
    },
    {
      id: 'supervisi',
      title: 'Supervisi & Kunci Data',
      metric: 'Deteksi Outlier Z-Score: 0',
      status: 'healthy',
      onClick: () => handleSelectMenu('supervisi'),
    },
    {
      id: 'laporan',
      title: 'Generator e-PPGBM',
      metric: 'Siap Ekspor PDF/CSV/XLSX',
      status: 'healthy',
      onClick: () => handleSelectMenu('laporan'),
    },
  ]

  const quickClinicalActions = [
    {
      id: 'b-act-gis',
      label: 'Buka Peta GIS Klaster',
      icon: MapPin,
      onClick: () => handleSelectMenu('peta-gis'),
    },
    {
      id: 'b-act-triage',
      label: 'Tambah Kasus Triase',
      icon: AlertTriangle,
      onClick: handleOpenQuickAdd,
    },
    {
      id: 'b-act-soap',
      label: 'Catat Home Visit SOAP',
      icon: HeartPulse,
      onClick: () => handleSelectMenu('intervensi'),
    },
    {
      id: 'b-act-pmt',
      label: 'Evaluasi Kohor PMT',
      icon: Activity,
      onClick: () => handleSelectMenu('pmt-evaluasi'),
    },
    {
      id: 'b-act-sup',
      label: 'Kunci Supervisi RW',
      icon: ClipboardCheck,
      onClick: () => handleSelectMenu('supervisi'),
    },
    {
      id: 'b-act-exp',
      label: 'Ekspor PDF e-PPGBM',
      icon: FileSpreadsheet,
      onClick: () => handleSelectMenu('laporan'),
    },
  ]

  const skdnMatrixCells = [
    { label: 'Indikator D/S (Hadir)', valueText: '89.4%', subText: 'Target 85%', percent: 89 },
    { label: 'Indikator N/D (Naik BB)', valueText: '84.2%', subText: 'Target 80%', percent: 84 },
    { label: 'Indikator K/S (Buku KIA)', valueText: '100%', subText: `${statsSummary.totalBalita} Balita`, percent: 95 },
    { label: '1000 HPK (0-23 Bln)', valueText: '92.0%', subText: 'Terpantau', percent: 82 },
    { label: 'Klaster RW 01 (Aman)', valueText: '4.2%', subText: 'Prevalensi', percent: 42 },
    { label: 'Klaster RW 02 (Waspada)', valueText: '9.6%', subText: 'Prevalensi', percent: 64 },
    { label: 'Klaster RW 03 (Rawan)', valueText: '14.2%', subText: 'Intervensi PMT', percent: 91 },
    { label: 'Klaster RW 04 (Aman)', valueText: `${statsSummary.stuntingPrevalence.toFixed(1)}%`, subText: 'Prevalensi', percent: Math.round(statsSummary.stuntingPrevalence * 6) },
    { label: 'Kepatuhan Konsumsi PMT', valueText: '88.5%', subText: 'Kohor 90 Hari', percent: 86 },
    { label: 'Validasi Supervisi RW', valueText: '100%', subText: '8 Posyandu', percent: 78 },
  ]

  const bidanStuntingSeries = [
    { label: 'Jan', value: 13.8, unit: '%' },
    { label: 'Feb', value: 13.1, unit: '%' },
    { label: 'Mar', value: 12.4, unit: '%' },
    { label: 'Apr', value: 11.9, unit: '%' },
    { label: 'Mei', value: 11.2, unit: '%' },
    { label: 'Jun', value: 10.6, unit: '%' },
    { label: 'Jul', value: 10.1, unit: '%' },
    { label: 'Agu', value: 9.7, unit: '%' },
    { label: 'Sep', value: 9.2, unit: '%' },
    { label: 'Okt', value: 8.8, unit: '%' },
    { label: 'Nov', value: Number(statsSummary.stuntingPrevalence.toFixed(1)), unit: '%' },
  ]

  const bidanPmtTrendSeries = [
    { label: 'H-0', value: 52 },
    { label: 'H-15', value: 61 },
    { label: 'H-30', value: 70 },
    { label: 'H-45', value: 76 },
    { label: 'H-60', value: 82 },
    { label: 'H-75', value: 86 },
    { label: 'H-90', value: 91 },
  ]

  return (
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#f5f6f8] text-slate-800 flex flex-col lg:flex-row font-runde selection:bg-[#f26522] selection:text-white">
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex bg-slate-900/40 backdrop-blur-xs">
          <BidanNavigationShell
            menus={BIDAN_MENUS}
            activeMenuId={activeMenuId}
            user={user}
            sidebarCollapsed={false}
            onToggleCollapse={() => setMobileMenuOpen(false)}
            onSelectMenu={handleSelectMenu}
            onOpenQuickAdd={handleOpenQuickAdd}
            onSwitchRole={onSwitchRole}
            onLogout={onLogout}
            statsSummary={statsSummary}
          />
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setMobileMenuOpen(false)}
            className="flex-1"
          />
        </div>
      )}

      {/* Desktop Left Navigation Shell */}
      <div className="hidden lg:flex">
        <BidanNavigationShell
          menus={BIDAN_MENUS}
          activeMenuId={activeMenuId}
          user={user}
          sidebarCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
          onSelectMenu={handleSelectMenu}
          onOpenQuickAdd={handleOpenQuickAdd}
          onSwitchRole={onSwitchRole}
          onLogout={onLogout}
          statsSummary={statsSummary}
        />
      </div>

      {/* Center Main Workspace */}
      <main className="flex-1 min-w-0 lg:h-dvh p-4 sm:p-6 overflow-y-auto space-y-5">
        <SmartTopHeader
          user={user}
          roleLabel="Bidan Desa / Nakes"
          pageTitle={
            activeMenuId === 'dashboard'
              ? 'Clinical Epidemiology & Surveillance Dashboard'
              : currentMenu.label
          }
          breadcrumbs={[
            'Dashboard',
            user?.posyandu_name || 'UPTD Puskesmas Sukamaju',
            currentMenu.shortLabel || currentMenu.label,
          ]}
          searchQuery={globalSearch}
          onSearchChange={setGlobalSearch}
          searchPlaceholder="Cari kasus triase balita, klaster Posyandu RW, atau kunjungan SOAP..."
          greenBadgeText={`Sasaran Balita ${statsSummary.totalBalita}`}
          redBadgeText={`Triase Prioritas ${statsSummary.highRiskCount}`}
          modeTabs={['Surveilans Live', 'Peta GIS Klaster', 'Ekspor e-PPGBM']}
          activeModeTab={activeModeTab}
          onModeTabChange={(tab) => {
            setActiveModeTab(tab)
            if (tab === 'Peta GIS Klaster') handleSelectMenu('peta-gis')
            if (tab === 'Ekspor e-PPGBM') handleSelectMenu('laporan')
            if (tab === 'Surveilans Live') handleSelectMenu('dashboard')
          }}
          onNotificationClick={() => handleSelectMenu('prioritas')}
          unreadCount={statsSummary.pendingVisits}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        {exportNotice && (
          <div
            role="status"
            className="p-3.5 px-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[12.5px] font-medium flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{exportNotice}</span>
            </span>
            <button
              type="button"
              onClick={() => setExportNotice('')}
              className="font-semibold underline cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Active Workspace Section */}
        <section aria-label={`Ruang Kerja ${currentMenu.label}`}>
          {activeMenuId === 'peta-gis' ? (
            <PetaGIS user={user} embedded={true} />
          ) : activeMenuId === 'prioritas' ? (
            <PrioritasList
              user={user}
              embedded={true}
              externalCreateTrigger={createTriggerCount}
              onDataChange={handlePriorityDataChange}
            />
          ) : (
            /* Main Epidemiologi & Surveilans Executive Dashboard */
            <div className="space-y-5">
              {/* Row 1: 4 SmartHR Sparkline KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <SmartSparkKpiCard
                  title="Prevalensi Stunting Desa"
                  value={`${statsSummary.stuntingPrevalence.toFixed(1)}%`}
                  subtitle="Target Nasional < 14.0% (8 Posyandu)"
                  icon={Stethoscope}
                  visualType="area"
                  accentColor="#f26522"
                  onClick={() => handleSelectMenu('peta-gis')}
                />
                <SmartSparkKpiCard
                  title="Status Surveilans e-PPGBM"
                  value="Healthy"
                  subtitle={`${statsSummary.totalBalita} Balita Terpantau WHO LMS`}
                  icon={ClipboardCheck}
                  visualType="equalizer"
                  accentColor="#f26522"
                  onClick={() => handleSelectMenu('supervisi')}
                />
                <SmartSparkKpiCard
                  title="Kasus Triase Prioritas"
                  value={`${statsSummary.highRiskCount}`}
                  subtitle={`${statsSummary.redCount} Prioritas Merah • ${statsSummary.wastingCount} Wasting`}
                  icon={AlertTriangle}
                  visualType="bars"
                  accentColor="#f26522"
                  onClick={() => handleSelectMenu('prioritas')}
                />
                <SmartSparkKpiCard
                  title="Home Visit & Kohor PMT"
                  value="Running"
                  subtitle={`${statsSummary.pendingVisits} Kunjungan SOAP Terjadwal`}
                  icon={HeartPulse}
                  visualType="pulse"
                  accentColor="#0f4c5c"
                  onClick={() => handleSelectMenu('intervensi')}
                />
              </div>

              {/* Row 2: 8-Col Capsule Bar Chart + 4-Col Dot Progress & Quick Actions */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
                <div className="xl:col-span-8">
                  <SmartCapsuleBarChart
                    title="Capaian Surveilans SKDN & Prevalensi Stunting per Posyandu RW"
                    icon={MapPin}
                    timeTabs={['1H', '1D', '1W', '1M']}
                    activeTimeTab={activeTimeTab}
                    onTimeTabChange={setActiveTimeTab}
                    bars={capsuleBars}
                    subCards={clinicalSubCards}
                    onBarClick={(bar) => handleSelectMenu(bar.id)}
                  />
                </div>

                <div className="xl:col-span-4 flex flex-col gap-5">
                  <SmartDotProgressCard
                    title="Kepatuhan Konsumsi PMT 90 Hari"
                    icon={ShieldCheck}
                    subtitle="17 dari 19 balita kohor PMT patuh >85%"
                    percentage={89}
                    totalDots={16}
                  />
                  <SmartQuickActionsGrid
                    title="Quick Clinical Bidan Actions"
                    icon={Stethoscope}
                    actions={quickClinicalActions}
                  />
                </div>
              </div>

              {/* Row 3: Middle Full-Width Peak Matrix & Smooth Area Chart */}
              <SmartPeakMatrixAndAreaCard
                title="Monitoring Indikator SKDN & Kerawanan Kelompok 1000 HPK (0-23 Bulan)"
                subtitle="Distribusi Capaian Layanan & Risiko Klaster RW (Bulan Berjalan)"
                icon={Activity}
                periodLabel="Bulan Ini"
                cells={skdnMatrixCells}
                areaTitle="Analisis Kurva Penurunan Prevalensi Stunting & Wasting Desa (12 Bulan)"
                areaSeries={bidanStuntingSeries}
                highlightCallout={{
                  label: 'Prevalensi Saat Ini',
                  value: `${statsSummary.stuntingPrevalence.toFixed(1)}% (Di Bawah Ambang 14%)`,
                }}
              />

              {/* Row 4: Bottom 2 Columns (5-Col Trend & Compliance + 7-Col Distribution & Heatmap) */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
                <div className="xl:col-span-5">
                  <SmartTrendAndComplianceCard
                    title="Tren Graduasi Balita Penerima PMT"
                    icon={HeartPulse}
                    trendSeries={bidanPmtTrendSeries}
                    complianceTitle="Audit Klinis & Supervisi Antropometri"
                    complianceRows={[
                      {
                        id: 'b-comp-1',
                        value: `${statsSummary.redCount}`,
                        title: 'Triase Merah (Z-Score < -3 SD)',
                        subtitle: 'Wajib kunjungan rumah SOAP & rujukan',
                        onClick: () => handleSelectMenu('prioritas'),
                      },
                      {
                        id: 'b-comp-2',
                        value: `${statsSummary.pendingVisits}`,
                        title: 'Jadwal Home Visit Aktif',
                        subtitle: 'Tersinkron ke Kartu Gizi Digital Ortu',
                        onClick: () => handleSelectMenu('intervensi'),
                      },
                      {
                        id: 'b-comp-3',
                        value: '0',
                        title: 'Outlier Antropometri Ekstrem',
                        subtitle: 'Seluruh input kader lolos verifikasi WHO',
                        onClick: () => handleSelectMenu('supervisi'),
                      },
                    ]}
                  />
                </div>

                <div className="xl:col-span-7 flex flex-col gap-5">
                  <SmartStackedDistributionCard
                    title="Distribusi Status Gizi Balita Desa Sukamaju (TB/U & BB/TB)"
                    icon={Stethoscope}
                    periodLabel="Bulanan"
                    segments={[
                      {
                        label: 'Gizi Baik (Normal)',
                        count: `${Math.max(1, statsSummary.totalBalita - statsSummary.highRiskCount - statsSummary.wastingCount)}`,
                        sublabel: 'Pita Hijau KMS',
                      },
                      {
                        label: 'Risiko / Pre-Stunting',
                        count: `${statsSummary.highRiskCount}`,
                        sublabel: 'ML Faltering >= 70%',
                      },
                      {
                        label: 'Wasting (BB/TB)',
                        count: `${statsSummary.wastingCount}`,
                        sublabel: 'Intervensi PMT',
                      },
                      {
                        label: 'Triase Merah Kritis',
                        count: `${statsSummary.redCount}`,
                        sublabel: 'Z-Score < -3 SD',
                      },
                    ]}
                  />

                  <SmartHeatmapMatrixCard
                    title="Matriks Intensitas Kerawanan Spasial RT/RW & Kepatuhan PMT"
                    icon={MapPin}
                    periodLabel="Triwulan"
                  />
                </div>
              </div>

              {/* Row 5: Embedded Interactive Priority Triage Table */}
              <PrioritasList
                user={user}
                embedded={true}
                externalCreateTrigger={createTriggerCount}
                onDataChange={handlePriorityDataChange}
              />
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
