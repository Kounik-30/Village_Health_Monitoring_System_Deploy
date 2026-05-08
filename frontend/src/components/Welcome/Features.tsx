import React from 'react'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  alpha,
} from '@mui/material'
import {
  MonitorHeart,
  NotificationImportant,
  Assessment,
  Dashboard,
  Security,
  MedicalServices,
  CheckCircle,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import AnimatedSection from './AnimatedSection'
import { designTokens, glassEffect } from '../../styles/theme'
import { useTranslate } from '../../hooks/useTranslate'

const Features: React.FC = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { t } = useTranslate()

  const features = [
    {
      icon: <MonitorHeart />,
      title: t('Real-Time Health Monitoring'),
      description: t('Continuous monitoring of vital signs and health metrics with instant alerts for healthcare providers.'),
      content: t('Our advanced monitoring system tracks patient vital signs, symptoms, and health trends in real-time. Healthcare providers receive instant notifications when critical thresholds are exceeded, enabling rapid response and intervention.'),
      image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&h=400&fit=crop&crop=center',
      benefits: [
        t('Continuous vital sign monitoring'),
        t('Automated health trend analysis'),
        t('Instant critical alert system'),
        t('Historical health data tracking'),
        t('Wearable device integration'),
      ],
    },
    {
      icon: <NotificationImportant />,
      title: t('Smart Alert System'),
      description: t('Intelligent notification system that prioritizes alerts based on severity and connects patients with appropriate care.'),
      content: t('Our AI-powered alert system analyzes patient data to determine urgency levels and automatically routes notifications to the most appropriate healthcare providers. This ensures critical cases receive immediate attention while reducing alert fatigue.'),
      image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=500&h=400&fit=crop&crop=center',
      benefits: [
        t('AI-powered urgency classification'),
        t('Multi-channel notification delivery'),
        t('Escalation protocols for critical cases'),
        t('Provider availability matching'),
        t('Response time tracking'),
      ],
    },
    {
      icon: <Assessment />,
      title: t('Comprehensive Reports'),
      description: t('Detailed health reports and analytics that provide insights into patient health trends and community health patterns.'),
      content: t('Generate comprehensive health reports that combine individual patient data with community health trends. Our reporting system helps healthcare providers make informed decisions and track the effectiveness of treatment plans.'),
      image: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=500&h=400&fit=crop&crop=center',
      benefits: [
        t('Automated report generation'),
        t('Customizable report templates'),
        t('Population health analytics'),
        t('Treatment outcome tracking'),
        t('Regulatory compliance reporting'),
      ],
    },
    {
      icon: <Dashboard />,
      title: t('Interactive Dashboards'),
      description: t('Role-based dashboards that provide relevant information and tools for patients, doctors, and administrators.'),
      content: t('Our intuitive dashboards are tailored to each user role, providing relevant information and tools. Patients can track their health progress, doctors can manage multiple patients efficiently, and administrators can oversee system-wide operations.'),
      image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500&h=400&fit=crop&crop=center',
      benefits: [
        t('Role-based interface customization'),
        t('Real-time data visualization'),
        t('Interactive health charts'),
        t('Quick action buttons'),
        t('Mobile-responsive design'),
      ],
    },
    {
      icon: <Security />,
      title: t('Advanced Security'),
      description: t('End-to-end encryption and comprehensive security measures to protect sensitive health information.'),
      content: t('We implement industry-leading security measures including end-to-end encryption, multi-factor authentication, and regular security audits to ensure patient data remains secure and compliant with healthcare regulations.'),
      image: 'https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=500&h=400&fit=crop&crop=center',
      benefits: [
        t('End-to-end data encryption'),
        t('Multi-factor authentication'),
        t('HIPAA compliance'),
        t('Regular security audits'),
        t('Secure data backup and recovery'),
      ],
    },
    {
      icon: <MedicalServices />,
      title: t('Telemedicine Integration'),
      description: t('Seamless video consultations and remote medical services connecting patients with healthcare providers.'),
      content: t('Our integrated telemedicine platform enables high-quality video consultations, remote diagnosis, and follow-up care. Patients can access medical expertise from anywhere, reducing travel time and improving healthcare accessibility.'),
      image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=500&h=400&fit=crop&crop=center',
      benefits: [
        t('HD video consultation platform'),
        t('Screen sharing for medical records'),
        t('Digital prescription management'),
        t('Appointment scheduling system'),
        t('Multi-language support'),
      ],
    },
    {
      icon: <CheckCircle />,
      title: t('Quality Assurance'),
      description: t('Continuous quality monitoring and improvement processes to ensure the highest standards of care.'),
      content: t('We maintain rigorous quality assurance processes including regular system monitoring, user feedback collection, and continuous improvement initiatives to ensure our platform meets the highest standards of healthcare delivery.'),
      image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500&h=400&fit=crop&crop=center',
      benefits: [
        t('Continuous system monitoring'),
        t('User feedback integration'),
        t('Performance optimization'),
        t('Regular feature updates'),
        t('24/7 technical support'),
      ],
    },
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
              {t('Powerful Features for Better Healthcare')}
            </Typography>
            <Typography
              variant="h5"
              sx={{
                color: 'text.secondary',
                maxWidth: '800px',
                mx: 'auto',
                lineHeight: 1.6,
              }}
            >
              {t('Discover how our comprehensive platform transforms healthcare delivery in rural communities')}
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Feature Sections */}
      {features.map((feature, index) => (
        <AnimatedSection
          key={index}
          background={index % 2 === 0 ? 'default' : 'light'}
          animation={index % 2 === 0 ? 'slideInLeft' : 'slideInRight'}
          delay={index * 100}
        >
          <Grid
            container
            spacing={6}
            alignItems="center"
            direction={index % 2 === 0 ? 'row' : 'row-reverse'}
          >
            <Grid item xs={12} md={6}>
              <Box>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    mb: 3,
                    background: designTokens.colors.primary.gradient,
                    fontSize: '2rem',
                  }}
                >
                  {feature.icon}
                </Avatar>
                <Typography
                  variant="h3"
                  component="h2"
                  sx={{
                    mb: 3,
                    fontWeight: 600,
                    color: 'text.primary',
                  }}
                >
                  {feature.title}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: 'text.secondary',
                    lineHeight: 1.6,
                    mb: 3,
                  }}
                >
                  {feature.description}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'text.secondary',
                    lineHeight: 1.7,
                    mb: 4,
                  }}
                >
                  {feature.content}
                </Typography>

                {/* Benefits List */}
                <Card
                  sx={{
                    ...glassEffect,
                    mb: 3,
                    '&:hover': {
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 2,
                        fontWeight: 600,
                        color: designTokens.colors.primary.main,
                      }}
                    >
                      {t('Key Benefits')}
                    </Typography>
                    <List dense>
                      {feature.benefits.map((benefit, benefitIndex) => (
                        <ListItem key={benefitIndex} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <CheckCircle
                              sx={{
                                color: designTokens.colors.primary.main,
                                fontSize: '1.2rem',
                              }}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={benefit}
                            sx={{
                              '& .MuiListItemText-primary': {
                                fontSize: '0.95rem',
                                color: 'text.secondary',
                              },
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>

                <Button
                  variant="outlined"
                  onClick={() => navigate('/about')}
                  sx={{
                    borderColor: designTokens.colors.primary.main,
                    color: designTokens.colors.primary.main,
                    '&:hover': {
                      backgroundColor: `${designTokens.colors.primary.main}10`,
                    },
                  }}
                >
                  {t('Learn More')}
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  ...glassEffect,
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: designTokens.shadows.strong,
                  },
                }}
              >
                <img
                  src={feature.image}
                  alt={feature.title}
                  style={{
                    width: '100%',
                    height: '400px',
                    objectFit: 'cover',
                  }}
                />
              </Card>
            </Grid>
          </Grid>
        </AnimatedSection>
      ))}

      {/* CTA Section */}
      <AnimatedSection
        background="gradient"
        animation="pulse"
        title={t('Ready to Experience These Features?')}
        subtitle={t('Join our platform and discover how these powerful features can transform healthcare delivery in your community.')}
      >
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Grid container spacing={3} justifyContent="center">
            <Grid item>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/login')}
                sx={{
                  px: 6,
                  py: 2,
                  fontSize: '1.2rem',
                  background: designTokens.colors.primary.gradient,
                  '&:hover': {
                    background: designTokens.colors.primary.gradient,
                    filter: 'brightness(1.1)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                {t('Get Started Now')}
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/contact')}
                sx={{
                  px: 6,
                  py: 2,
                  fontSize: '1.2rem',
                  borderColor: designTokens.colors.primary.main,
                  color: designTokens.colors.primary.main,
                  '&:hover': {
                    backgroundColor: `${designTokens.colors.primary.main}10`,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                {t('Contact Sales')}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </AnimatedSection>
    </Box>
  )
}

export default Features
