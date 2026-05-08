import React, { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { alpha } from '@mui/material/styles'
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Fab,
  Alert,
  Chip,
  Stack,
  useTheme
} from '@mui/material'
import {
  Report,
  Chat,
  Add,
  LocationOn,
  HealthAndSafety
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
// import { useNotifications } from '../../contexts/NotificationContext'
import HealthReportForm from '../HealthReport/HealthReportForm'
import ReportsList from '../HealthReport/ReportsList'
import ConsultationsList from '../Consultation/ConsultationsList'
import Profile from '../Profile/Profile'
import { consultationsApi, reportsApi } from '../../services/api'
import { useTranslate } from '../../hooks/useTranslate'
import { localizeMedicalList } from '../../utils/medicalLabels'

const VillagerDashboard: React.FC = () => {
  const { user } = useAuth()
  // const { addNotification } = useNotifications()
  const { t } = useTranslate()
  const navigate = useNavigate()
  const theme = useTheme()
  
  const [recentReports, setRecentReports] = useState<any[]>([])
  const [activeConsultations, setActiveConsultations] = useState<any[]>([])

  useEffect(() => {
    if (!user) return

    const loadDashboardData = async () => {
      try {
        const [allReports, consultations] = await Promise.all([
          reportsApi.list(),
          consultationsApi.list()
        ])

        setRecentReports(allReports.slice(0, 3))
        setActiveConsultations(consultations.filter((consultation) => consultation.status === 'active'))
      } catch (error) {
        console.error('Failed to load villager dashboard data:', error)
      }
    }

    // Initial load
    loadDashboardData()

    // Listen to real-time updates
    const onConsultationsUpdated = () => loadDashboardData()
    const onAllReportsUpdated = () => loadDashboardData()
    window.addEventListener('consultations_updated', onConsultationsUpdated as EventListener)
    window.addEventListener('allReportsUpdated', onAllReportsUpdated as EventListener)

    const interval = setInterval(() => {
      void loadDashboardData()
    }, 1500)

    return () => {
      clearInterval(interval)
      window.removeEventListener('consultations_updated', onConsultationsUpdated as EventListener)
      window.removeEventListener('allReportsUpdated', onAllReportsUpdated as EventListener)
    }
  }, [user])

  const handleEmergencyReport = () => {
    navigate('/villager/report?emergency=true')
  }

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'emergency':
        return theme.palette.error.main
      case 'high':
        return theme.palette.warning.main
      case 'medium':
        return theme.palette.info.main
      case 'low':
      default:
        return theme.palette.success.main
    }
  }

  const getUrgencyChipSx = (urgency?: string) => {
    const color = getUrgencyColor(urgency)

    return {
      textTransform: 'capitalize',
      backgroundColor: color,
      color: theme.palette.getContrastText(color),
      fontWeight: 600
    }
  }

  const quickStats = [
    {
      title: t('myReports'),
      value: recentReports.length,
      icon: <Report />,
      color: theme.palette.success.main,
      bgColor: alpha(theme.palette.success.main, theme.palette.mode === 'dark' ? 0.18 : 0.1),
      action: () => navigate('/villager/reports')
    },
    {
      title: t('activeConsultations'),
      value: activeConsultations.length,
      icon: <Chat />,
      color: theme.palette.primary.main,
      bgColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.18 : 0.1),
      action: () => navigate('/villager/consultations')
    },
    {
      title: t('Health Score'),
      value: '85%',
      icon: <HealthAndSafety />,
      color: theme.palette.warning.main,
      bgColor: alpha(theme.palette.warning.main, theme.palette.mode === 'dark' ? 0.18 : 0.1),
      action: () => {}
    }
  ]

  return (
    <Container maxWidth="lg">
      <Routes>
        <Route path="/" element={
          <>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" gutterBottom>
                {t('welcome')}, {user?.fullName}! 👋
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {t('How are you feeling today? Report any health concerns or check your consultation history.')}
              </Typography>
            </Box>

            {/* Emergency Alert */}
            <Alert 
              severity="info" 
              sx={{ mb: 3 }}
              action={
                <Button color="inherit" size="small" onClick={handleEmergencyReport}>
                  {t('Report Emergency')}
                </Button>
              }
            >
              {t('In case of emergency, click "Report Emergency" for immediate assistance.')}
            </Alert>

            {/* Quick Stats */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {quickStats.map((stat, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'translateY(-4px)' }
                    }}
                    onClick={stat.action}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box 
                          sx={{ 
                            p: 1, 
                            borderRadius: 1, 
                            backgroundColor: stat.bgColor,
                            color: stat.color,
                            mr: 2
                          }}
                        >
                          {stat.icon}
                        </Box>
                        <Typography variant="h6" component="div">
                          {stat.title}
                        </Typography>
                      </Box>
                      <Typography variant="h4" color={stat.color} fontWeight="bold">
                        {stat.value}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Recent Reports */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {t('Recent Health Reports')}
                    </Typography>
                    {recentReports.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        {t('noReports')}
                      </Typography>
                    ) : (
                      recentReports.map((report, index) => (
                        <Box
                          key={index}
                          sx={{
                            mb: 2,
                            p: 2,
                            borderRadius: 2,
                            backgroundColor: alpha(
                              theme.palette.primary.main,
                              theme.palette.mode === 'dark' ? 0.14 : 0.05
                            ),
                            border: `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="space-between"
                            alignItems="flex-start"
                            sx={{ mb: 1, gap: 1 }}
                          >
                            <Typography
                              variant="subtitle2"
                              sx={{
                                color: 'text.primary',
                                fontWeight: 600,
                                flex: 1,
                                wordBreak: 'break-word',
                              }}
                            >
                              {localizeMedicalList(report.symptoms, { t }) || t('No symptoms recorded')}
                            </Typography>
                            <Chip
                              size="small"
                              label={t(report.urgency || 'pending')}
                              sx={getUrgencyChipSx(report.urgency)}
                            />
                          </Stack>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                            {report.description || t('No description provided')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      ))
                    )}
                    <Button 
                      fullWidth 
                      variant="outlined" 
                      sx={{ mt: 2 }}
                      onClick={() => navigate('/villager/reports')}
                    >
                      {t('View All Reports')}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {t('Quick Actions')}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={<Report />}
                        onClick={() => navigate('/villager/report')}
                        size="large"
                      >
                        {t('reportHealth')}
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<LocationOn />}
                        onClick={() => navigate('/villager/report?location=true')}
                        size="large"
                      >
                        {t('shareLocation')}
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Chat />}
                        onClick={() => navigate('/villager/consultations')}
                        size="large"
                      >
                        {t('View Consultations')}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Floating Action Button for Quick Report */}
            <Fab
              color="primary"
              aria-label="add report"
              sx={{ position: 'fixed', bottom: 16, right: 16 }}
              onClick={() => navigate('/villager/report')}
            >
              <Add />
            </Fab>
          </>
        } />
        <Route path="/report" element={<HealthReportForm />} />
        <Route path="/reports" element={<ReportsList />} />
        <Route path="/consultations" element={<ConsultationsList />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Container>
  )
}

export default VillagerDashboard
