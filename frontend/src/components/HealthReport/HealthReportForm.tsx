import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { alpha, useTheme } from '@mui/material/styles'
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Grid
} from '@mui/material'
import { Send, Warning, Mic, Stop } from '@mui/icons-material'
import LocationMap from '../Communication/LocationMap'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { reportsApi } from '../../services/api'
import type { HealthReport } from '../../types/models'
import { useTranslate } from '../../hooks/useTranslate'

const HealthReportForm: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [formData, setFormData] = useState({
    symptoms: '',
    description: '',
    urgency: 'medium' as 'low' | 'medium' | 'high' | 'emergency'
  })
  const [location, setLocation] = useState<{latitude: number, longitude: number, address?: string, text?: string} | null>(null)
  const [bounds, setBounds] = useState<[[number, number],[number, number]] | null>(null)
  const [manualLocation, setManualLocation] = useState('')
  const [geocodeTimer, setGeocodeTimer] = useState<number | null>(null)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [voiceFileName, setVoiceFileName] = useState<string>('')
  const [voiceDataUrl, setVoiceDataUrl] = useState<string>('')
  const [voiceMimeType, setVoiceMimeType] = useState<string>('audio/webm')
  const [voiceSaved, setVoiceSaved] = useState<boolean>(false)
  const [attachments, setAttachments] = useState<Array<{ name: string; mimeType: string; dataUrl: string; size: number; uploadedAt: Date }>>([])

  const { user } = useAuth()
  const { showToast } = useNotifications()
  const { t, language } = useTranslate()
  const navigate = useNavigate()
  const theme = useTheme()

  // Check URL parameters for emergency
  useEffect(() => {
    if (searchParams.get('emergency') === 'true') {
      setFormData(prev => ({ ...prev, urgency: 'emergency' }))
    }
  }, [searchParams])

  // Auto-geocode when user types a location name - Enhanced for better real-time updates
  useEffect(() => {
    if (!manualLocation.trim()) {
      setLocation(null)
      setIsGeocoding(false)
      return
    }
    
    setIsGeocoding(true)
    
    if (geocodeTimer) {
      clearTimeout(geocodeTimer)
    }
    
    // Reduced debounce time for more responsive updates
    const timer = window.setTimeout(() => {
      geocodeManualLocation()
    }, 400)
    
    setGeocodeTimer(timer)
    return () => clearTimeout(timer)
  }, [manualLocation])

  const geocodeManualLocation = async () => {
    if (!manualLocation.trim()) {
      setIsGeocoding(false)
      return
    }
    
    // Helper to get device location quickly (for local bias)
    const getDeviceLocation = () => new Promise<{ lat: number; lon: number } | null>((resolve) => {
      if (!navigator.geolocation) return resolve(null)
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: false, timeout: 5000 }
      )
    })

    // Helper to run a nominatim query with optional viewbox bias
    const trySearch = async (q: string, viewbox?: { south: number; west: number; north: number; east: number }) => {
      const params = new URLSearchParams({
        format: 'json',
        q,
        limit: '1',
        addressdetails: '1'
      })
      if (viewbox) {
        params.set('viewbox', `${viewbox.west},${viewbox.south},${viewbox.east},${viewbox.north}`)
        params.set('bounded', '1')
      }
      const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`
      const res = await fetch(url)
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        return data[0]
      }
      return null
    }

    try {
      setIsGeocoding(true)

      // Clean up the input (remove parentheses & extra spaces)
      const cleaned = manualLocation.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim()
      const zipMatch = cleaned.match(/\b\d{5,6}\b/)
      const postal = zipMatch ? zipMatch[0] : ''

      // Prepare candidate queries (ordered by relevance)
      const candidates: string[] = []
      if (cleaned) candidates.push(cleaned)
      if (postal) candidates.push(postal)
      // Add global fallback with country context if missing
      if (!/\b(India|IN)\b/i.test(cleaned)) candidates.push(`${cleaned}, India`)

      // Try to get device location for local bias
      const userLoc = await getDeviceLocation()
      let best: any = null

      // If we have device location, search with a small viewbox around it first
      if (userLoc) {
        const delta = 0.35 // ~40km box
        const viewbox = {
          south: userLoc.lat - delta,
          west: userLoc.lon - delta,
          north: userLoc.lat + delta,
          east: userLoc.lon + delta
        }
        for (const q of candidates) {
          best = await trySearch(q, viewbox)
          if (best) break
        }
      }

      // Fallback: global search without viewbox
      if (!best) {
        for (const q of candidates) {
          best = await trySearch(q)
          if (best) break
        }
      }

      if (best) {
        const lat = parseFloat(best.lat)
        const lon = parseFloat(best.lon)
        setLocation({ 
          latitude: lat, 
          longitude: lon, 
          address: best.display_name, 
          text: cleaned 
        })
        // Parse boundingbox if available: [south, north, west, east]
        const bb = best?.boundingbox
        if (Array.isArray(bb) && bb.length === 4) {
          const south = parseFloat(bb[0])
          const north = parseFloat(bb[1])
          const west = parseFloat(bb[2])
          const east = parseFloat(bb[3])
          if ([south, north, west, east].every(v => Number.isFinite(v))) {
            setBounds([[south, west],[north, east]])
          } else {
            setBounds(null)
          }
        } else {
          setBounds(null)
        }
        setError('')
      } else {
        setBounds(null)
        setLocation(null)
      setError('Location not found. Try simplifying the address or include nearby city name.')
      }
    } catch (e: any) {
      setBounds(null)
      setError(e?.message || 'Failed to find the location. Check your network connection.')
    } finally {
      setIsGeocoding(false)
    }
  }

  const handleFileSelectChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const files = e.target.files
      if (!files || files.length === 0) return
      const newItems: Array<{ name: string; mimeType: string; dataUrl: string; size: number; uploadedAt: Date }> = []
      const tasks: Promise<void>[] = []
      for (const file of Array.from(files)) {
        const task = new Promise<void>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            try {
              const result = reader.result as string
              newItems.push({
                name: file.name,
                mimeType: file.type || 'application/octet-stream',
                dataUrl: result || '',
                size: file.size,
                uploadedAt: new Date()
              })
              resolve()
            } catch (err) {
              reject(err)
            }
          }
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        tasks.push(task)
      }
      await Promise.all(tasks)
      setAttachments(prev => [...newItems, ...prev])
      e.currentTarget.value = ''
    } catch (e: any) {
      setError(e?.message || 'Failed to load selected files')
    }
  }

  const [isRecording, setIsRecording] = useState(false)
  const [recordError, setRecordError] = useState('')
  const [recordStart, setRecordStart] = useState<number | null>(null)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null)
  useEffect(() => {
    let interval: any
    if (isRecording && recordStart) {
      interval = setInterval(() => {
        setRecordSeconds(Math.floor((Date.now() - recordStart) / 1000))
      }, 250)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRecording, recordStart])
  const startRecording = async () => {
    try {
      setRecordError('')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      const chunks: Blob[] = []
      mr.ondataavailable = (evt: BlobEvent) => {
        if (evt.data && evt.data.size > 0) {
          chunks.push(evt.data)
        }
      }
      mr.onstop = async () => {
        try {
          const blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' })
          const reader = new FileReader()
          reader.onloadend = () => {
            const result = reader.result as string
            setVoiceDataUrl(result || '')
            setVoiceFileName('recording.' + ((mr.mimeType || 'audio/webm').split('/')[1] || 'webm'))
            setVoiceMimeType(mr.mimeType || 'audio/webm')
            setVoiceSaved(false)
          }
          reader.readAsDataURL(blob)
        } catch (e: any) {
          setRecordError(e?.message || 'Failed to process recording')
        }
      }
      setMediaStream(stream)
      setRecorder(mr)
      setIsRecording(true)
      setRecordStart(Date.now())
      setRecordSeconds(0)
      mr.start()
    } catch (e: any) {
      setRecordError(e?.message || 'Microphone access denied')
      setIsRecording(false)
      setRecordStart(null)
    }
  }
  const stopRecording = () => {
    try {
      recorder?.stop()
    } finally {
      setIsRecording(false)
      setRecordStart(null)
      setRecordSeconds(0)
      mediaStream?.getTracks().forEach(t => t.stop())
      setMediaStream(null)
    }
  }
  const discardRecording = () => {
    setVoiceDataUrl('')
    setVoiceFileName('')
    setRecordError('')
    setVoiceSaved(false)
  }
  const saveRecording = () => {
    if (!voiceDataUrl) return
    setVoiceSaved(true)
  }

  const handleChange = (field: string) => (e: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const newReport: HealthReport = {
        id: Date.now().toString(),
        userId: user!.id,
        symptoms: formData.symptoms,
        description: formData.description,
        urgency: formData.urgency,
        location: location || undefined,
        createdAt: new Date(),
        status: 'pending',
        responses: [],
        assignedDoctorId: undefined,
        assignedDoctorName: undefined
      }

      if (voiceSaved && voiceDataUrl) {
        newReport.voiceMessage = {
          mimeType: voiceMimeType || (voiceDataUrl.split(';')[0].split(':')[1] || 'audio/mpeg'),
          dataUrl: voiceDataUrl,
          uploadedAt: new Date()
        }
      }
      if (attachments.length > 0) {
        ;(newReport as any).attachments = attachments
      }

      const createdReport = await reportsApi.create(newReport)
      window.dispatchEvent(new CustomEvent('allReportsUpdated', { detail: { reason: 'new_report', reportId: createdReport.id } }))

      setSuccess('Health report submitted successfully')
      showToast('Report submitted successfully', { severity: 'success', autoHideDuration: 3000 })
      
      // Reset form
      setFormData({
        symptoms: '',
        description: '',
        urgency: 'medium'
      })
      setLocation(null)
      setVoiceFileName('')
      setVoiceDataUrl('')
      setRecordError('')
      setVoiceSaved(false)
      setAttachments([])

      // Navigate back to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/villager')
      }, 2000)

    } catch (err: any) {
      setError(err.message || 'Failed to submit report')
      showToast('Something went wrong', { severity: 'error', autoHideDuration: 3500 })
    } finally {
      setLoading(false)
    }
  }

  const commonSymptoms = [
    'Fever', 'Cough', 'Headache', 'Body Pain', 'Stomach Pain',
    'Diarrhea', 'Vomiting', 'Dizziness', 'Chest Pain', 'Breathing Difficulty'
  ]

  const getStoredSymptomLabel = (symptom: string) => (language === 'bn' ? t(symptom) : symptom)

  const urgencyColors = {
    low: theme.palette.success.main,
    medium: theme.palette.warning.main,
    high: theme.palette.error.light,
    emergency: theme.palette.error.main
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 2 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom color="primary">
            {t('reportHealth')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('Please describe your symptoms and health concerns')}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {t(error)}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {t(success)}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          {/* Quick Symptom Selection */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('Common Symptoms (Click to add)')}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {commonSymptoms.map((symptom) => (
                <Chip
                  key={symptom}
                  label={t(symptom)}
                  onClick={() => {
                    const currentSymptoms = formData.symptoms
                    const nextSymptom = getStoredSymptomLabel(symptom)
                    const newSymptoms = currentSymptoms 
                      ? `${currentSymptoms}, ${nextSymptom}`
                      : nextSymptom
                    setFormData(prev => ({ ...prev, symptoms: newSymptoms }))
                  }}
                  variant="outlined"
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Box>

          {/* Symptoms Input */}
          <TextField
            fullWidth
            label={t('symptoms')}
            multiline
            rows={3}
            value={formData.symptoms}
            onChange={handleChange('symptoms')}
            required
            sx={{ mb: 3 }}
            placeholder={t('Describe your symptoms (e.g., fever, headache, cough)')}
          />

          {/* Description */}
          <TextField
            fullWidth
            label={t('description')}
            multiline
            rows={4}
            value={formData.description}
            onChange={handleChange('description')}
            sx={{ mb: 3 }}
            placeholder={t('Provide more details about your condition, when it started, etc.')}
          />

          {/* Urgency Level */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>{t('urgency')}</InputLabel>
            <Select
              value={formData.urgency}
              onChange={handleChange('urgency')}
              label={t('urgency')}
            >
              <MenuItem value="low">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: urgencyColors.low }} />
                  {t('Low - Can wait for regular consultation')}
                </Box>
              </MenuItem>
              <MenuItem value="medium">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: urgencyColors.medium }} />
                  {t('Medium - Need consultation soon')}
                </Box>
              </MenuItem>
              <MenuItem value="high">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: urgencyColors.high }} />
                  {t('High - Need urgent attention')}
                </Box>
              </MenuItem>
              <MenuItem value="emergency">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Warning sx={{ color: urgencyColors.emergency }} />
                  {t('Emergency - Life threatening')}
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('Optional Voice Message')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {t('Attach a short voice description of your health issue')}
            </Typography>
            <Button variant="outlined" component="label" sx={{ mr: 2 }}>
              {t('Choose File')}
              <input
                hidden
                type="file"
                multiple
                accept="audio/*,image/*,application/pdf"
                onChange={handleFileSelectChange}
              />
            </Button>
            {attachments.length > 0 && (
              <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {attachments.map((att, idx) => (
                  <Chip
                    key={`${att.name}_${idx}`}
                    label={att.name}
                    onDelete={() => {
                      setAttachments(prev => prev.filter((_, i) => i !== idx))
                    }}
                    variant="outlined"
                  />
                ))}
              </Box>
            )}
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('Record Voice')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              {!isRecording ? (
                <Button variant="contained" color="primary" onClick={startRecording} startIcon={<Mic />}>
                  {t('Start Recording')}
                </Button>
              ) : (
                <Button variant="contained" color="error" onClick={stopRecording} startIcon={<Stop />}>
                  {t('Stop')} ({recordSeconds}s)
                </Button>
              )}
              {!!voiceDataUrl && !voiceSaved && (
                <>
                  <audio controls src={voiceDataUrl} style={{ maxWidth: 320 }} />
                  <Button variant="contained" color="primary" onClick={saveRecording}>
                    {t('save')}
                  </Button>
                  <Button variant="outlined" color="error" onClick={discardRecording}>
                    {t('discard')}
                  </Button>
                </>
              )}
              {!!voiceDataUrl && voiceSaved && (
                <>
                  <Chip label={voiceFileName || t('Saved recording')} color="primary" variant="filled" />
                  <audio controls src={voiceDataUrl} style={{ maxWidth: 320 }} />
                  <Button variant="outlined" color="error" onClick={discardRecording}>
                    {t('discard')}
                  </Button>
                </>
              )}
            </Box>
            {recordError && (
              <Alert severity="error" sx={{ mt: 1 }}>{t(recordError)}</Alert>
            )}
          </Box>

          {/* Enter Location */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label={t('Enter your location')}
              value={manualLocation}
              onChange={(e) => setManualLocation(e.target.value)}
              placeholder={t('Type a place name (e.g., Barasat, Gobardanga, Kolkata)')}
              helperText={
                isGeocoding 
                  ? t('Searching for location...') 
                  : location 
                    ? `✓ ${t('Found')}: ${location.text}` 
                    : t('Enter a place name to see it on the map')
              }
              InputProps={{
                endAdornment: isGeocoding ? <CircularProgress size={20} /> : null
              }}
            />
            
            {/* Real-time Map Display */}
            {location && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="success.main" gutterBottom>
                  📍 {location.address || `${location.text} (${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})`}
                </Typography>
                <LocationMap 
                  latitude={location.latitude} 
                  longitude={location.longitude} 
                  address={location.address || location.text} 
                  bounds={bounds ?? undefined}
                  onLocationChange={(loc) => {
                    setLocation({
                      latitude: loc.latitude,
                      longitude: loc.longitude,
                      address: loc.address,
                      text: loc.text || manualLocation.trim()
                    })
                    // Clear bounds so map uses setView for device location
                    setBounds(null)
                    if (loc.text) {
                      setManualLocation(loc.text)
                    }
                  }}
                />
              </Box>
            )}
            
            {/* Show helpful message when no location is entered */}
            {!manualLocation.trim() && !location && (
              <Box
                sx={{
                  mt: 1,
                  p: 2,
                  bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.14 : 0.05),
                  border: '1px solid',
                  borderColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.24 : 0.12),
                  borderRadius: 1.5
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {t('Enter your location to help doctors understand your area and provide better assistance')}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Submit Buttons */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate('/villager')}
                size="large"
              >
                {t('cancel')}
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading || !formData.symptoms}
                startIcon={loading ? <CircularProgress size={20} /> : <Send />}
                size="large"
                sx={{
                  bgcolor: formData.urgency === 'emergency' ? urgencyColors.emergency : undefined
                }}
              >
                {loading ? t('Submitting...') : t('submit')}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  )
}

export default HealthReportForm
