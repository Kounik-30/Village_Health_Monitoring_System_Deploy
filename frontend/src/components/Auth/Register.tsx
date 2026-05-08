import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Card,
  CardContent,
  Avatar,
  Grid,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import { 
  Language,
  Visibility, 
  VisibilityOff,
  PersonAdd,
  PersonOutline,
  MedicalServices,
  AdminPanelSettings,
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { designTokens, glassEffect, glassButtonEffect } from '../../styles/theme'
import { useTranslate } from '../../hooks/useTranslate'
import { LANGUAGE_OPTIONS, type SupportedLanguage } from '../../constants/language'

const Register: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phoneNumber: '',
    role: '' as 'villager' | 'doctor' | 'admin' | '',
    specialization: '',
    licenseNumber: '',
    village: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { register } = useAuth()
  const navigate = useNavigate()
  const { t, language, setLanguage } = useTranslate()
  const { showToast } = useNotifications()

  const roleIcons = {
    villager: <PersonOutline />,
    doctor: <MedicalServices />,
    admin: <AdminPanelSettings />,
  }

  const roleColors = {
    villager: designTokens.colors.secondary.main,
    doctor: designTokens.colors.primary.main,
    admin: designTokens.colors.accent.main,
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

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (!formData.role) {
      setError('Please select a role')
      return
    }

    if (formData.role === 'doctor' && (!formData.specialization || !formData.licenseNumber)) {
      setError('Specialization and License Number are required for doctors')
      return
    }

    if (formData.role === 'villager' && !formData.village) {
      setError('Village name is required for villagers')
      return
    }

    setLoading(true)

    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        role: formData.role as 'villager' | 'doctor' | 'admin',
        specialization: formData.role === 'doctor' ? formData.specialization : undefined,
        licenseNumber: formData.role === 'doctor' ? formData.licenseNumber : undefined,
        village: formData.role === 'villager' ? formData.village : undefined,
      }
      const currentUser = await register(payload)
      showToast('Registered Successfully', { severity: 'success', autoHideDuration: 3500 })
      
      switch (currentUser.role) {
        case 'villager':
          navigate('/villager')
          break
        case 'doctor':
          navigate('/doctor')
          break
        case 'admin':
          navigate('/admin')
          break
        default:
          navigate('/login')
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const changeLanguage = (lang: SupportedLanguage) => {
    setLanguage(lang)
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${designTokens.colors.secondary.main}15 0%, ${designTokens.colors.primary.main}15 100%)`,
        display: 'flex',
        alignItems: 'center',
        py: { xs: 2, sm: 4 },
      }}
    >
      <Container component="main" maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            mb: { xs: 1.5, sm: 2 },
            px: { xs: 0.5, sm: 0 },
            width: '100%'
          }}
        >
          <FormControl size="small" sx={{ width: { xs: '100%', sm: 'auto' }, maxWidth: { xs: 220, sm: 'none' } }}>
            <InputLabel>{t('Language')}</InputLabel>
            <Select
              value={language}
              label={t('Language')}
              onChange={(e) => changeLanguage(e.target.value as SupportedLanguage)}
              startAdornment={<Language />}
              sx={{
                ...glassEffect,
                minWidth: { xs: '100%', sm: 150 },
              }}
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Grid container spacing={{ xs: 3, md: 6 }} alignItems="center">
          {/* Left Side - Registration Form */}
          <Grid item xs={12} md={7}>
            <Card sx={{ 
              ...glassEffect, 
              maxWidth: 600, 
              mx: 'auto',
              width: '100%',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(25px)',
              WebkitBackdropFilter: 'blur(25px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.2)',
            }}>
              <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      mx: 'auto',
                      mb: 2,
                      background: designTokens.colors.secondary.gradient,
                      fontSize: '2rem',
                    }}
                  >
                    <PersonAdd sx={{ fontSize: '2rem' }} />
                  </Avatar>
                  <Typography 
                    component="h1" 
                    variant="h4" 
                    sx={{
                      mb: 1,
                      fontWeight: 700,
                      fontSize: { xs: '2rem', sm: '2.125rem' },
                      background: designTokens.colors.secondary.gradient,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {t('Join Village Health')}
                  </Typography>
                  <Typography variant="h6" sx={{ color: designTokens.colors.neutral[600] }}>
                    {t('register')}
                  </Typography>
                  <Typography variant="body1" sx={{ color: designTokens.colors.neutral[700] }}>
                    {t('Create your account to access healthcare services')}
                  </Typography>
                </Box>

                {error && (
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mb: 3,
                      borderRadius: designTokens.borderRadius.md,
                    }}
                  >
                    {t(error)}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="fullName"
                        label={t('fullName')}
                        name="fullName"
                        autoComplete="name"
                        autoFocus
                        value={formData.fullName}
                        onChange={handleChange('fullName')}
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            borderRadius: designTokens.borderRadius.md,
                          },
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label={t('email')}
                        name="email"
                        autoComplete="email"
                        value={formData.email}
                        onChange={handleChange('email')}
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            borderRadius: designTokens.borderRadius.md,
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="phoneNumber"
                        label={t('phoneNumber')}
                        name="phoneNumber"
                        autoComplete="tel"
                        value={formData.phoneNumber}
                        onChange={handleChange('phoneNumber')}
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            borderRadius: designTokens.borderRadius.md,
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth margin="normal" required>
                        <InputLabel>{t('selectRole')}</InputLabel>
                        <Select
                          value={formData.role}
                          onChange={handleChange('role')}
                          label={t('selectRole')}
                          sx={{
                            borderRadius: designTokens.borderRadius.md,
                          }}
                          renderValue={(value) => (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {value && roleIcons[value as keyof typeof roleIcons]}
                              {value && t(value)}
                            </Box>
                          )}
                        >
                          <MenuItem value="villager">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PersonOutline sx={{ color: roleColors.villager }} />
                              {t('villager')}
                            </Box>
                          </MenuItem>
                          <MenuItem value="doctor">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <MedicalServices sx={{ color: roleColors.doctor }} />
                              {t('doctor')}
                            </Box>
                          </MenuItem>
                          <MenuItem value="admin">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <AdminPanelSettings sx={{ color: roleColors.admin }} />
                              {t('admin')}
                            </Box>
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Conditional fields based on role */}
                    {formData.role === 'doctor' && (
                      <>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="specialization"
                            label={t('Specialization')}
                            name="specialization"
                            value={formData.specialization}
                            onChange={handleChange('specialization')}
                            sx={{ 
                              '& .MuiOutlinedInput-root': {
                                borderRadius: designTokens.borderRadius.md,
                              },
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="licenseNumber"
                            label={t('License Number')}
                            name="licenseNumber"
                            value={formData.licenseNumber}
                            onChange={handleChange('licenseNumber')}
                            sx={{ 
                              '& .MuiOutlinedInput-root': {
                                borderRadius: designTokens.borderRadius.md,
                              },
                            }}
                          />
                        </Grid>
                      </>
                    )}

                    {formData.role === 'villager' && (
                      <Grid item xs={12}>
                        <TextField
                          margin="normal"
                          required
                          fullWidth
                          id="village"
                          label={t('Village Name')}
                          name="village"
                          value={formData.village}
                          onChange={handleChange('village')}
                          sx={{ 
                            '& .MuiOutlinedInput-root': {
                              borderRadius: designTokens.borderRadius.md,
                            },
                          }}
                        />
                      </Grid>
                    )}

                    <Grid item xs={12} sm={6}>
                      <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label={t('password')}
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        autoComplete="new-password"
                        value={formData.password}
                        onChange={handleChange('password')}
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            borderRadius: designTokens.borderRadius.md,
                          },
                        }}
                        InputProps={{
                          endAdornment: (
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          )
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="confirmPassword"
                        label={t('confirmPassword')}
                        type="password"
                        id="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange('confirmPassword')}
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            borderRadius: designTokens.borderRadius.md,
                          },
                        }}
                      />
                    </Grid>
                  </Grid>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    startIcon={loading ? null : <PersonAdd />}
                    sx={{ 
                      ...glassButtonEffect.secondary,
                      mt: 3, 
                      mb: 3, 
                      py: 1.5,
                      fontSize: '1.1rem',
                      '&:disabled': {
                        background: designTokens.colors.neutral[300],
                        opacity: 0.6,
                      },
                    }}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : t('register')}
                  </Button>
                  
                  <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Typography variant="body2" sx={{ color: designTokens.colors.neutral[600] }}>
                      {t('Already have an account?')}{' '}
                      <Link 
                        to="/login" 
                        style={{ 
                          textDecoration: 'none', 
                          color: designTokens.colors.primary.main,
                          fontWeight: 500,
                        }}
                      >
                        {t('login')}
                      </Link>
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Side - Animated Mockup */}
          <Grid item xs={12} md={5}>
            <Box sx={{ textAlign: 'center' }}>
              <Card
                sx={{
                  ...glassEffect,
                  overflow: 'hidden',
                  maxWidth: 350,
                  mx: 'auto',
                  width: '100%',
                  '&:hover': {
                    transform: 'translateY(-8px) rotateY(-5deg)',
                    boxShadow: designTokens.shadows.strong,
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=350&q=80"
                  alt={t('Join Village Health Community')}
                  style={{
                    width: '100%',
                    height: isMobile ? '260px' : '450px',
                    objectFit: 'cover',
                  }}
                />
              </Card>
              <Typography
                variant="h6"
                sx={{
                  mt: 3,
                  color: designTokens.colors.neutral[700],
                  fontWeight: 500,
                }}
              >
                {t('Join Our Healthcare Community')}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mt: 1,
                  color: designTokens.colors.neutral[600],
                  maxWidth: 280,
                  mx: 'auto',
                }}
              >
                {t('Connect with healthcare professionals and access quality medical services')}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}

export default Register
