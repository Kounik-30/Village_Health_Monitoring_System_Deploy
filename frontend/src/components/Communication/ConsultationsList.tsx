import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { alpha, useTheme } from '@mui/material/styles'
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Chip,
  Alert,
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider
} from '@mui/material'
import {
  Chat,
  VideoCall,
  Phone,
  Schedule,
  CheckCircle,
  Person,
  AccessTime,
  LocalHospital
} from '@mui/icons-material'
import { Tooltip } from '@mui/material'
import CallModal from './CallModal'
import { useAuth } from '../../contexts/AuthContext'
import { consultationsApi } from '../../services/api'
import type { Consultation } from '../../types/models'
import { useTranslate } from '../../hooks/useTranslate'

const ConsultationsList: React.FC = () => {
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [loading, setLoading] = useState(true)
  const [callMode, setCallMode] = useState<null | 'voice' | 'video'>(null)

  const { user } = useAuth()
  const { t } = useTranslate()
  const navigate = useNavigate()
  const theme = useTheme()

  useEffect(() => {
    loadConsultations()
  }, [user])

  const loadConsultations = async () => {
    try {
      const stored = await consultationsApi.list()
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

      setConsultations(parsed.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ))
    } catch (error) {
      console.error('Error loading consultations:', error)
    } finally {
      setLoading(false)
    }
  }

  // status helpers are defined below with typed status

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const handleStartChat = (consultation: Consultation) => {
    navigate(`/chat/${consultation.id}`)
  }

  const handleVideoCall = (consultation: Consultation) => {
    void consultation
    setCallMode('video')
  }

  const handleVoiceCall = (consultation: Consultation) => {
    void consultation
    setCallMode('voice')
  }

  const getStatusColor = (status: Consultation['status']) => {
    switch (status) {
      case 'active':
        return 'primary'
      case 'scheduled':
        return 'warning'
      case 'completed':
        return 'success'
      default:
        return 'default'
    }
  }

  const getConsultationItemSx = (status: Consultation['status']) => ({
    border: '1px solid',
    borderColor:
      status === 'active'
        ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.3 : 0.16)
        : theme.palette.divider,
    borderRadius: 1.5,
    mb: 1,
    bgcolor:
      status === 'active'
        ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.14 : 0.06)
        : 'background.paper'
  })

  const messageCardSx = {
    mt: 1,
    p: 1.25,
    bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.14 : 0.05),
    border: '1px solid',
    borderColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.24 : 0.12),
    borderRadius: 1.5
  }

  const getStatusIcon = (status: Consultation['status']) => {
    switch (status) {
      case 'active':
        return <Chat />
      case 'scheduled':
        return <Schedule />
      case 'completed':
        return <CheckCircle />
      default:
        return <Chat />
    }
  }

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography>{t('Loading consultations...')}</Typography>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 2 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom color="primary">
            <LocalHospital sx={{ mr: 1, verticalAlign: 'middle' }} />
            {t('consultations')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('Your consultations with doctors')}
          </Typography>
        </Box>

        {consultations.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('No consultations yet')}
            </Typography>
            <Typography variant="body2">
              {t("Once a doctor responds to your health report, you'll be able to communicate with them here.")}
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
              {t('Active Consultations')}: {consultations.filter(c => c.status === 'active').length}
            </Typography>
            
            <List>
              {consultations.map((consultation, index) => (
                <React.Fragment key={consultation.id}>
                  <ListItem
                    sx={getConsultationItemSx(consultation.status)}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <Person />
                      </Avatar>
                    </ListItemAvatar>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="h6">
                            Dr. {consultation.doctorName}
                          </Typography>
                          <Chip
                            icon={getStatusIcon(consultation.status)}
                            label={t(consultation.status)}
                            size="small"
                            color={getStatusColor(consultation.status) as any}
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          {consultation.doctorSpecialization && (
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {consultation.doctorSpecialization}
                            </Typography>
                          )}
                          
                          {consultation.lastMessage && (
                            <Box sx={messageCardSx}>
                              <Typography variant="body2" gutterBottom>
                                <strong>{t('Last message')}:</strong>
                              </Typography>
                              <Typography variant="body2">
                                {consultation.lastMessage.content.length > 100
                                  ? `${consultation.lastMessage.content.substring(0, 100)}...`
                                  : consultation.lastMessage.content
                                }
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                {formatDate(consultation.lastMessage.timestamp)}
                              </Typography>
                            </Box>
                          )}
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <AccessTime fontSize="small" color="action" />
                              <Typography variant="caption">
                                {t('Started')}: {formatDate(consultation.createdAt)}
                              </Typography>
                            </Box>
                            {consultation.completedAt && (
                              <Typography variant="caption" color="success.main">
                                {t('Completed')}: {formatDate(consultation.completedAt)}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      }
                    />
                    
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {consultation.status === 'active' && (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title={t('Start Chat')}>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleStartChat(consultation)}
                                aria-label={t('Start Chat')}
                              >
                                <Chat />
                              </IconButton>
                            </Tooltip>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleVoiceCall(consultation)}
                              aria-label={t('Voice Call')}
                            >
                              <Phone />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleVideoCall(consultation)}
                              aria-label={t('Video Call')}
                            >
                              <VideoCall />
                            </IconButton>
                          </Box>
                        )}
                        
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => navigate(`/villager/reports`)}
                        >
                          {t('View Report')}
                        </Button>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  
                  {index < consultations.length - 1 && <Divider sx={{ my: 1 }} />}
                </React.Fragment>
              ))}
            </List>
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
      <CallModal open={!!callMode} mode={callMode || 'voice'} onClose={() => setCallMode(null)} />
    </Container>
  )
}

export default ConsultationsList
