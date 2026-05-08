import React, { useMemo, useState } from 'react'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  IconButton,
  alpha,
} from '@mui/material'
import {
  Email,
  Phone,
  LocationOn,
  Send,
  Facebook,
  Twitter,
  LinkedIn,
  Instagram,
  ExpandMore,
  Schedule,
  Support,
  Public,
  Security,
  Group,
} from '@mui/icons-material'
import AnimatedSection from './AnimatedSection'
import { designTokens, glassEffect } from '../../styles/theme'
import { contactApi } from '../../services/api'
import { useNotifications } from '../../contexts/NotificationContext'
import { useTranslate } from '../../hooks/useTranslate'

type ContactFormData = {
  name: string
  email: string
  subject: string
  message: string
}

type ContactFormErrors = Partial<Record<keyof ContactFormData, string>>

const initialFormData: ContactFormData = {
  name: '',
  email: '',
  subject: '',
  message: '',
}

const Contact: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { showToast } = useNotifications()
  const { t } = useTranslate()
  const [formData, setFormData] = useState<ContactFormData>(initialFormData)
  const [errors, setErrors] = useState<ContactFormErrors>({})
  const [submitState, setSubmitState] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState<string | false>(false)

  const isDark = theme.palette.mode === 'dark'

  const validateForm = useMemo(
    () => (data: ContactFormData): ContactFormErrors => {
      const nextErrors: ContactFormErrors = {}
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      if (!data.name.trim()) nextErrors.name = t('Full name is required')
      if (!data.email.trim()) nextErrors.email = t('Email address is required')
      else if (!emailPattern.test(data.email.trim())) nextErrors.email = t('Enter a valid email address')
      if (!data.subject.trim()) nextErrors.subject = t('Subject is required')
      if (!data.message.trim()) nextErrors.message = t('Message is required')
      else if (data.message.trim().length < 10) nextErrors.message = t('Message must be at least 10 characters')

      return nextErrors
    },
    [t]
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
    if (errors[name as keyof ContactFormData]) {
      setErrors((current) => ({
        ...current,
        [name]: undefined
      }))
    }
    if (submitState) {
      setSubmitState(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationErrors = validateForm(formData)

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setSubmitState({
        type: 'error',
        message: 'Please fix the highlighted fields and try again.'
      })
      return
    }

    setErrors({})
    setSubmitState(null)
    setIsSubmitting(true)

    try {
      const response = await contactApi.sendMessage({
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      })

      setFormData(initialFormData)
      setSubmitState({
        type: 'success',
        message: response.message || 'Message sent successfully'
      })
       
      setTimeout(() => {
        setSubmitState(null)
      }, 3000)
      
      showToast('Message sent successfully', { severity: 'success', autoHideDuration: 3500 })
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to send message. Please try again.'

      setSubmitState({
        type: 'error',
        message
      })
      showToast(message || 'Something went wrong', { severity: 'error', autoHideDuration: 4000 })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFaqChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedFaq(isExpanded ? panel : false)
  }

  const contactInfo = [
    {
      icon: <Email />,
      title: t('Email Us'),
      content: 'support@villagehealthmonitor.com',
      description: t('Get in touch via email for detailed inquiries'),
    },
    {
      icon: <Phone />,
      title: t('Call Us'),
      content: '+1 (555) 123-4567',
      description: t('24/7 support hotline for urgent matters'),
    },
    {
      icon: <LocationOn />,
      title: t('Visit Us'),
      content: '123 Healthcare Ave, Medical District',
      description: t('Our headquarters and main support center'),
    },
  ]

  const socialLinks = [
    { icon: <Facebook />, name: 'Facebook', url: '#' },
    { icon: <Twitter />, name: 'Twitter', url: '#' },
    { icon: <LinkedIn />, name: 'LinkedIn', url: '#' },
    { icon: <Instagram />, name: 'Instagram', url: '#' },
  ]

  const faqs = [
    {
      id: 'faq1',
      question: t('How do I get started with Village Health Monitor?'),
      answer: t('Getting started is easy! Simply sign up for an account, choose your role (patient, doctor, or health worker), and complete the onboarding process. Our team will guide you through the setup and provide training materials.'),
    },
    {
      id: 'faq2',
      question: t('Is my health data secure and private?'),
      answer: t('Absolutely. We use end-to-end encryption, comply with HIPAA regulations, and follow industry best practices for data security. Your health information is never shared without your explicit consent.'),
    },
    {
      id: 'faq3',
      question: t('What devices are compatible with the platform?'),
      answer: t('Our platform works on all modern devices including smartphones, tablets, and computers. We also integrate with popular wearable devices and health monitoring equipment.'),
    },
    {
      id: 'faq4',
      question: t('How much does the service cost?'),
      answer: t('We offer flexible pricing plans for individuals, healthcare providers, and organizations. Contact our sales team for detailed pricing information tailored to your needs.'),
    },
    {
      id: 'faq5',
      question: t('Do you provide training and support?'),
      answer: t('Yes! We provide comprehensive training materials, video tutorials, and 24/7 customer support. Our team is always ready to help you make the most of our platform.'),
    },
    {
      id: 'faq6',
      question: t('Can I integrate with existing healthcare systems?'),
      answer: t('Our platform supports integration with most major healthcare systems and electronic health records (EHR) platforms. Our technical team can help with custom integrations.'),
    },
  ]

  const officeHours = [
    { day: t('Monday - Friday'), hours: t('8:00 AM - 6:00 PM') },
    { day: t('Saturday'), hours: t('9:00 AM - 4:00 PM') },
    { day: t('Sunday'), hours: t('Emergency Support Only') },
  ]

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.18 : 0.12)} 0%, ${alpha(theme.palette.secondary.main, theme.palette.mode === 'dark' ? 0.16 : 0.12)} 100%)`,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant={isMobile ? 'h3' : 'h1'}
              component="h1"
              sx={{
                mb: 3,
                fontWeight: 700,
                background: designTokens.colors.primary.gradient,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {t('Get in Touch')}
            </Typography>
            <Typography
              variant="h5"
              sx={{
                color: 'text.secondary',
                maxWidth: '600px',
                mx: 'auto',
                lineHeight: 1.6,
              }}
            >
              {t("We're here to help you transform healthcare in your community")}
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Contact Form Section */}
      <AnimatedSection
        animation="slideInLeft"
        title={t('Send Us a Message')}
        subtitle={t("Have questions or need support? We'd love to hear from you.")}
      >
        <Grid container spacing={6}>
          <Grid item xs={12} md={8}>
            <Card sx={{ ...glassEffect }}>
              <CardContent sx={{ p: 4 }}>
                <form onSubmit={handleSubmit}>
                  {submitState ? (
                    <Alert severity={submitState.type} sx={{ mb: 3 }}>
                      {t(submitState.message)}
                    </Alert>
                  ) : null}
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label={t('Full Name')}
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        error={Boolean(errors.name)}
                        helperText={errors.name}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: designTokens.borderRadius.md,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label={t('Email Address')}
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        error={Boolean(errors.email)}
                        helperText={errors.email}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: designTokens.borderRadius.md,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={t('Subject')}
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        error={Boolean(errors.subject)}
                        helperText={errors.subject}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: designTokens.borderRadius.md,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={t('Message')}
                        name="message"
                        multiline
                        rows={6}
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        error={Boolean(errors.message)}
                        helperText={errors.message}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: designTokens.borderRadius.md,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <Send />}
                        disabled={isSubmitting}
                        sx={{
                          px: 4,
                          py: 1.5,
                          background: designTokens.colors.primary.gradient,
                          '&:hover': {
                            background: designTokens.colors.primary.gradient,
                            filter: 'brightness(1.1)',
                            transform: 'translateY(-2px)',
                          },
                        }}
                      >
                        {isSubmitting ? t('Sending...') : t('Send Message')}
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                ...glassEffect,
                height: 'fit-content',
                background: isDark ? alpha(theme.palette.background.paper, 0.88) : glassEffect.background,
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=300&fit=crop&crop=center"
                alt={t('Contact us')}
                style={{
                  width: '100%',
                  height: '200px',
                  objectFit: 'cover',
                }}
              />
            </Card>
          </Grid>
        </Grid>
      </AnimatedSection>

      {/* Contact Information Section */}
      <AnimatedSection
        background="light"
        animation="slideInRight"
        title={t('Contact Information')}
        subtitle={t('Multiple ways to reach our support team')}
      >
        <Grid container spacing={4}>
          {contactInfo.map((info, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card
                sx={{
                  ...glassEffect,
                  textAlign: 'center',
                  height: '100%',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: designTokens.shadows.strong,
                  },
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Avatar
                    sx={{
                      width: 60,
                      height: 60,
                      mx: 'auto',
                      mb: 2,
                      background: designTokens.colors.primary.gradient,
                    }}
                  >
                    {info.icon}
                  </Avatar>
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 1,
                      fontWeight: 600,
                      color: 'text.primary',
                    }}
                  >
                    {info.title}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 1,
                      color: designTokens.colors.primary.main,
                      fontWeight: 500,
                    }}
                  >
                    {info.content}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                    }}
                  >
                    {info.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </AnimatedSection>

      {/* Map Section */}
      <AnimatedSection
        animation="fadeInUp"
        title={t('Find Our Office')}
        subtitle={t('Visit us at our headquarters for in-person consultations')}
      >
        <Card sx={{ ...glassEffect, overflow: 'hidden' }}>
          <Box
            sx={{
              height: 400,
              background: `linear-gradient(45deg, ${designTokens.colors.primary.main}20, ${designTokens.colors.secondary.main}20)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: 'text.secondary',
                textAlign: 'center',
              }}
            >
              {t('Interactive Map Placeholder')}
              <br />
              <Typography variant="body2" sx={{ mt: 1 }}>
                123 Healthcare Ave, Medical District
              </Typography>
            </Typography>
          </Box>
        </Card>
      </AnimatedSection>

      {/* Office Hours & Social Section */}
      <AnimatedSection
        background="light"
        animation="slideInLeft"
        title={t('Office Hours & Social Media')}
        subtitle={t('Stay connected with us through multiple channels')}
      >
        <Grid container spacing={6}>
          <Grid item xs={12} md={6}>
            <Card sx={{ ...glassEffect }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Schedule sx={{ mr: 2, color: designTokens.colors.primary.main }} />
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: 'text.primary',
                    }}
                  >
                    {t('Office Hours')}
                  </Typography>
                </Box>
                <List>
                  {officeHours.map((schedule, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemText
                        primary={schedule.day}
                        secondary={schedule.hours}
                        sx={{
                          '& .MuiListItemText-primary': {
                            fontWeight: 500,
                            color: 'text.secondary',
                          },
                          '& .MuiListItemText-secondary': {
                            color: designTokens.colors.primary.main,
                          },
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ ...glassEffect }}>
              <CardContent sx={{ p: 4 }}>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 3,
                    fontWeight: 600,
                    color: 'text.primary',
                  }}
                >
                  {t('Follow Us')}
                </Typography>
                <Grid container spacing={2}>
                  {socialLinks.map((social, index) => (
                    <Grid item key={index}>
                      <IconButton
                        sx={{
                          width: 60,
                          height: 60,
                          background: designTokens.colors.primary.gradient,
                          color: 'white',
                          '&:hover': {
                            transform: 'translateY(-4px) rotate(5deg)',
                            boxShadow: designTokens.shadows.medium,
                          },
                        }}
                      >
                        {social.icon}
                      </IconButton>
                    </Grid>
                  ))}
                </Grid>
                <Typography
                  variant="body2"
                  sx={{
                    mt: 3,
                    color: 'text.secondary',
                  }}
                >
                  {t('Stay updated with our latest news, health tips, and platform updates')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </AnimatedSection>

      {/* FAQ Section */}
      <AnimatedSection
        animation="slideInRight"
        title={t('Frequently Asked Questions')}
        subtitle={t('Find answers to common questions about our platform')}
      >
        <Box sx={{ maxWidth: '800px', mx: 'auto' }}>
          {faqs.map((faq) => (
            <Accordion
              key={faq.id}
              expanded={expandedFaq === faq.id}
              onChange={handleFaqChange(faq.id)}
              sx={{
                mb: 2,
                ...glassEffect,
                '&:before': {
                  display: 'none',
                },
                '&.Mui-expanded': {
                  margin: '0 0 16px 0',
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMore />}
                sx={{
                  '& .MuiAccordionSummary-content': {
                    margin: '16px 0',
                  },
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 500,
                    color: 'text.primary',
                  }}
                >
                  {faq.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography
                  sx={{
                    color: 'text.secondary',
                    lineHeight: 1.6,
                  }}
                >
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </AnimatedSection>

      {/* Support Features Section */}
      <AnimatedSection
        background="gradient"
        animation="pulse"
        title={t('Why Choose Our Support?')}
        subtitle={t("We're committed to providing exceptional service and support")}
      >
        <Grid container spacing={4}>
          {[
            {
              icon: <Support />,
              title: t('24/7 Support'),
              description: t('Round-the-clock assistance for all your needs'),
            },
            {
              icon: <Group />,
              title: t('Expert Team'),
              description: t('Healthcare and technology experts at your service'),
            },
            {
              icon: <Security />,
              title: t('Secure Platform'),
              description: t('Enterprise-grade security for your peace of mind'),
            },
            {
              icon: <Public />,
              title: t('Global Reach'),
              description: t('Supporting communities worldwide'),
            },
          ].map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Box sx={{ textAlign: 'center' }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    mx: 'auto',
                    mb: 2,
                    background: designTokens.colors.primary.gradient,
                    color: 'white',
                    fontSize: '2rem',
                    boxShadow: designTokens.shadows.medium,
                  }}
                >
                  {feature.icon}
                </Avatar>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 1,
                    fontWeight: 600,
                    color: 'text.primary',
                  }}
                >
                  {feature.title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                  }}
                >
                  {feature.description}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </AnimatedSection>
    </Box>
  )
}

export default Contact
