import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { alpha, useTheme } from '@mui/material/styles'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  IconButton,
  Divider,
  Tooltip,
} from '@mui/material'
import { VideoCall, Call, Chat, Person, Schedule } from '@mui/icons-material'
import CallModal from '../Communication/CallModal'
import { useAuth } from '../../contexts/AuthContext'
import { consultationsApi } from '../../services/api'
import type { Consultation } from '../../types/models'
import { useTranslate } from '../../hooks/useTranslate'

const ConsultationsList: React.FC = () => {
  const { user } = useAuth()
  const { t, language } = useTranslate()
  const navigate = useNavigate()
  const theme = useTheme()
  const [consultations, setConsultations] = useState<Consultation[]>([])

  useEffect(() => {
    const loadConsultations = () => {
      try {
        consultationsApi.list().then((stored) => {
          const parsed: Consultation[] = stored.map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          lastMessage: c.lastMessage ? {
            ...c.lastMessage,
            timestamp: new Date(c.lastMessage.timestamp)
          } : undefined,
          scheduledAt: c.scheduledAt ? new Date(c.scheduledAt) : undefined,
          completedAt: c.completedAt ? new Date(c.completedAt) : undefined
          }))
          const active = parsed.filter(c => c.status === 'active')
          const uniqueById = Array.from(new Map(active.map(c => [c.id, c])).values())
          setConsultations(uniqueById.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
        }).catch((e) => {
          console.error('Error loading consultations:', e)
          setConsultations([])
        })
      } catch (e) {
        console.error('Error loading consultations:', e)
        setConsultations([])
      }
    }

    if (user) {
      loadConsultations()
    }

    // Listen to consultation updates and storage changes
    const onUpdated = () => loadConsultations()
    window.addEventListener('consultations_updated', onUpdated as EventListener)
    window.addEventListener('storage', onUpdated as EventListener)
    return () => {
      window.removeEventListener('consultations_updated', onUpdated as EventListener)
      window.removeEventListener('storage', onUpdated as EventListener)
    }
  }, [user])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'scheduled':
        return 'warning'
      case 'completed':
        return 'default'
      default:
        return 'default'
    }
  }

  const [callOpen, setCallOpen] = useState<{ mode: 'voice' | 'video' } | null>(null)
  const handleVideoCall = (consultationId: string) => {
    void consultationId
    setCallOpen({ mode: 'video' })
  }

  const handleVoiceCall = (consultationId: string) => {
    void consultationId
    setCallOpen({ mode: 'voice' })
  }

  const handleChat = (consultationId: string) => {
    navigate(`/chat/${consultationId}`)
  }

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat(language === 'bn' ? 'bn-BD' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  if (consultations.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          {t('No consultations available')}
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/villager/report')}
          sx={{ mt: 2 }}
        >
          {t('Submit Health Report')}
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {t('My Consultations')}
      </Typography>

      <List>
        {consultations.map((consultation, index) => (
          <React.Fragment key={consultation.id}>
            <ListItem
              sx={{
                p: 0,
                mb: 2,
              }}
            >
              <Card
                sx={{
                  width: '100%',
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.96 : 1)
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      <Person />
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6">
                        Dr. {consultation.doctorName}
                      </Typography>
                      {consultation.doctorSpecialization && (
                        <Typography variant="body2" color="text.secondary">
                          {consultation.doctorSpecialization}
                        </Typography>
                      )}
                    </Box>
                    <Chip
                      label={t(consultation.status)}
                      color={getStatusColor(consultation.status) as any}
                      size="small"
                    />
                  </Box>

                  {/* Symptoms omitted: not available in new consultation schema */}

                  {consultation.lastMessage && (
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {consultation.lastMessage.content}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">
                      <Schedule sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                      {formatDate(consultation.createdAt)}
                    </Typography>

                    <Box>
                      <Tooltip title={t('Start Chat') as string}>
                        <IconButton
                          color="primary"
                          onClick={() => handleChat(consultation.id)}
                          aria-label={t('Start Chat') as string}
                        >
                          <Chat />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('Voice Call') as string}>
                        <IconButton
                          color="primary"
                          onClick={() => handleVoiceCall(consultation.id)}
                          aria-label={t('Voice Call') as string}
                        >
                          <Call />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('Video Call') as string}>
                        <IconButton
                          color="primary"
                          onClick={() => handleVideoCall(consultation.id)}
                          aria-label={t('Video Call') as string}
                        >
                          <VideoCall />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </ListItem>
            {index < consultations.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
      <CallModal open={!!callOpen} mode={(callOpen?.mode || 'voice')} onClose={() => setCallOpen(null)} />
      <Typography variant="h6" gutterBottom>
        {t('Active Consultations')}: {consultations.length}
      </Typography>
    </Box>
  )
}

export default ConsultationsList
