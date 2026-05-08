import React, { useCallback, useMemo, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import NotificationCenter from '../Notifications/NotificationCenter'
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  useMediaQuery,
  useTheme
} from '@mui/material'
import {
  Menu as MenuIcon,
  AccountCircle,
  Logout,
  Dashboard,
  Report,
  Chat,
  History,
  Settings,
  Language,
  LightMode,
  DarkMode
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { useTranslate } from '../../hooks/useTranslate'
import { LANGUAGE_OPTIONS, type SupportedLanguage } from '../../constants/language'
import { useThemeMode } from '../../contexts/ThemeModeContext'

const Layout: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [languageAnchorEl, setLanguageAnchorEl] = useState<null | HTMLElement>(null)
  
  const { user, logout } = useAuth()
  const { showToast } = useNotifications()
  const { t, language, setLanguage } = useTranslate()
  const { mode, toggleTheme } = useThemeMode()
  const theme = useTheme()
  const navigate = useNavigate()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

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

  const handleProfileMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }, [])

  const handleProfileMenuClose = useCallback(() => {
    setAnchorEl(null)
  }, [])

  const handleLogout = useCallback(async () => {
    await logout()
    showToast('Logout Successful', { severity: 'success', autoHideDuration: 3500 })
    navigate('/login')
  }, [logout, navigate, showToast])

  const handleLanguageMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setLanguageAnchorEl(event.currentTarget)
  }, [])

  const handleLanguageChange = useCallback((nextLanguage: SupportedLanguage) => {
    setLanguage(nextLanguage)
    setLanguageAnchorEl(null)
  }, [setLanguage])

  const navigationItems = useMemo(() => {
    const baseItems = [
      { text: t('dashboard'), icon: <Dashboard />, path: `/${user?.role}` },
      { text: t('profile'), icon: <AccountCircle />, path: `/${user?.role}/profile` },
    ]

    switch (user?.role) {
      case 'villager':
        return [
          ...baseItems,
          { text: t('reportHealth'), icon: <Report />, path: '/villager/report' },
          { text: t('myReports'), icon: <History />, path: '/villager/reports' },
          { text: t('consultations'), icon: <Chat />, path: '/villager/consultations' },
        ]
      case 'doctor':
        return [
          ...baseItems,
          { text: t('patientReports'), icon: <Report />, path: '/doctor/reports' },
          { text: t('activeConsultations'), icon: <Chat />, path: '/doctor/consultations' },
          { text: t('medicalHistory'), icon: <History />, path: '/doctor/history' },
        ]
      case 'admin':
        return [
          ...baseItems,
          { text: t('Users'), icon: <AccountCircle />, path: '/admin/users' },
          { text: t('Reports'), icon: <Report />, path: '/admin/reports' },
          { text: t('Analytics'), icon: <Settings />, path: '/admin/analytics' },
        ]
      default:
        return baseItems
    }
  }, [t, user?.role])

  const handleDrawerOpen = useCallback(() => {
    setDrawerOpen(true)
  }, [])

  const handleDrawerClose = useCallback(() => {
    setDrawerOpen(false)
  }, [])

  const handleNavigate = useCallback((path: string) => {
    navigate(path)
    setDrawerOpen(false)
  }, [navigate])

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (muiTheme) => muiTheme.zIndex.drawer + 1,
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{ ...touchTargetSx, mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            🏥 {t('Village Health')} - {user?.fullName}
          </Typography>

          <IconButton
            color="inherit"
            onClick={toggleTheme}
            aria-label={mode === 'dark' ? t('Switch to light mode') : t('Switch to dark mode')}
            sx={touchTargetSx}
          >
            {mode === 'dark' ? <LightMode /> : <DarkMode />}
          </IconButton>

          <IconButton color="inherit" onClick={handleLanguageMenuOpen} sx={touchTargetSx}>
            <Language />
          </IconButton>

          <NotificationCenter />

          <IconButton
            edge="end"
            aria-label="account of current user"
            onClick={handleProfileMenuOpen}
            color="inherit"
            sx={touchTargetSx}
          >
            <Avatar
              src={user?.profilePicture || undefined}
              sx={{ width: 32, height: 32 }}
            >
              {user?.fullName?.charAt(0)}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerClose}
        ModalProps={{
          keepMounted: true,
          disableAutoFocus: true,
          disableEnforceFocus: true,
          disableRestoreFocus: true,
          disableScrollLock: true
        }}
        transitionDuration={{ enter: 180, exit: 140 }}
        PaperProps={{
          sx: {
            width: { xs: 'min(86vw, 320px)', sm: 280 },
            willChange: 'transform'
          }
        }}
      >
        <Toolbar />
        <Box role="presentation">
          <List>
            {navigationItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  onClick={() => handleNavigate(item.path)}
                  sx={{ minHeight: 48, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider />
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout} sx={{ minHeight: 48, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                <ListItemIcon><Logout /></ListItemIcon>
                <ListItemText primary={t('logout')} />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Profile Menu */}
      <Menu
        anchorEl={languageAnchorEl}
        open={Boolean(languageAnchorEl)}
        onClose={() => setLanguageAnchorEl(null)}
      >
        {LANGUAGE_OPTIONS.map((option) => (
          <MenuItem
            key={option.value}
            selected={language === option.value}
            onClick={() => handleLanguageChange(option.value)}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
      >
        <MenuItem onClick={() => handleNavigate(`/${user?.role}/profile`)}>
          <AccountCircle sx={{ mr: 1 }} />
          {t('profile')}
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <Logout sx={{ mr: 1 }} />
          {t('logout')}
        </MenuItem>
      </Menu>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, width: isMobile ? '100%' : 'auto' }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  )
}

export default Layout
