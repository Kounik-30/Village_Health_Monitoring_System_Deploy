import React, { useState, useEffect } from 'react'
import { Box } from '@mui/material'
import { designTokens } from '../../styles/theme'

const ProgressBar: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const updateScrollProgress = () => {
      const scrollPx = document.documentElement.scrollTop
      const winHeightPx = document.documentElement.scrollHeight - document.documentElement.clientHeight
      const scrolled = (scrollPx / winHeightPx) * 100

      setScrollProgress(scrolled)
    }

    window.addEventListener('scroll', updateScrollProgress)
    return () => window.removeEventListener('scroll', updateScrollProgress)
  }, [])

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: 4,
        zIndex: 9999,
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <Box
        sx={{
          height: '100%',
          background: designTokens.colors.primary.gradient,
          width: `${scrollProgress}%`,
          transition: 'width 0.1s ease-out',
          borderRadius: '0 2px 2px 0',
        }}
      />
    </Box>
  )
}

export default ProgressBar