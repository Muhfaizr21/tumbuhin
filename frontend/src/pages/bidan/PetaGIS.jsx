import { useEffect, useRef, useState } from 'react'
import {
  AlertOctagon,
  AlertTriangle,
  ArrowLeft,
  Layers,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
} from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { fetchRoleDashboardData } from '../../lib/authApi'

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

const RISK_FILTER_TABS = [
  { key: 'ALL', label: 'Semua', icon: Layers, iconColor: 'text-[#2597d0]' },
  { key: 'HIGH', label: 'Rawan', icon: AlertOctagon, iconColor: 'text-rose-500' },
  { key: 'MEDIUM', label: 'Waspada', icon: AlertTriangle, iconColor: 'text-amber-500' },
  { key: 'LOW', label: 'Aman', icon: ShieldCheck, iconColor: 'text-emerald-500' },
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
  const [errorMessage, setErrorMessage] = useState('')
  const [dataSource, setDataSource] = useState('Memuat data...')

  const loadGISData = async () => {
    setLoading(true)
    setErrorMessage('')
    try {
      const data = await fetchRoleDashboardData('/bidan/gis-clusters')
      if (Array.isArray(data) && data.length > 0) {
        setClusters(data)
        setDataSource('Basis Data Klinis PostgreSQL')
      } else {
        setClusters(FALLBACK_CLUSTERS)
        setDataSource('Data Referensi Wilayah Desa')
      }
    } catch (err) {
      setClusters(FALLBACK_CLUSTERS)
      setDataSource('Mode Lokal Wilayah Desa')
      setErrorMessage(err?.message ? `Info Koneksi: ${err.message}` : '')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGISData()
  }, [])

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
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> • Tumbuhin Clinical GIS',
      maxZoom: 19,
    }).addTo(map)

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

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
      let fillColor = '#10b981'
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
        opacity: 0.95,
        fillOpacity: 0.65,
      }).addTo(map)

      const popupContent = `
        <div style="font-family: 'Open Runde', sans-serif; min-width: 220px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 8px;">
            <strong style="font-size: 14px; color: #1e293b;">${c.posyandu_name}</strong>
            <span style="font-size: 10.5px; font-weight: 700; padding: 2px 8px; border-radius: 8px; background: ${fillColor}18; color: ${strokeColor}; border: 1px solid ${strokeColor}40;">
              ${c.risk_level}
            </span>
          </div>
          <p style="margin: 3px 0; font-size: 12px; color: #475569;"><strong>Wilayah:</strong> ${c.rw_code} (${c.rt_code})</p>
          <p style="margin: 3px 0; font-size: 12px; color: #475569;"><strong>Sasaran Balita:</strong> ${c.total_balita} Anak</p>
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

  const filteredClusters = clusters.filter((item) => {
    const matchFilter = filterRisk === 'ALL' || item.risk_level === filterRisk
    const matchSearch =
      item.posyandu_name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      item.rw_code.toLowerCase().includes(searchKeyword.toLowerCase())
    return matchFilter && matchSearch
  })

  const totalBalitaDesa = clusters.reduce((acc, curr) => acc + curr.total_balita, 0)
  const totalStuntingDesa = clusters.reduce((acc, curr) => acc + curr.stunting_count, 0)
  const highRiskClustersCount = clusters.filter((c) => c.risk_level === 'HIGH').length

  return (
    <div
      className={`text-slate-800 flex flex-col font-runde ${
        embedded
          ? 'w-full rounded-2xl border border-slate-100 overflow-hidden bg-white shadow-xs'
          : 'min-h-screen bg-[#f6f9fc]'
      }`}
    >
      {!embedded && (
        <header className="bg-white border-b border-slate-100 px-5 sm:px-8 py-4 sticky top-0 z-30">
          <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <button
                type="button"
                onClick={() => {
                  window.location.hash = '#/bidan/dashboard'
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 text-[13px] font-medium hover:bg-slate-50 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-[#2597d0]" aria-hidden="true" />
                <span>Dasbor Bidan</span>
              </button>
              <div>
                <h1 className="text-[19px] sm:text-[21px] font-bold text-slate-800 tracking-tight">
                  Peta GIS &amp; Klaster Risiko Stunting
                </h1>
                <p className="text-[12px] text-slate-500">
                  Yurisdiksi: <strong className="text-slate-800">{user?.village_name || 'Desa Sukamaju'}</strong> • {dataSource}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={loadGISData}
                disabled={loading}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-[12.5px] font-semibold hover:bg-slate-50 cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-[#2597d0] ${loading ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                <span>Segarkan</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.hash = '#/bidan/prioritas'
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2597d0] hover:bg-[#1e82b8] text-white text-[12.5px] font-semibold cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Daftar Prioritas</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {embedded && (
        <div className="p-4 px-5 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#edf7fe] text-[#2597d0] flex items-center justify-center">
              <MapPin className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-[14px] font-bold text-slate-800">
                Peta Sebaran Klaster Posyandu {user?.village_name || 'Desa Sukamaju'}
              </h2>
              <p className="text-[11px] text-slate-400">{dataSource}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadGISData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-[12px] font-semibold hover:bg-slate-50 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2597d0]"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-[#2597d0] ${loading ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>Segarkan</span>
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.hash = '#/bidan/prioritas'
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#2597d0] hover:bg-[#1e82b8] text-white text-[12px] font-semibold cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2597d0]"
            >
              <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Buka Triase Prioritas</span>
            </button>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="px-5 py-2 bg-amber-50 border-b border-amber-100 text-amber-800 text-[12px] flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="font-semibold underline cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      <div className="flex-1 min-w-0 w-full flex flex-col xl:flex-row overflow-hidden bg-slate-50">
        {/* Left Posyandu Cluster Inspector */}
        <div className="w-full xl:w-80 bg-white border-b xl:border-b-0 xl:border-r border-slate-100 flex flex-col shrink-0 overflow-y-auto max-h-[38vh] xl:max-h-[560px]">
          <div className="p-3.5 border-b border-slate-100 bg-slate-50/70 grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-white border border-slate-100">
              <span className="text-[10.5px] text-slate-400 block">Sasaran</span>
              <span className="text-[15px] font-bold text-slate-800">{totalBalitaDesa}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-slate-100">
              <span className="text-[10.5px] text-slate-400 block">Stunting</span>
              <span className="text-[15px] font-bold text-rose-600">{totalStuntingDesa}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-slate-100">
              <span className="text-[10.5px] text-slate-400 block">Zona Kritis</span>
              <span className="text-[15px] font-bold text-amber-600">{highRiskClustersCount} RW</span>
            </div>
          </div>

          <div className="p-3.5 border-b border-slate-100 space-y-2.5">
            <div className="relative">
              <label htmlFor="gis-posyandu-search" className="sr-only">
                Cari Posyandu atau RW
              </label>
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                id="gis-posyandu-search"
                type="text"
                placeholder="Cari Posyandu atau RW..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-[12.5px] rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#2597d0] transition-colors"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {RISK_FILTER_TABS.map((tab) => {
                const TabIcon = tab.icon
                const isSelected = filterRisk === tab.key
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setFilterRisk(tab.key)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#2597d0] ${
                      isSelected
                        ? 'bg-[#2597d0] text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                    }`}
                  >
                    <TabIcon
                      className={`w-3 h-3 ${isSelected ? 'text-white' : tab.iconColor}`}
                      aria-hidden="true"
                    />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="p-3 space-y-2 flex-1 bg-slate-50/40">
            <p className="px-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
              Titik Pantau Posyandu ({filteredClusters.length})
            </p>

            {filteredClusters.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-[12px]">
                Tidak ada Posyandu yang sesuai dengan filter risiko.
              </div>
            ) : (
              filteredClusters.map((c) => {
                const isSelected = selectedCluster?.posyandu_id === c.posyandu_id
                let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200'
                let StatusIcon = ShieldCheck
                if (c.risk_level === 'HIGH') {
                  badgeClass = 'bg-rose-50 text-rose-700 border-rose-200'
                  StatusIcon = AlertOctagon
                } else if (c.risk_level === 'MEDIUM') {
                  badgeClass = 'bg-amber-50 text-amber-700 border-amber-200'
                  StatusIcon = AlertTriangle
                }

                return (
                  <button
                    key={c.posyandu_id}
                    type="button"
                    onClick={() => handleSelectPosyandu(c)}
                    className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2597d0] ${
                      isSelected
                        ? 'bg-[#edf7fe] border-[#2597d0] shadow-xs'
                        : 'bg-white border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#2597d0] shrink-0" aria-hidden="true" />
                          <span className="font-bold text-[13px] text-slate-800">
                            {c.posyandu_name}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 ml-5 block">
                          {c.rw_code} • {c.rt_code}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${badgeClass}`}
                      >
                        <StatusIcon className="w-2.5 h-2.5" aria-hidden="true" />
                        <span>
                          {c.risk_level === 'HIGH'
                            ? 'KRITIS'
                            : c.risk_level === 'MEDIUM'
                              ? 'WASPADA'
                              : 'AMAN'}
                        </span>
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 grid grid-cols-3 gap-1 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Sasaran</span>
                        <span className="font-semibold text-slate-700">{c.total_balita}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Stunting</span>
                        <span className="font-bold text-rose-600">
                          {c.stunting_count} ({c.stunting_prevalence.toFixed(0)}%)
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">ML Risk</span>
                        <span className="font-bold text-[#2597d0]">{c.high_risk_count}</span>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right Interactive Leaflet Map */}
        <div className="flex-1 min-w-0 relative w-full h-[460px] sm:h-[520px] xl:h-[560px]">
          <div ref={mapContainerRef} className="w-full h-full min-h-[460px] z-0" />

          <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-200/80 shadow-md text-[11px] space-y-2 pointer-events-auto max-w-[220px]">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[12px] border-b border-slate-100 pb-1.5">
              <Layers className="w-3.5 h-3.5 text-[#2597d0]" aria-hidden="true" />
              <span>Indikator Zona Risiko</span>
            </div>
            <div className="space-y-1.5 text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                <span>
                  <strong className="text-slate-800">Kritis:</strong> Prevalensi &ge; 15%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span>
                  <strong className="text-slate-800">Waspada:</strong> Prevalensi &ge; 8%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span>
                  <strong className="text-slate-800">Aman:</strong> Prevalensi &lt; 8%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
