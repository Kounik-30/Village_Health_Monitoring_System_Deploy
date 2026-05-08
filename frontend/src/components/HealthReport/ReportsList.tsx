import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { alpha, useTheme } from '@mui/material/styles'
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Button,
  Grid,
  Alert,
  Divider,
  IconButton,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import {
  History,
  LocationOn,
  ExpandMore,
  ExpandLess,
  Warning,
  CheckCircle,
  Schedule,
  Visibility,
  Delete
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { reportsApi } from '../../services/api'
import type { HealthReport } from '../../types/models'
import { useTranslate } from '../../hooks/useTranslate'
import { localizePersonName } from '../../utils/localizePersonName'
import { localizeMedicalList } from '../../utils/medicalLabels'

const ReportsList: React.FC = () => {
  const [reports, setReports] = useState<HealthReport[]>([])
  const [expandedReport, setExpandedReport] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  // Track per-villager hidden reports (soft delete)
  const [, setHiddenReportIds] = useState<string[]>([])
  // Delete modal state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [reportIdPendingDelete, setReportIdPendingDelete] = useState<string | null>(null)
  const { user } = useAuth()
  const { showToast } = useNotifications()
  const { t, language } = useTranslate()
  const navigate = useNavigate()
  const theme = useTheme()

  const formatDoctorName = (name?: string | null) => {
    const trimmed = String(name || '').trim()
    if (!trimmed) return ''

    if (language === 'bn') {
      return localizePersonName(trimmed, { language, t, role: 'doctor' })
    }

    const withoutHonorific = trimmed.replace(/^(dr\.?|ডা\.?)\s*/i, '').trim()
    return `Dr. ${withoutHonorific || trimmed}`
  }

  const localizeSymptomList = (symptoms?: string | null) => {
    return localizeMedicalList(symptoms, { t })
  }
  useEffect(() => {
    loadReports()
  }, [user])

  // Poll for real-time updates to current user's reports so changes reflect instantly
  useEffect(() => {
    if (!user) return
    const interval = setInterval(() => {
      void loadReports()
    }, 1500)
    return () => clearInterval(interval)
  }, [user])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning'
      case 'reviewed': return 'info'
      case 'resolved': return 'success'
      default: return 'default'
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

  const getReportCardSx = (urgency: string) => ({
    border: '1px solid',
    borderColor:
      urgency === 'emergency'
        ? alpha(theme.palette.error.main, theme.palette.mode === 'dark' ? 0.4 : 0.22)
        : theme.palette.divider,
    bgcolor:
      urgency === 'emergency'
        ? alpha(theme.palette.error.main, theme.palette.mode === 'dark' ? 0.14 : 0.06)
        : 'background.paper',
    overflow: 'hidden',
    '&:hover': {
      boxShadow: theme.palette.mode === 'dark' ? 8 : 4
    }
  })

  const responseCardSx = {
    p: 2,
    mb: 1,
    bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.14 : 0.05),
    border: '1px solid',
    borderColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.24 : 0.12),
    borderRadius: 1.5
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Schedule />
      case 'reviewed': return <Visibility />
      case 'resolved': return <CheckCircle />
      default: return <Schedule />
    }
  }


  const toggleExpand = (reportId: string) => {
    setExpandedReport(expandedReport === reportId ? null : reportId)
  }

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat(language === 'bn' ? 'bn-BD' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const loadReports = async () => {
    try {
      const rawReports = await reportsApi.list()
      const parsedReports: HealthReport[] = rawReports.map((report: any) => ({
        ...report,
        createdAt: new Date(report.createdAt),
        responses: Array.isArray(report.responses) ? report.responses.map((resp: any) => ({
          ...resp,
          respondedAt: new Date(resp.respondedAt),
          followUpDate: resp.followUpDate ? new Date(resp.followUpDate) : undefined
        })) : (report.doctorResponse ? [{
          doctorId: 'unknown',
          doctorName: report.doctorResponse.doctorName,
          advice: report.doctorResponse.advice,
          prescription: report.doctorResponse.prescription,
          followUpDate: report.doctorResponse.followUpDate ? new Date(report.doctorResponse.followUpDate) : undefined,
          respondedAt: new Date(report.doctorResponse.respondedAt)
        }] : []),
        assignedDoctorId: report.assignedDoctorId,
        assignedDoctorName: report.assignedDoctorName
      }))
      setHiddenReportIds([])
      setReports(parsedReports)
    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setLoading(false)
    }
  }

  // Open delete confirmation modal
  const openDeleteDialog = (reportId: string) => {
    setReportIdPendingDelete(reportId)
    setDeleteDialogOpen(true)
  }

  // Soft delete a report for current villager only (no confirm here)
  const handleDeleteReport = async (reportId: string) => {
    if (!user) return
    try {
      await reportsApi.archive(reportId)
      setReports(prev => prev.filter(r => r.id !== reportId))
      window.dispatchEvent(new CustomEvent('consultations_updated', { detail: { userId: user.id, reportId } }))
    } catch (error) {
      console.error('Failed to archive report:', error)
    }

    showToast('Deleted successfully', { severity: 'success', autoHideDuration: 3500 })
  }

  const handleConfirmDelete = () => {
    if (reportIdPendingDelete) {
      handleDeleteReport(reportIdPendingDelete)
    }
    setDeleteDialogOpen(false)
    setReportIdPendingDelete(null)
  }

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false)
    setReportIdPendingDelete(null)
  }

  const handleAppointDoctor = async (report: HealthReport, doctorId: string) => {
    const selectedResponse = (report.responses || []).find(r => r.doctorId === doctorId)
    if (!selectedResponse) return

    try {
      await reportsApi.assign(report.id, doctorId)
      window.dispatchEvent(new CustomEvent('allReportsUpdated', { detail: { reason: 'appoint_doctor', reportId: report.id, doctorId } }))
      window.dispatchEvent(new CustomEvent('consultations_updated', { detail: { userId: report.userId, reportId: report.id, doctorId } }))
      showToast('Doctor appointed successfully', { severity: 'success', autoHideDuration: 3500 })
      await loadReports()
    } catch (error) {
      console.error('Failed to appoint doctor:', error)
      showToast('Something went wrong', { severity: 'error', autoHideDuration: 3500 })
    }
  }

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography>{t('Loading your reports...')}</Typography>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 2 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom color="primary">
            <History sx={{ mr: 1, verticalAlign: 'middle' }} />
            {t('Health History')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('Your health reports and doctor consultations')}
          </Typography>
        </Box>

        {reports.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('No health reports yet')}
            </Typography>
            <Typography variant="body2">
              {t("You haven't submitted any health reports. Click the button below to report your first health concern.")}
            </Typography>
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              onClick={() => navigate('/villager/report')}
            >
              {t('reportHealth')}
            </Button>
          </Alert>
        ) : (
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('Total Reports')}: {reports.length}
            </Typography>
            
            <Grid container spacing={2}>
              {reports.map((report) => (
                <Grid item xs={12} key={report.id}>
                  <Card 
                    elevation={2}
                    sx={getReportCardSx(report.urgency)}
                  >
                    <CardContent>
                      {/* Header */}
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          mb: 2,
                          gap: 1.5,
                          flexWrap: 'wrap'
                        }}
                      >
                        <Box sx={{ minWidth: 0, flex: '1 1 220px' }}>
                          <Typography variant="h6" gutterBottom sx={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                            {localizeSymptomList(report.symptoms).length > 50 
                              ? `${localizeSymptomList(report.symptoms).substring(0, 50)}...` 
                              : localizeSymptomList(report.symptoms)
                            }
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(report.createdAt)}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            flexWrap: 'wrap',
                            justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                            maxWidth: '100%'
                          }}
                        >
                          {report.urgency === 'emergency' && (
                            <Warning sx={{ color: getUrgencyColor(report.urgency) }} />
                          )}
                          <Chip
                            label={t(report.urgency)}
                            size="small"
                            sx={getUrgencyChipSx(report.urgency)}
                          />
                          {/* Per-villager delete (soft delete) */}
                          <IconButton
                            aria-label={t('Delete')}
                            color="error"
                            size="small"
                            onClick={() => openDeleteDialog(report.id)}
                            sx={{ ml: { xs: 0, sm: 1 }, flexShrink: 0 }}
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </Box>

                      {/* Status and Location */}
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 2,
                          gap: 1,
                          flexWrap: 'wrap'
                        }}
                      >
                        <Chip
                          icon={getStatusIcon(report.status)}
                          label={t(report.status)}
                          color={getStatusColor(report.status) as any}
                          variant="outlined"
                        />
                        {report.location && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocationOn fontSize="small" color="action" />
                            <Typography variant="caption" color="text.secondary">
                              {t('Location shared')}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Expand/Collapse Button */}
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <IconButton
                          onClick={() => toggleExpand(report.id)}
                          size="small"
                        >
                          {expandedReport === report.id ? <ExpandLess /> : <ExpandMore />}
                          <Typography variant="caption" sx={{ ml: 0.5 }}>
                            {expandedReport === report.id ? t('Show Less') : t('Show More')}
                          </Typography>
                        </IconButton>
                      </Box>

                      {/* Expanded Content */}
                      <Collapse in={expandedReport === report.id}>
                        <Divider sx={{ my: 2 }} />
                        
                        {/* Full Symptoms */}
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            {t('Symptoms')}:
                          </Typography>
                          <Typography variant="body2">
                            {localizeSymptomList(report.symptoms)}
                          </Typography>
                        </Box>

                        {/* Description */}
                        {report.description && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              {t('Description')}:
                            </Typography>
                            <Typography variant="body2">
                              {report.description}
                            </Typography>
                          </Box>
                        )}

                        {/* Location Details */}
                        {report.location && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              {t('Location')}:
                            </Typography>
                            <Typography variant="body2">
                              {report.location.address || `${report.location.latitude}, ${report.location.longitude}`}
                            </Typography>
                          </Box>
                        )}

                        {/* Doctor Responses List */}
                        {(report.responses && report.responses.length > 0) && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              {t('Doctor Responses')}:
                            </Typography>
                            {report.assignedDoctorId && (
                              <Alert severity="success" sx={{ mb: 2 }}>
                                {t('Appointed Doctor')}: {formatDoctorName(report.assignedDoctorName)}
                              </Alert>
                            )}
                            {report.responses.map((resp, idx) => (
                              <Box key={`${report.id}_resp_${idx}`} sx={responseCardSx}>
                                <Typography variant="body2" gutterBottom>
                                  <strong>{formatDoctorName(resp.doctorName)}</strong>
                                </Typography>
                                <Typography variant="body2" gutterBottom>
                                  {resp.advice}
                                </Typography>
                                {resp.prescription && (
                                  <Box sx={{ mt: 1 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                      {t('Prescription')}:
                                    </Typography>
                                    <Typography variant="body2">
                                      {resp.prescription}
                                    </Typography>
                                  </Box>
                                )}
                                {resp.followUpDate && (
                                  <Typography variant="caption" color="text.secondary">
                                    {t('Follow-up')}: {formatDate(resp.followUpDate)}
                                  </Typography>
                                )}
                                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                                  {t('Responded on')}: {formatDate(resp.respondedAt)}
                                </Typography>
                                {!report.assignedDoctorId && (
                                  <Box sx={{ mt: 1 }}>
                                    <Button
                                      variant="contained"
                                      size="small"
                                      onClick={() => handleAppointDoctor(report, resp.doctorId)}
                                    >
                                      {t('Appoint Doctor')}
                                    </Button>
                                  </Box>
                                )}
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Collapse>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Action Buttons */}
        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            onClick={() => navigate('/villager/report')}
            size="large"
          >
            {t('reportHealth')}
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/villager')}
            size="large"
          >
            {t('Back to Dashboard')}
          </Button>
        </Box>
      </Paper>
      {/* Delete confirmation modal */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(3px)',
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.3)'
          }
        }}
                        PaperProps={{
                          sx: {
                            borderRadius: 2,
                            boxShadow: 6,
                            width: 'calc(100% - 24px)',
                            maxWidth: 420,
                            m: 1.5
                          }
                        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>{t('Delete Report')}</DialogTitle>
        <DialogContent>
          <Typography>{t('Are you sure you want to delete this?')}</Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
            {t('This will hide the report from your view only.')}
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
          <Button variant="outlined" onClick={handleCancelDelete} sx={{ borderRadius: 2 }}>{t('No')}</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete} sx={{ borderRadius: 2 }}>{t('Yes')}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default ReportsList
