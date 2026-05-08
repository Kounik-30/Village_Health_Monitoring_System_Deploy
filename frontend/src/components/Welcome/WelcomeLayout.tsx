import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useMediaQuery,
  useTheme,
  Fab,
  LinearProgress,
  alpha,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  KeyboardArrowUp as ArrowUpIcon,
  LightMode,
  DarkMode,
} from '@mui/icons-material'
import { designTokens, navGlassEffect, glassButtonEffect } from '../../styles/theme'
import Footer from './Footer'
import { useTranslate } from '../../hooks/useTranslate'
import { useThemeMode } from '../../contexts/ThemeModeContext'

const WelcomeLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const { t } = useTranslate()
  const { mode, toggleTheme } = useThemeMode()
  const scrollFrame = useRef<number>()

  const shouldReduceEffects = isMobile || prefersReducedMotion
  const mobileDrawerWidth = isMobile ? Math.min(window.innerWidth - 24, 320) : 280
  const touchTargetSx = useMemo(
    () => ({
      width: 44,
      height: 44,
      borderRadius: 2,
      touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent'
    }),
    []
  )

  const navigationItems = useMemo(() => [
    { label: t('Home'), path: '/' },
    { label: t('About'), path: '/about' },
    { label: t('Features'), path: '/features' },
    { label: t('Contact'), path: '/contact' },
  ], [t])

  useEffect(() => {
    const updateScrollState = () => {
      const scrollTop = window.scrollY
      const docHeight = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1)
      const progress = (scrollTop / docHeight) * 100

      setScrollProgress((current) => (Math.abs(current - progress) > 1 ? progress : current))
      setShowBackToTop((current) => {
        const next = scrollTop > 300
        return current === next ? current : next
      })
      setScrolled((current) => {
        const next = scrollTop > 50
        return current === next ? current : next
      })
      scrollFrame.current = undefined
    }

    updateScrollState()

    const handleScroll = () => {
      if (scrollFrame.current) {
        return
      }

      scrollFrame.current = window.requestAnimationFrame(updateScrollState)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollFrame.current) {
        window.cancelAnimationFrame(scrollFrame.current)
      }
    }
  }, [])

  const handleDrawerOpen = useCallback(() => {
    setMobileOpen(true)
  }, [])

  const handleDrawerClose = useCallback(() => {
    setMobileOpen(false)
  }, [])

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    })
  }, [prefersReducedMotion])

  const handleNavigation = useCallback((path: string) => {
    navigate(path)
    setMobileOpen(false)
  }, [navigate])

  const drawer = useMemo(() => (
    <Box sx={{ width: 250, pt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2, pb: 2 }}>
        <IconButton onClick={handleDrawerClose} sx={touchTargetSx}>
          <CloseIcon />
        </IconButton>
      </Box>
      <List>
        {navigationItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              sx={{
                minHeight: 48,
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(46, 125, 50, 0.1)',
                },
                backgroundColor: location.pathname === item.path ? 'rgba(46, 125, 50, 0.1)' : 'transparent',
              }}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
        <Box sx={{ px: 2, pt: 2 }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => handleNavigation('/login')}
            sx={{ mb: 1 }}
          >
            {t('Login')}
          </Button>
          <Button
            variant="contained"
            fullWidth
            onClick={() => handleNavigation('/register')}
          >
            {t('Sign Up')}
          </Button>
        </Box>
      </List>
    </Box>
  ), [handleDrawerClose, handleNavigation, location.pathname, navigationItems, t, touchTargetSx])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Progress Bar */}
      <LinearProgress
        variant="determinate"
        value={scrollProgress}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1300,
          height: 3,
          backgroundColor: 'transparent',
          '& .MuiLinearProgress-bar': {
            background: designTokens.colors.primary.gradient,
          },
        }}
      />

      {/* Navigation */}
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{
          ...navGlassEffect,
          transition: shouldReduceEffects ? 'background-color 0.2s ease' : 'all 0.24s ease-out',
          borderBottom: scrolled ? `1px solid ${theme.palette.divider}` : 'none',
          background: scrolled 
            ? alpha(theme.palette.background.paper, mode === 'dark' ? 0.82 : 0.74)
            : alpha(theme.palette.background.default, mode === 'dark' ? 0.58 : 0.4),
          backdropFilter: shouldReduceEffects ? 'none' : scrolled ? 'blur(18px)' : 'blur(12px)',
          WebkitBackdropFilter: shouldReduceEffects ? 'none' : scrolled ? 'blur(18px)' : 'blur(12px)',
          color: theme.palette.text.primary,
        }}
      >
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              background: designTokens.colors.primary.gradient,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              cursor: 'pointer',
            }}
            onClick={() => handleNavigation('/welcome')}
          >
            {t('Village Health Monitor')}
          </Typography>

          {!isMobile ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {navigationItems.map((item) => (
                <Button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    color: location.pathname === item.path
                      ? designTokens.colors.primary.main
                      : theme.palette.text.secondary,
                    fontWeight: location.pathname === item.path ? 600 : 400,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}
              <Button
                variant="outlined"
                onClick={() => handleNavigation('/login')}
                sx={{
                  ...glassButtonEffect.primary,
                  minWidth: '100px',
                  textTransform: 'none',
                  transition: 'all 0.3s ease',
                  ml: 2
                }}
              >
                {t('Login')}
              </Button>
              <Button
                variant="contained"
                onClick={() => handleNavigation('/register')}
                sx={{
                  ...glassButtonEffect.secondary,
                  minWidth: '100px',
                  textTransform: 'none',
                  transition: 'all 0.3s ease',
                }}
              >
                {t('Sign Up')}
              </Button>
              <IconButton
                color="inherit"
                onClick={toggleTheme}
                aria-label={mode === 'dark' ? t('Switch to light mode') : t('Switch to dark mode')}
                sx={touchTargetSx}
              >
                {mode === 'dark' ? <LightMode /> : <DarkMode />}
              </IconButton>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                color="inherit"
                onClick={toggleTheme}
                aria-label={mode === 'dark' ? t('Switch to light mode') : t('Switch to dark mode')}
                sx={touchTargetSx}
              >
                {mode === 'dark' ? <LightMode /> : <DarkMode />}
              </IconButton>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerOpen}
                sx={touchTargetSx}
              >
                <MenuIcon />
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerClose}
        ModalProps={{
          keepMounted: true,
          disableAutoFocus: true,
          disableEnforceFocus: true,
          disableRestoreFocus: true,
          disableScrollLock: true,
        }}
        transitionDuration={{ enter: 180, exit: 140 }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: mobileDrawerWidth,
            willChange: 'transform',
            borderTopLeftRadius: 16,
            borderBottomLeftRadius: 16,
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, pt: { xs: 9, md: 10 } }}>
        <Outlet />
        <Footer />
      </Box>

      {/* Back to Top Button */}
      <Fab
        color="primary"
        size="medium"
        onClick={scrollToTop}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          opacity: showBackToTop ? 1 : 0,
          transform: showBackToTop ? 'scale(1)' : 'scale(0)',
          transition: `all ${designTokens.animations.duration.normal} ${designTokens.animations.easing.easeInOut}`,
          background: designTokens.colors.primary.gradient,
          '&:hover': {
            background: designTokens.colors.primary.gradient,
            filter: 'brightness(1.1)',
            transform: 'scale(1.1)',
          },
        }}
      >
        <ArrowUpIcon />
      </Fab>
    </Box>
  )
}

export default WelcomeLayout
