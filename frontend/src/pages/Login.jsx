import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Alert,
  Snackbar,
  CircularProgress,
  Container
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  LockOutlined,
  PersonOutlined,
  ArrowBack
} from '@mui/icons-material';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation / Message states
  const [validationError, setValidationError] = useState('');
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });

  const handleShowPasswordToggle = () => {
    setShowPassword(!showPassword);
  };

  const handleCloseToast = () => {
    setToast({ ...toast, open: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    // Client-side validations
    if (!username.trim()) {
      setValidationError('Username is required');
      return;
    }
    if (!password) {
      setValidationError('Password is required');
      return;
    }
    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long');
      return;
    }

    setIsSubmitting(true);
    const result = await login(username.trim(), password);
    setIsSubmitting(false);

    if (result.success) {
      setToast({
        open: true,
        message: 'Signed in successfully! Redirecting...',
        severity: 'success'
      });
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } else {
      setToast({
        open: true,
        message: result.message || 'Login failed',
        severity: 'error'
      });
    }
  };

  return (
    <Container maxWidth="xs" sx={{ minHeight: 'calc(100vh - 70px)', display: 'flex', alignItems: 'center', py: 6 }}>
      {/* Background blobs */}
      <div className="blob-container">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <Box sx={{ width: '100%', position: 'relative', zIndex: 1 }} className="animate-fade-in">
        {/* Back Button */}
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/')}
          sx={{ mb: 3, color: 'var(--text-secondary)' }}
        >
          Back to Home
        </Button>

        <Card sx={{ width: '100%' }}>
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-1px' }}>
                Welcome Back
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                Sign in to your bLINK account to join calls
              </Typography>
            </Box>

            {/* Validation Alert */}
            {validationError && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: '10px' }}>
                {validationError}
              </Alert>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField
                  label="Username"
                  variant="outlined"
                  fullWidth
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlined sx={{ color: 'var(--text-muted)' }} />
                      </InputAdornment>
                    ),
                  }}
                  autoFocus
                />

                <TextField
                  label="Password"
                  variant="outlined"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined sx={{ color: 'var(--text-muted)' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleShowPasswordToggle} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={isSubmitting}
                  sx={{ py: 1.5, mt: 1 }}
                >
                  {isSubmitting ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </Box>
            </form>

            {/* Sign Up Link */}
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                Don't have an account?{' '}
                <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                  Create Account
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Toast notifications */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseToast} severity={toast.severity} sx={{ width: '100%', borderRadius: '10px' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Login;
