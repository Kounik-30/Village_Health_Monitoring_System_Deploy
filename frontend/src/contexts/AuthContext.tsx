import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authApi, getAccessToken, usersApi } from '../services/api'
import type { RegisterData, User } from '../types/models'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<User>
  register: (userData: RegisterData) => Promise<User>
  logout: () => Promise<void>
  loading: boolean
  updateProfile: (updates: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const restoreSession = async () => {
      if (!getAccessToken()) {
        setLoading(false)
        return
      }

      try {
        const currentUser = await authApi.me()
        setUser(currentUser)
      } catch (error) {
        console.error('Failed to restore user session:', error)
        await authApi.logout()
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    void restoreSession()
  }, [])

  const login = async (email: string, password: string): Promise<User> => {
    setLoading(true)
    try {
      const currentUser = await authApi.login(email, password)
      setUser(currentUser)
      return currentUser
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || error?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData: RegisterData): Promise<User> => {
    setLoading(true)
    try {
      const currentUser = await authApi.register(userData)
      setUser(currentUser)
      return currentUser
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || error?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout request failed:', error)
    }
    setUser(null)
  }

  const updateProfile: AuthContextType['updateProfile'] = async (updates) => {
    if (!user) return
    try {
      await usersApi.updateProfile(updates)
      const refreshedUser = await authApi.me()
      setUser(refreshedUser)
    } catch (error) {
      console.error('Failed to update profile:', error)
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    loading,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
