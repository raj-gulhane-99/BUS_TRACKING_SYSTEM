import { useEffect, useRef, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ── Custom bus marker icon ────────────────────────────────────────────────────
const createBusIcon = (status = 'active', busNumber = '') => L.divIcon({
  className: '',
  html: `
    <div class="bus-marker-icon ${status !== 'active' ? 'bus-marker-offline' : ''}" title="${busNumber}">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
        <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
      </svg>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -25],
})

// ── Custom student/user marker ────────────────────────────────────────────────
const createStudentIcon = () => L.divIcon({
  className: '',
  html: `
    <div class="student-marker-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20],
})

// ── Auto-pan to target ────────────────────────────────────────────────────────
function PanTo({ position }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.setView(position, map.getZoom(), { animate: true })
  }, [position, map])
  return null
}

// ── Smooth marker movement ────────────────────────────────────────────────────
function AnimatedMarker({ position, icon, children }) {
  const markerRef = useRef(null)
  const prevPos = useRef(position)

  useEffect(() => {
    if (!markerRef.current || !position) return
    const marker = markerRef.current
    const start  = prevPos.current
    const end    = position
    if (!start || (start[0] === end[0] && start[1] === end[1])) return

    const frames = 30
    let frame = 0
    const animate = () => {
      frame++
      const t = frame / frames
      const lat = start[0] + (end[0] - start[0]) * t
      const lng = start[1] + (end[1] - start[1]) * t
      marker.setLatLng([lat, lng])
      if (frame < frames) requestAnimationFrame(animate)
      else prevPos.current = end
    }
    requestAnimationFrame(animate)
  }, [position])

  if (!position) return null
  return (
    <Marker ref={markerRef} position={position} icon={icon}>
      {children}
    </Marker>
  )
}

// ── Route colors ──────────────────────────────────────────────────────────────
const ROUTE_COLORS = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed']

/**
 * LiveMap — unified map component used across all dashboards.
 *
 * Props:
 *  - buses: Array<{ _id, busNumber, status, currentLocation: {lat,lng}, currentSpeed, assignedDriver, assignedRoute }>
 *  - liveLocations: Object { busId: { lat, lng, speed } }
 *  - studentLocation: { lat, lng } | null
 *  - center: [lat, lng]
 *  - zoom: number
 *  - autoPan: boolean
 *  - panTarget: [lat, lng] | null
 *  - height: string (CSS value)
 */
export default function LiveMap({
  buses = [],
  liveLocations = {},
  studentLocation = null,
  center = [28.6448, 77.2167],
  zoom = 13,
  autoPan = false,
  panTarget = null,
  height = '100%',
}) {
  const studentIcon = useMemo(() => createStudentIcon(), [])

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height, width: '100%', borderRadius: 'inherit' }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {autoPan && panTarget && <PanTo position={panTarget} />}

      {/* Student location marker */}
      {studentLocation && (
        <Marker position={[studentLocation.lat, studentLocation.lng]} icon={studentIcon}>
          <Popup>
            <div className="text-sm">
              <p className="font-bold text-green-700">📍 Your Location</p>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Bus markers */}
      {buses.map((bus, idx) => {
        const live = liveLocations[bus._id]
        const loc  = live || bus.currentLocation
        if (!loc?.lat) return null

        const position  = [loc.lat, loc.lng]
        const speed     = live?.speed ?? bus.currentSpeed ?? 0
        const status    = bus.status || 'offline'
        const busIcon   = createBusIcon(status, bus.busNumber)
        const routeColor = ROUTE_COLORS[idx % ROUTE_COLORS.length]
        const polyline  = bus.assignedRoute?.polyline

        return (
          <div key={bus._id}>
            {/* Route polyline */}
            {polyline && polyline.length > 1 && (
              <Polyline
                positions={polyline}
                pathOptions={{ color: routeColor, weight: 4, opacity: 0.6, dashArray: '8 4' }}
              />
            )}

            {/* Animated bus marker */}
            <AnimatedMarker position={position} icon={busIcon}>
              <Popup>
                <div className="text-sm min-w-[180px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                        <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{bus.busNumber}</p>
                      <span className={`text-xs font-semibold ${status === 'active' ? 'text-green-600' : 'text-slate-500'}`}>
                        ● {status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  {bus.assignedDriver && (
                    <p className="text-slate-600"><span className="font-medium">Driver:</span> {bus.assignedDriver.name}</p>
                  )}
                  {bus.assignedRoute && (
                    <p className="text-slate-600"><span className="font-medium">Route:</span> {bus.assignedRoute.name}</p>
                  )}
                  <p className="text-slate-600 mt-1"><span className="font-medium">Speed:</span> {Math.round(speed)} km/h</p>
                  {live?.timestamp && (
                    <p className="text-slate-400 text-xs mt-1">
                      Updated: {new Date(live.timestamp).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </Popup>
            </AnimatedMarker>

            {/* Stop markers */}
            {bus.assignedRoute?.stops?.map(stop => (
              <Marker
                key={stop._id || stop.order}
                position={[stop.lat, stop.lng]}
                icon={L.divIcon({
                  className: '',
                  html: `<div style="width:10px;height:10px;border-radius:50%;background:${routeColor};border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>`,
                  iconSize: [10, 10],
                  iconAnchor: [5, 5],
                })}
              >
                <Popup>
                  <p className="text-sm font-semibold">Stop {stop.order}: {stop.name}</p>
                </Popup>
              </Marker>
            ))}
          </div>
        )
      })}
    </MapContainer>
  )
}
