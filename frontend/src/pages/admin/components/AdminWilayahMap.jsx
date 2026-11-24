import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

/**
 * Interactive Leaflet GIS Overview Map for Super Admin Master Wilayah (/admin/wilayah)
 * Displays all Posyandu RW clusters, children count, active status, and allows flying to or editing any unit.
 */
export function AdminWilayahClusterMap({
  units = [],
  selectedUnitId = null,
  onSelectUnit,
  onEditUnit,
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef(new Map())

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [-6.601, 106.813],
      zoom: 14,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> • Tumbuhin Super Admin GIS',
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((m) => m.remove())
    markersRef.current.clear()

    const validBounds = []

    units.forEach((unit) => {
      const lat = Number(unit.latitude)
      const lng = Number(unit.longitude)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return

      validBounds.push([lat, lng])
      const isSelected = selectedUnitId && String(selectedUnitId) === String(unit.id)
      const isActive = Boolean(unit.is_active)

      const fillColor = isSelected ? '#2597d0' : isActive ? '#10b981' : '#94a3b8'
      const strokeColor = isSelected ? '#0f172a' : isActive ? '#047857' : '#475569'

      const marker = L.circleMarker([lat, lng], {
        radius: isSelected ? 15 : 11,
        fillColor,
        color: strokeColor,
        weight: isSelected ? 3 : 2,
        opacity: 1,
        fillOpacity: 0.85,
      }).addTo(map)

      marker.bindTooltip(
        `<div style="font-weight:700;font-size:11.5px;color:#0f172a;">${unit.name} (RW ${unit.rw_code})</div>
         <div style="font-size:10.5px;color:#475569;">${unit.children_count || 0} Balita • ${unit.kader_count || 0} Kader</div>`,
        {
          direction: 'top',
          offset: [0, -10],
          opacity: 0.96,
        },
      )

      const popupNode = document.createElement('div')
      popupNode.style.minWidth = '210px'
      popupNode.style.fontFamily = "'Open Runde', sans-serif"
      popupNode.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-bottom:8px;">
          <div>
            <div style="font-weight:700;font-size:13px;color:#0f172a;">${unit.name}</div>
            <div style="font-size:11px;color:#64748b;">RW ${unit.rw_code} / RT ${unit.rt_code} • ${unit.village_name || 'Desa Sukamaju'}</div>
          </div>
          <span style="padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;background:${
            isActive ? '#ecfdf5' : '#f1f5f9'
          };color:${isActive ? '#047857' : '#475569'};">
            ${isActive ? 'AKTIF' : 'NONAKTIF'}
          </span>
        </div>
        <div style="font-size:11.5px;color:#334155;margin-bottom:6px;">
          <div><strong>Alamat:</strong> ${unit.address || '-'}</div>
          <div><strong>Jadwal:</strong> ${unit.schedule_day || '-'}</div>
          <div><strong>Sasaran:</strong> ${unit.children_count || 0} Balita (${unit.kader_count || 0} Akun Kader)</div>
          <div style="font-family:monospace;font-size:10.5px;color:#2597d0;margin-top:4px;">
            GIS: ${lat.toFixed(5)}, ${lng.toFixed(5)}
          </div>
        </div>
      `

      if (onEditUnit) {
        const editBtn = document.createElement('button')
        editBtn.type = 'button'
        editBtn.textContent = 'Ubah Titik & Data Unit'
        editBtn.style.cssText =
          'width:100%;margin-top:4px;padding:6px 10px;border-radius:8px;background:#1e293b;color:#fff;font-size:11px;font-weight:600;border:none;cursor:pointer;'
        editBtn.onclick = () => {
          map.closePopup()
          onEditUnit(unit)
        }
        popupNode.appendChild(editBtn)
      }

      marker.bindPopup(popupNode)
      marker.on('click', () => {
        if (onSelectUnit) onSelectUnit(unit)
      })

      markersRef.current.set(String(unit.id), marker)
    })

    if (!selectedUnitId && validBounds.length > 1) {
      map.fitBounds(validBounds, { padding: [36, 36], maxZoom: 15 })
    }
  }, [units, selectedUnitId, onSelectUnit, onEditUnit])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedUnitId) return

    const target = units.find((u) => String(u.id) === String(selectedUnitId))
    if (!target) return

    const lat = Number(target.latitude)
    const lng = Number(target.longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return

    map.flyTo([lat, lng], 16, { duration: 0.65 })
    const marker = markersRef.current.get(String(target.id))
    if (marker) {
      marker.openPopup()
    }
  }, [selectedUnitId, units])

  return (
    <div
      ref={containerRef}
      className="w-full h-[310px] rounded-2xl border border-slate-200 overflow-hidden z-0"
    />
  )
}

/**
 * Interactive Click-to-Pick Leaflet Map inside Add/Edit Posyandu Modal.
 * Clicking anywhere on the map updates latitude & longitude immediately.
 */
export function AdminWilayahPickerMap({ latitude, longitude, onChangeCoordinates }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)

  const safeLat = Number.isFinite(Number(latitude)) ? Number(latitude) : -6.595038
  const safeLng = Number.isFinite(Number(longitude)) ? Number(longitude) : 106.816635

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [safeLat, safeLng],
      zoom: 15,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map)

    const marker = L.circleMarker([safeLat, safeLng], {
      radius: 11,
      fillColor: '#2597d0',
      color: '#0f172a',
      weight: 2.5,
      opacity: 1,
      fillOpacity: 0.9,
    }).addTo(map)

    marker.bindTooltip('Klik peta untuk memindahkan titik Posyandu', {
      direction: 'top',
      offset: [0, -10],
    })

    map.on('click', (e) => {
      const nextLat = Number(e.latlng.lat.toFixed(6))
      const nextLng = Number(e.latlng.lng.toFixed(6))
      marker.setLatLng([nextLat, nextLng])
      if (onChangeCoordinates) {
        onChangeCoordinates(nextLat, nextLng)
      }
    })

    mapRef.current = map
    markerRef.current = marker

    // Ensure proper Leaflet sizing inside modal
    setTimeout(() => {
      map.invalidateSize()
    }, 120)

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    if (!map || !marker) return

    marker.setLatLng([safeLat, safeLng])
    map.panTo([safeLat, safeLng], { animate: true })
  }, [safeLat, safeLng])

  return (
    <div
      ref={containerRef}
      className="w-full h-[185px] rounded-xl border border-slate-200 overflow-hidden z-0 cursor-crosshair"
    />
  )
}
