import { Suspense, lazy, useMemo } from 'react'
import { Box, CircularProgress, useMediaQuery, useTheme } from '@mui/material'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { StaticTranslationProvider, TranslationProvider } from './contexts/TranslationContext'
import ScrollToTop from './components/ScrollToTop'

const Login = lazy(() => import('./components/Auth/Login'))
const Register = lazy(() => import('./components/Auth/Register'))
const VillagerDashboard = lazy(() => import('./components/Dashboards/VillagerDashboard'))
const DoctorDashboard = lazy(() => import('./components/Dashboards/DoctorDashboard'))
const AdminDashboard = lazy(() => import('./components/Dashboards/AdminDashboard'))
const ProtectedRoute = lazy(() => import('./components/Auth/ProtectedRoute'))
const Layout = lazy(() => import('./components/Layout/Layout'))
const Chat = lazy(() => import('./components/Communication/Chat'))
const WelcomeLayout = lazy(() => import('./components/Welcome/WelcomeLayout'))
const Home = lazy(() => import('./components/Welcome/Home'))
const About = lazy(() => import('./components/Welcome/About'))
const Features = lazy(() => import('./components/Welcome/Features'))
const Contact = lazy(() => import('./components/Welcome/Contact'))
const FloatingBubbles = lazy(() => import('./components/FloatingBubbles'))

const marketingRoutes = new Set(['/', '/home', '/about', '/features', '/contact'])

function AppLoader() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center'
      }}
    >
      <CircularProgress color="primary" />
    </Box>
  )
}

function App() {
  const theme = useTheme()
  const location = useLocation()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const showFloatingBubbles = useMemo(
    () => marketingRoutes.has(location.pathname) && !isMobile && !prefersReducedMotion,
    [isMobile, location.pathname, prefersReducedMotion]
  )

  return (
    <TranslationProvider>
      <AuthProvider>
        <NotificationProvider>
          <ScrollToTop />
          <Suspense fallback={<AppLoader />}>
            {showFloatingBubbles ? <FloatingBubbles /> : null}
            <Routes>
              <Route element={<StaticTranslationProvider language="en"><WelcomeLayout /></StaticTranslationProvider>}>
                <Route path="/" element={<Home />} />
                <Route path="/home" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/features" element={<Features />} />
                <Route path="/contact" element={<Contact />} />
              </Route>

              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route element={<Layout />}>
                <Route
                  path="/chat/:consultationId"
                  element={
                    <ProtectedRoute allowedRoles={['villager', 'doctor']}>
                      <Chat />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/villager/*"
                  element={
                    <ProtectedRoute allowedRoles={['villager']}>
                      <VillagerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/doctor/*"
                  element={
                    <ProtectedRoute allowedRoles={['doctor']}>
                      <DoctorDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/*"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
              </Route>
            </Routes>
          </Suspense>
        </NotificationProvider>
      </AuthProvider>
    </TranslationProvider>
  )
}

export default App
