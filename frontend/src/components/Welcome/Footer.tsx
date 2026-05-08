import React from 'react'
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  IconButton,
  Divider,
  useTheme,
  alpha,
} from '@mui/material'
import {
  Facebook,
  Twitter,
  LinkedIn,
  Instagram,
  Email,
  Phone,
  LocationOn,
} from '@mui/icons-material'
import { designTokens, glassEffect } from '../../styles/theme'

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()
  const theme = useTheme()

  const socialLinks = [
    { icon: <Facebook />, url: '#', label: 'Facebook' },
    { icon: <Twitter />, url: '#', label: 'Twitter' },
    { icon: <LinkedIn />, url: '#', label: 'LinkedIn' },
    { icon: <Instagram />, url: '#', label: 'Instagram' },
  ]

  const quickLinks = [
    { label: 'Home', url: '/' },
    { label: 'About Us', url: '/about' },
    { label: 'Features', url: '/features' },
    { label: 'Contact', url: '/contact' },
    { label: 'Login', url: '/login' },
    { label: 'Register', url: '/register' },
  ]

  const services = [
    'Telemedicine Consultations',
    'Health Monitoring',
    'Emergency Services',
    'Medical Records',
    'Appointment Booking',
    'Health Education',
  ]

  return (
    <Box
      component="footer"
      sx={{
        ...glassEffect,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.14 : 0.15)}, ${alpha(theme.palette.secondary.main, theme.palette.mode === 'dark' ? 0.12 : 0.15)})`,
        mt: 'auto',
        py: 6,
        borderTop: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Company Info */}
          <Grid item xs={12} md={4}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                background: `linear-gradient(45deg, ${designTokens.colors.primary.main}, ${designTokens.colors.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
              }}
            >
              Village Health
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                mb: 3,
                lineHeight: 1.6,
              }}
            >
              Connecting rural communities with quality healthcare through innovative 
              telemedicine solutions. Bridging the gap between patients and healthcare 
              providers with technology and compassion.
            </Typography>
            
            {/* Contact Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Email sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
              <Typography variant="body2" color="text.secondary">
                info@villagehealth.com
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Phone sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
              <Typography variant="body2" color="text.secondary">
                +1 (555) 123-4567
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <LocationOn sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
              <Typography variant="body2" color="text.secondary">
                123 Health Street, Medical City, MC 12345
              </Typography>
            </Box>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: 'primary.main',
                mb: 2,
              }}
            >
              Quick Links
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {quickLinks.map((link, index) => (
                <Link
                  key={index}
                  href={link.url}
                  sx={{
                    color: 'text.secondary',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      color: 'primary.main',
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </Box>
          </Grid>

          {/* Services */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: 'primary.main',
                mb: 2,
              }}
            >
              Our Services
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {services.map((service, index) => (
                <Typography
                  key={index}
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                  }}
                >
                  • {service}
                </Typography>
              ))}
            </Box>
          </Grid>

          {/* Social Media & Newsletter */}
          <Grid item xs={12} md={3}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: 'primary.main',
                mb: 2,
              }}
            >
              Connect With Us
            </Typography>
            
            {/* Social Media Icons */}
            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
              {socialLinks.map((social, index) => (
                <IconButton
                  key={index}
                  href={social.url}
                  aria-label={social.label}
                  sx={{
                    ...glassEffect,
                    width: 40,
                    height: 40,
                    color: 'primary.main',
                    border: `1px solid ${designTokens.colors.primary.main}30`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: `linear-gradient(45deg, ${designTokens.colors.primary.main}20, ${designTokens.colors.secondary.main}20)`,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 8px 25px ${designTokens.colors.primary.main}30`,
                    },
                  }}
                >
                  {social.icon}
                </IconButton>
              ))}
            </Box>

            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                mb: 2,
                lineHeight: 1.6,
              }}
            >
              Stay updated with our latest news, health tips, and community stories. 
              Follow us on social media for daily health insights.
            </Typography>

            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontStyle: 'italic',
              }}
            >
              "Your health, our priority - connecting communities one consultation at a time."
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: theme.palette.divider }} />

        {/* Bottom Section */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              textAlign: { xs: 'center', sm: 'left' },
            }}
          >
            © {currentYear} Village Health. All rights reserved. | Empowering rural healthcare through technology.
          </Typography>
          
          <Box
            sx={{
              display: 'flex',
              gap: 3,
              flexWrap: 'wrap',
              justifyContent: { xs: 'center', sm: 'flex-end' },
            }}
          >
            <Link
              href="#"
              sx={{
                color: 'text.secondary',
                textDecoration: 'none',
                fontSize: '0.875rem',
                transition: 'color 0.3s ease',
                '&:hover': {
                  color: 'primary.main',
                },
              }}
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              sx={{
                color: 'text.secondary',
                textDecoration: 'none',
                fontSize: '0.875rem',
                transition: 'color 0.3s ease',
                '&:hover': {
                  color: 'primary.main',
                },
              }}
            >
              Terms of Service
            </Link>
            <Link
              href="#"
              sx={{
                color: 'text.secondary',
                textDecoration: 'none',
                fontSize: '0.875rem',
                transition: 'color 0.3s ease',
                '&:hover': {
                  color: 'primary.main',
                },
              }}
            >
              Cookie Policy
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  )
}

export default Footer
