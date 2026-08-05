import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

export const SocketProvider = ({ children }) => {
  const { user } = useAuth()
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [busLocations, setBusLocations] = useState({})

  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect()
      setConnected(false)
      return
    }

    const socketUrl = import.meta.env.VITE_API_URL || '/'
    const socket = io(socketUrl, {
      auth: { token: localStorage.getItem('bustrack_token') },
      transports: ['websocket'],
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      if (user.role === 'admin') {
        socket.emit('admin:join', { adminId: user._id })
      }
    })

    socket.on('disconnect', () => setConnected(false))

    socket.on('bus:location_update', (data) => {
      setBusLocations(prev => ({
        ...prev,
        [data.busId]: {
          lat: data.lat,
          lng: data.lng,
          speed: data.speed,
          heading: data.heading,
          timestamp: data.timestamp,
        },
      }))
    })

    return () => {
      socket.disconnect()
      setConnected(false)
    }
  }, [user])

  // ✅ Stable references — wrapped in useCallback so they never cause re-renders
  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data)
  }, [])

  const on = useCallback((event, handler) => {
    socketRef.current?.on(event, handler)
    return () => socketRef.current?.off(event, handler)
  }, [])

  const off = useCallback((event, handler) => {
    socketRef.current?.off(event, handler)
  }, [])

  return (
    <SocketContext.Provider value={{ connected, busLocations, emit, on, off }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const ctx = useContext(SocketContext)
  if (!ctx) throw new Error('useSocket must be used within SocketProvider')
  return ctx
}
