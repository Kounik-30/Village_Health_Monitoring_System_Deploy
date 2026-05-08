import React, { useMemo } from 'react'
import { Box, useMediaQuery, useTheme } from '@mui/material'

interface Bubble {
  id: number
  size: number
  left: number
  animationDuration: number
  animationDelay: number
  opacity: number
  gradient: string
}

const gradients = [
  `radial-gradient(circle, rgba(178, 236, 193, 0.8), rgba(144, 238, 144, 0.6), rgba(152, 251, 152, 0.4))`,
  `radial-gradient(circle, rgba(162, 235, 176, 0.75), rgba(134, 239, 172, 0.55), rgba(187, 247, 208, 0.35))`,
  `radial-gradient(circle, rgba(165, 243, 252, 0.8), rgba(103, 232, 249, 0.6), rgba(34, 211, 238, 0.4))`,
  `radial-gradient(circle, rgba(153, 246, 228, 0.75), rgba(94, 234, 212, 0.55), rgba(45, 212, 191, 0.35))`,
  `radial-gradient(circle, rgba(254, 240, 138, 0.8), rgba(253, 224, 71, 0.6), rgba(250, 204, 21, 0.4))`,
  `radial-gradient(circle, rgba(254, 215, 170, 0.75), rgba(251, 191, 36, 0.55), rgba(245, 158, 11, 0.35))`,
  `radial-gradient(circle, rgba(221, 214, 254, 0.8), rgba(196, 181, 253, 0.6), rgba(167, 139, 250, 0.4))`,
  `radial-gradient(circle, rgba(233, 213, 255, 0.75), rgba(209, 196, 233, 0.55), rgba(186, 164, 235, 0.35))`,
  `radial-gradient(circle, rgba(187, 247, 208, 0.7), rgba(134, 239, 172, 0.5), rgba(74, 222, 128, 0.3))`,
  `radial-gradient(circle, rgba(165, 243, 252, 0.7), rgba(125, 211, 252, 0.5), rgba(59, 130, 246, 0.3))`,
  `radial-gradient(circle, rgba(254, 249, 195, 0.7), rgba(254, 240, 138, 0.5), rgba(251, 191, 36, 0.3))`,
  `radial-gradient(circle, rgba(243, 232, 255, 0.7), rgba(221, 214, 254, 0.5), rgba(196, 181, 253, 0.3))`,
]

const FloatingBubbles: React.FC = () => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  const bubbles = useMemo(() => {
    if (prefersReducedMotion) {
      return []
    }

    return Array.from({ length: 8 }, (_, index): Bubble => ({
      id: index,
      size: Math.random() * 64 + 24,
      left: Math.random() * 100,
      animationDuration: Math.random() * 18 + 18,
      animationDelay: Math.random() * 8,
      opacity: Math.random() * (isDark ? 0.16 : 0.32) + (isDark ? 0.05 : 0.12),
      gradient: gradients[Math.floor(Math.random() * gradients.length)],
    }))
  }, [isDark, prefersReducedMotion])

  if (bubbles.length === 0) {
    return null
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: -1,
        overflow: 'hidden',
        opacity: isDark ? 0.45 : 1,
        filter: isDark ? 'saturate(0.8)' : 'none',
      }}
    >
      {bubbles.map((bubble) => (
        <Box
          key={bubble.id}
          sx={{
            position: 'absolute',
            width: `${bubble.size}px`,
            height: `${bubble.size}px`, // Perfect circles
            borderRadius: '50%',
            background: bubble.gradient,
            opacity: bubble.opacity,
            left: `${bubble.left}%`,
            bottom: '-100px',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: isDark
              ? '0 1px 6px rgba(0, 0, 0, 0.18)'
              : '0 2px 10px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            animation: `floatUp ${bubble.animationDuration}s linear infinite`,
            animationDelay: `${bubble.animationDelay}s`,
            willChange: 'transform, opacity',
            transform: 'translate3d(0, 0, 0)',
            '@keyframes floatUp': {
              '0%': {
                transform: `translateY(0) translateX(0)`,
                opacity: 0,
              },
              '10%': {
                opacity: bubble.opacity,
              },
              '90%': {
                opacity: bubble.opacity,
              },
              '100%': {
                transform: `translateY(-100vh) translateX(${Math.sin(bubble.id) * 30}px)`, // Gentle horizontal drift
                opacity: 0,
              },
            },
          }}
        />
      ))}
    </Box>
  )
}

export default FloatingBubbles
