import { useState, useEffect, useRef } from 'react'

/**
 * Hook that returns the user's current GPS position.
 * Updates automatically as the user moves.
 */
export function useGeolocation() {
  const [location, setLocation]   = useState(null)  // { lat, lng, accuracy }
  const [error, setError]         = useState(null)
  const [loading, setLoading]     = useState(true)
  const watchIdRef = useRef(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      setLoading(false)
      return
    }

    const success = (pos) => {
      setLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        speed: pos.coords.speed ?? 0,
        heading: pos.coords.heading ?? 0,
      })
      setLoading(false)
      setError(null)
    }

    const fail = (err) => {
      setError(err.message)
      setLoading(false)
    }

    const options = {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 10000,
    }

    // Initial position
    navigator.geolocation.getCurrentPosition(success, fail, options)

    // Watch for updates
    watchIdRef.current = navigator.geolocation.watchPosition(success, fail, options)

    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current)
    }
  }, [])

  return { location, error, loading }
}

/**
 * Simulate GPS movement along a polyline (for testing without real GPS).
 * Returns a position that moves along the given path at the given speed.
 */
export function useSimulatedGPS(polyline = [], speedKmh = 30, enabled = false) {
  const [position, setPosition] = useState(null)
  const [segIndex, setSegIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const raf = useRef(null)

  useEffect(() => {
    if (!enabled || polyline.length < 2) return

    let seg = 0
    let t   = 0
    setPosition(polyline[0] ? { lat: polyline[0][0], lng: polyline[0][1] } : null)

    const speedMs   = speedKmh / 3.6 // m/s
    const R         = 6371000
    let lastTime    = null

    const step = (timestamp) => {
      if (!lastTime) lastTime = timestamp
      const dt = (timestamp - lastTime) / 1000 // seconds
      lastTime = timestamp

      if (seg >= polyline.length - 1) {
        seg = 0
        t   = 0
      }

      const from = polyline[seg]
      const to   = polyline[seg + 1]

      if (!from || !to) {
        raf.current = requestAnimationFrame(step)
        return
      }

      const dLat  = ((to[0] - from[0]) * Math.PI) / 180
      const dLng  = ((to[1] - from[1]) * Math.PI) / 180
      const dist  = Math.sqrt((dLat * R) ** 2 + (dLng * R * Math.cos((from[0] * Math.PI) / 180)) ** 2)

      t += (speedMs * dt) / dist
      if (t >= 1) {
        t = 0
        seg = (seg + 1) % (polyline.length - 1)
      }

      const lat = from[0] + (to[0] - from[0]) * t
      const lng = from[1] + (to[1] - from[1]) * t
      setPosition({ lat, lng, speed: speedKmh })

      raf.current = requestAnimationFrame(step)
    }

    raf.current = requestAnimationFrame(step)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [enabled, polyline, speedKmh])

  return position
}
