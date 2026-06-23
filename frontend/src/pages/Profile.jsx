import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  Grid,
  Stack,
  Divider,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
  CircularProgress,
  Skeleton
} from '@mui/material';
import {
  Save,
  ArrowBack,
  VideoSettings,
  Settings,
  ShowChart
} from '@mui/icons-material';

import { getAvatarProps } from '../utils/avatar';


const Profile = () => {
  const { user, updateProfile, getProfileStats } = useAuth();
  const navigate = useNavigate();

  // Profile data state
  const [name, setName] = useState('');
  const [stats, setStats] = useState({ totalMeetings: 0, totalHours: 0, totalMinutes: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Settings states (saved in localStorage)
  const [defaultCameraOn, setDefaultCameraOn] = useState(true);
  const [defaultMicOn, setDefaultMicOn] = useState(true);
  const [waitingRoomEnabled, setWaitingRoomEnabled] = useState(false);

  // Feedbacks
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    if (user) {
      setName(user.name);
    }

    // Load meeting settings
    const camSetting = localStorage.getItem('blink_setting_camera');
    const micSetting = localStorage.getItem('blink_setting_mic');
    const wrSetting = localStorage.getItem('blink_setting_waitingroom');

    if (camSetting !== null) setDefaultCameraOn(camSetting === 'true');
    if (micSetting !== null) setDefaultMicOn(micSetting === 'true');
    if (wrSetting !== null) setWaitingRoomEnabled(wrSetting === 'true');

    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    setLoadingStats(true);
    const data = await getProfileStats();
    if (data && data.success) {
      setStats(data.stats);
    }
    setLoadingStats(false);
  };

  const handleCloseToast = () => {
    setToast({ ...toast, open: false });
  };



  const handleSaveProfile = async () => {
    if (!name.trim()) {
      setToast({ open: true, message: 'Name cannot be empty', severity: 'warning' });
      return;
    }

    setIsSaving(true);
    const result = await updateProfile(name.trim(), "");
    setIsSaving(false);

    if (result.success) {
      setToast({ open: true, message: 'Profile updated successfully!', severity: 'success' });
    } else {
      setToast({ open: true, message: result.message || 'Failed to update profile', severity: 'error' });
    }
  };

  const handleCameraToggle = (e) => {
    const val = e.target.checked;
    setDefaultCameraOn(val);
    localStorage.setItem('blink_setting_camera', val ? 'true' : 'false');
    setToast({ open: true, message: `Default camera set to ${val ? 'ON' : 'OFF'}`, severity: 'info' });
  };

  const handleMicToggle = (e) => {
    const val = e.target.checked;
    setDefaultMicOn(val);
    localStorage.setItem('blink_setting_mic', val ? 'true' : 'false');
    setToast({ open: true, message: `Default mic set to ${val ? 'ON' : 'OFF'}`, severity: 'info' });
  };

  const handleWaitingRoomToggle = (e) => {
    const val = e.target.checked;
    setWaitingRoomEnabled(val);
    localStorage.setItem('blink_setting_waitingroom', val ? 'true' : 'false');
    setToast({ open: true, message: `Waiting room protection ${val ? 'ENABLED' : 'DISABLED'}`, severity: 'info' });
  };

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      {/* Background blobs */}
      <div className="blob-container">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <Box sx={{ mb: 4 }} className="animate-fade-in">
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/dashboard')} sx={{ color: 'var(--text-secondary)' }}>
          Back to Dashboard
        </Button>
      </Box>

      <Grid container spacing={4} className="animate-fade-in">
        {/* LEFT COLUMN: EDIT PROFILE */}
        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Settings sx={{ color: 'var(--primary)' }} /> Edit Profile Settings
              </Typography>

              <Stack spacing={3.5}>
                {/* Avatar Display */}
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-secondary)', mb: 2 }}>
                    Profile Avatar
                  </Typography>
                  <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 1 }}>
                    <Avatar
                      {...getAvatarProps(name, {
                        width: 76,
                        height: 76,
                        fontSize: '2rem',
                        border: '3px solid var(--primary)',
                        boxShadow: '0 0 15px rgba(139, 92, 246, 0.3)'
                      })}
                    />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Dynamic Letter Avatar
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                        Your avatar is generated automatically from your display name
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                <Divider sx={{ borderColor: 'var(--card-border)' }} />

                {/* Name & Username Inputs */}
                <TextField
                  label="Display Name"
                  variant="outlined"
                  fullWidth
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <TextField
                  label="Username"
                  variant="outlined"
                  fullWidth
                  value={user?.username || ''}
                  disabled
                  helperText="Usernames cannot be changed."
                />

                {/* Save Button */}
                <Button
                  variant="contained"
                  startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <Save />}
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  sx={{ py: 1.5, mt: 1 }}
                >
                  Save Profile Changes
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT COLUMN: STATS & CONTROLS */}
        <Grid item xs={12} md={5}>
          <Stack spacing={4}>
            {/* Statistics */}
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ShowChart sx={{ color: 'var(--secondary)' }} /> Conferencing Statistics
                </Typography>

                <Stack spacing={3}>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 0.5 }}>
                      Total Meetings Attended
                    </Typography>
                    {loadingStats ? (
                      <Skeleton variant="text" width="30%" height={36} />
                    ) : (
                      <Typography variant="h4" sx={{ fontWeight: 800 }}>
                        {stats.totalMeetings} meetings
                      </Typography>
                    )}
                  </Box>

                  <Box>
                    <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 0.5 }}>
                      Cumulative Meeting Hours
                    </Typography>
                    {loadingStats ? (
                      <Skeleton variant="text" width="40%" height={36} />
                    ) : (
                      <Typography variant="h4" sx={{ fontWeight: 800 }}>
                        {stats.totalHours} hrs
                      </Typography>
                    )}
                  </Box>

                  <Box>
                    <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 0.5 }}>
                      Minutes Logged
                    </Typography>
                    {loadingStats ? (
                      <Skeleton variant="text" width="30%" height={36} />
                    ) : (
                      <Typography variant="h4" sx={{ fontWeight: 800 }}>
                        {stats.totalMinutes} mins
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Meeting Preferences Card */}
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VideoSettings sx={{ color: 'var(--accent-pink)' }} /> Room Preferences
                </Typography>

                <Stack spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={defaultCameraOn}
                        onChange={handleCameraToggle}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Default Camera ON</Typography>
                        <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>Start calls with camera active</Typography>
                      </Box>
                    }
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={defaultMicOn}
                        onChange={handleMicToggle}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Default Mic ON</Typography>
                        <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>Start calls with microphone unmuted</Typography>
                      </Box>
                    }
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={waitingRoomEnabled}
                        onChange={handleWaitingRoomToggle}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Enable Waiting Room</Typography>
                        <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>Host must approve guest entries</Typography>
                      </Box>
                    }
                  />
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {/* Snackbar Alerts */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
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

export default Profile;
