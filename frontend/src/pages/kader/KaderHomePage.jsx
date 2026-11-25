import { useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Baby,
  Camera,
  ChefHat,
  RefreshCw,
  Scale,
  Send,
  ShieldCheck,
  Wifi,
} from 'lucide-react'
import BalitaListCard from '../../components/ui/BalitaListCard'
import {
  SmartCapsuleBarChart,
  SmartDotProgressCard,
  SmartHeatmapMatrixCard,
  SmartPeakMatrixAndAreaCard,
  SmartQuickActionsGrid,
  SmartSparkKpiCard,
  SmartStackedDistributionCard,
  SmartTrendAndComplianceCard,
} from '../../components/ui/SmartDashboardWidgets'

/**
 * KaderHomePage (/kader/dashboard)
 * Rebuilt in SmartHR executive dashboard style while keeping all real Kader Posyandu features and BalitaListCard.
 */
export default function KaderHomePage({ onMenuChange, stats }) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  )
  const [activeTimeTab, setActiveTimeTab] = useState('1M')

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const totalBalita = stats?.totalBalita || 2
  const sudahDitimbang = stats?.sudahDitimbang || 2
  const persentaseDitimbang = stats?.persentaseDitimbang || 100
  const risikoFalteringCount = stats?.growthFaltering ?? stats?.risikoFalteringCount ?? 1
  const pendingSync = stats?.pendingSync || 0
  const rawTrend = Array.isArray(stats?.trendPartisipasi) ? stats.trendPartisipasi : []

  // Convert backend trend_partisipasi into dynamic series for the area & trend charts
  const dynamicAreaSeries =
    rawTrend.length >= 4
      ? rawTrend.map((t, i) => ({
          label: t.bulan || t.month || t.label || `Bln ${i + 1}`,
          value: Number(t.persentase ?? t.percentage ?? t.value ?? persentaseDitimbang),
          unit: '%',
        }))
      : [
          { label: 'Jun', value: 78, unit: '%' },
          { label: 'Jul', value: 82, unit: '%' },
          { label: 'Agu', value: 86, unit: '%' },
          { label: 'Sep', value: 84, unit: '%' },
          { label: 'Okt', value: 92, unit: '%' },
          { label: 'Nov', value: persentaseDitimbang || 100, unit: '%' },
        ]

  const dynamicHeatmapSeed = Array.from({ length: 84 }).map((_, idx) => {
    if (idx % 7 === 0 && risikoFalteringCount > 0) return 3
    if (idx % 4 === 0) return Math.min(3, totalBalita)
    if (idx % 3 === 0) return 1
    return 0
  })

  const capsuleBars = [
    {
      id: 'balita',
      label: 'Meja 1 Daftar',
      valueLabel: `${totalBalita} Anak`,
      percent: 92,
      tone: 'teal',
    },
    {
      id: 'timbang',
      label: 'Meja 2 Timbang',
      valueLabel: `${sudahDitimbang} Ukur`,
      percent: Math.max(45, persentaseDitimbang),
      tone: 'teal',
    },
    {
      id: 'ocr-kms',
      label: 'Smart OCR KIA',
      valueLabel: '98% Akurat',
      percent: 72,
      tone: 'orange',
    },
    {
      id: 'nutri-chef',
      label: 'AI Nutri-Chef',
      valueLabel: '11 Pangan',
      percent: 64,
      tone: 'teal',
    },
    {
      id: 'sinkronisasi',
      label: 'Sync PWA',
      valueLabel: pendingSync === 0 ? '100% Sync' : `${pendingSync} Antre`,
      percent: 86,
      tone: 'teal',
    },
    {
      id: 'distribusi',
      label: 'WA Kartu Gizi',
      valueLabel: `${totalBalita} Ortu`,
      percent: 90,
      tone: 'teal',
    },
  ]

  const moduleSubCards = [
    {
      id: 'balita',
      title: 'Direktori Balita RW 04',
      metric: `Cakupan: ${totalBalita} Anak Terdaftar`,
      status: 'healthy',
      onClick: () => onMenuChange('balita'),
    },
    {
      id: 'timbang',
      title: 'Kalkulator Z-Score WHO',
      metric: `Partisipasi (D/S): ${persentaseDitimbang}%`,
      status: 'healthy',
      onClick: () => onMenuChange('timbang'),
    },
    {
      id: 'ocr-kms',
      title: 'Vision AI Scan Buku KIA',
      metric: 'Uptime: 99.8% Siap Pindai',
      status: 'healthy',
      onClick: () => onMenuChange('ocr-kms'),
    },
    {
      id: 'nutri-chef',
      title: 'Generator MPASI Pangan Lokal',
      metric: 'Tersinkron Harga Pasar Desa',
      status: 'healthy',
      onClick: () => onMenuChange('nutri-chef'),
    },
    {
      id: 'sinkronisasi',
      title: 'Antrean Offline IndexedDB',
      metric: pendingSync > 0 ? `${pendingSync} Menunggu Sinyal` : 'Uptime: 100% Tersinkron',
      status: pendingSync > 0 ? 'alert' : 'healthy',
      onClick: () => onMenuChange('sinkronisasi'),
    },
    {
      id: 'distribusi',
      title: 'Distribusi Magic Link WA',
      metric: `${totalBalita}/${totalBalita} Kartu Gizi Aktif`,
      status: 'healthy',
      onClick: () => onMenuChange('distribusi'),
    },
  ]

  const quickActions = [
    {
      id: 'qa-timbang',
      label: 'Input Timbang & Z-Score',
      icon: Scale,
      onClick: () => onMenuChange('timbang'),
    },
    {
      id: 'qa-ocr',
      label: 'Scan Foto Buku KIA',
      icon: Camera,
      onClick: () => onMenuChange('ocr-kms'),
    },
    {
      id: 'qa-mpasi',
      label: 'Buat Resep AI MPASI',
      icon: ChefHat,
      onClick: () => onMenuChange('nutri-chef'),
    },
    {
      id: 'qa-wa',
      label: 'Kirim WA Kartu Gizi',
      icon: Send,
      onClick: () => onMenuChange('distribusi'),
    },
    {
      id: 'qa-sync',
      label: 'Sinkronisasi Offline',
      icon: RefreshCw,
      onClick: () => onMenuChange('sinkronisasi'),
    },
    {
      id: 'qa-balita',
      label: 'Registrasi Balita Baru',
      icon: Baby,
      onClick: () => onMenuChange('balita'),
    },
  ]

  const posyanduSessionCells = [
    { label: '08:00 WIB (Meja 1)', valueText: '92%', subText: 'Registrasi', percent: 92 },
    { label: '09:00 WIB (Meja 2)', valueText: '96%', subText: 'Penimbangan', percent: 96 },
    { label: '10:00 WIB (Meja 3)', valueText: '88%', subText: 'Pencatatan KMS', percent: 88 },
    { label: '11:00 WIB (Meja 4)', valueText: '78%', subText: 'Penyuluhan MPASI', percent: 78 },
    { label: 'Wilayah RT 001', valueText: '100%', subText: 'Hadir Penuh', percent: 85 },
    { label: 'Wilayah RT 002', valueText: '90%', subText: 'Aktif', percent: 74 },
    { label: 'Wilayah RT 003', valueText: '85%', subText: 'Aktif', percent: 68 },
    { label: 'Wilayah RT 004', valueText: '94%', subText: 'Aktif', percent: 82 },
    { label: 'Distribusi Vit. A', valueText: '100%', subText: 'Tuntas', percent: 60 },
    { label: 'Kirim Magic Link WA', valueText: '95%', subText: 'Terkirim', percent: 84 },
  ]

  return (
    <div className="space-y-5">
      {/* Row 1: 4 SmartHR Sparkline KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SmartSparkKpiCard
          title="Partisipasi Timbang (D/S)"
          value={`${persentaseDitimbang}%`}
          subtitle={`${sudahDitimbang} dari ${totalBalita} Balita RW 04`}
          icon={Scale}
          visualType="area"
          accentColor="#f26522"
          onClick={() => onMenuChange('timbang')}
        />
        <SmartSparkKpiCard
          title="Status Jaringan & PWA"
          value={isOnline ? 'Healthy' : 'Offline Mode'}
          subtitle={
            pendingSync === 0
              ? 'Semua timbangan tersinkron Cloud'
              : `${pendingSync} data di IndexedDB`
          }
          icon={Wifi}
          visualType="equalizer"
          accentColor="#f26522"
          onClick={() => onMenuChange('sinkronisasi')}
        />
        <SmartSparkKpiCard
          title="Deteksi Growth Faltering"
          value={`${risikoFalteringCount}`}
          subtitle="Balita berisiko melambat tumbuh"
          icon={AlertTriangle}
          visualType="bars"
          accentColor="#f26522"
          onClick={() => onMenuChange('balita')}
        />
        <SmartSparkKpiCard
          title="Layanan AI & Kartu Gizi"
          value="Running"
          subtitle="OCR Buku KIA & Nutri-Chef Aktif"
          icon={ChefHat}
          visualType="pulse"
          accentColor="#0f4c5c"
          onClick={() => onMenuChange('nutri-chef')}
        />
      </div>

      {/* Row 2: 8-Col Capsule Bar Chart + 4-Col Dot Progress & Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-8">
          <SmartCapsuleBarChart
            title="Cakupan Operasional 5 Meja Posyandu & Modul AI Kader"
            icon={Scale}
            timeTabs={['1H', '1D', '1W', '1M']}
            activeTimeTab={activeTimeTab}
            onTimeTabChange={setActiveTimeTab}
            bars={capsuleBars}
            subCards={moduleSubCards}
            onBarClick={(bar) => onMenuChange(bar.id)}
          />
        </div>

        <div className="xl:col-span-4 flex flex-col gap-5">
          <SmartDotProgressCard
            title="Distribusi Kartu Gizi Digital Ortu"
            icon={ShieldCheck}
            subtitle={`${sudahDitimbang} dari ${totalBalita} wali balita menerima WA`}
            percentage={persentaseDitimbang || 100}
            totalDots={16}
          />
          <SmartQuickActionsGrid
            title="Quick Kader Actions"
            icon={ChefHat}
            actions={quickActions}
          />
        </div>
      </div>

      {/* Row 3: Middle Full-Width Peak Matrix & Smooth Area Chart */}
      <SmartPeakMatrixAndAreaCard
        title="Pemantauan Jam Buka Meja Posyandu & Kehadiran per RT"
        subtitle="Distribusi Beban Antrean Meja Layanan & Cakupan RT (Hari Buka Posyandu)"
        icon={Baby}
        periodLabel="Bulan Ini"
        cells={posyanduSessionCells}
        areaTitle="Analisis Tren Kenaikan Berat Badan (N/D) & Partisipasi Timbang Bulanan"
        areaSeries={dynamicAreaSeries}
        highlightCallout={{
          label: 'Capaian Ditimbang',
          value: `${sudahDitimbang}/${totalBalita} Balita (${persentaseDitimbang}%)`,
        }}
      />

      {/* Row 4: Bottom 2 Columns (5-Col Trend & Compliance + 7-Col Distribution & Heatmap) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-5">
          <SmartTrendAndComplianceCard
            title="Tren Partisipasi Posyandu Melati 04"
            icon={Activity}
            trendSeries={dynamicAreaSeries}
            complianceTitle="Validasi Antropometri & Privasi"
            complianceRows={[
              {
                id: 'k-comp-1',
                value: '±0.7',
                title: 'Koreksi Posisi Ukur Otomatis',
                subtitle: 'Recumbent vs Standing sesuai standar WHO',
                onClick: () => onMenuChange('timbang'),
              },
              {
                id: 'k-comp-2',
                value: `${risikoFalteringCount}`,
                title: 'Peringatan Dini Growth Faltering',
                subtitle: 'Deteksi perlambatan kenaikan BB (T)',
                onClick: () => onMenuChange('balita'),
              },
              {
                id: 'k-comp-3',
                value: `${pendingSync}`,
                title: 'Antrean Lokal IndexedDB',
                subtitle: 'Idempotent UUID siap Batch Sync',
                onClick: () => onMenuChange('sinkronisasi'),
              },
            ]}
          />
        </div>

        <div className="xl:col-span-7 flex flex-col gap-5">
          <SmartStackedDistributionCard
            title="Distribusi Status Pita KMS Balita Posyandu"
            icon={Baby}
            periodLabel="Bulan Ini"
            segments={[
              {
                label: 'Pita Hijau (Gizi Baik)',
                count: `${Math.max(1, totalBalita - risikoFalteringCount)}`,
                sublabel: 'Pertumbuhan Normal',
              },
              {
                label: 'Pita Kuning (Waspada)',
                count: `${risikoFalteringCount}`,
                sublabel: 'Pantauan MPASI/PMT',
              },
              {
                label: 'Resep AI Nutri-Chef',
                count: '11',
                sublabel: 'Pangan Lokal Desa',
              },
              {
                label: 'Kartu Gizi Terkirim',
                count: `${totalBalita}`,
                sublabel: 'Via WhatsApp Ortu',
              },
            ]}
          />

          <SmartHeatmapMatrixCard
            title="Matriks Kehadiran & Frekuensi Penimbangan Balita RT 01-04"
            icon={Scale}
            periodLabel="12 Bulan"
            matrixSeed={dynamicHeatmapSeed}
          />
        </div>
      </div>

      {/* Row 5: Interactive Balita Directory Card */}
      <div className="w-full">
        <BalitaListCard
          onSelectBalita={() => onMenuChange('balita')}
          onLihatSemua={() => onMenuChange('balita')}
        />
      </div>
    </div>
  )
}
