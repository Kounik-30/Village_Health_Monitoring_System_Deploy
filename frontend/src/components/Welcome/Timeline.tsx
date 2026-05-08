import React, { useEffect, useRef, useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material'
import { designTokens, glassEffect } from '../../styles/theme'

interface TimelineItem {
  year: string
  title: string
  description: string
  icon: React.ReactNode
  color?: string
}

interface TimelineProps {
  items: TimelineItem[]
  title?: string
  subtitle?: string
}

const Timeline: React.FC<TimelineProps> = ({ items, title, subtitle }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [visibleItems, setVisibleItems] = useState<number[]>([])
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0')
            setVisibleItems((prev) => [...prev, index])
          }
        })
      },
      { threshold: 0.3 }
    )

    itemRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref)
    })

    return () => observer.disconnect()
  }, [items])

  return (
    <Box>
      {title && (
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h3"
            component="h2"
            sx={{
              mb: 2,
              fontWeight: 600,
              color: 'text.primary',
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="h6"
              sx={{
                color: 'text.secondary',
                maxWidth: '600px',
                mx: 'auto',
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      )}

      <Box sx={{ position: 'relative', maxWidth: '800px', mx: 'auto' }}>
        {/* Timeline Line */}
        <Box
          sx={{
            position: 'absolute',
            left: isMobile ? 30 : '50%',
            top: 0,
            bottom: 0,
            width: 4,
            background: designTokens.colors.primary.gradient,
            transform: isMobile ? 'none' : 'translateX(-50%)',
            borderRadius: 2,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '50%',
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: designTokens.colors.primary.main,
              transform: 'translateX(-50%)',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: '50%',
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: designTokens.colors.primary.main,
              transform: 'translateX(-50%)',
            },
          }}
        />

        {/* Timeline Items */}
        {items.map((item, index) => (
          <Box
            key={index}
            ref={(el) => (itemRefs.current[index] = el as HTMLDivElement)}
            data-index={index}
            sx={{
              position: 'relative',
              mb: 6,
              display: 'flex',
              flexDirection: isMobile ? 'row' : index % 2 === 0 ? 'row' : 'row-reverse',
              alignItems: 'center',
              opacity: visibleItems.includes(index) ? 1 : 0,
              transform: visibleItems.includes(index) 
                ? 'translateY(0)' 
                : 'translateY(50px)',
              transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              transitionDelay: `${index * 200}ms`,
            }}
          >
            {/* Timeline Icon */}
            <Box
              sx={{
                position: isMobile ? 'relative' : 'absolute',
                left: isMobile ? 0 : '50%',
                transform: isMobile ? 'none' : 'translateX(-50%)',
                zIndex: 2,
                mr: isMobile ? 3 : 0,
              }}
            >
              <Avatar
                sx={{
                  width: 60,
                  height: 60,
                  background: item.color || designTokens.colors.primary.gradient,
                  border: `4px solid ${theme.palette.background.paper}`,
                  boxShadow: visibleItems.includes(index) 
                    ? `${designTokens.shadows.medium}, 0 0 20px ${item.color || designTokens.colors.primary.main}40`
                    : designTokens.shadows.medium,
                  animation: visibleItems.includes(index) 
                    ? 'pulse 2s infinite' 
                    : 'none',
                  '@keyframes pulse': {
                    '0%': {
                      boxShadow: `${designTokens.shadows.medium}, 0 0 20px ${item.color || designTokens.colors.primary.main}40`,
                    },
                    '50%': {
                      boxShadow: `${designTokens.shadows.medium}, 0 0 30px ${item.color || designTokens.colors.primary.main}60`,
                    },
                    '100%': {
                      boxShadow: `${designTokens.shadows.medium}, 0 0 20px ${item.color || designTokens.colors.primary.main}40`,
                    },
                  },
                }}
              >
                {item.icon}
              </Avatar>
            </Box>

            {/* Timeline Content */}
            <Box
              sx={{
                flex: 1,
                maxWidth: isMobile ? 'calc(100% - 90px)' : '45%',
                ml: isMobile ? 0 : index % 2 === 0 ? 0 : 'auto',
                mr: isMobile ? 0 : index % 2 === 0 ? 'auto' : 0,
              }}
            >
              <Card
                sx={{
                  ...glassEffect,
                  position: 'relative',
                  background: theme.palette.mode === 'dark'
                    ? alpha(theme.palette.background.paper, 0.92)
                    : 'rgba(255, 255, 255, 0.88)',
                  border: `1px solid ${theme.palette.mode === 'dark'
                    ? alpha('#ffffff', 0.12)
                    : 'rgba(255, 255, 255, 0.55)'}`,
                  backdropFilter: theme.palette.mode === 'dark' ? 'blur(12px)' : 'blur(18px)',
                  WebkitBackdropFilter: theme.palette.mode === 'dark' ? 'blur(12px)' : 'blur(18px)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 16px 36px rgba(0, 0, 0, 0.38)'
                    : designTokens.shadows.medium,
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 20px 42px rgba(0, 0, 0, 0.44)'
                      : designTokens.shadows.strong,
                  },
                  transition: 'all 0.3s ease',
                  '&::before': !isMobile
                    ? {
                        content: '""',
                        position: 'absolute',
                        top: '50%',
                        [index % 2 === 0 ? 'left' : 'right']: -12,
                        width: 0,
                        height: 0,
                        borderTop: '12px solid transparent',
                        borderBottom: '12px solid transparent',
                        [index % 2 === 0 ? 'borderRight' : 'borderLeft']: `12px solid ${theme.palette.mode === 'dark'
                          ? alpha(theme.palette.background.paper, 0.92)
                          : 'rgba(255, 255, 255, 0.9)'}`,
                        transform: 'translateY(-50%)',
                      }
                    : {},
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      color: designTokens.colors.primary.main,
                      fontWeight: 600,
                      mb: 1,
                    }}
                  >
                    {item.year}
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      color: 'text.primary',
                      mb: 2,
                    }}
                  >
                    {item.title}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: 'text.primary',
                      lineHeight: 1.6,
                    }}
                  >
                    {item.description}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
        ))}
      </Box>

      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </Box>
  )
}

export default Timeline
