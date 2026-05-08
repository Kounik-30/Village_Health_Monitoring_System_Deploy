import React, { createContext, useCallback, useContext, useReducer, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import NotificationService from '../services/NotificationService'
import type { AppNotification } from '../services/NotificationService'
import { notificationsApi } from '../services/api'
import Snackbar from '@mui/material/Snackbar'
import Slide from '@mui/material/Slide'
import type { SlideProps } from '@mui/material/Slide'
import {
  Box,
  IconButton,
  Typography
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import {
  CheckCircleRounded,
  CloseRounded,
  ErrorOutlineRounded,
  InfoOutlined,
  WarningAmberRounded
} from '@mui/icons-material'
import { useTranslate } from '../hooks/useTranslate'

interface NotificationState {
  notifications: AppNotification[]
  unreadCount: number
}

type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: AppNotification }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'LOAD_NOTIFICATIONS'; payload: AppNotification[] }

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0
}

function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      const newNotifications = [action.payload, ...state.notifications]
      return {
        notifications: newNotifications,
        unreadCount: newNotifications.filter(n => !n.read).length
      }
    
    case 'MARK_AS_READ':
      const updatedNotifications = state.notifications.map(n =>
        n.id === action.payload ? { ...n, read: true } : n
      )
      return {
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter(n => !n.read).length
      }
    
    case 'MARK_ALL_AS_READ':
      const allReadNotifications = state.notifications.map(n => ({ ...n, read: true }))
      return {
        notifications: allReadNotifications,
        unreadCount: 0
      }
    
    case 'REMOVE_NOTIFICATION':
      const filteredNotifications = state.notifications.filter(n => n.id !== action.payload)
      return {
        notifications: filteredNotifications,
        unreadCount: filteredNotifications.filter(n => !n.read).length
      }
    
    case 'LOAD_NOTIFICATIONS':
      return {
        notifications: action.payload,
        unreadCount: action.payload.filter(n => !n.read).length
      }
    
    default:
      return state
  }
}

interface NotificationContextType {
  notifications: AppNotification[]
  unreadCount: number
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp'>) => void
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  removeNotification: (id: string) => void
  clearNotifications: () => void
  showToast: (message: string, options?: { severity?: 'success' | 'info' | 'warning' | 'error', autoHideDuration?: number }) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

interface ToastState {
  id: number
  message: string
  severity: 'success' | 'info' | 'warning' | 'error'
  duration: number
}

function SlideLeftTransition(props: SlideProps) {
  return <Slide {...props} direction="left" />
}

export type { AppNotification } from '../services/NotificationService'
export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState)
  const { user } = useAuth()
  const { t } = useTranslate()
  const theme = useTheme()

  // Toast state
  const [toastOpen, setToastOpen] = useState(false)
  const [currentToast, setCurrentToast] = useState<ToastState | null>(null)
  const [queuedToast, setQueuedToast] = useState<ToastState | null>(null)
  const [progressActive, setProgressActive] = useState(false)
  const duplicateToastRef = useRef<{ signature: string; timestamp: number } | null>(null)

  useEffect(() => {
    if (!toastOpen || !currentToast) {
      setProgressActive(false)
      return
    }

    setProgressActive(false)
    const frame = window.requestAnimationFrame(() => {
      setProgressActive(true)
    })

    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [currentToast?.id, toastOpen])

  const toastMeta = useMemo(() => {
    switch (currentToast?.severity || 'success') {
      case 'success':
        return {
          title: t('Success'),
          icon: <CheckCircleRounded fontSize="small" />,
          accent: theme.palette.success.main
        }
      case 'error':
        return {
          title: t('Error'),
          icon: <ErrorOutlineRounded fontSize="small" />,
          accent: theme.palette.error.main
        }
      case 'warning':
        return {
          title: t('Warning'),
          icon: <WarningAmberRounded fontSize="small" />,
          accent: theme.palette.warning.main
        }
      default:
        return {
          title: t('Information'),
          icon: <InfoOutlined fontSize="small" />,
          accent: theme.palette.info.main
        }
    }
  }, [currentToast?.severity, t, theme])

  const translatedToastMessage = useMemo(
    () => (currentToast?.message ? t(currentToast.message) : ''),
    [currentToast?.message, t]
  )

  useEffect(() => {
    const loadNotifications = async () => {
      if (!user) {
        dispatch({ type: 'LOAD_NOTIFICATIONS', payload: [] })
        return
      }

      try {
        const notifications = await notificationsApi.list()
        dispatch({ type: 'LOAD_NOTIFICATIONS', payload: notifications })
      } catch (error) {
        console.error('Error loading notifications:', error)
      }
    }

    void loadNotifications()
  }, [user])

  useEffect(() => {
    if (!user) return

    const unsubscribe = NotificationService.subscribe((notification) => {
      dispatch({ type: 'ADD_NOTIFICATION', payload: notification })
      NotificationService.showBrowserNotification(notification)
      NotificationService.playNotificationSound(notification.type)
    })

    NotificationService.startMonitoring(user.role, user.id)
    void NotificationService.requestNotificationPermission()

    return () => {
      unsubscribe()
      NotificationService.stopMonitoring()
    }
  }, [user])

  const addNotification = useCallback((notification: Omit<AppNotification, 'id' | 'timestamp'>) => {
    const newNotification: AppNotification = {
      ...notification,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    }
    dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification })
  }, [])

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationsApi.markAsRead(id)
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
    dispatch({ type: 'MARK_AS_READ', payload: id })
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllAsRead()
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
    dispatch({ type: 'MARK_ALL_AS_READ' })
  }, [])

  const removeNotification = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id })
  }, [])

  const clearNotifications = useCallback(() => {
    void markAllAsRead()
  }, [markAllAsRead])

  const showToast: NotificationContextType['showToast'] = useCallback((message, options) => {
    const severity = options?.severity || 'success'
    const duration = options?.autoHideDuration ?? 3000
    const signature = `${severity}:${message}`
    const now = Date.now()

    if (
      duplicateToastRef.current &&
      duplicateToastRef.current.signature === signature &&
      now - duplicateToastRef.current.timestamp < 1200
    ) {
      return
    }

    duplicateToastRef.current = { signature, timestamp: now }
    const nextToast: ToastState = {
      id: now,
      message,
      severity,
      duration
    }

    if (toastOpen) {
      setQueuedToast(nextToast)
      setToastOpen(false)
      return
    }

    setQueuedToast(null)
    setCurrentToast(nextToast)
    setToastOpen(true)
  }, [toastOpen])

  const handleToastClose = useCallback((_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return
    setToastOpen(false)
  }, [])

  const handleToastExited = useCallback(() => {
    if (queuedToast) {
      setCurrentToast(queuedToast)
      setQueuedToast(null)
      setToastOpen(true)
      return
    }

    setCurrentToast(null)
  }, [queuedToast])

  const value = useMemo<NotificationContextType>(() => ({
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearNotifications,
    showToast
  }), [addNotification, clearNotifications, markAllAsRead, markAsRead, removeNotification, showToast, state.notifications, state.unreadCount])

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {/* Global Toast Snackbar */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={currentToast?.duration ?? 3000}
        onClose={handleToastClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        TransitionComponent={SlideLeftTransition}
        TransitionProps={{ onExited: handleToastExited }}
        sx={{
          zIndex: (theme) => theme.zIndex.snackbar,
          top: { xs: 8, sm: 16 },
          right: { xs: 8, sm: 16 },
          left: 'auto',
          maxWidth: { xs: 'calc(100vw - 16px)', sm: 460 }
        }}
      >
        <Box
          sx={{
            width: { xs: 'calc(100vw - 16px)', sm: 380 },
            maxWidth: '100%',
            overflow: 'hidden',
            borderRadius: 3,
            border: `1px solid ${alpha(toastMeta.accent, theme.palette.mode === 'dark' ? 0.3 : 0.18)}`,
            bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.96 : 0.98),
            boxShadow:
              theme.palette.mode === 'dark'
                ? `0 18px 45px ${alpha('#000000', 0.38)}`
                : `0 16px 36px ${alpha('#0f1720', 0.14)}`,
            backdropFilter: 'blur(14px)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, px: 2, py: 1.75 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: toastMeta.accent,
                bgcolor: alpha(toastMeta.accent, theme.palette.mode === 'dark' ? 0.18 : 0.1),
                boxShadow: `0 0 0 6px ${alpha(toastMeta.accent, theme.palette.mode === 'dark' ? 0.08 : 0.05)}`
              }}
            >
              {toastMeta.icon}
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.25 }}>
                {toastMeta.title}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.5, wordBreak: 'break-word' }}>
                {translatedToastMessage}
              </Typography>
            </Box>
            <IconButton
              onClick={() => setToastOpen(false)}
              size="small"
              aria-label={t('Close')}
              sx={{
                mt: -0.5,
                color: 'text.secondary',
                '&:hover': {
                  color: 'text.primary',
                  bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.08 : 0.05)
                }
              }}
            >
              <CloseRounded fontSize="small" />
            </IconButton>
          </Box>
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: 5,
              overflow: 'hidden',
              borderTop: `1px solid ${alpha(toastMeta.accent, theme.palette.mode === 'dark' ? 0.14 : 0.08)}`,
              bgcolor: alpha(toastMeta.accent, theme.palette.mode === 'dark' ? 0.09 : 0.05),
              borderBottomLeftRadius: 12,
              borderBottomRightRadius: 12,
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(90deg, ${alpha(toastMeta.accent, 1)} 0%, ${alpha(toastMeta.accent, theme.palette.mode === 'dark' ? 0.92 : 0.82)} 65%, ${alpha(toastMeta.accent, 0.72)} 100%)`,
                boxShadow: `0 0 12px ${alpha(toastMeta.accent, theme.palette.mode === 'dark' ? 0.42 : 0.22)}`,
                transformOrigin: 'left center',
                transform: `scaleX(${progressActive ? 0 : 1})`,
                transition: currentToast ? `transform ${currentToast.duration}ms linear` : 'none',
                willChange: 'transform'
              }
            }}
          />
        </Box>
      </Snackbar>
    </NotificationContext.Provider>
  )
}
