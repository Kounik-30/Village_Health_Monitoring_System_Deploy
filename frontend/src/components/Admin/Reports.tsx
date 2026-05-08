import React, { useEffect, useState } from 'react'
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Chip,
  // Button, // removed unused import to fix TS6133
  Card,
  CardContent
} from '@mui/material'
import NotificationService from '../../services/NotificationService'
import { reportsApi } from '../../services/api'
import type { HealthReport } from '../../types/models'
import { useTranslate } from '../../hooks/useTranslate'
import { localizeMedicalList } from '../../utils/medicalLabels'

const Reports: React.FC = () => {
  const [reports, setReports] = useState<HealthReport[]>([])
  const [loading, setLoading] = useState(true)
  const { t, language } = useTranslate()

  useEffect(() => {
    loadReports()
    const unsubscribe = NotificationService.subscribe(() => loadReports())
    // Listen for intra-tab updates and periodic refresh
    const onUpdate = () => loadReports()
    try {
      window.addEventListener('reports_updated', onUpdate)
      window.addEventListener('users_updated', onUpdate)
      window.addEventListener('allReportsUpdated', onUpdate as EventListener)
    } catch {}
    const interval = setInterval(loadReports, 1500)
    return () => {
      unsubscribe()
      clearInterval(interval)
      try {
        window.removeEventListener('reports_updated', onUpdate)
        window.removeEventListener('users_updated', onUpdate)
        window.removeEventListener('allReportsUpdated', onUpdate as EventListener)
      } catch {}
    }
  }, [])

  const loadReports = async () => {
    try {
      const rawReports = await reportsApi.list()
      const parsed: HealthReport[] = rawReports.map((r: any) => ({
        ...r,
        createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
        responses: Array.isArray(r.responses) ? r.responses.map((resp: any) => ({
          ...resp,
          respondedAt: resp.respondedAt ? new Date(resp.respondedAt) : new Date(),
          followUpDate: resp.followUpDate ? new Date(resp.followUpDate) : undefined
        })) : []
      }))
      setReports(parsed)
    } catch (e) {
      console.error('Failed to load reports', e)
    } finally {
      setLoading(false)
    }
  }

  const statusColor = (status: HealthReport['status']) => {
    switch (status) {
      case 'pending': return 'warning'
      case 'reviewed': return 'info'
      case 'active': return 'secondary'
      case 'resolved': return 'success'
      default: return 'default'
    }
  }

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom color="primary">
          {t('Admin - Reports')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('View patient reports and track their status (pending, responded, resolved)')}
        </Typography>
      </Paper>

      {reports.length === 0 && !loading ? (
        <Typography color="text.secondary">{t('No reports found.')}</Typography>
      ) : (
        <Grid container spacing={3}>
          {reports.map((report) => (
            <Grid item xs={12} md={6} key={report.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6">{localizeMedicalList(report.symptoms, { t })}</Typography>
                    <Chip label={report.responses?.length ? t('Responded') : t(report.status)} color={report.responses?.length ? 'info' : statusColor(report.status)} size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {new Date(report.createdAt).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
                  </Typography>
                  <Typography sx={{ mb: 2 }}>{report.description}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label={t(report.urgency)} color={report.urgency === 'emergency' ? 'error' : report.urgency === 'high' ? 'warning' : 'default'} variant="outlined" />
                    {report.assignedDoctorName && (
                      <Chip label={`${t('Assigned')}: ${report.assignedDoctorName}`} color="secondary" variant="outlined" />
                    )}
                    {!!report.responses?.length && (
                      <Chip label={`${t('Responses')}: ${report.responses.length}`} color="info" variant="outlined" />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  )
}

export default Reports
