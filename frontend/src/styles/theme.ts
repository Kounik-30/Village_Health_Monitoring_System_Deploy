import { alpha, createTheme } from '@mui/material/styles'

// Design tokens
export const designTokens = {
  colors: {
    primary: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
      gradient: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
    },
    secondary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#0d47a1',
      gradient: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
    },
    accent: {
      main: '#ff6b35',
      light: '#ff8a65',
      dark: '#d84315',
      gradient: 'linear-gradient(135deg, #ff6b35 0%, #ff8a65 100%)',
    },
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#9e9e9e',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
    glass: {
      background: 'rgba(255, 255, 255, 0.1)',
      backgroundDark: 'rgba(0, 0, 0, 0.1)',
      border: 'rgba(255, 255, 255, 0.2)',
      borderDark: 'rgba(255, 255, 255, 0.1)',
    }
  },
  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem',
    xxl: '4rem',
  },
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    full: '50%',
  },
  shadows: {
    soft: '0 4px 20px rgba(0, 0, 0, 0.08)',
    medium: '0 8px 30px rgba(0, 0, 0, 0.12)',
    strong: '0 12px 40px rgba(0, 0, 0, 0.15)',
    glass: '0 8px 32px rgba(31, 38, 135, 0.37)',
  },
  animations: {
    duration: {
      fast: '0.2s',
      normal: '0.3s',
      slow: '0.5s',
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    }
  }
}

export function createAppTheme(mode: 'light' | 'dark' = 'light') {
  const isDark = mode === 'dark'

  return createTheme({
    palette: {
      mode,
      primary: {
        main: designTokens.colors.primary.main,
        light: designTokens.colors.primary.light,
        dark: designTokens.colors.primary.dark,
      },
      secondary: {
        main: designTokens.colors.secondary.main,
        light: designTokens.colors.secondary.light,
        dark: designTokens.colors.secondary.dark,
      },
      background: {
        default: isDark ? '#0f1720' : '#f7faf8',
        paper: isDark ? '#16212b' : '#ffffff',
      },
      text: {
        primary: isDark ? '#eef6f0' : designTokens.colors.neutral[800],
        secondary: isDark ? '#b8c7bd' : designTokens.colors.neutral[600],
      },
      divider: isDark ? alpha('#ffffff', 0.12) : alpha('#1b5e20', 0.12),
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '3.5rem',
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: '-0.02em',
      },
      h2: {
        fontSize: '2.5rem',
        fontWeight: 600,
        lineHeight: 1.3,
        letterSpacing: '-0.01em',
      },
      h3: {
        fontSize: '2rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 500,
        lineHeight: 1.5,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 500,
        lineHeight: 1.5,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.6,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: designTokens.borderRadius.md,
            textTransform: 'none',
            fontWeight: 500,
            padding: '12px 24px',
            boxShadow: 'none',
            transition: `background-color ${designTokens.animations.duration.normal} ${designTokens.animations.easing.easeInOut}, box-shadow ${designTokens.animations.duration.normal} ${designTokens.animations.easing.easeInOut}, transform ${designTokens.animations.duration.normal} ${designTokens.animations.easing.easeInOut}`,
            '&:hover': {
              boxShadow: designTokens.shadows.soft,
              transform: 'translateY(-2px)',
            },
          },
          contained: {
            background: designTokens.colors.primary.gradient,
            '&:hover': {
              background: designTokens.colors.primary.gradient,
              filter: 'brightness(1.1)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: designTokens.borderRadius.lg,
            boxShadow: isDark ? '0 10px 28px rgba(0, 0, 0, 0.35)' : designTokens.shadows.soft,
            backgroundImage: 'none',
            border: `1px solid ${isDark ? alpha('#ffffff', 0.08) : alpha('#1b5e20', 0.08)}`,
            transition: `box-shadow ${designTokens.animations.duration.normal} ${designTokens.animations.easing.easeInOut}, transform ${designTokens.animations.duration.normal} ${designTokens.animations.easing.easeInOut}`,
            '&:hover': {
              boxShadow: isDark ? '0 16px 36px rgba(0, 0, 0, 0.42)' : designTokens.shadows.medium,
              transform: 'translateY(-4px)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: designTokens.borderRadius.md,
            backgroundImage: 'none',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          }
        }
      },
      MuiButtonBase: {
        styleOverrides: {
          root: {
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }
        }
      },
      MuiIconButton: {
        defaultProps: {
          disableRipple: true,
        },
        styleOverrides: {
          root: {
            width: 44,
            height: 44,
          }
        }
      }
    },
  })
}

export const theme = createAppTheme('light')

// Glass morphism effects inspired by modern UI design
export const glassEffect = {
  background: 'rgba(255, 255, 255, 0.25)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)', // Safari support
  border: '1px solid rgba(255, 255, 255, 0.18)',
  borderRadius: designTokens.borderRadius.lg,
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
}

// Enhanced glass effect for navigation
export const navGlassEffect = {
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
}

// Glass button effects
export const glassButtonEffect = {
  primary: {
    background: '#4CAF50',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    borderRadius: '25px',
    boxShadow: '0 4px 20px rgba(76, 175, 80, 0.4)',
    color: '#ffffff',
    fontWeight: 600,
    '&:hover': {
      background: '#45a049',
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 25px rgba(76, 175, 80, 0.5)',
    }
  },
  secondary: {
    background: '#4CAF50',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    borderRadius: '25px',
    boxShadow: '0 4px 20px rgba(76, 175, 80, 0.3)',
    color: '#ffffff',
    fontWeight: 600,
    '&:hover': {
      background: '#45a049',
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 25px rgba(76, 175, 80, 0.4)',
    }
  }
}

// Animation keyframes
export const keyframes = {
  fadeInUp: `
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
  `,
  slideInLeft: `
    @keyframes slideInLeft {
      from {
        opacity: 0;
        transform: translateX(-30px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `,
  slideInRight: `
    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(30px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `,
  pulse: `
    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.05);
      }
    }
  `,
  typing: `
    @keyframes typing {
      from { width: 0 }
      to { width: 100% }
    }
  `,
  blink: `
    @keyframes blink {
      50% { border-color: transparent }
    }
  `,
}
