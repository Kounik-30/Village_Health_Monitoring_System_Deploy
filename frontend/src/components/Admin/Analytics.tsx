import React, { useEffect, useState } from 'react'
import { Container, Paper, Typography, Box, Grid, Card, CardContent } from '@mui/material'
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts'
import { adminApi } from '../../services/api'
import type { AdminStats } from '../../types/models'
import { useTranslate } from '../../hooks/useTranslate'

const Analytics: React.FC = () => {
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
  const [chartData, setChartData] = useState<{ date: string; totalReports: number; emergencyReports: number; resolvedReports: number }[]>([])
  const { t } = useTranslate()

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const response = await adminApi.getStats()
      setStats(response)
      setChartData(response.chartData)
    } catch (e) {
      console.error('Failed to load analytics data', e)
    }
  }

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom color="primary">{t('Admin - Analytics')}</Typography>
        <Typography variant="body2" color="text.secondary">{t('Data insights and visual reports for the system')}</Typography>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Typography variant="subtitle2" color="text.secondary">{t('Total Users')}</Typography>
            <Typography variant="h5" color="primary.main">{stats.totalUsers}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Typography variant="subtitle2" color="text.secondary">{t('Reports')}</Typography>
            <Typography variant="h5" color="secondary.main">{stats.totalReports}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Typography variant="subtitle2" color="text.secondary">{t('Responded')}</Typography>
            <Typography variant="h5" color="success.main">{stats.respondedReports}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Typography variant="subtitle2" color="text.secondary">{t('Emergency')}</Typography>
            <Typography variant="h5" color="error.main">{stats.emergencyReports}</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      <Paper elevation={1} sx={{ p: 3, my: 3 }}>
        <Typography variant="h6" gutterBottom>{t('Reports Trend (Last 7 days)')}</Typography>
        <Box sx={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalReports" name={t('Total Reports')} fill="#1976d2" />
              <Bar dataKey="emergencyReports" name={t('Emergency')} fill="#d32f2f" />
              <Bar dataKey="resolvedReports" name={t('Resolved')} fill="#2e7d32" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      <Paper elevation={1} sx={{ p: 3, my: 3 }}>
        <Typography variant="h6" gutterBottom>{t('User Distribution')}</Typography>
        <Box sx={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={[
                { name: t('Villagers'), value: stats.totalVillagers },
                { name: t('Doctors'), value: stats.totalDoctors },
                { name: t('Admins'), value: Math.max(stats.totalUsers - stats.totalVillagers - stats.totalDoctors, 0) }
              ]} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} label>
                <Cell fill="#1976d2" />
                <Cell fill="#2e7d32" />
                <Cell fill="#9c27b0" />
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Container>
  )
}

export default Analytics
