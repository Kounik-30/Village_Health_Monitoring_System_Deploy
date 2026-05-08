import React, { useState, useEffect } from 'react'
// Removed unused navigation and translation hooks
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Badge,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  // Removed ListItemSecondaryAction as it's unused
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  CircularProgress
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import {
  // Dashboard, // removed unused icon
  Notifications,
  People,
  Assignment,
  Warning,
  Chat,
  VideoCall,
  Phone,
  Send,
  Delete
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import LocationMap from '../Communication/LocationMap'
import NotificationService from '../../services/NotificationService'
import { Routes, Route } from 'react-router-dom'
import Profile from '../Profile/Profile'
import { reportsApi } from '../../services/api'
import type { HealthReport } from '../../types/models'
import { useTranslate } from '../../hooks/useTranslate'
import { localizePersonName } from '../../utils/localizePersonName'
import { localizeMedicalList } from '../../utils/medicalLabels'

const DoctorDashboard: React.FC = () => {
  const { t, language } = useTranslate()
  const theme = useTheme()
  const [reports, setReports] = useState<HealthReport[]>([])
  const [activeTab, setActiveTab] = useState(0)
  const [selectedReport, setSelectedReport] = useState<HealthReport | null>(null)
  const [responseDialog, setResponseDialog] = useState(false)
  const [response, setResponse] = useState({
    advice: '',
    prescription: '',
    followUpDays: 7
  })

  const { user } = useAuth()
  const { showToast, unreadCount, notifications } = useNotifications()
  // const navigate = useNavigate() // removed unused navigation
  // Compute unread from context first for consistency with top bell icon; fallback to local calculation if needed
  const displayUnread = (typeof unreadCount === 'number' ? unreadCount : (Array.isArray(notifications) ? notifications.filter(n => !n.read).length : 0))
  // Add per-doctor hidden reports list (to hide deleted cases from this doctor's view only)
  const [hiddenReportIds, setHiddenReportIds] = useState<string[]>([])
  // Delete confirmation modal state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [reportPendingDelete, setReportPendingDelete] = useState<HealthReport | null>(null)
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null)
  // NEW: consultations state for real-time rendering
  // const [consultations, setConsultations] = useState<any[]>([]) // removed unused state

  const formatPersonName = (name: string, role?: 'doctor' | 'villager' | 'admin') =>
    localizePersonName(name, { language, t, role })

  const formatSymptoms = (symptoms?: string | null) =>
    localizeMedicalList(symptoms, { t })

  const translateUrgency = (urgency?: string) => t(String(urgency || '').toLowerCase())
  const translateStatus = (status?: string) => t(String(status || '').toLowerCase())

  useEffect(() => {
    if (user) {
      loadReports()
      // Initial load of consultations for this doctor
      // const cons = JSON.parse(localStorage.getItem(`consultations_doctor_${user.id}`) || '[]')
      // setConsultations(Array.isArray(cons) ? cons : [])
    }
  }, [user])
  // Subscribe to appointment notifications for this doctor to show success toast
  useEffect(() => {
    if (!user) return
    const unsubscribe = NotificationService.subscribe((notification) => {
      if (notification.userId === user.id && notification.title === 'Appointment Assigned') {
        showToast('Appointment sent successfully', { severity: 'success', autoHideDuration: 3000 })
        // Refresh consultations on appointment events
        // const cons = JSON.parse(localStorage.getItem(`consultations_doctor_${user.id}`) || '[]')
        // setConsultations(Array.isArray(cons) ? cons : [])
      }
    })
    return () => {
      unsubscribe()
    }
  }, [showToast, user])
  
  // Poll for real-time updates to reports only (removed consultations polling)
  useEffect(() => {
    if (!user) return
    // Immediate initial load so new reports appear instantly without waiting for polling
    loadReports()
    const interval = setInterval(() => {
      loadReports()
    }, 500)
    return () => clearInterval(interval)
  }, [user])

  // React instantly to cross-tab/localStorage updates to 'allReports'
  useEffect(() => {
    if (!user) return
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'allReports') {
        loadReports()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('storage', onStorage)
    }
  }, [user])
  // Removed unused t and navigate

  // React instantly to in-tab custom events that indicate updates to 'allReports'
  useEffect(() => {
    if (!user) return
    const onCustom = () => {
      loadReports()
    }
    window.addEventListener('allReportsUpdated', onCustom as EventListener)
    return () => {
      window.removeEventListener('allReportsUpdated', onCustom as EventListener)
    }
  }, [user])
  // Removed unused t and navigate
  
  // Ensure hooks are always called in the same order
  // Duplicate effect removed to avoid redundant loadReports calls
  // useEffect(() => {
  //   if (user) {
  //     loadReports()
  //   }
  // }, [user])
  // Remove duplicate effect to maintain consistent hook order
  // useEffect(() => {
  //   loadReports()
  // }, [])
  
  // Guard against null user to prevent runtime errors and blank screen
  if (!user) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Alert severity="info">{t('Loading dashboard...')}</Alert>
        </Box>
      </Container>
    )
  }

  const loadReports = async () => {
    try {
      const allReports = await reportsApi.list()
      const reportsWithUserInfo = allReports.map((report: any) => ({
        ...report,
        createdAt: new Date(report.createdAt),
        voiceMessage: report.voiceMessage ? {
          ...report.voiceMessage,
          uploadedAt: report.voiceMessage.uploadedAt ? new Date(report.voiceMessage.uploadedAt) : new Date()
        } : undefined,
        attachments: Array.isArray(report.attachments) ? report.attachments.map((a: any) => ({
          ...a,
          uploadedAt: a.uploadedAt ? new Date(a.uploadedAt) : new Date()
        })) : undefined,
        responses: Array.isArray(report.responses) ? report.responses.map((resp: any) => ({
          ...resp,
          respondedAt: new Date(resp.respondedAt),
          followUpDate: resp.followUpDate ? new Date(resp.followUpDate) : undefined
        })) : []
      }))

      setReports(reportsWithUserInfo.sort((a: any, b: any) => {
        // Sort by urgency first, then by date
        const urgencyOrder: Record<'emergency' | 'high' | 'medium' | 'low', number> = { emergency: 4, high: 3, medium: 2, low: 1 }
        const aUrgency = a.urgency as 'emergency' | 'high' | 'medium' | 'low'
        const bUrgency = b.urgency as 'emergency' | 'high' | 'medium' | 'low'
        if (urgencyOrder[aUrgency] !== urgencyOrder[bUrgency]) {
          return urgencyOrder[bUrgency] - urgencyOrder[aUrgency]
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }))
    } catch (error) {
      console.error('Error loading reports:', error)
    }
  }

  const getFilteredReports = () => {
    // Always hide reports the current doctor removed (per-doctor hidden list)
    const visibleReports = reports
      .filter(r => !hiddenReportIds.includes(r.id))

    switch (activeTab) {
      case 0: // All
        return visibleReports
      case 1: // Pending (for this doctor)
        return visibleReports.filter(r => !hasDoctorResponded(r, user!.id))
      case 2: // Emergency (pending for this doctor)
        return visibleReports.filter(r => r.urgency === 'emergency' && !hasDoctorResponded(r, user!.id))
      case 3: // Reviewed (responded by this doctor)
        return visibleReports.filter(r => hasDoctorResponded(r, user!.id))
      default:
        return visibleReports
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'low': return theme.palette.success.main
      case 'medium': return theme.palette.warning.main
      case 'high': return theme.palette.error.light
      case 'emergency': return theme.palette.error.main
      default: return theme.palette.text.secondary
    }
  }

  const getUrgencyChipSx = (urgency: string) => {
    const color = getUrgencyColor(urgency)

    return {
      bgcolor: color,
      color: theme.palette.getContrastText(color),
      fontWeight: 'bold'
    }
  }

  const getReportItemSx = (urgency: string) => {
    const accentColor = urgency === 'emergency' ? theme.palette.error.main : theme.palette.primary.main

    return {
      border: '1px solid',
      borderColor:
        urgency === 'emergency'
          ? alpha(theme.palette.error.main, theme.palette.mode === 'dark' ? 0.38 : 0.22)
          : theme.palette.divider,
      borderRadius: 2,
      mb: 1.5,
      bgcolor:
        urgency === 'emergency'
          ? alpha(theme.palette.error.main, theme.palette.mode === 'dark' ? 0.14 : 0.08)
          : alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.92 : 1),
      boxShadow:
        urgency === 'emergency' && theme.palette.mode === 'dark'
          ? `0 0 0 1px ${alpha(theme.palette.error.main, 0.18)}`
          : 'none',
      alignItems: 'flex-start',
      pr: { xs: 2, sm: 22 },
      flexWrap: 'wrap',
      '& .MuiListItemSecondaryAction-root': {
        position: { xs: 'static', sm: 'absolute' },
        top: { sm: '50%' },
        transform: { xs: 'none', sm: 'translateY(-50%)' },
        right: { sm: 16 },
        mt: { xs: 1.5, sm: 0 },
        width: { xs: '100%', sm: 'auto' },
        maxWidth: '100%'
      },
      '& .MuiIconButton-root': {
        color: accentColor
      }
    }
  }

  const responseCardSx = {
    p: 1.25,
    bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.14 : 0.05),
    border: '1px solid',
    borderColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.24 : 0.12),
    borderRadius: 1.5,
    mb: 1.25
  }

  const detailSurfaceSx = {
    mb: 2,
    p: 1.25,
    bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.08 : 0.03),
    border: '1px solid',
    borderColor: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.14 : 0.08),
    borderRadius: 1.5,
    color: 'text.primary'
  }

  const reportSecondaryActionSx = {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    alignItems: { xs: 'stretch', sm: 'flex-end' },
    width: { xs: '100%', sm: 'auto' },
    minWidth: { sm: 180 },
    maxWidth: '100%'
  }

  const reportActionButtonSx = {
    width: { xs: '100%', sm: 'auto' },
    maxWidth: '100%',
    minWidth: { sm: 'fit-content' },
    whiteSpace: 'normal',
    textAlign: 'center',
    justifyContent: 'center',
    lineHeight: 1.3
  }

  const reportIconActionsSx = {
    display: 'flex',
    gap: 1,
    flexWrap: 'wrap',
    justifyContent: { xs: 'space-between', sm: 'flex-end' },
    width: { xs: '100%', sm: 'auto' }
  }

  const formatLocationSummary = (location?: HealthReport['location']) => {
    if (!location) return ''

    const hasCoordinates =
      typeof location.latitude === 'number' && Number.isFinite(location.latitude) &&
      typeof location.longitude === 'number' && Number.isFinite(location.longitude)
    const coordinateText = hasCoordinates ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : ''
    const primaryText = location.address || coordinateText

    return `${location.text ? `${location.text} — ` : ''}${primaryText}`.trim()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning'
      case 'reviewed': return 'info'
      case 'resolved': return 'success'
      default: return 'default'
    }
  }

  // Helper: whether current doctor has already responded to this report
  const hasDoctorResponded = (report: HealthReport, doctorId: string) => {
    return Array.isArray(report.responses) && report.responses.some((resp) => resp.doctorId === doctorId)
  }

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const handleRespondToReport = (report: HealthReport) => {
    setSelectedReport(report)
    setResponseDialog(true)
  }
  const openDeleteDialog = (report: HealthReport) => {
    setReportPendingDelete(report)
    setDeleteDialogOpen(true)
  }
  const handleConfirmDelete = async () => {
    if (!reportPendingDelete || deletingReportId) return

    await handleDeleteReport(reportPendingDelete)
  }
  const handleCancelDelete = () => {
    if (deletingReportId) return
    setDeleteDialogOpen(false)
    setReportPendingDelete(null)
  }

  const submitResponse = async () => {
    if (!selectedReport || !response.advice) return

    // Prevent responses if a doctor is already appointed and it's not the current doctor
    if (selectedReport.assignedDoctorId && selectedReport.assignedDoctorId !== user!.id) {
      setResponseDialog(false)
      return
    }

    try {
      await reportsApi.respond(selectedReport.id, {
        advice: response.advice,
        prescription: response.prescription || undefined,
        followUpDate: response.followUpDays > 0
          ? new Date(Date.now() + response.followUpDays * 24 * 60 * 60 * 1000)
          : undefined
      })

      window.dispatchEvent(new CustomEvent('allReportsUpdated', { detail: { reason: 'doctor_response', reportId: selectedReport.id } }))
      window.dispatchEvent(new CustomEvent('consultations_updated', { detail: { userId: selectedReport.userId, doctorId: user!.id, reportId: selectedReport.id } }))
      await loadReports()

      // Reset form and close dialog
      setResponse({ advice: '', prescription: '', followUpDays: 7 })
      setResponseDialog(false)
      setSelectedReport(null)

      // Show success toast
      showToast('Responded successfully', { severity: 'success', autoHideDuration: 3000 })
    } catch (error) {
      console.error('Error submitting response:', error)
      showToast('Failed to submit response', { severity: 'error', autoHideDuration: 3000 })
    }
  }

  const handleDeleteReport = async (report: HealthReport) => {
    if (!user) return

    setDeletingReportId(report.id)

    try {
      await reportsApi.remove(report.id)

      setReports((current) => current.filter((item) => item.id !== report.id))
      setHiddenReportIds((current) => current.filter((id) => id !== report.id))
      setDeleteDialogOpen(false)
      setReportPendingDelete(null)

      if (selectedReport?.id === report.id) {
        setResponseDialog(false)
        setSelectedReport(null)
      }

      window.dispatchEvent(
        new CustomEvent('allReportsUpdated', {
          detail: { reason: 'report_delete', reportId: report.id, deletedBy: user.id }
        })
      )
      window.dispatchEvent(
        new CustomEvent('consultations_updated', {
          detail: { reportId: report.id, deletedBy: user.id }
        })
      )
      window.dispatchEvent(
        new CustomEvent('reports_updated', {
          detail: { reportId: report.id, deletedBy: user.id }
        })
      )

      showToast('Report deleted successfully', { severity: 'success', autoHideDuration: 3000 })
    } catch (error) {
      console.error('Error deleting report:', error)
      showToast('Failed to delete report', { severity: 'error', autoHideDuration: 3000 })
    } finally {
      setDeletingReportId(null)
    }
  }

    // Derive counts from the same visible set as the doctor sees
    const visibleReports = reports
      .filter(r => !hiddenReportIds.includes(r.id))
    const pendingCount = visibleReports.filter(r => !hasDoctorResponded(r, user!.id)).length
    const emergencyCount = visibleReports.filter(r => r.urgency === 'emergency' && !hasDoctorResponded(r, user!.id)).length
    const todayCount = visibleReports.filter(r => {
      const today = new Date()
      const reportDate = new Date(r.createdAt)
      return reportDate.toDateString() === today.toDateString()
    }).length

    return (
      <Container maxWidth="lg">
        <Routes>
          {/* Index Dashboard Overview */}
          <Route index element={
            <Box sx={{ mt: 2 }}>
              {/* Welcome Section */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                  {t('Welcome')}, {user?.fullName ? formatPersonName(user.fullName, 'doctor') : t('Doctor')}! 👋
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {t('Here is an overview of your current activities and reports.')}
                </Typography>
              </Box>
              {/* Overview Cards */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Badge badgeContent={pendingCount} color="warning" overlap="circular">
                          <Assignment fontSize="large" sx={{ color: 'success.main' }} />
                        </Badge>
                        <Typography variant="h6" sx={{ mt: 1 }}>{t('Pending Reports')}</Typography>
                        <Typography variant="h4" sx={{ color: 'warning.main', fontWeight: 'bold' }}>{pendingCount}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Warning fontSize="large" sx={{ color: 'error.main' }} />
                        <Typography variant="h6" sx={{ mt: 1 }}>{t('Emergency Cases')}</Typography>
                        <Typography variant="h4" sx={{ color: 'error.main', fontWeight: 'bold' }}>{emergencyCount}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <People fontSize="large" sx={{ color: 'primary.main' }} />
                        <Typography variant="h6" sx={{ mt: 1 }}>{t("Today's Reports")}</Typography>
                        <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 'bold' }}>{todayCount}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Notifications fontSize="large" sx={{ color: 'primary.main' }} />
                        <Typography variant="h6" sx={{ mt: 1 }}>{t('Notifications')}</Typography>
                        <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 'bold' }}>{displayUnread}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Patient Reports (Index view) */}
              <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                  {t('Patient Reports')}
                </Typography>
                <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
                  <Tab label={`${t('All')} (${visibleReports.length})`} />
                  <Tab label={`${t('Pending')} (${pendingCount})`} />
                  <Tab label={`${t('Emergency')} (${emergencyCount})`} />
                  <Tab label={`${t('Reviewed')} (${visibleReports.filter(r => r.status === 'reviewed').length})`} />
                </Tabs>
                {getFilteredReports().length === 0 ? (
                  <Alert severity="info">{t('No reports found in this category.')}</Alert>
                ) : (
                  <List>
                    {getFilteredReports().map((report) => (
                      <ListItem
                        key={report.id}
                        sx={getReportItemSx(report.urgency)}
                        secondaryAction={
                          <Box sx={reportSecondaryActionSx}>
                            {(!report.assignedDoctorId || report.assignedDoctorId === user!.id) && (
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<Send />}
                                onClick={() => handleRespondToReport(report)}
                                sx={reportActionButtonSx}
                              >
                                {report.assignedDoctorId === user!.id ? t('Continue') : t('Respond')}
                              </Button>
                            )}
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              startIcon={<Delete />}
                              onClick={() => openDeleteDialog(report)}
                              disabled={deletingReportId === report.id}
                              sx={reportActionButtonSx}
                            >
                              {deletingReportId === report.id ? t('Deleting...') : t('Delete Report')}
                            </Button>
                            <Box sx={reportIconActionsSx}>
                              <Tooltip title={t('Open Chat')}>
                                <IconButton size="small" color="primary" aria-label={t('Open Chat')}>
                                  <Chat />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={t('Start Voice Call')}>
                                <IconButton size="small" color="primary" aria-label={t('Start Voice Call')}>
                                  <Phone />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={t('Start Video Call')}>
                                <IconButton size="small" color="primary" aria-label={t('Start Video Call')}>
                                  <VideoCall />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        }
                      >
                       <ListItemText
                         secondaryTypographyProps={{ component: 'div', color: 'text.primary' }}
                         primary={
                           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                             <Typography variant="h6">
                               {formatPersonName(report.userName || '', 'villager')}
                             </Typography>
                             {report.urgency === 'emergency' && (
                               <Warning sx={{ color: 'error.main' }} />
                             )}
                             <Chip
                              label={translateUrgency(report.urgency)}
                               size="small"
                               sx={getUrgencyChipSx(report.urgency)}
                             />
                             <Chip
                              label={translateStatus(report.status)}
                               size="small"
                               color={getStatusColor(report.status) as any}
                               variant="outlined"
                             />
                           </Box>
                         }
                         secondary={
                           <Box>
                             <Typography variant="body2" gutterBottom>
                               <strong>{t('Symptoms')}:</strong> {formatSymptoms(report.symptoms)}
                             </Typography>
                             {report.description && (
                               <Typography variant="body2" gutterBottom>
                                 <strong>{t('Description')}:</strong> {report.description}
                               </Typography>
                             )}
                             {report.voiceMessage?.dataUrl && (
                               <Box sx={{ mt: 1 }}>
                                 <Typography variant="subtitle2" gutterBottom>
                                   {t('Voice Message')}
                                 </Typography>
                                 <audio controls src={report.voiceMessage.dataUrl} style={{ width: '100%' }}>
                                   Your browser does not support the audio element.
                                 </audio>
                               </Box>
                             )}
                             {Array.isArray(report.attachments) && report.attachments.length > 0 && (
                               <Box sx={{ mt: 1 }}>
                                 <Typography variant="subtitle2" gutterBottom>
                                   {t('Attachments')}
                                 </Typography>
                                 <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                   {report.attachments.map((att, idx) => (
                                     <Button
                                       key={`${att.name}_${idx}`}
                                       component="a"
                                       href={att.dataUrl}
                                       download={att.name}
                                       variant="outlined"
                                       size="small"
                                     >
                                       {att.name}
                                     </Button>
                                   ))}
                                 </Box>
                               </Box>
                             )}
                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                               <Typography variant="caption">
                                 {formatDate(report.createdAt)}
                               </Typography>
                               {report.userVillage && (
                                 <Typography variant="caption">
                                   {t('Village')}: {report.userVillage}
                                 </Typography>
                               )}
                             </Box>
                             {report.location && (
                               <Box sx={{ mt: 1 }}>
                                 <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-word', overflowWrap: 'anywhere', whiteSpace: 'normal' }}>
                                  {t('Location')}: {formatLocationSummary(report.location)}
                                 </Typography>
                                {typeof report.location.latitude === 'number' && typeof report.location.longitude === 'number' && (
                                <Box sx={{ mt: 1.5, mb: 1, width: '100%', maxWidth: 500 }}>
                                    <LocationMap
                                      latitude={report.location.latitude}
                                      longitude={report.location.longitude}
                                      address={report.location.address}
                                      height={150}
                                      showUseMyLocation={false}
                                    />
                                 </Box>
                                )}
                               </Box>
                             )}
                             {Array.isArray(report.responses) && report.responses.length > 0 && (
                               <Box sx={{ mt: 1.5 }}>
                                 <Typography variant="subtitle2" gutterBottom>
                                   {t('Doctor Responses')}
                                 </Typography>
                                 {report.responses.map((resp, idx) => (
                                  <Box key={idx} sx={responseCardSx}>
                                     <Typography variant="body2" gutterBottom>
                                       <strong>{t('Doctor')}:</strong> {formatPersonName(resp.doctorName, 'doctor')}
                                     </Typography>
                                     <Typography variant="body2" gutterBottom>
                                       <strong>{t('Advice')}:</strong> {resp.advice}
                                     </Typography>
                                     {resp.prescription && (
                                       <Typography variant="body2" gutterBottom>
                                         <strong>{t('Prescription')}:</strong> {resp.prescription}
                                       </Typography>
                                     )}
                                     <Box sx={{ display: 'flex', gap: 2 }}>
                                       <Typography variant="caption" color="text.secondary">
                                         {t('Responded')}: {formatDate(resp.respondedAt as Date)}
                                       </Typography>
                                       {resp.followUpDate && (
                                         <Typography variant="caption" color="text.secondary">
                                           {t('Follow-up')}: {formatDate(resp.followUpDate as Date)}
                                         </Typography>
                                       )}
                                     </Box>
                                   </Box>
                                 ))}
                               </Box>
                             )}
                           </Box>
                         }
                       />
                     </ListItem>
                   ))}
                 </List>
               )}
             </Paper>
            </Box>
          } />

          {/* NEW: Profile route for doctor */}
          <Route path="profile" element={<Profile />} />

          {/* NEW: Dedicated Patient Reports page at /doctor/reports */}
          <Route path="reports" element={
            <Box sx={{ mt: 2 }}>
              <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                  {t('Patient Reports')}
                </Typography>
                <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
                  <Tab label={`${t('All')} (${visibleReports.length})`} />
                  <Tab label={`${t('Pending')} (${pendingCount})`} />
                  <Tab label={`${t('Emergency')} (${emergencyCount})`} />
                  <Tab label={`${t('Reviewed')} (${visibleReports.filter(r => r.status === 'reviewed').length})`} />
                </Tabs>
                {getFilteredReports().length === 0 ? (
                  <Alert severity="info">{t('No reports found in this category.')}</Alert>
                ) : (
                  <List>
                    {getFilteredReports().map((report) => (
                      <ListItem
                        key={report.id}
                        sx={getReportItemSx(report.urgency)}
                        secondaryAction={
                          <Box sx={reportSecondaryActionSx}>
                            {(!report.assignedDoctorId || report.assignedDoctorId === user!.id) && (
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<Send />}
                                onClick={() => handleRespondToReport(report)}
                                sx={reportActionButtonSx}
                              >
                                {report.assignedDoctorId === user!.id ? t('Continue') : t('Respond')}
                              </Button>
                            )}
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              startIcon={<Delete />}
                              onClick={() => openDeleteDialog(report)}
                              disabled={deletingReportId === report.id}
                              sx={reportActionButtonSx}
                            >
                              {deletingReportId === report.id ? t('Deleting...') : t('Delete Report')}
                            </Button>
                            <Box sx={reportIconActionsSx}>
                              <Tooltip title={t('Open Chat')}>
                                <IconButton size="small" color="primary" aria-label={t('Open Chat')}>
                                  <Chat />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={t('Start Voice Call')}>
                                <IconButton size="small" color="primary" aria-label={t('Start Voice Call')}>
                                  <Phone />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={t('Start Video Call')}>
                                <IconButton size="small" color="primary" aria-label={t('Start Video Call')}>
                                  <VideoCall />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        }
                      >
                       <ListItemText
                         secondaryTypographyProps={{ component: 'div', color: 'text.primary' }}
                         primary={
                           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                             <Typography variant="h6">
                               {formatPersonName(report.userName || '', 'villager')}
                             </Typography>
                             {report.urgency === 'emergency' && (
                               <Warning sx={{ color: 'error.main' }} />
                             )}
                             <Chip
                              label={translateUrgency(report.urgency)}
                               size="small"
                               sx={getUrgencyChipSx(report.urgency)}
                             />
                             <Chip
                              label={translateStatus(report.status)}
                               size="small"
                               color={getStatusColor(report.status) as any}
                               variant="outlined"
                             />
                           </Box>
                         }
                         secondary={
                           <Box>
                             <Typography variant="body2" gutterBottom>
                               <strong>{t('Symptoms')}:</strong> {formatSymptoms(report.symptoms)}
                             </Typography>
                             {report.description && (
                               <Typography variant="body2" gutterBottom>
                                 <strong>{t('Description')}:</strong> {report.description}
                               </Typography>
                             )}
                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                               <Typography variant="caption">
                                 {formatDate(report.createdAt)}
                               </Typography>
                               {report.userVillage && (
                                 <Typography variant="caption">
                                   {t('Village')}: {report.userVillage}
                                 </Typography>
                               )}
                             </Box>
                             {report.location && (
                               <Box sx={{ mt: 1 }}>
                                 <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-word', overflowWrap: 'anywhere', whiteSpace: 'normal' }}>
                                  {t('Location')}: {formatLocationSummary(report.location)}
                                 </Typography>
                                {typeof report.location.latitude === 'number' && typeof report.location.longitude === 'number' && (
                                <Box sx={{ mt: 1.5, mb: 1, width: '100%', maxWidth: 500 }}>
                                    <LocationMap
                                      latitude={report.location.latitude}
                                      longitude={report.location.longitude}
                                      address={report.location.address}
                                      height={150}
                                      showUseMyLocation={false}
                                    />
                                 </Box>
                                )}
                               </Box>
                             )}
                             {Array.isArray(report.responses) && report.responses.length > 0 && (
                               <Box sx={{ mt: 1.5 }}>
                                 <Typography variant="subtitle2" gutterBottom>
                                   {t('Doctor Responses')}
                                 </Typography>
                                 {report.responses.map((resp, idx) => (
                                  <Box key={idx} sx={responseCardSx}>
                                     <Typography variant="body2" gutterBottom>
                                       <strong>{t('Doctor')}:</strong> {formatPersonName(resp.doctorName, 'doctor')}
                                     </Typography>
                                     <Typography variant="body2" gutterBottom>
                                       <strong>{t('Advice')}:</strong> {resp.advice}
                                     </Typography>
                                     {resp.prescription && (
                                       <Typography variant="body2" gutterBottom>
                                         <strong>{t('Prescription')}:</strong> {resp.prescription}
                                       </Typography>
                                     )}
                                     <Box sx={{ display: 'flex', gap: 2 }}>
                                       <Typography variant="caption" color="text.secondary">
                                         {t('Responded')}: {formatDate(resp.respondedAt as Date)}
                                       </Typography>
                                       {resp.followUpDate && (
                                         <Typography variant="caption" color="text.secondary">
                                           {t('Follow-up')}: {formatDate(resp.followUpDate as Date)}
                                         </Typography>
                                       )}
                                     </Box>
                                   </Box>
                                 ))}
                               </Box>
                             )}
                           </Box>
                         }
                       />
                     </ListItem>
                   ))}
                 </List>
               )}
             </Paper>
            </Box>
          } />

          {/* Active Consultations - separate functional page showing pending reports only */}
          <Route path="consultations" element={
            <Box sx={{ mt: 2 }}>
              <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                  {t('Active Consultations')}
                </Typography>
                {visibleReports.filter(r => !hasDoctorResponded(r, user!.id)).length === 0 ? (
                  <Alert severity="info">{t('No pending reports requiring response.')}</Alert>
                ) : (
                  <List>
                    {visibleReports
                      .filter(r => !hasDoctorResponded(r, user!.id))
                      .map((report) => (
                        <ListItem
                          key={report.id}
                          sx={getReportItemSx(report.urgency)}
                          secondaryAction={
                            <Box sx={reportSecondaryActionSx}>
                              {(!report.assignedDoctorId || report.assignedDoctorId === user!.id) && (
                                <Button
                                  variant="contained"
                                  size="small"
                                  startIcon={<Send />}
                                  onClick={() => handleRespondToReport(report)}
                                  sx={reportActionButtonSx}
                                >
                                  {report.assignedDoctorId === user!.id ? t('Continue') : t('Respond')}
                                </Button>
                              )}
                            </Box>
                          }
                        >
                          <ListItemText
                            secondaryTypographyProps={{ component: 'div', color: 'text.primary' }}
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Typography variant="h6">{formatPersonName(report.userName || '', 'villager')}</Typography>
                                <Chip label={translateUrgency(report.urgency)} size="small" sx={getUrgencyChipSx(report.urgency)} />
                                <Chip label={translateStatus('pending')} size="small" color={getStatusColor('pending') as any} variant="outlined" />
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" gutterBottom>
                                  <strong>{t('Symptoms')}:</strong> {formatSymptoms(report.symptoms)}
                                </Typography>
                                {report.description && (
                             <Typography variant="body2" gutterBottom>
                               <strong>{t('Description')}:</strong> {report.description}
                             </Typography>
                            )}
                            {report.voiceMessage?.dataUrl && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  {t('Voice Message')}
                                </Typography>
                                <audio controls src={report.voiceMessage.dataUrl} style={{ width: '100%' }}>
                                  Your browser does not support the audio element.
                                </audio>
                              </Box>
                            )}
                            {Array.isArray(report.attachments) && report.attachments.length > 0 && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  {t('Attachments')}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                  {report.attachments.map((att, idx) => (
                                    <Button
                                      key={`${att.name}_${idx}`}
                                      component="a"
                                      href={att.dataUrl}
                                      download={att.name}
                                      variant="outlined"
                                      size="small"
                                    >
                                      {att.name}
                                    </Button>
                                  ))}
                                </Box>
                              </Box>
                            )}
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(report.createdAt)}
                            </Typography>
                          </Box>
                        }
                          />
                        </ListItem>
                      ))}
                  </List>
                )}
              </Paper>
            </Box>
          } />

          {/* Medical History - separate functional page showing responded & appointed cases */}
          <Route path="history" element={
            <Box sx={{ mt: 2 }}>
              <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                  {t('Medical History')}
                </Typography>
                {visibleReports.filter(r => r.status === 'reviewed').length === 0 ? (
                  <Alert severity="info">{t('No medical history records yet.')}</Alert>
                ) : (
                  <List>
                    {visibleReports
                      .filter(r => r.status === 'reviewed')
                      .map((report) => (
                        <ListItem
                          key={report.id}
                          sx={getReportItemSx(report.urgency)}
                          secondaryAction={
                            <Box sx={reportSecondaryActionSx}>
                              {report.assignedDoctorId === user!.id && (
                                <Button
                                  variant="contained"
                                  size="small"
                                  startIcon={<Send />}
                                  onClick={() => handleRespondToReport(report)}
                                  sx={reportActionButtonSx}
                                >
                                  {t('Continue')}
                                </Button>
                              )}
                            </Box>
                          }
                        >
                          <ListItemText
                            secondaryTypographyProps={{ component: 'div', color: 'text.primary' }}
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Typography variant="h6">{formatPersonName(report.userName || '', 'villager')}</Typography>
                                <Chip label={translateUrgency(report.urgency)} size="small" sx={getUrgencyChipSx(report.urgency)} />
                                <Chip label={translateStatus('reviewed')} size="small" color={getStatusColor('reviewed') as any} variant="outlined" />
                              </Box>
                            }
                            secondary={
                              <Box>
                                {Array.isArray(report.responses) && report.responses.length > 0 && (
                                  <Box sx={{ mt: 1.5 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                      {t('Doctor Responses')}
                                    </Typography>
                                    {report.responses.map((resp, idx) => (
                                      <Box key={idx} sx={responseCardSx}>
                                        <Typography variant="body2" gutterBottom>
                                          <strong>{t('Doctor')}:</strong> {formatPersonName(resp.doctorName, 'doctor')}
                                        </Typography>
                                        <Typography variant="body2" gutterBottom>
                                          <strong>{t('Advice')}:</strong> {resp.advice}
                                        </Typography>
                                        {resp.prescription && (
                                          <Typography variant="body2" gutterBottom>
                                            <strong>{t('Prescription')}:</strong> {resp.prescription}
                                          </Typography>
                                        )}
                                        <Box sx={{ display: 'flex', gap: 2 }}>
                                          <Typography variant="caption" color="text.secondary">
                                            {t('Responded')}: {formatDate(resp.respondedAt as Date)}
                                          </Typography>
                                          {resp.followUpDate && (
                                            <Typography variant="caption" color="text.secondary">
                                              {t('Follow-up')}: {formatDate(resp.followUpDate as Date)}
                                            </Typography>
                                          )}
                                        </Box>
                                      </Box>
                                    ))}
                                  </Box>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                  </List>
                )}
              </Paper>
            </Box>
          } />
          </Routes>
          
          {/* Global overlays moved outside Routes */}
          {/* Response Dialog */}
          <Dialog
            open={responseDialog}
            onClose={() => setResponseDialog(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              {t('Respond to report for')} {selectedReport?.userName ? formatPersonName(selectedReport.userName || '', 'villager') : ''}
            </DialogTitle>
            <DialogContent>
              {selectedReport && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {t("Patient's Symptoms")}:
                  </Typography>
                  <Typography variant="body2" sx={detailSurfaceSx}>
                    {formatSymptoms(selectedReport.symptoms)}
                  </Typography>
                  {selectedReport.description && (
                    <>
                      <Typography variant="subtitle2" gutterBottom>
                        {t('Description')}:
                      </Typography>
                      <Typography variant="body2" sx={detailSurfaceSx}>
                        {selectedReport.description}
                      </Typography>
                    </>
                  )}
                </Box>
              )}

              <TextField
                fullWidth
                label={t('Medical Advice')}
                multiline
                rows={4}
                value={response.advice}
                onChange={(e) => setResponse(prev => ({ ...prev, advice: e.target.value }))}
                required
                sx={{ mb: 2 }}
                placeholder={t('Provide your medical advice and recommendations...')}
              />

              <TextField
                fullWidth
                label={t('Prescription (Optional)')}
                multiline
                rows={3}
                value={response.prescription}
                onChange={(e) => setResponse(prev => ({ ...prev, prescription: e.target.value }))}
                sx={{ mb: 2 }}
                placeholder={t('List medications, dosage, and instructions...')}
              />

              <FormControl fullWidth>
                <InputLabel>{t('Follow-up in Days')}</InputLabel>
                <Select
                  value={response.followUpDays}
                  onChange={(e) => setResponse(prev => ({ ...prev, followUpDays: e.target.value as number }))}
                  label={t('Follow-up in Days')}
                >
                  <MenuItem value={0}>{t('No follow-up needed')}</MenuItem>
                  <MenuItem value={3}>{t('3 days')}</MenuItem>
                  <MenuItem value={7}>{t('1 week')}</MenuItem>
                  <MenuItem value={14}>{t('2 weeks')}</MenuItem>
                  <MenuItem value={30}>{t('1 month')}</MenuItem>
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions
              sx={{
                px: { xs: 2, sm: 3 },
                pb: 2,
                flexWrap: 'wrap',
                gap: 1,
                '& > :not(style)': {
                  ml: '0 !important',
                  width: { xs: '100%', sm: 'auto' }
                }
              }}
            >
              <Button onClick={() => setResponseDialog(false)}>
                {t('Cancel')}
              </Button>
              <Button
                onClick={submitResponse}
                variant="contained"
                disabled={!response.advice}
                startIcon={<Send />}
              >
                {t('Send Response')}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Delete confirmation modal */}
          <Dialog
            open={deleteDialogOpen}
            onClose={handleCancelDelete}
            BackdropProps={{
              sx: {
                backdropFilter: 'blur(2px)',
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.15)'
              }
            }}
            PaperProps={{ sx: { borderRadius: 2, boxShadow: 8 } }}
          >
            <DialogTitle>{t('Are you sure you want to delete this?')}</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary">
                {reportPendingDelete?.symptoms || t('Delete Report')}
              </Typography>
            </DialogContent>
            <DialogActions
              sx={{
                px: { xs: 2, sm: 3 },
                pb: 2,
                flexWrap: 'wrap',
                gap: 1,
                '& > :not(style)': {
                  ml: '0 !important',
                  width: { xs: '100%', sm: 'auto' }
                }
              }}
            >
              <Button variant="outlined" onClick={handleCancelDelete} disabled={Boolean(deletingReportId)}>
                {t('No')}
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleConfirmDelete}
                disabled={Boolean(deletingReportId)}
                startIcon={deletingReportId ? <CircularProgress size={16} color="inherit" /> : undefined}
              >
                {deletingReportId ? t('Deleting...') : t('Yes')}
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      )
    }

export default DoctorDashboard
