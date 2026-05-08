import React, { useEffect, useMemo, useState } from 'react'
import { alpha, useTheme } from '@mui/material/styles'
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Tabs,
  Tab,
  Alert,
  LinearProgress,
  Select,
  MenuItem,
  Stack,
  // IconButton, // unused
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import {
  Dashboard,
  People,
  LocalHospital,
  Assignment,
  Warning,
  CheckCircle,
  Block,
  Insights,
  // Edit, // unused
  // Add // unused
} from '@mui/icons-material'
// import { Tooltip } from '@mui/material' // remove unused Tooltip import
import { Routes, Route } from 'react-router-dom'
import Profile from '../Profile/Profile'
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, PieChart, Pie, Cell } from 'recharts'
import NotificationService from '../../services/NotificationService'
import Users from '../Admin/Users'
import Reports from '../Admin/Reports'
import Analytics from '../Admin/Analytics'
import { adminApi, usersApi } from '../../services/api'
import type { AdminStats, DiseaseInsights } from '../../types/models'
import { useTranslate } from '../../hooks/useTranslate'
import { localizeMedicalLabel } from '../../utils/medicalLabels'

interface User {
  id: string
  fullName: string
  email: string
  role: 'villager' | 'doctor' | 'admin'
  phoneNumber?: string
  village?: string
  specialization?: string
  licenseNumber?: string
  isActive: boolean
  createdAt: Date
  lastLogin?: Date
}

const AdminDashboard: React.FC = () => {
  const { t, language } = useTranslate()
  const theme = useTheme()
  const currentYear = new Date().getFullYear()
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalDoctors: 0,
    totalVillagers: 0,
    totalReports: 0,
    pendingReports: 0,
    emergencyReports: 0,
    resolvedReports: 0,
    activeConsultations: 0,
    respondedReports: 0,
    chartData: []
  })
  const [users, setUsers] = useState<User[]>([])
  const [activeTab, setActiveTab] = useState(0)
  const [selectedUser] = useState<User | null>(null) // remove unused setter to fix TS6133
  const [userDialog, setUserDialog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState<{ date: string; totalReports: number; emergencyReports: number; resolvedReports: number }[]>([])
  const [selectedDiseaseMonth, setSelectedDiseaseMonth] = useState('')
  const [appliedDiseaseMonth, setAppliedDiseaseMonth] = useState('')
  const [diseaseInsights, setDiseaseInsights] = useState<DiseaseInsights | null>(null)
  const [diseaseLoading, setDiseaseLoading] = useState(false)
  const [diseaseError, setDiseaseError] = useState('')
  const [hasPredicted, setHasPredicted] = useState(false)

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const monthNumber = index + 1
        const value = `${currentYear}-${String(monthNumber).padStart(2, '0')}`
        const date = new Date(Date.UTC(currentYear, index, 1))

        return {
          value,
          label: date.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US', { month: 'long', timeZone: 'UTC' })
        }
      }),
    [currentYear, language]
  )

  const displayedDiseaseCounts = useMemo(
    () =>
      (diseaseInsights?.diseaseCounts || []).slice(0, 5).map((item) => ({
        ...item,
        disease: localizeMedicalLabel(item.disease, { t })
      })),
    [diseaseInsights, t]
  )

  const localizedDominantDiseaseName = useMemo(
    () => (diseaseInsights?.dominantDisease?.name ? localizeMedicalLabel(diseaseInsights.dominantDisease.name, { t }) : ''),
    [diseaseInsights?.dominantDisease?.name, t]
  )

  useEffect(() => {
    void loadSystemData()
  }, [])

  useEffect(() => {
    const unsubscribe = NotificationService.subscribe(() => {
      void loadSystemData()
      if (appliedDiseaseMonth) {
        void loadDiseaseInsights(appliedDiseaseMonth)
      }
    })

    const onUpdate = () => {
      void loadSystemData()
      if (appliedDiseaseMonth) {
        void loadDiseaseInsights(appliedDiseaseMonth)
      }
    }

    try {
      window.addEventListener('reports_updated', onUpdate)
      window.addEventListener('users_updated', onUpdate)
      window.addEventListener('allReportsUpdated', onUpdate as EventListener)
    } catch {}
    const interval = setInterval(() => {
      void loadSystemData()
    }, 1500)
    return () => {
      unsubscribe()
      clearInterval(interval)
      try {
        window.removeEventListener('reports_updated', onUpdate)
        window.removeEventListener('users_updated', onUpdate)
        window.removeEventListener('allReportsUpdated', onUpdate as EventListener)
      } catch {}
    }
  }, [appliedDiseaseMonth])

  const loadSystemData = async () => {
    try {
      const [statsResponse, allUsers] = await Promise.all([
        adminApi.getStats(),
        usersApi.list()
      ])

      const usersWithDates = allUsers.map((u: any) => ({
        ...u,
        createdAt: new Date(u.createdAt || Date.now()),
        lastLogin: u.lastLoginAt ? new Date(u.lastLoginAt) : undefined,
        isActive: u.isActive !== false // Default to true if not specified
      }))
      setUsers(usersWithDates)
      setStats(statsResponse)
      setChartData(statsResponse.chartData)
    } catch (error) {
      console.error('Error loading system data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDiseaseInsights = async (month: string) => {
    setDiseaseLoading(true)
    setDiseaseError('')

    try {
      const response = await adminApi.getDiseaseInsights(month)
      setDiseaseInsights(response)
    } catch (error) {
      console.error('Error loading disease insights:', error)
      setDiseaseInsights(null)
      setDiseaseError('Failed to generate disease insights for the selected month.')
    } finally {
      setDiseaseLoading(false)
    }
  }

  const handlePredict = () => {
    if (!selectedDiseaseMonth) return
    setHasPredicted(true)
    setAppliedDiseaseMonth(selectedDiseaseMonth)
    void loadDiseaseInsights(selectedDiseaseMonth)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(language === 'bn' ? 'bn-BD' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getFilteredUsers = () => {
    switch (activeTab) {
      case 0: // All
        return users
      case 1: // Villagers
        return users.filter(u => u.role === 'villager')
      case 2: // Doctors
        return users.filter(u => u.role === 'doctor')
      case 3: // Inactive
        return users.filter(u => !u.isActive)
      default:
        return users
    }
  }

  const chartSeriesColors = useMemo(
    () => ({
      reports: theme.palette.primary.main,
      emergency: theme.palette.error.main,
      resolved: theme.palette.success.main,
      users: theme.palette.secondary.main,
      admins: theme.palette.secondary.dark
    }),
    [theme]
  )

  const chartGridColor = alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.14 : 0.08)
  const chartTickColor = theme.palette.text.secondary
  const chartTooltipStyle = {
    backgroundColor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.98 : 1),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 12,
    color: theme.palette.text.primary,
    boxShadow: theme.palette.mode === 'dark' ? '0 12px 30px rgba(0,0,0,0.35)' : '0 8px 24px rgba(0,0,0,0.12)'
  }

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography>{t('Loading system data...')}</Typography>
          <LinearProgress sx={{ mt: 2 }} />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg">
      <Routes>
        <Route path="/profile" element={<Profile />} />
        <Route path="/users" element={<Users />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/" element={
          <Box sx={{ mt: 2 }}>
            {/* Header */}
            <Paper elevation={3} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h4" gutterBottom color="primary">
                <Dashboard sx={{ mr: 1, verticalAlign: 'middle' }} />
                {t('Admin Dashboard')}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {t('System administration and monitoring')}
              </Typography>
            </Paper>

            {/* System Stats */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ borderColor: 'divider' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <People sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h6">{t('Total Users')}</Typography>
                    <Typography variant="h4" color="primary.main">
                      {stats.totalUsers}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stats.totalVillagers} {t('Villagers')}, {stats.totalDoctors} {t('Doctors')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ borderColor: 'divider' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Assignment sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                    <Typography variant="h6">{t('Health Reports')}</Typography>
                    <Typography variant="h4" color="info.main">
                      {stats.totalReports}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stats.pendingReports} {t('Pending')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ borderColor: 'divider' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Warning sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
                    <Typography variant="h6">{t('Emergency Cases')}</Typography>
                    <Typography variant="h4" color="error.main">
                      {stats.emergencyReports}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('Require immediate attention')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ borderColor: 'divider' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <LocalHospital sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                    <Typography variant="h6">{t('Consultations')}</Typography>
                    <Typography variant="h4" color="success.main">
                      {stats.activeConsultations}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('Active doctor-patient interactions')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* System Health Indicators */}
            <Paper elevation={3} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h5" gutterBottom>
                {t('System Health')}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Alert severity="success" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>{t('Server Status')}:</strong> {t('Online')}
                    </Typography>
                  </Alert>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Alert severity="info" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>{t('Response Rate')}:</strong> {stats.totalReports > 0 ? Math.round((stats.respondedReports / stats.totalReports) * 100) : 0}%
                    </Typography>
                  </Alert>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Alert severity={stats.pendingReports > 10 ? "warning" : "success"} sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>{t('Pending Queue')}:</strong> {stats.pendingReports} {t('reports')}
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
            </Paper>

            {/* System Trends */}
            <Paper elevation={3} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h5" gutterBottom>
                {t('System Trends (Last 7 Days)')}
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Box sx={{ height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                        <CartesianGrid stroke={chartGridColor} strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fill: chartTickColor }} axisLine={{ stroke: chartGridColor }} tickLine={{ stroke: chartGridColor }} />
                        <YAxis allowDecimals={false} tick={{ fill: chartTickColor }} axisLine={{ stroke: chartGridColor }} tickLine={{ stroke: chartGridColor }} />
                        <RechartsTooltip contentStyle={chartTooltipStyle} labelStyle={{ color: theme.palette.text.primary }} itemStyle={{ color: theme.palette.text.primary }} />
                        <Legend formatter={(value) => <span style={{ color: theme.palette.text.primary }}>{value}</span>} />
                        <Bar dataKey="totalReports" name={t('Total Reports')} fill={chartSeriesColors.reports} />
                        <Bar dataKey="emergencyReports" name={t('Emergency')} fill={chartSeriesColors.emergency} />
                        <Bar dataKey="resolvedReports" name={t('Resolved')} fill={chartSeriesColors.resolved} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: t('Villagers'), value: users.filter(u => u.role === 'villager').length },
                            { name: t('Doctors'), value: users.filter(u => u.role === 'doctor').length },
                            { name: t('Admins'), value: users.filter(u => u.role === 'admin').length }
                          ]}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          label={false}
                        >
                          <Cell fill={chartSeriesColors.reports} />
                          <Cell fill={chartSeriesColors.resolved} />
                          <Cell fill={chartSeriesColors.admins} />
                        </Pie>
                        <Legend formatter={(value) => <span style={{ color: theme.palette.text.primary }}>{value}</span>} />
                        <RechartsTooltip contentStyle={chartTooltipStyle} labelStyle={{ color: theme.palette.text.primary }} itemStyle={{ color: theme.palette.text.primary }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Disease Prediction and Insights */}
            <Paper elevation={3} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 3 }}>
                <Box>
                  <Typography variant="h5" gutterBottom>
                    <Insights sx={{ mr: 1, verticalAlign: 'middle' }} />
                    {t('Disease Prediction and Insights')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('Analyze structured symptom and diagnosis values from MongoDB reports to identify the most common diseases for a selected month.')}
                  </Typography>
                </Box>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: { xs: '100%', md: 'auto' }, alignItems: { xs: 'stretch', sm: 'flex-end' } }}>
                  <Stack spacing={0.75} sx={{ width: { xs: '100%', sm: 240 } }}>
                    <Typography variant="body2" fontWeight={600} color="text.primary">
                      {t('Month')}
                    </Typography>
                    <Select
                      size="small"
                      value={selectedDiseaseMonth}
                      onChange={(event) => setSelectedDiseaseMonth(event.target.value)}
                      displayEmpty
                      fullWidth
                      sx={{ bgcolor: 'background.paper' }}
                      renderValue={(selected) => {
                        if (!selected) {
                          return t('Select Month')
                        }

                        const option = monthOptions.find((item) => item.value === selected)
                        return option?.label || t('Select Month')
                      }}
                    >
                      <MenuItem value="">
                        <em>{t('Select Month')}</em>
                      </MenuItem>
                      {monthOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </Stack>

                  <Button
                    variant="contained"
                    onClick={handlePredict}
                    disabled={diseaseLoading || !selectedDiseaseMonth}
                    sx={{ minWidth: { xs: '100%', sm: 120 } }}
                  >
                    {diseaseLoading ? t('Predicting...') : t('Predict')}
                  </Button>
                </Stack>
              </Box>

              {diseaseError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {t(diseaseError)}
                </Alert>
              )}

              {diseaseLoading && <LinearProgress sx={{ mb: 2 }} />}

              {!hasPredicted && !diseaseLoading && (
                <Alert severity="info">
                  {t('Please select a month and click Predict.')}
                </Alert>
              )}

              {hasPredicted && !diseaseLoading && diseaseInsights && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined" sx={{ height: '100%', borderColor: 'divider' }}>
                      <CardContent>
                        <Typography variant="overline" color="text.secondary">
                          {t('Prediction Summary')}
                        </Typography>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                          {diseaseInsights.label}
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                          <Chip label={`${diseaseInsights.totalReports} ${t('Reports')}`} color="primary" variant="outlined" />
                          <Chip label={`${diseaseInsights.matchedReports} ${t('Matched')}`} color="success" variant="outlined" />
                          <Chip label={`${displayedDiseaseCounts.length} ${t('Shown')}`} color="secondary" variant="outlined" />
                        </Stack>
                        {diseaseInsights.dominantDisease ? (
                          <Alert severity="success" sx={{ mb: 2 }}>
                            <Typography variant="body2">
                              <strong>{t('Dominant disease')}:</strong> {localizedDominantDiseaseName} ({diseaseInsights.dominantDisease.count} {t('reports')})
                            </Typography>
                          </Alert>
                        ) : diseaseInsights.totalReports === 0 ? (
                          <Alert severity="info" sx={{ mb: 2 }}>
                            {t('No report data exists for the selected month.')}
                          </Alert>
                        ) : (
                          <Alert severity="info" sx={{ mb: 2 }}>
                            {t('No disease labels were detected in stored reports for this month.')}
                          </Alert>
                        )}
                        <Typography variant="body2" color="text.secondary">
                          {t('Insights use only the report symptoms and diagnosis fields. Combined symptom strings are split and normalized before aggregation.')}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={8}>
                    <Card variant="outlined" sx={{ height: '100%', borderColor: 'divider' }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {t('Top Disease Frequency')}
                        </Typography>
                        <Box sx={{ height: 320 }}>
                          {displayedDiseaseCounts.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={displayedDiseaseCounts} margin={{ top: 10, right: 40, bottom: 85, left: 10 }}>
                                <CartesianGrid stroke={chartGridColor} strokeDasharray="3 3" />
                                <XAxis
                                  dataKey="disease"
                                  angle={-20}
                                  textAnchor="end"
                                  height={85}
                                  interval={0}
                                  tick={{ fontSize: 12, fill: chartTickColor }}
                                  tickMargin={12}
                                  axisLine={{ stroke: chartGridColor }}
                                  tickLine={{ stroke: chartGridColor }}
                                />
                                <YAxis allowDecimals={false} tick={{ fill: chartTickColor }} axisLine={{ stroke: chartGridColor }} tickLine={{ stroke: chartGridColor }} />
                                <RechartsTooltip contentStyle={chartTooltipStyle} labelStyle={{ color: theme.palette.text.primary }} itemStyle={{ color: theme.palette.text.primary }} />
                                <Bar dataKey="count" name={t('Reports')} fill={chartSeriesColors.admins} radius={[6, 6, 0, 0]} maxBarSize={56} />
                              </BarChart>
                            </ResponsiveContainer>
                          ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                              <Typography variant="body2" color="text.secondary">
                                {diseaseInsights.totalReports === 0
                                  ? t('No report data exists for the selected month.')
                                  : t('No structured symptom or diagnosis values were found for this month.')}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}
            </Paper>

            {/* User Management */}
            <Paper elevation={3} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">
                  {t('User Management')}
                </Typography>
              </Box>

              {/* User Tabs */}
              <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
                <Tab label={`${t('All Users')} (${users.length})`} />
                <Tab label={`${t('Villagers')} (${users.filter(u => u.role === 'villager').length})`} />
                <Tab label={`${t('Doctors')} (${users.filter(u => u.role === 'doctor').length})`} />
                <Tab label={`${t('Inactive')} (${users.filter(u => !u.isActive).length})`} />
              </Tabs>

              {/* Users Table */}
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('Name')}</TableCell>
                      <TableCell>{t('Email')}</TableCell>
                      <TableCell>{t('Role')}</TableCell>
                      <TableCell>{t('Status')}</TableCell>
                      <TableCell>{t('Created')}</TableCell>
                      <TableCell>{t('Actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getFilteredUsers().map((user) => (
                      <TableRow
                        key={user.id}
                        sx={{
                          '& td, & th': {
                            borderColor: 'divider'
                          }
                        }}
                      >
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {user.fullName}
                            </Typography>
                            {user.village && (
                              <Typography variant="caption" color="text.secondary">
                                {user.village}
                              </Typography>
                            )}
                            {user.specialization && (
                              <Typography variant="caption" color="text.secondary">
                                {user.specialization}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={t(user.role)}
                            size="small"
                            color={user.role === 'doctor' ? 'primary' : user.role === 'admin' ? 'secondary' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.isActive ? t('Active') : t('Inactive')}
                            size="small"
                            color={user.isActive ? 'success' : 'error'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {formatDate(user.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            {user.isActive ? (
                              <CheckCircle sx={{ color: 'success.main' }} />
                            ) : (
                              <Block sx={{ color: 'error.main' }} />
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* User Dialog */}
            <Dialog
              open={userDialog}
              onClose={() => setUserDialog(false)}
              maxWidth="sm"
              fullWidth
            >
              <DialogTitle>
                {selectedUser ? t('Edit User') : t('Add New User')}
              </DialogTitle>
              <DialogContent>
                <Alert severity="info" sx={{ mb: 2 }}>
                  {t('User management functionality would be implemented here in a real application.')}
                </Alert>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setUserDialog(false)}>
                  {t('Cancel')}
                </Button>
                <Button variant="contained">
                  {selectedUser ? t('Update') : t('Create')}
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        } />
        </Routes>
      </Container>
    )
}

export default AdminDashboard
