import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  AlertTriangle,
  Flame,
  Layers,
  MapPin,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { fetchRoleDashboardData } from '../../lib/authApi'

// Fallback cluster data if backend offline
const FALLBACK_CLUSTERS = [
  {
    posyandu_id: 'pos-01',
    posyandu_name: 'Posyandu Melati 01',
    village_name: 'Desa Sukamaju',
    rw_code: 'RW 01',
    rt_code: 'RT 01-03',
    latitude: -6.5912,
    longitude: 106.7998,
    total_balita: 48,
    stunting_count: 2,
    wasting_count: 1,
    high_risk_count: 3,
    stunting_prevalence: 4.2,
    risk_level: 'LOW',
  },
  {
    posyandu_id: 'pos-02',
    posyandu_name: 'Posyandu Melati 02',
    village_name: 'Desa Sukamaju',
    rw_code: 'RW 02',
    rt_code: 'RT 01-04',
    latitude: -6.5935,
    longitude: 106.8042,
    total_balita: 52,
    stunting_count: 5,
    wasting_count: 2,
    high_risk_count: 4,
    stunting_prevalence: 9.6,
    risk_level: 'MEDIUM',
  },
  {
    posyandu_id: 'pos-03',
    posyandu_name: 'Posyandu Melati 03',
    village_name: 'Desa Sukamaju',
    rw_code: 'RW 03',
    rt_code: 'RT 01-03',
    latitude: -6.5968,
    longitude: 106.8089,
    total_balita: 40,
    stunting_count: 8,
    wasting_count: 3,
    high_risk_count: 6,
    stunting_prevalence: 20.0,
    risk_level: 'HIGH',
  },
  {
    posyandu_id: 'pos-04',
    posyandu_name: 'Posyandu Melati 04',
    village_name: 'Desa Sukamaju',
    rw_code: 'RW 04',
    rt_code: 'RT 01-05',
    latitude: -6.6012,
    longitude: 106.8123,
    total_balita: 45,
    stunting_count: 4,
    wasting_count: 1,
    high_risk_count: 2,
    stunting_prevalence: 8.9,
    risk_level: 'MEDIUM',
  },
  {
    posyandu_id: 'pos-05',
    posyandu_name: 'Posyandu Mawar 05',
    village_name: 'Desa Sukamaju',
    rw_code: 'RW 05',
    rt_code: 'RT 01-03',
    latitude: -6.6045,
    longitude: 106.8167,
    total_balita: 38,
    stunting_count: 7,
    wasting_count: 2,
    high_risk_count: 5,
    stunting_prevalence: 18.4,
    risk_level: 'HIGH',
  },
  {
    posyandu_id: 'pos-06',
    posyandu_name: 'Posyandu Mawar 06',
    village_name: 'Desa Sukamaju',
    rw_code: 'RW 06',
    rt_code: 'RT 01-04',
    latitude: -6.6089,
    longitude: 106.821,
    total_balita: 42,
    stunting_count: 3,
    wasting_count: 1,
    high_risk_count: 1,
    stunting_prevalence: 7.1,
    risk_level: 'LOW',
  },
  {
    posyandu_id: 'pos-07',
    posyandu_name: 'Posyandu Kenanga 07',
    village_name: 'Desa Sukamaju',
    rw_code: 'RW 07',
    rt_code: 'RT 01-03',
    latitude: -6.612,
    longitude: 106.8256,
    total_balita: 39,
    stunting_count: 1,
    wasting_count: 0,
    high_risk_count: 1,
    stunting_prevalence: 2.5,
    risk_level: 'LOW',
  },
  {
    posyandu_id: 'pos-08',
    posyandu_name: 'Posyandu Kenanga 08',
    village_name: 'Desa Sukamaju',
    rw_code: 'RW 08',
    rt_code: 'RT 01-04',
    latitude: -6.6165,
    longitude: 106.831,
    total_balita: 38,
    stunting_count: 6,
    wasting_count: 1,
    high_risk_count: 3,
    stunting_prevalence: 15.8,
    risk_level: 'HIGH',
  },
]

export default function PetaGIS({ user, embedded = false }) {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])

  const [clusters, setClusters] = useState(FALLBACK_CLUSTERS)
  const [selectedCluster, setSelectedCluster] = useState(null)
  const [filterRisk, setFilterRisk] = useState('ALL')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState('Memuat data...')

  // Fetch real GIS clusters from backend
  const loadGISData = async () => {
    setLoading(true)
    try {
      const data = await fetchRoleDashboardData('/bidan/gis-clusters')
      if (Array.isArray(data) && data.length > 0) {
        setClusters(data)
        setDataSource('Basis Data Klinis PostgreSQL')
      } else {
        setClusters(FALLBACK_CLUSTERS)
        setDataSource('Data Seeder Desa')
      }
    } catch {
      setClusters(FALLBACK_CLUSTERS)
      setDataSource('Data Baseline Desa')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGISData()
  }, [])

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return
    if (mapInstanceRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: [-6.602, 106.815],
      zoom: 14,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> • Letters Medical GIS',
      maxZoom: 19,
    }).addTo(map)

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // Render or update circle markers
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    const filtered = clusters.filter((item) => {
      const matchFilter = filterRisk === 'ALL' || item.risk_level === filterRisk
      const matchSearch =
        item.posyandu_name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        item.rw_code.toLowerCase().includes(searchKeyword.toLowerCase())
      return matchFilter && matchSearch
    })

    filtered.forEach((c) => {
      let fillColor = '#10b981' // LOW
      let strokeColor = '#047857'
      let radius = 14

      if (c.risk_level === 'HIGH') {
        fillColor = '#ef4444'
        strokeColor = '#b91c1c'
        radius = 22
      } else if (c.risk_level === 'MEDIUM') {
        fillColor = '#f59e0b'
        strokeColor = '#d97706'
        radius = 18
      }

      const circle = L.circleMarker([c.latitude, c.longitude], {
        radius,
        fillColor,
        color: strokeColor,
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.6,
      }).addTo(map)

      const popupContent = `
        <div style="font-family: 'Open Runde', sans-serif; min-width: 220px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e4e4eb; padding-bottom: 8px; margin-bottom: 8px;">
            <strong style="font-size: 14px; color: #070709; letter-spacing: -0.01em;">${c.posyandu_name}</strong>
            <span style="font-size: 10.5px; font-weight: 600; padding: 2px 8px; border-radius: 100px; background: ${fillColor}18; color: ${strokeColor}; border: 1px solid ${strokeColor}40;">
              ${c.risk_level}
            </span>
          </div>
          <p style="margin: 3px 0; font-size: 12px; color: #60606c;"><strong>Wilayah:</strong> ${c.rw_code} (${c.rt_code})</p>
          <p style="margin: 3px 0; font-size: 12px; color: #60606c;"><strong>Sasaran Balita:</strong> ${c.total_balita} Anak</p>
          <p style="margin: 3px 0; font-size: 12px; color: #b91c1c;"><strong>Kasus Stunting:</strong> ${c.stunting_count} (${c.stunting_prevalence.toFixed(1)}%)</p>
          <p style="margin: 3px 0; font-size: 12px; color: #d97706;"><strong>Kasus Wasting:</strong> ${c.wasting_count} Balita</p>
          <p style="margin: 3px 0; font-size: 12px; color: #2597d0;"><strong>Skor ML Faltering:</strong> ${c.high_risk_count} Kasus</p>
        </div>
      `

      circle.bindPopup(popupContent)

      circle.on('click', () => {
        setSelectedCluster(c)
      })

      markersRef.current.push(circle)
    })
  }, [clusters, filterRisk, searchKeyword])

  const handleSelectPosyandu = (c) => {
    setSelectedCluster(c)
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([c.latitude, c.longitude], 16, {
        duration: 1.2,
      })
    }
  }

  const totalBalitaDesa = clusters.reduce((acc, curr) => acc + curr.total_balita, 0)
  const totalStuntingDesa = clusters.reduce((acc, curr) => acc + curr.stunting_count, 0)
  const highRiskClustersCount = clusters.filter((c) => c.risk_level === 'HIGH').length

  return (
    <div className={`text-[#070709] flex flex-col font-runde selection:bg-[#2597d0] selection:text-white ${embedded ? 'w-full rounded-[24px] border border-[#e4e4eb] overflow-hidden bg-white shadow-[0_17px_37px_rgba(16,55,132,0.03)]' : 'min-h-screen bg-[#ffffff]'}`}>
      {/* DESIGN.md Top Sticky Header: White background, 1px bottom border, pill controls */}
      {!embedded && (
        <header className="bg-white border-b border-[#e4e4eb] px-5 sm:px-8 py-4 sticky top-0 z-30 shadow-[0_1px_2px_rgba(228,229,231,0.24)]">
          <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <button
                type="button"
                onClick={() => {
                  window.location.hash = '#/bidan/dashboard'
                }}
                className="letters-ghost-btn inline-flex items-center gap-2 px-4 py-2 text-[13px] hover:bg-[#f5f5f5] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-[#2597d0]" />
                <span>Dasbor Bidan</span>
              </button>
              <div className="h-5 w-px bg-[#e4e4eb] hidden sm:block" />
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-[19px] sm:text-[22px] font-semibold text-[#070709] tracking-[-0.03em] leading-tight">
                    Peta GIS &amp; Klaster Risiko Stunting
                  </h1>
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-medium bg-[#f5f5f5] text-[#070709] border border-[#e4e4eb]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2597d0]" />
                    Leaflet GIS
                  </span>
                </div>
                <p className="text-[12px] text-[#60606c] tracking-[-0.01em] mt-0.5">
                  Yurisdiksi: <strong className="text-[#070709]">{user?.village_name || 'Desa Sukamaju'}</strong> • {dataSource}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={loadGISData}
                disabled={loading}
                className="letters-ghost-btn inline-flex items-center gap-2 px-4 py-2 text-[13px] hover:bg-[#f5f5f5] cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#2597d0] ${loading ? 'animate-spin' : ''}`} />
                <span>Segarkan</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.hash = '#/bidan/prioritas'
                }}
                className="letters-pill-btn inline-flex items-center gap-2 px-5 py-2 text-[13px] cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-[#2597d0]" />
                <span>Daftar Prioritas</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Embedded Sub-header Toolbar (if inside RoleDashboardShell) */}
      {embedded && (
        <div className="p-4 px-6 border-b border-[#e4e4eb] bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#2597d0]" />
            <span className="text-[13px] font-semibold text-[#070709] tracking-[-0.01em]">
              Peta Sebaran Kasus Stunting Wilayah {user?.village_name || 'Desa Sukamaju'}
            </span>
            <span className="text-[11.5px] text-[#8b8b8b]">({dataSource})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadGISData}
              disabled={loading}
              className="letters-ghost-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[12px] hover:bg-[#f5f5f5] cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 text-[#2597d0] ${loading ? 'animate-spin' : ''}`} />
              <span>Segarkan</span>
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.hash = '#/bidan/prioritas'
              }}
              className="letters-pill-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[12px] cursor-pointer"
            >
              <AlertTriangle className="w-3 h-3 text-[#2597d0]" />
              <span>Buka Prioritas (19)</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace: Left Posyandu List + Right Full Leaflet Map */}
      <div className="flex-1 min-w-0 w-full flex flex-col xl:flex-row overflow-hidden bg-[#f5f5f5]">
        {/* Left Sidebar Control Panel (Letters Cloud Surface) */}
        <div className="w-full xl:w-80 bg-white border-b xl:border-b-0 xl:border-r border-[#e4e4eb] flex flex-col shrink-0 overflow-y-auto max-h-[36vh] xl:max-h-[580px] shadow-[0_17px_37px_rgba(16,55,132,0.02)]">
          {/* Quick Metrics Bar: Letters Card Style */}
          <div className="p-3.5 border-b border-[#e4e4eb] bg-[#f5f5f5] grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-[14px] bg-white border border-[#e4e4eb] shadow-[0_1px_2px_rgba(228,229,231,0.24)]">
              <span className="text-[10.5px] text-[#60606c] block font-normal tracking-[-0.01em]">Sasaran</span>
              <span className="text-[16px] font-semibold text-[#070709] tracking-[-0.02em]">{totalBalitaDesa}</span>
            </div>
            <div className="p-2.5 rounded-[14px] bg-white border border-[#e4e4eb] shadow-[0_1px_2px_rgba(228,229,231,0.24)]">
              <span className="text-[10.5px] text-[#60606c] block font-normal tracking-[-0.01em]">Stunting</span>
              <span className="text-[16px] font-semibold text-rose-600 tracking-[-0.02em]">{totalStuntingDesa}</span>
            </div>
            <div className="p-2.5 rounded-[14px] bg-white border border-[#e4e4eb] shadow-[0_1px_2px_rgba(228,229,231,0.24)]">
              <span className="text-[10.5px] text-[#60606c] block font-normal tracking-[-0.01em]">Klaster</span>
              <span className="text-[16px] font-semibold text-amber-600 tracking-[-0.02em]">{highRiskClustersCount} Rawan</span>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="p-3.5 border-b border-[#e4e4eb] space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-[#8b8b8b] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari Posyandu / RW..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-[12.5px] rounded-full border border-[#bebecc] bg-white text-[#070709] placeholder:text-[#8b8b8b] focus:outline-none focus:border-[#070709] tracking-[-0.01em] transition-colors"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { key: 'ALL', label: 'Semua' },
                { key: 'HIGH', label: '🔴 Rawan' },
                { key: 'MEDIUM', label: '🟡 Waspada' },
                { key: 'LOW', label: '🟢 Aman' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilterRisk(tab.key)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                    filterRisk === tab.key
                      ? 'bg-[#070709] text-white shadow-[0_1px_2px_rgba(36,36,40,0.1)]'
                      : 'bg-[#f5f5f5] text-[#60606c] hover:bg-[#e4e4eb] hover:text-[#070709]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Posyandu Cluster List */}
          <div className="p-3 space-y-2 flex-1 bg-[#f5f5f5]">
            <p className="px-2 text-[10.5px] font-semibold uppercase tracking-wider text-[#8b8b8b]">
              Titik Pantau Posyandu ({clusters.length})
            </p>

            {clusters
              .filter((item) => {
                const matchFilter = filterRisk === 'ALL' || item.risk_level === filterRisk
                const matchSearch =
                  item.posyandu_name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                  item.rw_code.toLowerCase().includes(searchKeyword.toLowerCase())
                return matchFilter && matchSearch
              })
              .map((c) => {
                const isSelected = selectedCluster?.posyandu_id === c.posyandu_id
                let badgeClass = 'bg-[#f5f5f5] text-[#070709] border-[#e4e4eb]'
                if (c.risk_level === 'HIGH') {
                  badgeClass = 'bg-rose-50 text-rose-700 border-rose-200'
                } else if (c.risk_level === 'MEDIUM') {
                  badgeClass = 'bg-amber-50 text-amber-700 border-amber-200'
                } else {
                  badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }

                return (
                  <div
                    key={c.posyandu_id}
                    onClick={() => handleSelectPosyandu(c)}
                    className={`p-3 rounded-[16px] border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white border-[#070709] shadow-[0_17px_37px_rgba(16,55,132,0.06)] ring-1 ring-[#070709]'
                        : 'bg-white border-[#e4e4eb] hover:border-[#bebecc] shadow-[0_1px_2px_rgba(228,229,231,0.24)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#2597d0] shrink-0" />
                          <h2 className="font-semibold text-[13.5px] text-[#070709] tracking-[-0.01em]">
                            {c.posyandu_name}
                          </h2>
                        </div>
                        <span className="text-[11px] text-[#60606c] ml-5">
                          {c.rw_code} • {c.rt_code}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${badgeClass}`}
                      >
                        {c.risk_level === 'HIGH'
                          ? 'KRITIS'
                          : c.risk_level === 'MEDIUM'
                            ? 'WASPADA'
                            : 'AMAN'}
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-[#f0f0f4] grid grid-cols-3 gap-1 text-[11px]">
                      <div>
                        <span className="text-[#8b8b8b] block text-[10px]">Sasaran</span>
                        <span className="font-medium text-[#070709]">{c.total_balita}</span>
                      </div>
                      <div>
                        <span className="text-[#8b8b8b] block text-[10px]">Stunting</span>
                        <span className="font-semibold text-rose-600">
                          {c.stunting_count} ({c.stunting_prevalence.toFixed(0)}%)
                        </span>
                      </div>
                      <div>
                        <span className="text-[#8b8b8b] block text-[10px]">ML Risk</span>
                        <span className="font-semibold text-[#2597d0]">{c.high_risk_count}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        {/* Right Map Canvas with Floating Overlay Legend */}
        <div className="flex-1 min-w-0 relative w-full h-[480px] sm:h-[540px] xl:h-[580px]">
          {/* Leaflet Map Div */}
          <div ref={mapContainerRef} className="w-full h-full min-h-[480px] z-0" />

          {/* Floating Map Legend (Letters Card Style: 18px radius, atmospheric shadow) */}
          <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 backdrop-blur-md p-3.5 rounded-[16px] border border-[#e4e4eb] shadow-[0_17px_37px_rgba(16,55,132,0.06)] text-[11px] space-y-2 pointer-events-auto max-w-[220px]">
            <div className="flex items-center gap-1.5 font-semibold text-[#070709] text-[12px] border-b border-[#f0f0f4] pb-1.5 tracking-[-0.01em]">
              <Layers className="w-3.5 h-3.5 text-[#2597d0]" />
              <span>Indikator Klaster</span>
            </div>
            <div className="space-y-1.5 text-[#60606c]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-rose-700 shrink-0" />
                <span>
                  <strong className="text-[#070709]">Kritis:</strong> Prevalensi &ge; 15%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-700 shrink-0" />
                <span>
                  <strong className="text-[#070709]">Waspada:</strong> Prevalensi &ge; 8%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-700 shrink-0" />
                <span>
                  <strong className="text-[#070709]">Aman:</strong> Prevalensi &lt; 8%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
