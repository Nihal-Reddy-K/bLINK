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
  Container,
  Grid,
  Avatar
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  LockOutlined,
  PersonOutlined,
  ArrowBack,
  Badge
} from '@mui/icons-material';


const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [name, setName] = useState('');
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
    if (!name.trim()) {
      setValidationError('Full Name is required');
      return;
    }
    if (!username.trim()) {
      setValidationError('Username is required');
      return;
    }
    if (username.trim().includes(' ')) {
      setValidationError('Username cannot contain spaces');
      return;
    }
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username.trim())) {
      setValidationError('Username can only contain alphanumeric characters and underscores');
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
    const result = await register(
      name.trim(),
      username.trim().toLowerCase(),
      password,
      ""
    );
    setIsSubmitting(false);

    if (result.success) {
      setToast({
        open: true,
        message: 'Account created successfully! Redirecting...',
        severity: 'success'
      });
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } else {
      setToast({
        open: true,
        message: result.message || 'Registration failed',
        severity: 'error'
      });
    }
  };

  return (
    <Container maxWidth="sm" sx={{ minHeight: 'calc(100vh - 70px)', display: 'flex', alignItems: 'center', py: 6 }}>
      {/* Background blobs */}
      <div className="blob-container">
        <div className="blob blob-1"></div>
        <div className="blob blob-3"></div>
      </div>

      <Box sx={{ width: '100%', position: 'relative', zIndex: 1 }} className="animate-fade-in">
        {/* Back Button */}
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/')}
          sx={{ mb: 2, color: 'var(--text-secondary)' }}
        >
          Back to Home
        </Button>

        <Card sx={{ width: '100%' }}>
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-1px' }}>
                Create Account
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                Start meeting in seconds with crystal clear quality
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
                  label="Full Name"
                  variant="outlined"
                  fullWidth
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Badge sx={{ color: 'var(--text-muted)' }} />
                      </InputAdornment>
                    ),
                  }}
                  autoFocus
                />

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
                    'Create bLINK Account'
                  )}
                </Button>
              </Box>
            </form>

            {/* Login Link */}
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                  Sign In
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

export default Register;
