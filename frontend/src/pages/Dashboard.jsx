import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Avatar,
  Stack,
  IconButton,
  Divider,
  Snackbar,
  Alert,
  Skeleton,
  InputAdornment,
  Tooltip
} from '@mui/material';
import {
  Add,
  Keyboard,
  Search,
  CalendarToday,
  ContentCopy,
  Replay,
  DeleteOutlined,
  HourglassEmpty,
  ChatBubbleOutlined,
  PersonOutlined,
  AccessTime,
  EventNote
} from '@mui/icons-material';

import { getAvatarProps } from '../utils/avatar';


const Dashboard = () => {
  const { user, getProfileStats } = useAuth();
  const navigate = useNavigate();

  // Component states
  const [stats, setStats] = useState({ totalMeetings: 0, totalHours: 0, totalMinutes: 0 });
  const [history, setHistory] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Join Room Inputs
  const [joinRoomId, setJoinRoomId] = useState('');
  const [newMeetingTitle, setNewMeetingTitle] = useState('');

  // Feedbacks
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchStats();
    fetchHistory();
  }, [searchQuery, dateFilter]);

  const fetchStats = async () => {
    setLoadingStats(true);
    const data = await getProfileStats();
    if (data && data.success) {
      setStats(data.stats);
    }
    setLoadingStats(false);
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      let url = '/meetings/history';
      const params = [];
      if (searchQuery.trim()) {
        params.push(`search=${encodeURIComponent(searchQuery.trim())}`);
      }
      if (dateFilter) {
        params.push(`date=${encodeURIComponent(dateFilter)}`);
      }
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const response = await api.get(url);
      if (response.data.success) {
        setHistory(response.data.history);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCloseToast = () => {
    setToast({ ...toast, open: false });
  };

  // Generate unique Room ID: format xxx-xxxx-xxx
  const generateRoomId = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const segment = (len) => {
      let str = '';
      for (let i = 0; i < len; i++) {
        str += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return str;
    };
    return `${segment(3)}-${segment(4)}-${segment(3)}`;
  };

  const handleCreateMeeting = async () => {
    const roomId = generateRoomId();
    const title = newMeetingTitle.trim() || `Sync - ${new Date().toLocaleDateString()}`;
    
    try {
      const response = await api.post('/meetings', { roomId, title });
      if (response.data.success) {
        setToast({
          open: true,
          message: 'Meeting created successfully!',
          severity: 'success'
        });
        setTimeout(() => {
          navigate(`/meet/${roomId}`);
        }, 800);
      }
    } catch (err) {
      console.error('Error creating meeting:', err);
      setToast({
        open: true,
        message: err.response?.data?.message || 'Failed to create meeting',
        severity: 'error'
      });
    }
  };

  const handleJoinMeeting = (e) => {
    e.preventDefault();
    if (!joinRoomId.trim()) {
      setToast({ open: true, message: 'Please enter a Meeting ID', severity: 'warning' });
      return;
    }
    
    // Clean room ID from whitespaces or URL parameters
    let cleanedId = joinRoomId.trim().toLowerCase();
    if (cleanedId.includes('/meet/')) {
      cleanedId = cleanedId.split('/meet/')[1].split(/[?#]/)[0];
    }
    
    navigate(`/meet/${cleanedId}`);
  };

  const handleDeleteHistory = async (roomId) => {
    try {
      const response = await api.delete(`/meetings/${roomId}`);
      if (response.data.success) {
        setToast({ open: true, message: 'Meeting history item deleted', severity: 'success' });
        // Refresh local history list
        setHistory(prev => prev.filter(item => item.roomId !== roomId));
        // Refresh stats
        fetchStats();
      }
    } catch (err) {
      console.error('Failed to delete history item:', err);
      setToast({ open: true, message: 'Failed to delete item', severity: 'error' });
    }
  };

  const handleCopyInviteLink = (roomId) => {
    const inviteLink = `${window.location.origin}/meet/${roomId}`;
    navigator.clipboard.writeText(inviteLink);
    setToast({ open: true, message: 'Meeting link copied to clipboard!', severity: 'success' });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    let res = '';
    if (hrs > 0) res += `${hrs}h `;
    if (mins > 0) res += `${mins}m `;
    if (secs > 0 || res === '') res += `${secs}s`;
    return res.trim();
  };



  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Background blobs */}
      <div className="blob-container">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <Grid container spacing={4} className="animate-fade-in">
        {/* LEFT PROFILE & ACTIONS PANEL */}
        <Grid item xs={12} md={4}>
          <Stack spacing={4}>
            {/* User Profile Card */}
            <Card>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Avatar
                  {...getAvatarProps(user?.name || user?.username, {
                    width: 90,
                    height: 90,
                    mx: 'auto',
                    mb: 2.5,
                    border: '3px solid var(--primary)',
                    boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)',
                    fontSize: '2.5rem'
                  })}
                />
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {user?.name}
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 3 }}>
                  @{user?.username}
                </Typography>
                
                <Divider sx={{ my: 2, borderColor: 'var(--card-border)' }} />

                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    {loadingStats ? (
                      <Skeleton variant="text" width="60%" sx={{ mx: 'auto' }} />
                    ) : (
                      <Typography variant="h4" sx={{ fontWeight: 800, color: 'var(--primary)' }}>
                        {stats.totalMeetings}
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                      Total Meetings
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    {loadingStats ? (
                      <Skeleton variant="text" width="60%" sx={{ mx: 'auto' }} />
                    ) : (
                      <Typography variant="h4" sx={{ fontWeight: 800, color: 'var(--secondary)' }}>
                        {stats.totalHours}
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                      Hours Conducted
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Quick Actions Panel */}
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                  Quick Meeting controls
                </Typography>

                {/* Create Meeting */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'var(--text-secondary)' }}>
                    Start an Instant Meeting
                  </Typography>
                  <Stack spacing={1.5}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Meeting Title (optional)"
                      value={newMeetingTitle}
                      onChange={(e) => setNewMeetingTitle(e.target.value)}
                    />
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<Add />}
                      onClick={handleCreateMeeting}
                      sx={{ py: 1.2 }}
                    >
                      Create Meeting
                    </Button>
                  </Stack>
                </Box>

                <Divider sx={{ my: 3, borderColor: 'var(--card-border)' }} />

                {/* Join Meeting */}
                <form onSubmit={handleJoinMeeting}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'var(--text-secondary)' }}>
                    Join with a Code / Link
                  </Typography>
                  <Stack direction="row" spacing={1.5}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g. abc-defg-hij"
                      value={joinRoomId}
                      onChange={(e) => setJoinRoomId(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Keyboard sx={{ color: 'var(--text-muted)', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Button
                      type="submit"
                      variant="outlined"
                      sx={{
                        borderColor: 'var(--card-border)',
                        color: 'var(--text-primary)',
                        '&:hover': {
                          borderColor: 'var(--text-secondary)',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        }
                      }}
                    >
                      Join
                    </Button>
                  </Stack>
                </form>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* RIGHT MEETING HISTORY LOGS */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%', minHeight: '500px' }}>
              {/* History Search Header */}
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Meeting History
                </Typography>
                
                {/* Search / Date Filter Row */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                  <TextField
                    size="small"
                    placeholder="Search title, room ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={{ color: 'var(--text-muted)' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                  
                  <TextField
                    type="date"
                    size="small"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarToday sx={{ color: 'var(--text-muted)', fontSize: 16 }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                  {dateFilter && (
                    <Button
                      size="small"
                      onClick={() => setDateFilter('')}
                      sx={{ color: 'var(--text-secondary)', minWidth: 'auto', p: 0.5 }}
                    >
                      Clear
                    </Button>
                  )}
                </Stack>
              </Box>

              {/* History Items list */}
              <Box sx={{ flexGrow: 1 }}>
                {loadingHistory ? (
                  /* Skeleton Loaders */
                  <Stack spacing={2}>
                    {[1, 2, 3].map((n) => (
                      <Card key={n} sx={{ border: '1px solid var(--card-border)', background: 'transparent' }}>
                        <CardContent sx={{ p: 3 }}>
                          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                            <Skeleton variant="text" width="40%" height={24} />
                            <Skeleton variant="text" width="20%" height={24} />
                          </Stack>
                          <Skeleton variant="text" width="80%" />
                          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                            <Skeleton variant="rectangular" width={60} height={30} sx={{ borderRadius: '6px' }} />
                            <Skeleton variant="rectangular" width={60} height={30} sx={{ borderRadius: '6px' }} />
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                ) : history.length === 0 ? (
                  /* Empty state rendering */
                  <Box sx={{ py: 8, textAlign: 'center' }}>
                    <HourglassEmpty sx={{ fontSize: 60, color: 'var(--text-muted)', mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      No meetings found
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'var(--text-secondary)', maxW: '320px', mx: 'auto' }}>
                      {searchQuery || dateFilter 
                        ? 'Try modifying your search queries or date filters.' 
                        : 'Create your first meeting using the quick meeting controls panel on the left.'}
                    </Typography>
                  </Box>
                ) : (
                  /* Logs items list */
                  <Stack spacing={2}>
                    {history.map((meeting) => (
                      <Card
                        key={meeting.roomId}
                        sx={{
                          border: '1px solid var(--card-border)',
                          backgroundColor: 'rgba(255,255,255,0.01)',
                          transition: 'var(--transition-fast)',
                          '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.02)',
                            borderColor: 'rgba(139, 92, 246, 0.2)'
                          }
                        }}
                      >
                        <CardContent sx={{ p: 3 }}>
                          <Grid container spacing={2} alignItems="center">
                            {/* Meeting Info */}
                            <Grid item xs={12} sm={8}>
                              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', mb: 0.5 }}>
                                {meeting.title}
                              </Typography>
                              
                              <Stack direction="row" spacing={2.5} flexWrap="wrap" sx={{ gap: 1 }}>
                                <Stack direction="row" alignItems="center" spacing={0.6}>
                                  <EventNote sx={{ fontSize: 14, color: 'var(--text-muted)' }} />
                                  <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                                    {new Date(meeting.createdAt).toLocaleDateString(undefined, {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </Typography>
                                </Stack>
                                
                                <Stack direction="row" alignItems="center" spacing={0.6}>
                                  <AccessTime sx={{ fontSize: 14, color: 'var(--text-muted)' }} />
                                  <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                                    Duration: {formatDuration(meeting.duration)}
                                  </Typography>
                                </Stack>

                                <Stack direction="row" alignItems="center" spacing={0.6}>
                                  <PersonOutlined sx={{ fontSize: 14, color: 'var(--text-muted)' }} />
                                  <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                                    Host: @{meeting.creator}
                                  </Typography>
                                </Stack>
                                
                                {meeting.messageCount > 0 && (
                                  <Stack direction="row" alignItems="center" spacing={0.6}>
                                    <ChatBubbleOutlined sx={{ fontSize: 14, color: 'var(--text-muted)' }} />
                                    <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                                      {meeting.messageCount} chat logs
                                    </Typography>
                                  </Stack>
                                )}
                              </Stack>
                              
                              {/* Recent chats preview */}
                              {meeting.lastMessage && (
                                <Box sx={{ mt: 1.5, p: 1.2, borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}>
                                  <Typography variant="caption" sx={{ color: 'var(--text-secondary)', display: 'block', fontStyle: 'italic' }}>
                                    Last message: <strong>@{meeting.lastMessage.sender}</strong>: {meeting.lastMessage.text}
                                  </Typography>
                                </Box>
                              )}
                            </Grid>
                            
                            {/* Item Actions */}
                            <Grid item xs={12} sm={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' }, gap: 1 }}>
                              <Tooltip title="Copy Invite Link">
                                <IconButton size="small" onClick={() => handleCopyInviteLink(meeting.roomId)} sx={{ color: 'var(--text-secondary)' }}>
                                  <ContentCopy fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Rejoin Room">
                                <IconButton
                                  size="small"
                                  onClick={() => navigate(`/meet/${meeting.roomId}`)}
                                  sx={{ color: 'var(--primary)' }}
                                >
                                  <Replay fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Delete History Log">
                                <IconButton size="small" onClick={() => handleDeleteHistory(meeting.roomId)} sx={{ color: 'var(--danger)' }}>
                                  <DeleteOutlined fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Snackbar alerts */}
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

export default Dashboard;
