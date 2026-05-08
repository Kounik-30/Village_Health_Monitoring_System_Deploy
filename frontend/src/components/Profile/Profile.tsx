import React, { useEffect, useMemo, useState } from 'react'
import {
  Container,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Typography,
  Grid,
  TextField,
  Button,
  IconButton,
  Stack,
  Divider,
  Box,
  InputAdornment,
} from '@mui/material'
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon,
  DeleteOutline as DeleteOutlineIcon,
  AccountCircle,
  Email,
  Phone,
  Wc,
  CalendarToday,
  Home,
  MedicalServices,
  Badge,
  LocationOn,
  History as HistoryIcon,
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { useTranslate } from '../../hooks/useTranslate'
import { localizePersonName } from '../../utils/localizePersonName'

const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth()
  const { showToast } = useNotifications()
  const { t, language } = useTranslate()
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    gender: '',
    dateOfBirth: '',
    address: '',
    specialization: '',
    licenseNumber: '',
    village: '',
    medicalHistory: '',
    profilePicture: '',
  })

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        gender: user.gender || '',
        dateOfBirth: user.dateOfBirth || '',
        address: user.address || '',
        specialization: user.specialization || '',
        licenseNumber: user.licenseNumber || '',
        village: user.village || '',
        medicalHistory: user.medicalHistory || '',
        profilePicture: user.profilePicture || '',
      })
    }
  }, [user])

  const avatarLetters = useMemo(() => {
    const name = user?.fullName || 'U'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name[0]?.toUpperCase() || 'U'
  }, [user])

  const localizedProfileName = useMemo(
    () => localizePersonName(user?.fullName, { language, t, role: user?.role }),
    [language, t, user?.fullName, user?.role]
  )

  const memberSinceDate = useMemo(
    () => (user?.createdAt ? new Date(user.createdAt).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US') : ''),
    [language, user?.createdAt]
  )

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setForm(prev => ({ ...prev, profilePicture: dataUrl }))
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      await updateProfile({
        fullName: form.fullName,
        email: form.email,
        phoneNumber: form.phoneNumber,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth,
        address: form.address,
        specialization: user.role === 'doctor' ? form.specialization : undefined,
        licenseNumber: user.role === 'doctor' ? form.licenseNumber : undefined,
        village: user.role === 'villager' ? form.village : undefined,
        medicalHistory: user.role === 'villager' ? form.medicalHistory : undefined,
        profilePicture: form.profilePicture,
      })
      setIsEditing(false)
      showToast('Profile updated successfully', { severity: 'success', autoHideDuration: 3000 })
    } catch (error: any) {
      showToast('Failed to update profile', { severity: 'error', autoHideDuration: 4000 })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    // Reset to original user data
    if (!user) return
    setForm({
      fullName: user.fullName || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      gender: user.gender || '',
      dateOfBirth: user.dateOfBirth || '',
      address: user.address || '',
      specialization: user.specialization || '',
      licenseNumber: user.licenseNumber || '',
      village: user.village || '',
      medicalHistory: user.medicalHistory || '',
      profilePicture: user.profilePicture || '',
    })
    setIsEditing(false)
  }

  const handleRemovePhoto = () => {
    setForm((prev) => ({
      ...prev,
      profilePicture: ''
    }))
  }

  if (!user) {
    return (
      <Container maxWidth="md">
        <Typography variant="h6" sx={{ mt: 4 }}>{t('No user loaded')}</Typography>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ pb: 6 }}>
      {/* Header Card with Avatar */}
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={form.profilePicture || undefined}
                sx={{ width: 96, height: 96, bgcolor: 'primary.main', fontSize: 32 }}
              >
                {avatarLetters}
              </Avatar>
              {isEditing && (
                <IconButton
                  component="label"
                  aria-label={t('upload picture')}
                  sx={{ position: 'absolute', right: -8, bottom: -8, bgcolor: 'background.paper', boxShadow: 2 }}
                >
                  <PhotoCameraIcon />
                  <input hidden accept="image/*" type="file" onChange={handleImageChange} />
                </IconButton>
              )}
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={600}>{localizedProfileName}</Typography>
              <Typography variant="body2" color="text.secondary">{t('Role')}: {t(user.role)}</Typography>
              <Typography variant="body2" color="text.secondary">{t('Member since')} {memberSinceDate}</Typography>
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            {!isEditing ? (
              <Button variant="contained" startIcon={<EditIcon />} onClick={() => setIsEditing(true)}>
                {t('Edit Profile')}
              </Button>
            ) : (
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {t('save')}
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  disabled={saving}
                >
                  {t('cancel')}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteOutlineIcon />}
                  onClick={handleRemovePhoto}
                  disabled={saving}
                >
                  {t('Remove Photo')}
                </Button>
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card elevation={1} sx={{ mb: 3 }}>
        <CardHeader title={t('Personal Information')} />
        <Divider />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label={t('Full Name')}
                value={form.fullName}
                onChange={handleChange('fullName')}
                fullWidth
                disabled={!isEditing}
                InputProps={{ startAdornment: <InputAdornment position="start"><AccountCircle /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label={t('Email')}
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                fullWidth
                disabled={!isEditing}
                InputProps={{ startAdornment: <InputAdornment position="start"><Email /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label={t('Phone Number')}
                value={form.phoneNumber}
                onChange={handleChange('phoneNumber')}
                fullWidth
                disabled={!isEditing}
                InputProps={{ startAdornment: <InputAdornment position="start"><Phone /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label={t('Gender')}
                value={form.gender}
                onChange={handleChange('gender')}
                fullWidth
                disabled={!isEditing}
                InputProps={{ startAdornment: <InputAdornment position="start"><Wc /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label={t('Date of Birth')}
                type="date"
                value={form.dateOfBirth}
                onChange={handleChange('dateOfBirth')}
                fullWidth
                disabled={!isEditing}
                InputLabelProps={{ shrink: true }}
                InputProps={{ startAdornment: <InputAdornment position="start"><CalendarToday /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label={t('Address')}
                value={form.address}
                onChange={handleChange('address')}
                fullWidth
                disabled={!isEditing}
                InputProps={{ startAdornment: <InputAdornment position="start"><Home /></InputAdornment> }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Role-specific Information */}
      <Card elevation={1} sx={{ mb: 3 }}>
        <CardHeader title={t('Role Details')} />
        <Divider />
        <CardContent>
          <Grid container spacing={2}>
            {user.role === 'doctor' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={t('Specialization')}
                    value={form.specialization}
                    onChange={handleChange('specialization')}
                    fullWidth
                    disabled={!isEditing}
                    InputProps={{ startAdornment: <InputAdornment position="start"><MedicalServices /></InputAdornment> }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={t('License Number')}
                    value={form.licenseNumber}
                    onChange={handleChange('licenseNumber')}
                    fullWidth
                    disabled={!isEditing}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Badge /></InputAdornment> }}
                  />
                </Grid>
              </>
            )}

            {user.role === 'villager' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={t('Village')}
                    value={form.village}
                    onChange={handleChange('village')}
                    fullWidth
                    disabled={!isEditing}
                    InputProps={{ startAdornment: <InputAdornment position="start"><LocationOn /></InputAdornment> }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label={t('Medical History')}
                    value={form.medicalHistory}
                    onChange={handleChange('medicalHistory')}
                    fullWidth
                    multiline
                    minRows={3}
                    disabled={!isEditing}
                    InputProps={{ startAdornment: <InputAdornment position="start"><HistoryIcon /></InputAdornment> }}
                  />
                </Grid>
              </>
            )}

            {user.role === 'admin' && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  {t('Admins do not have additional role-specific fields.')}
                </Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
    </Container>
  )
}

export default Profile
