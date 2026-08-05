import { createContext, useContext, useState, useEffect } from 'react'
import { login as loginApi, getMe } from '../api/auth'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount: restore session from localStorage
  useEffect(() => {
    const token    = localStorage.getItem('bustrack_token')
    const userData = localStorage.getItem('bustrack_user')

    if (token && userData) {
      try {
        // Immediately set user from cache so app loads fast
        const cachedUser = JSON.parse(userData)
        setUser(cachedUser)

        // Verify token in background — if it fails, keep cache (don't log out)
        getMe()
          .then(res => {
            if (res.data?.user) setUser(res.data.user)
          })
          .catch(() => {
            // Token verify failed but we keep cached user
            // Only clear if token truly expired (401 handled in axios interceptor)
            console.warn('Token verify failed — using cached session')
          })
          .finally(() => setLoading(false))
      } catch {
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const res = await loginApi({ email, password })
    const { token, user: userData } = res.data

    localStorage.setItem('bustrack_token', token)
    localStorage.setItem('bustrack_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const logout = () => {
    localStorage.removeItem('bustrack_token')
    localStorage.removeItem('bustrack_user')
    setUser(null)
    toast.success('Logged out successfully')
  }

  const updateUser = (updated) => {
    const merged = { ...user, ...updated }
    localStorage.setItem('bustrack_user', JSON.stringify(merged))
    setUser(merged)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
