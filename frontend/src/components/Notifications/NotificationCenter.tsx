import React, { useState, useEffect } from 'react'
import {
  Box,
  Badge,
  IconButton,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Button,
  Divider,
  Chip,
  Avatar,
  Stack,
} from '@mui/material'
import {
  Notifications,
  NotificationsActive,
  Warning,
  Info,
  CheckCircle,
  Person,
  Clear,
  MarkEmailRead,
} from '@mui/icons-material'
import { useNotifications } from '../../contexts/NotificationContext'
import { useAuth } from '../../contexts/AuthContext'
import { useTranslate } from '../../hooks/useTranslate'
import { localizePersonName } from '../../utils/localizePersonName'

const NotificationCenter: React.FC = () => {
  const { user } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications()
  const { t, language } = useTranslate()
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)

  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleMarkAsRead = (notificationId: string) => {
    void markAsRead(notificationId)
  }

  const handleMarkAllAsRead = () => {
    void markAllAsRead()
  }

  const handleClearAll = () => {
    clearNotifications()
    handleClose()
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'emergency':
        return <Warning color="error" />
      case 'new_report':
        return <Info color="info" />
      case 'consultation':
        return <Person color="primary" />
      case 'system':
        return <CheckCircle color="success" />
      default:
        return <Info color="info" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'emergency':
        return '#ffebee'
      case 'new_report':
        return '#e3f2fd'
      case 'consultation':
        return '#f3e5f5'
      case 'system':
        return '#e8f5e8'
      default:
        return '#f5f5f5'
    }
  }

  const localizeName = (name: string, role?: 'doctor' | 'villager' | 'admin') =>
    localizePersonName(name, { language, t, role })

  const formatNotificationTitle = (title: string) => {
    const titleMap: Record<string, string> = {
      'New Health Report': 'New Health Report',
      'Report Deleted': 'Report Deleted',
      'Doctor Response': 'Doctor Response',
      'Doctor Responded': 'Doctor Responded',
      'Appointment Assigned': 'Appointment Assigned',
      'Appointment Deleted': 'Appointment Deleted',
      'New Message': 'New Message',
      'Consultation Message': 'Consultation Message'
    }

    return t(titleMap[title] || title)
  }

  const formatNotificationMessage = (message: string) => {
    const submittedReportMatch = message.match(/^(.+?) submitted a (low|medium|high|emergency) report\.$/i)
    if (submittedReportMatch) {
      const [, name, urgency] = submittedReportMatch
      return t('notifications.reportSubmittedMessage', {
        values: {
          name: localizeName(name, 'villager'),
          urgency: t(urgency.toLowerCase())
        }
      })
    }

    const doctorDeletedMatch = message.match(/^Dr\.\s+(.+?) deleted a health report\.$/i)
    if (doctorDeletedMatch) {
      const [, doctorName] = doctorDeletedMatch
      return t('notifications.reportDeletedMessage', {
        values: {
          doctorName: localizeName(doctorName, 'doctor')
        }
      })
    }

    const doctorRespondedMatch = message.match(/^Dr\.\s+(.+?) responded to your health report\.$/i)
    if (doctorRespondedMatch) {
      const [, doctorName] = doctorRespondedMatch
      return t('notifications.doctorResponseMessage', {
        values: {
          doctorName: localizeName(doctorName, 'doctor')
        }
      })
    }

    const doctorRespondedAdminMatch = message.match(/^Dr\.\s+(.+?) responded to a villager report\.$/i)
    if (doctorRespondedAdminMatch) {
      const [, doctorName] = doctorRespondedAdminMatch
      return t('notifications.doctorRespondedAdminMessage', {
        values: {
          doctorName: localizeName(doctorName, 'doctor')
        }
      })
    }

    const appointmentAssignedMatch = message.match(/^(.+?) appointed you to their case\.$/i)
    if (appointmentAssignedMatch) {
      const [, name] = appointmentAssignedMatch
      return t('notifications.appointmentAssignedMessage', {
        values: {
          name: localizeName(name, 'villager')
        }
      })
    }

    const appointmentAssignedAdminMatch = message.match(/^(.+?) assigned a doctor to a report\.$/i)
    if (appointmentAssignedAdminMatch) {
      const [, name] = appointmentAssignedAdminMatch
      return t('notifications.appointmentAssignedAdminMessage', {
        values: {
          name: localizeName(name, 'villager')
        }
      })
    }

    const appointmentDeletedMatch = message.match(/^Dr\.\s+(.+?) removed their appointment for your report\.$/i)
    if (appointmentDeletedMatch) {
      const [, doctorName] = appointmentDeletedMatch
      return t('notifications.appointmentDeletedMessage', {
        values: {
          doctorName: localizeName(doctorName, 'doctor')
        }
      })
    }

    const appointmentDeletedAdminMatch = message.match(/^Dr\.\s+(.+?) removed an appointment from a report\.$/i)
    if (appointmentDeletedAdminMatch) {
      const [, doctorName] = appointmentDeletedAdminMatch
      return t('notifications.appointmentDeletedAdminMessage', {
        values: {
          doctorName: localizeName(doctorName, 'doctor')
        }
      })
    }

    const consultationMessageMatch = message.match(/^(.+?) sent a new consultation message\.$/i)
    if (consultationMessageMatch) {
      const [, name] = consultationMessageMatch
      return t('notifications.newConsultationMessage', {
        values: {
          name: localizeName(name)
        }
      })
    }

    const consultationAdminMessageMatch = message.match(/^(.+?) sent a consultation message\.$/i)
    if (consultationAdminMessageMatch) {
      const [, name] = consultationAdminMessageMatch
      return t('notifications.consultationMessageAdmin', {
        values: {
          name: localizeName(name)
        }
      })
    }

    return t(message)
  }

  const formatTime = (timestamp: Date | string) => {
    const now = new Date()
    const date = new Date(timestamp)
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return t('notifications.justNow')
    if (minutes < 60) return t('notifications.minutesAgo', { count: minutes })
    if (hours < 24) return t('notifications.hoursAgo', { count: hours })
    return t('notifications.daysAgo', { count: days })
  }

  // Auto-refresh notifications every 30 seconds for doctors
  useEffect(() => {
    if (user?.role === 'doctor') {
      const interval = setInterval(() => {
        // Simulate receiving new notifications
        // Placeholder for real-time updates; integrate with backend later
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [user])

  // Recompute unread from notifications to ensure badge updates reliably
  const computedUnread = Array.isArray(notifications)
    ? notifications.filter(n => !n.read).length
    : 0
  const safeUnread = typeof unreadCount === 'number' ? unreadCount : 0
  const displayUnread = computedUnread ?? safeUnread
  const badgeContent = displayUnread > 0 ? displayUnread : undefined

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        sx={{ mr: 1 }}
      >
        <Badge badgeContent={badgeContent} color="error">
          {displayUnread > 0 ? <NotificationsActive /> : <Notifications />}
         </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { width: 400, maxHeight: 500 }
        }}
      >
        <Box sx={{ px: 2, pt: 1.75, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5 }}>
            <Stack spacing={0.75} sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
                {t('notifications.title')}
              </Typography>
              {displayUnread > 0 && (
                <Typography variant="body2" color="text.secondary">
                  {t('notifications.unreadCount', { count: displayUnread })}
                </Typography>
              )}
            </Stack>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, flexShrink: 0, pt: 0.125 }}>
              {displayUnread > 0 && (
                <Button
                  size="small"
                  onClick={handleMarkAllAsRead}
                  startIcon={<MarkEmailRead />}
                  sx={{ whiteSpace: 'nowrap', minWidth: 'auto' }}
                >
                  {t('notifications.markAllRead')}
                </Button>
              )}
              <IconButton size="small" onClick={handleClearAll} sx={{ alignSelf: 'flex-start', mt: -0.25 }}>
                <Clear />
              </IconButton>
            </Box>
          </Box>
        </Box>

        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {t('notifications.noNotifications')}
            </Typography>
          </Box>
        ) : (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  sx={{
                    bgcolor: notification.read ? 'transparent' : getNotificationColor(notification.type),
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: notification.read ? '#f5f5f5' : getNotificationColor(notification.type),
                    }
                  }}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <ListItemIcon>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'transparent' }}>
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: notification.read ? 400 : 600 }}>
                          {formatNotificationTitle(notification.title)}
                        </Typography>
                        {!notification.read && (
                          <Chip label={t('New')} size="small" color="primary" />
                        )}
                        {notification.type === 'emergency' && (
                          <Chip label={t('Emergency')} size="small" color="error" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {formatNotificationMessage(notification.message)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatTime(notification.timestamp)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < notifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Popover>
    </>
  )
}

export default NotificationCenter
