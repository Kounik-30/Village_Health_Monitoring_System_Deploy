import React, { useState, useEffect } from 'react'
import { Fab, Zoom } from '@mui/material'
import { KeyboardArrowUp } from '@mui/icons-material'
import { designTokens } from '../../styles/theme'
import { useTranslate } from '../../hooks/useTranslate'

const BackToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)
  const { t } = useTranslate()

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return (
    <Zoom in={isVisible}>
      <Fab
        onClick={scrollToTop}
        sx={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          background: designTokens.colors.primary.gradient,
          color: 'white',
          zIndex: 1000,
          '&:hover': {
            background: designTokens.colors.primary.gradient,
            filter: 'brightness(1.1)',
            transform: 'scale(1.1)',
          },
          transition: 'all 0.3s ease',
        }}
        aria-label={t('scroll back to top')}
      >
        <KeyboardArrowUp />
      </Fab>
    </Zoom>
  )
}

export default BackToTop
