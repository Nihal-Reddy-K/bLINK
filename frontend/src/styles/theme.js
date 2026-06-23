import { createTheme } from '@mui/material/styles';

export const getMuiTheme = (mode) => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? '#8B5CF6' : '#6366F1', // Purple/Indigo
        contrastText: '#ffffff',
      },
      secondary: {
        main: isDark ? '#3B82F6' : '#0EA5E9', // Blue/Sky
      },
      background: {
        default: isDark ? '#09090B' : '#F8FAFC',
        paper: isDark ? 'rgba(20, 20, 25, 0.8)' : 'rgba(255, 255, 255, 0.8)',
      },
      text: {
        primary: isDark ? '#FAFAFA' : '#0F172A',
        secondary: isDark ? '#A1A1AA' : '#475569',
      },
      divider: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    },
    typography: {
      fontFamily: [
        'Outfit',
        'Plus Jakarta Sans',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      h1: {
        fontWeight: 700,
      },
      h2: {
        fontWeight: 700,
      },
      h3: {
        fontWeight: 600,
      },
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
        borderRadius: 12,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            padding: '10px 20px',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: 'none',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.15)',
            },
          },
          containedPrimary: {
            background: isDark 
              ? 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)'
              : 'linear-gradient(135deg, #6366F1 0%, #0EA5E9 100%)',
            border: 'none',
            '&:hover': {
              background: isDark 
                ? 'linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)'
                : 'linear-gradient(135deg, #4F46E5 0%, #0284C7 100%)',
              boxShadow: isDark
                ? '0 6px 20px rgba(139, 92, 246, 0.4)'
                : '0 6px 20px rgba(99, 102, 241, 0.2)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            background: isDark ? 'rgba(15, 15, 20, 0.55)' : 'rgba(255, 255, 255, 0.65)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.06)'}`,
            borderRadius: 16,
            boxShadow: isDark ? '0 8px 32px 0 rgba(0, 0, 0, 0.4)' : '0 8px 32px 0 rgba(99, 102, 241, 0.05)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
              '& fieldset': {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
              },
              '&:hover fieldset': {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
              },
              '&.Mui-focused fieldset': {
                borderColor: isDark ? '#8B5CF6' : '#6366F1',
              },
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? 'rgba(15, 15, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(16px)',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
            borderRadius: 20,
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          },
        },
      },
    },
  });
};
